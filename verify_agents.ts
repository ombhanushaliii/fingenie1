
// Verification script for Phase 5 Agents
// Mock env vars BEFORE imports
process.env.MONGODB_URI = 'mongodb://mock-uri';
process.env.GEMINI_API_KEY = 'mock-key';
process.env.PINECONE_API_KEY = 'mock-key';
process.env.INNGEST_EVENT_KEY = 'mock-key';
process.env.INNGEST_SIGNING_KEY = 'mock-key';

import { extractTransactionDetails } from './lib/agents/transaction-agent';
import { analyzeCashflow } from './lib/agents/cashflow-agent';
import { generateInvestmentPlan } from './lib/agents/investment-agent';
import { prepareITRDraft } from './lib/agents/tax-agent';
import { planRetirement } from './lib/agents/retirement-agent';

async function verify() {
    console.log('Starting Phase 5 Agent Verification...');

    try {
        // 1. Transaction Agent
        if (typeof extractTransactionDetails === 'function') {
            console.log('✅ Transaction Agent loaded');
        } else {
            console.error('❌ Transaction Agent failed');
        }

        // 2. Cashflow Agent
        if (typeof analyzeCashflow === 'function') {
            console.log('✅ Cashflow Agent loaded');
        } else {
            console.error('❌ Cashflow Agent failed');
        }

        // 3. Investment Agent
        if (typeof generateInvestmentPlan === 'function') {
            console.log('✅ Investment Agent loaded');
        } else {
            console.error('❌ Investment Agent failed');
        }

        // 4. Tax Agent
        if (typeof prepareITRDraft === 'function') {
            console.log('✅ Tax Agent loaded');
        } else {
            console.error('❌ Tax Agent failed');
        }

        // 5. Retirement Agent
        if (typeof planRetirement === 'function') {
            console.log('✅ Retirement Agent loaded');
        } else {
            console.error('❌ Retirement Agent failed');
        }
    } catch (error) {
        console.error('❌ Verification script encountered an error:', error);
    }

    console.log('Verification complete.');
    process.exit(0);
}

verify().catch((e) => {
    console.error(e);
    process.exit(1);
});
