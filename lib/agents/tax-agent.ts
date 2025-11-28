import { queryTaxRules } from '@/lib/vectordb';
import { geminiChat } from '@/lib/gemini';

export async function prepareITRDraft(
    userIncome: number,
    deductions: any
) {
    const taxRules = await queryTaxRules('Income Tax Act 2024 deductions');

    const rulesContext = taxRules.matches
        .map((m: any) => m.metadata?.text)
        .join('\n');

    const prompt = `
Tax Rules Context:
${rulesContext}

User Income Details:
- Salary: ₹${userIncome}
- Deductions: ${JSON.stringify(deductions)}

Generate a pre-ITR summary (not filing, just educational):
`;

    return await geminiChat(prompt);
}
