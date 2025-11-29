import { inngest } from '@/lib/inngest';
import { geminiStructuredOutput, geminiChat } from '@/lib/gemini';
import dbConnect from '@/lib/db';
import { Conversation } from '@/lib/schemas';
import { investmentAgent } from './investment-agent';
import { retirementAgent } from './retirement-agent';
import { schemeAgent } from './scheme-agent';











export const analysisAgent = inngest.createFunction(
    { id: 'analysis-agent' },
    { event: 'user/analysis-input' },
    async ({ event, step }) => {
        const { userId, messageId, text } = event.data;

        await dbConnect();

        // Step 1: Extract financial data from user message
        const extractedData = await step.run('extract-data', async () => {
            const prompt = `Extract Indian financial data from: "${text}"

CURRENCY CONVERSION:
₹40k = 40000, ₹5L = 500000, ₹1Cr = 10000000
8 LPA = monthly 66666 (800000/12)

EXAMPLES:
"I'm 28, freelancer, earn ₹80k monthly, spend ₹40k, have ₹1L emergency fund, ₹5L term insurance"
→ {age: 28, employmentType: "gig", monthlyIncome: 80000, monthlyExpenses: 40000, assets: {emergencyFund: 100000}, insurance: {lifeInsuranceCover: 500000}}

Extract and return JSON:
{
  "age": number|null,
  "monthlyIncome": number|null,
  "monthlyExpenses": number|null,
  "employmentType": "salaried"|"gig"|"business"|"student"|"retired"|null,
  "assets": {
    "emergencyFund": number|null,
    "fixedDeposits": number|null,
    "mutualFunds": number|null,
    "stocks": number|null
  },
  "liabilities": null,
  "insurance": {
    "lifeInsuranceCover": number|null,
    "healthInsuranceCover": number|null
  },
  "taxDetails": {
    "regime": null,
    "pan": null
  }
}`;

            const extracted = await geminiStructuredOutput(prompt, 'Extract financial data. Return only valid JSON.');
            console.log('📊 [EXTRACT]:', JSON.stringify(extracted, null, 2));
            return typeof extracted === 'string' ? {} : extracted;
        });

        // Step 2: Run financial analysis on extracted data
        const analysis = await step.run('analyze-finances', async () => {
            const { analyzeFinancialData } = await import('@/lib/analysis/financial-analysis-engine');
            return analyzeFinancialData(extractedData);
        });




        // Step 3: Route to appropriate agents based on query intent
        const routing = await step.run('route-intent', async () => {
            const routePrompt = `Analyze this financial query and determine which specialized agents should handle it: "${text}"

Available agents:
- tax_itr: Tax planning, ITR filing, regime comparison, deductions
- investment_planning: Mutual funds, stocks, asset allocation, SIPs
- retirement_pension: NPS, retirement corpus, pension planning
- government_schemes: PPF, SSY, PMJJBY, subsidies, schemes
- general_qa: General financial advice, education

Return JSON:
{
  "intent": "brief description",
  "agents": ["array of relevant agent names"],
  "confidence": 0.0-1.0
}`;

            const result = await geminiStructuredOutput(routePrompt, 'Route to agents');
            console.log('🔀 [ROUTE]:', result);
            return typeof result === 'string' ? { agents: [], confidence: 0 } : result;
        });

        // Step 4: Call specialized agents
        const agentResults: any = {};
        const profile = {
            userId,
            age: extractedData.age,
            monthlyIncome: extractedData.monthlyIncome,
            monthlyExpenses: extractedData.monthlyExpenses,
            employmentType: extractedData.employmentType,
            assets: extractedData.assets,
            liabilities: extractedData.liabilities,
            insurance: extractedData.insurance,
            analysis
        };

        if (routing.agents?.length > 0) {
            console.log('🤖 [AGENTS] Calling:', routing.agents);





            for (const agent of routing.agents) {
                try {
                    
                    if (agent === 'investment_planning') {
                        agentResults.investment = await step.invoke('call-investment-agent', {
                            function: investmentAgent,
                            data: { message: text, profile }
                        });
                    } else if (agent === 'retirement_pension') {
                        agentResults.retirement = await step.invoke('call-retirement-agent', {
                            function: retirementAgent,
                            data: { message: text, profile }
                        });
                    } else if (agent === 'government_schemes') {
                        agentResults.schemes = await step.invoke('call-scheme-agent', {
                            function: schemeAgent,
                            data: { message: text, profile }
                        });
                    }
                } catch (error) {
                    console.log(`⚠️ [AGENT] ${agent} failed:`, error);
                }

            }
        }

        // Step 5: Generate comprehensive financial report
        const response = await step.run('generate-report', async () => {
            const hasAgentResults = Object.keys(agentResults).length > 0;

            return await geminiChat(`You are a professional Indian financial advisor. Create a comprehensive financial report.






USER MESSAGE: "${text}"



EXTRACTED DATA:
${JSON.stringify(extractedData, null, 2)}



FINANCIAL ANALYSIS:
${JSON.stringify(analysis, null, 2)}



${hasAgentResults ? `
SPECIALIZED AGENT INSIGHTS:
${JSON.stringify(agentResults, null, 2)}
` : ''}

Create a detailed, well-structured report with these sections:


# Personal Finance Report





## Executive Summary
(2-3 sentence overview of financial health)

## Income & Savings Analysis
- Monthly income: Rs.${analysis.income.monthly.toLocaleString('en-IN')}
- Monthly expenses: Rs.${analysis.expenses.monthly.toLocaleString('en-IN')}
- Savings rate: ${analysis.savings.rate.toFixed(1)}% (${analysis.savings.status})


## Emergency Fund Status
- Current: Rs.${analysis.emergencyFund.current.toLocaleString('en-IN')}
- Recommended: Rs.${analysis.emergencyFund.recommended.toLocaleString('en-IN')}
- Coverage: ${analysis.emergencyFund.months.toFixed(1)} months

## Insurance Coverage
- Life Insurance Gap: Rs.${analysis.insurance.life.gap.toLocaleString('en-IN')}
- Health Insurance Gap: Rs.${analysis.insurance.health.gap.toLocaleString('en-IN')}

${hasAgentResults ? `
## Specialized Recommendations

${agentResults.tax ? `### Tax Optimization\n${agentResults.tax}\n` : ''}
${agentResults.investment ? `### Investment Strategy\n${agentResults.investment}\n` : ''}
${agentResults.retirement ? `### Retirement Planning\n${agentResults.retirement}\n` : ''}
${agentResults.schemes ? `### Government Schemes\n${agentResults.schemes}\n` : ''}
` : ''}


## Top 5 Priority Actions
1. ${analysis.emergencyFund.status === 'insufficient' ? `Build emergency fund - need Rs.${analysis.emergencyFund.gap.toLocaleString('en-IN')} more` : 'Emergency fund adequate ✓'}
2. ${analysis.insurance.life.gap > 0 ? `Get term insurance for Rs.${analysis.insurance.life.gap.toLocaleString('en-IN')}` : 'Life insurance adequate ✓'}
3. ${analysis.savings.rate < 20 ? `Increase savings rate to 20%+` : 'Maintain excellent savings discipline ✓'}
4. ${analysis.debt.status === 'high' ? `Reduce debt burden - current DTI ${analysis.debt.debtToIncomeRatio.toFixed(1)}%` : 'Debt is manageable'}
5. ${analysis.retirement.monthlySipNeeded > 0 ? `Start retirement SIP of Rs.${analysis.retirement.monthlySipNeeded.toLocaleString('en-IN')}/month` : 'Review retirement planning'}

Use Indian Rupee notation (Rs.). Be specific, actionable, data-driven.`);




        });

        // Step 6: Store conversation
        await step.run('store-response', async () => {
            await Conversation.updateOne(
                { userId },
                {
                    $push: {
                        messages: {
                            messageId: `${messageId}-response`,
                            sender: 'assistant',
                            text: response,
                            agentsInvolved: routing.agents || [],
                            timestamp: new Date()
                        }
                    }
                },
                { upsert: true }
            );
        });

        return { userId, messageId, status: 'completed', extractedData, analysis, agentsUsed: routing.agents };
    }
);