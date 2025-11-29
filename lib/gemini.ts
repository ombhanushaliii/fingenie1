import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function geminiChat(
    prompt: string,
    model = 'gemini-2.0-flash'
) {
    const modelInstance = genAI.getGenerativeModel({ model });
    const result = await modelInstance.generateContent(prompt);
    let text = result.response.text();

    // Remove markdown code blocks if present
    text = text.replace(/```markdown\n?/g, '').replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    return text;
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
    let text = result.response.text();

    // Remove markdown code blocks
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Parse JSON
    try {
        return JSON.parse(text);
    } catch (e) {
        console.log('⚠️ JSON parse error, trying to extract...');

        // Try to find JSON object in the text
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                return JSON.parse(jsonMatch[0]);
            } catch (e2) {
                console.log('❌ Extraction failed, returning text');
            }
        }

        return text;
    }
}

export async function geminiWithContext(
    userMessage: string,
    context: any,
    model = 'gemini-2.0-flash'
) {
    const prompt = `
Context: ${JSON.stringify(context, null, 2)}

User Message: ${userMessage}

Respond as a helpful financial advisor.
`;

    return await geminiChat(prompt, model);
}

export async function generateEmbedding(text: string) {
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const result = await model.embedContent(text);
    return result.embedding.values;
}
