import { inngest } from '@/lib/inngest';
import { geminiStructuredOutput, geminiChat } from '@/lib/gemini';
import dbConnect from '@/lib/db';
import { Conversation, User, FinancialProfile, Transaction } from '@/lib/schemas';
import { taxAgent } from './tax-agent';
import { investmentAgent } from './investment-agent';
import { retirementAgent } from './retirement-agent';
import { schemeAgent } from './scheme-agent';
import { transactionAgent } from './transaction-agent';
import {
    getOrCreateFinancialProfile,
    updateFinancialProfile,
    updateAssets,
    addLiability,
    updateTaxDetails,
    getCriticalMissingFields,
    calculateProfileCompleteness
} from '@/lib/financial-profile-helpers';

export const handleChat = inngest.createFunction(
    { id: 'handle-chat-message' },
    { event: 'app/chat.message.received' },
    async ({ event, step }) => {
        const { userId, messageId, text } = event.data;

        await dbConnect();

        // Step 1: Load context
        const context = await step.run('load-context', async () => {
            const user = await User.findOne({ userId });
            const conversation = await Conversation.findOne({ userId });
            const financialProfile = await getOrCreateFinancialProfile(userId);
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
            const transactions = await Transaction.find({
                userId,
                date: { $gte: sixMonthsAgo }
            });

            return { user, conversation, financialProfile, transactions };
        });

        // Step 2: Extract and store financial data
        await step.run('extract-and-store', async () => {
            const prompt = `Extract financial data from: "${text}"
Return JSON with null for missing fields:
{"age": number|null, "monthlyExpenses": number|null, "employmentType": "salaried"|"gig"|"business"|"student"|"retired"|null, "assets": {"emergencyFund": number|null, "fixedDeposits": number|null, "mutualFunds": number|null, "stocks": number|null}, "insurance": {"lifeInsuranceCover": number|null, "healthInsuranceCover": number|null}, "taxDetails": {"regime": "new"|"old"|null, "pan": string|null}, "newLiability": {"type": string, "outstandingAmount": number, "interestRate": number, "monthlyEmi": number}|null}`;

            const extracted = await geminiStructuredOutput(prompt, 'Extract data');
            if (typeof extracted === 'string') return;

            // Store extracted data
            const updates: any = {};
            if (extracted.employmentType) updates.employmentType = extracted.employmentType;
            if (extracted.monthlyExpenses) updates.monthlyBurnRate = extracted.monthlyExpenses;
            if (Object.keys(updates).length > 0) await updateFinancialProfile(userId, updates);

            if (extracted.age && context.user) {
                await User.updateOne({ userId }, { $set: { 'profile.age': extracted.age } });
            }

            if (extracted.taxDetails) {
                const taxUpdates: any = {};
                if (extracted.taxDetails.regime) taxUpdates.regime = extracted.taxDetails.regime;
                if (extracted.taxDetails.pan) taxUpdates.pan = extracted.taxDetails.pan;
                if (Object.keys(taxUpdates).length > 0) await updateTaxDetails(userId, taxUpdates);
            }

            if (extracted.assets) {
                const assetUpdates: any = {};
                for (const [key, val] of Object.entries(extracted.assets)) {
                    if (val !== null) assetUpdates[key] = val;
                }
                if (Object.keys(assetUpdates).length > 0) await updateAssets(userId, assetUpdates);
            }

            if (extracted.newLiability) await addLiability(userId, extracted.newLiability);

            if (extracted.insurance) {
                const insuranceUpdates: any = {};
                if (extracted.insurance.lifeInsuranceCover !== null) insuranceUpdates['insurance.lifeInsuranceCover'] = extracted.insurance.lifeInsuranceCover;
                if (extracted.insurance.healthInsuranceCover !== null) insuranceUpdates['insurance.healthInsuranceCover'] = extracted.insurance.healthInsuranceCover;
                if (Object.keys(insuranceUpdates).length > 0) await updateFinancialProfile(userId, insuranceUpdates);
            }

            const reloadedProfile = await FinancialProfile.findOne({ userId });
            if (reloadedProfile) context.financialProfile = reloadedProfile as any;
        });

        // Step 3: Check for critical missing fields
        const criticalCheck = await step.run('check-critical-fields', async () => {
            return getCriticalMissingFields(context.financialProfile, context.user);
        });

        // If critical data missing, ask for it BEFORE analysis
        if (criticalCheck.hasCriticalGaps) {
            const response = await step.run('request-critical-data', async () => {
                return await geminiChat(`You are a financial advisor. User asked: "${text}"

I need critical information to provide accurate analysis:
${criticalCheck.criticalQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

Respond friendly: acknowledge their question, explain why you need this data, ask for it. Be concise.`);
            });

            await step.run('store-response', async () => {
                await Conversation.updateOne({ userId }, {
                    $push: { messages: { messageId: `${messageId}-response`, sender: 'assistant', text: response, agentsInvolved: [], timestamp: new Date() } }
                }, { upsert: true });
            });

            return { userId, messageId, status: 'awaiting_critical_data', missingFields: criticalCheck.missingCritical };
        }

        // Step 4: Run analysis (only if we have critical data)
        const analysis = await step.run('run-analysis', async () => {
            const { runFinancialAnalysis } = await import('@/lib/financial-analysis-engine');
            return await runFinancialAnalysis({ userId, profile: context.financialProfile, user: context.user, transactions: context.transactions });
        });

        // Step 5: Route to agents
        const routing = await step.run('route-intent', async () => {
            return await geminiStructuredOutput(`Route this query to agents: "${text}". Available: investment_planning, tax_itr, retirement_pension, government_schemes, transaction_tracking, general_qa. Return JSON: {"intent": "string", "agents": ["array"], "confidence": 0.0-1.0}`, 'Router');
        });

        // Step 6: Call agents
        const agentResults: any = {};
        const profile = context.user ? { ...context.user.profile, userId, financialProfile: context.financialProfile, analysis } : { userId, balance: 0, financialProfile: context.financialProfile, analysis };

        if (routing.agents?.length > 0) {
            for (const agent of routing.agents) {
                if (agent === 'tax_itr') agentResults.tax = await step.invoke('call-tax-agent', { function: taxAgent, data: { message: text, profile } });
                else if (agent === 'investment_planning') agentResults.investment = await step.invoke('call-investment-agent', { function: investmentAgent, data: { message: text, profile } });
                else if (agent === 'retirement_pension') agentResults.retirement = await step.invoke('call-retirement-agent', { function: retirementAgent, data: { message: text, profile } });
                else if (agent === 'government_schemes') agentResults.schemes = await step.invoke('call-scheme-agent', { function: schemeAgent, data: { message: text, profile } });
                else if (agent === 'transaction_tracking') agentResults.transaction = await step.invoke('call-transaction-agent', { function: transactionAgent, data: { message: text, profile } });
            }
        }

        // Step 7: Calculate completeness
        const completeness = calculateProfileCompleteness(context.financialProfile, context.user);

        // Step 8: Generate report
        const response = await step.run('compose-response', async () => {
            const { generateFinancialReport } = await import('@/lib/financial-report-generator');
            const prompt = generateFinancialReport({ text, analysis, agentResults, profileGaps: { completeness, hasMissingFields: completeness.score < 100, priorityQuestions: [] } });
            return await geminiChat(prompt);
        });

        // Step 9: Store response
        await step.run('store-response', async () => {
            await Conversation.updateOne({ userId }, {
                $push: { messages: { messageId: `${messageId}-response`, sender: 'assistant', text: response, agentsInvolved: routing.agents || [], timestamp: new Date() } }
            }, { upsert: true });
        });

        return { userId, messageId, status: 'completed', analysis };
    }
);
