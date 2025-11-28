import { serve } from 'inngest/next';
import { inngest } from '@/lib/inngest';

export const dynamic = 'force-dynamic';

// Import all Inngest functions
import { handleChat, processTransaction } from '@/inngest/functions';

const functions: any[] = [handleChat, processTransaction];

export const { GET, POST, PUT, DELETE } = serve({
    client: inngest,
    functions: functions,
});
