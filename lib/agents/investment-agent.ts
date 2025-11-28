import { queryInvestmentProducts } from '@/lib/vectordb';
import { geminiChat } from '@/lib/gemini';

export async function generateInvestmentPlan(
    userProfile: any,
    goal: any,
    cashflow: any
) {
    // Query VectorDB for investment products
    const products = await queryInvestmentProducts(
        `investment funds for ${userProfile.profile.riskProfile} risk profile`
    );

    const productsContext = products.matches
        .map((m: any) => m.metadata?.text)
        .join('\n');

    const prompt = `
User Profile:
- Age: ${userProfile.profile.age}
- Risk Profile: ${userProfile.profile.riskProfile}
- Monthly Surplus: ₹${cashflow.monthlySurplus}

Goal: ${goal.name} in ${goal.timeHorizonMonths} months, Target: ₹${goal.targetAmount}

Available Investment Products:
${productsContext}

Suggest a balanced investment allocation (only categories, no specific funds):
`;

    return await geminiChat(prompt);
}
