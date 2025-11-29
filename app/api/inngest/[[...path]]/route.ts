import { serve } from 'inngest/next';
import { inngest } from '@/lib/inngest';

export const dynamic = 'force-dynamic';

// Import all Inngest functions
import {
    handleChat,
    processTransaction,
    investmentAgent,
    retirementAgent,
    schemeAgent,
    transactionAgent,
    analysisAgent,
    goalAgent
} from '@/inngest/functions';

const functions: any[] = [
    handleChat,
    processTransaction,
    investmentAgent,
    retirementAgent,
    schemeAgent,
    transactionAgent,
    analysisAgent,
    goalAgent
];

export const { GET, POST, PUT } = serve({
    client: inngest,
    functions: functions,
});
