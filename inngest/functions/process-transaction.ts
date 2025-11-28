import { inngest } from '@/lib/inngest';
import { geminiStructuredOutput } from '@/lib/gemini';
import dbConnect from '@/lib/db';
import { Transaction } from '@/lib/schemas';

export const processTransaction = inngest.createFunction(
    { id: 'process-transaction' },
    { event: 'app/transaction.input.received' },
    async ({ event, step }) => {
        const { userId, rawInput, source } = event.data;

        await dbConnect();

        // Step 1: Extract transaction details using Gemini
        const extraction = await step.run('extract-transaction', async () => {
            const prompt = `
Extract transaction details from this input: "${rawInput}"

Return JSON:
{
  "type": "income" | "expense" | "savings",
  "amount": number,
  "category": string,
  "frequency": "monthly" | "yearly" | "one-time",
  "date": "YYYY-MM-DD",
  "description": string
}
`;

            return await geminiStructuredOutput(
                prompt,
                'You are a financial transaction parser'
            );
        });

        // Step 2: Store transaction
        const transactionId = await step.run('store-transaction', async () => {
            const result: any = await Transaction.create({
                transactionId: `txn_${Date.now()}`,
                userId,
                ...extraction,
                source,
            });
            return result._id;
        });

        return { transactionId, status: 'processed' };
    }
);
