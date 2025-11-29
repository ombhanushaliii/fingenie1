import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function geminiChat(
    prompt: string,
    model = 'gemini-2.0-flash'
) {
    const modelInstance = genAI.getGenerativeModel({ model });
    const result = await modelInstance.generateContent(prompt);
    return result.response.text();





}

export async function geminiStructuredOutput(
    prompt: string,
    systemPrompt: string,
    model = 'gemini-2.0-flash'
) {
    const modelInstance = genAI.getGenerativeModel({
        model,
        systemInstruction: systemPrompt,
    });

    const result = await modelInstance.generateContent(prompt);
    const text = result.response.text();

    // Parse JSON if needed



    try {
        // Attempt to find JSON block if wrapped in markdown code blocks
        const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```\n([\s\S]*?)\n```/);




        if (jsonMatch) {
            return JSON.parse(jsonMatch[1]);




        }
        return JSON.parse(text);
    } catch {
        return text;
    }
}