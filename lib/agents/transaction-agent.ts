import { geminiStructuredOutput } from '@/lib/gemini';

export async function extractTransactionDetails(text: string) {
    const prompt = `
Extract financial transaction details from: "${text}"

Return JSON with exact format:
{
  "type": "income" | "expense" | "savings",
  "amount": number (only digits),
  "category": string,
  "frequency": "monthly" | "yearly" | "one-time",
  "date": "YYYY-MM-DD",
  "description": string
}
`;

    return await geminiStructuredOutput(
        prompt,
        'Extract transaction details with high precision'
    );
}
