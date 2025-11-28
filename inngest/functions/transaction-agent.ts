import { inngest } from '@/lib/inngest';
import { geminiStructuredOutput, geminiChat } from '@/lib/gemini';
import { Transaction, User } from '@/lib/schemas';
import dbConnect from '@/lib/db';

export const transactionAgent = inngest.createFunction(
    { id: 'transaction-agent' },
    { event: 'user/transaction-input' },
    async ({ event }) => {
        const { message, profile } = event.data;
        await dbConnect();

        // Step 1: Parse transaction or intent from natural language using Gemini
        const parsePrompt = `
      Analyze the user input. Determine if they want to LOG a transaction or GET their balance. All the amounts will be in INR
      
      Return JSON:
      { 
        "intent": "log_transaction" | "get_balance",
        "transaction": { "type": "income|expense|savings", "category": "string", "amount": number, "date": "YYYY-MM-DD", "description": "string" } 
      }
      
      User input: "${message}"
    `;

        const result = await geminiStructuredOutput(parsePrompt, 'You are a transaction parser.');

        if (result?.intent === 'get_balance') {
            return {
                agent: 'transaction',
                response: `Your current balance is ${profile.balance || 0}.`,
                confirmationMessage: `Current balance: ${profile.balance || 0}`
            };
        }

        const transactionData = result?.transaction;

        if (!transactionData || !transactionData.amount) {
            return {
                agent: 'transaction',
                error: 'Could not parse transaction',
                clarification: 'Please specify: type (income/expense), amount, category, and date.',
            };
        }

        // Step 2: Store in MongoDB
        console.log(`[Transaction Agent] Creating transaction for user: ${profile.userId}`);
        const newTransaction: any = await Transaction.create({
            transactionId: `txn_${Date.now()}`,
            userId: profile.userId, // Assuming profile has userId
            ...transactionData,
            date: transactionData.date ? new Date(transactionData.date) : new Date(),
        });

        // Step 2.5: Update User Balance
        console.log(`[Transaction Agent] Updating balance for type: ${transactionData.type}, Amount: ${transactionData.amount}`);
        if (transactionData.type === 'income') {
            const updateRes = await User.updateOne({ userId: profile.userId }, { $inc: { 'profile.balance': transactionData.amount } });
            console.log(`[Transaction Agent] Income update result:`, updateRes);
        } else if (transactionData.type === 'expense') {
            const updateRes = await User.updateOne({ userId: profile.userId }, { $inc: { 'profile.balance': -transactionData.amount } });
            console.log(`[Transaction Agent] Expense update result:`, updateRes);
        }

        // Step 3: Generate summary response
        const response = await geminiChat(
            `Transaction recorded: ${JSON.stringify(transactionData)}. Provide brief confirmation.`
        );

        return {
            agent: 'transaction',
            transaction: transactionData,
            confirmationMessage: `Transaction recorded.`,
        };
    }
);
