import { inngest } from '@/lib/inngest';
import { queryTaxRules } from '@/lib/vectordb';
import { geminiWithContext } from '@/lib/gemini';

export const taxAgent = inngest.createFunction(
    { id: 'tax-saver-agent' },
    { event: 'user/tax-query' },
    async ({ event }) => {
        const { message, profile } = event.data;

        // Step 1: Search Pinecone for relevant tax rules
        const relevantRules = await queryTaxRules(message);

        // Step 2: Call Gemini for synthesis
        const context = {
            userProfile: profile,
            knowledgeBase: relevantRules.matches.map((m: any) => m.metadata)
        };

        const response = await geminiWithContext(
            `User is asking about tax savings. Answer based on Indian tax rules.`,
            context
        );

        return {
            agent: 'tax-saver',
            userQuery: message,
            response,
            sources: relevantRules.matches.map((m: any) => m.id),
        };
    }
);
