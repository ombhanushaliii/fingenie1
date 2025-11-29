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
    analysisAgent
} from '@/inngest/functions';

const functions: any[] = [
    handleChat,
    processTransaction,
    investmentAgent,
    retirementAgent,
    schemeAgent,
    transactionAgent,
    analysisAgent
];

export const { GET, POST, PUT } = serve({
    client: inngest,
    functions: functions,
});
