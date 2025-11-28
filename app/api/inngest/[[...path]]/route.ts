import { serve } from 'inngest/next';
import { inngest } from '@/lib/inngest';

export const dynamic = 'force-dynamic';

// Import all Inngest functions
import {
    handleChat,
    processTransaction,
    taxAgent,
    investmentAgent,
    retirementAgent,
    schemeAgent,
    transactionAgent
} from '@/inngest/functions';

const functions: any[] = [
    handleChat,
    processTransaction,
    taxAgent,
    investmentAgent,
    retirementAgent,
    schemeAgent,
    transactionAgent
];

export const { GET, POST, PUT } = serve({
    client: inngest,
    functions: functions,
});
