import { inngest } from '@/lib/inngest';
import { queryPensionSchemes } from '@/lib/vectordb';
import { geminiWithContext } from '@/lib/gemini';

export const retirementAgent = inngest.createFunction(
    { id: 'retirement-planner-agent' },
    { event: 'user/retirement-query' },
    async ({ event }) => {
        const { message, profile } = event.data;

        // Step 1: Search Pinecone for pension schemes
        const schemeResults = await queryPensionSchemes(message);

        // Step 2: Filter by eligibility (Placeholder)
        const eligibleSchemes = schemeResults.matches.filter((match: any) => {
            // Add detailed eligibility logic here based on match.metadata.eligibility
            return true;
        });

        // Step 3: Calculate projections using Gemini
        const context = {
            userProfile: profile,
            schemes: eligibleSchemes.map((m: any) => m.metadata)
        };

        const response = await geminiWithContext(
            `Calculate retirement corpus and recommend best scheme based on user profile and available schemes.`,
            context
        );

        return {
            agent: 'retirement-planner',
            userQuery: message,
            response,
            recommendedSchemes: schemeResults.matches.map((m: any) => m.metadata.name),
        };
    }
);
