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
      Analyze the user input. Determine if they want to LOG transactions or GET their balance. All the amounts will be in INR.
      The user might provide multiple transactions in a single sentence.
      
      Return JSON:
      { 
        "intent": "log_transaction" | "get_balance",
        "transactions": [{ "type": "income|expense|savings", "category": "string", "amount": number, "date": "YYYY-MM-DD", "description": "string" }] 
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

        const transactions = result?.transactions;

        if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
            return {
                agent: 'transaction',
                error: 'Could not parse transaction',
                clarification: 'Please specify: type (income/expense), amount, category, and date.',
            };
        }

        const processedTransactions = [];
        let totalIncome = 0;
        let totalExpense = 0;

        // Step 2: Store in MongoDB and Update Balance
        for (const transactionData of transactions) {
            if (!transactionData.amount) continue;

            console.log(`[Transaction Agent] Creating transaction for user: ${profile.userId}`);
            const newTransaction: any = await Transaction.create({
                transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                userId: profile.userId, // Assuming profile has userId
                ...transactionData,
                date: transactionData.date ? new Date(transactionData.date) : new Date(),
            });

            processedTransactions.push(transactionData);

            // Step 2.5: Update User Balance
            console.log(`[Transaction Agent] Updating balance for type: ${transactionData.type}, Amount: ${transactionData.amount}`);
            if (transactionData.type === 'income') {
                const updateRes = await User.updateOne({ userId: profile.userId }, { $inc: { 'profile.balance': transactionData.amount } });
                console.log(`[Transaction Agent] Income update result:`, updateRes);
                totalIncome += transactionData.amount;
            } else if (transactionData.type === 'expense') {
                const updateRes = await User.updateOne({ userId: profile.userId }, { $inc: { 'profile.balance': -transactionData.amount } });
                console.log(`[Transaction Agent] Expense update result:`, updateRes);
                totalExpense += transactionData.amount;
            }
        }

        // Step 3: Generate summary response
        const response = await geminiChat(
            `Transactions recorded: ${JSON.stringify(processedTransactions)}. Provide brief confirmation.`
        );

        return {
            agent: 'transaction',
            transactions: processedTransactions,
            confirmationMessage: `Recorded ${processedTransactions.length} transactions. Income: ${totalIncome}, Expense: ${totalExpense}`,
        };
    }
);
