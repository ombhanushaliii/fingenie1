import { inngest } from '@/lib/inngest';
import { queryComplianceGuides } from '@/lib/vectordb';
import { geminiWithContext } from '@/lib/gemini';

export const schemeAgent = inngest.createFunction(
    { id: 'government-scheme-agent' },
    { event: 'user/scheme-query' },
    async ({ event }) => {
        const { message, profile } = event.data;

        // Step 1: Search Pinecone for government schemes
        const schemeResults = await queryComplianceGuides(message);

        // Step 2: Ask Gemini to confirm eligibility
        const context = {
            userProfile: profile,
            schemes: schemeResults.matches.map((m: any) => m.metadata)
        };

        const response = await geminiWithContext(
            `Based on eligibility criteria, suggest matching schemes and ask for any missing information.`,
            context
        );

        return {
            agent: 'government-scheme',
            userQuery: message,
            response,
            availableSchemes: schemeResults.matches.map((m: any) => ({
                name: m.metadata.name,
                eligibility: m.metadata.eligibility,
                link: m.metadata.application_link,
            })),
        };
    }
);
