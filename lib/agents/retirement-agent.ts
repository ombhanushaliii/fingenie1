import { queryPensionSchemes } from '@/lib/vectordb';
import { geminiChat } from '@/lib/gemini';

export async function planRetirement(
    age: number,
    currentSavings: number,
    monthlySurplus: number
) {
    const schemes = await queryPensionSchemes('NPS PPF SCSS retirement schemes');

    const schemesContext = schemes.matches
        .map((m: any) => m.metadata?.text)
        .join('\n');

    const prompt = `
Pension Schemes Available:
${schemesContext}

User Profile:
- Age: ${age}
- Current Savings: ₹${currentSavings}
- Monthly Surplus: ₹${monthlySurplus}

Suggest retirement planning strategy with scheme allocation:
`;

    return await geminiChat(prompt);
}
