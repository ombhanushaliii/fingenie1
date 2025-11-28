import dbConnect from '@/lib/db';
import { Transaction } from '@/lib/schemas';
import { geminiChat } from '@/lib/gemini';

export async function analyzeCashflow(userId: string) {
    await dbConnect();

    const monthStart = new Date();
    monthStart.setDate(1);

    const transactions = await Transaction.find({
        userId,
        date: { $gte: monthStart },
    });

    const income = transactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const expenses = transactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    const savings = income - expenses;
    const savingsRate = income > 0 ? (savings / income) * 100 : 0;

    // Generate insights
    const insights = await geminiChat(`
Monthly Financial Summary:
- Income: ₹${income}
- Expenses: ₹${expenses}
- Savings: ₹${savings}
- Savings Rate: ${savingsRate.toFixed(1)}%

Generate a brief, encouraging insight about their finances.
`);

    return { income, expenses, savings, savingsRate, insights };
}
