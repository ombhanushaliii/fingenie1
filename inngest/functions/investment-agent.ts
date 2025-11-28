import { inngest } from '@/lib/inngest';
import { queryInvestmentProducts } from '@/lib/vectordb';
import { geminiWithContext } from '@/lib/gemini';

export const investmentAgent = inngest.createFunction(
    { id: 'investment-planner-agent' },
    { event: 'user/investment-query' },
    async ({ event }) => {
        const { message, profile } = event.data;

        // Step 1: Search Pinecone for investment concepts
        const conceptResults = await queryInvestmentProducts(message);

        // Step 2: Web search for current investment plans (Placeholder for Phase 2)
        // In a real implementation, use SerpAPI or Brave Search API here.
        // const webResults = await webSearchInvestmentPlans(message);
        const webResults = { results: [] }; // Mock empty results for now

        // Step 3: Gemini synthesis
        const context = {
            userProfile: profile,
            investmentConcepts: conceptResults.matches.map((m: any) => m.metadata),
            webSearchResults: webResults.results
        };

        const response = await geminiWithContext(
            `Compare and recommend investment plans based on user query.`,
            context
        );

        return {
            agent: 'investment-planner',
            userQuery: message,
            response,
            sources: conceptResults.matches.map((m: any) => m.id),
        };
    }
);
