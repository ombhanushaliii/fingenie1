import { Pinecone } from '@pinecone-database/pinecone';
import { generateEmbedding } from './gemini';

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });

async function queryIndex(indexName: string, query: string, topK = 5) {
    try {
        const embedding = await generateEmbedding(query);
        const index = pc.Index(indexName);

        const queryResponse = await index.query({
            vector: embedding,
            topK,
            includeMetadata: true,
        });

        return queryResponse;
    } catch (error) {
        console.error(`Error querying index ${indexName}:`, error);
        return { matches: [] };
    }
}

export async function queryInvestmentProducts(query: string, topK = 5) {
    return queryIndex('investment-products', query, topK);
}

export async function queryTaxRules(query: string, topK = 5) {
    return queryIndex('tax-rules', query, topK);
}

export async function queryPensionSchemes(query: string, topK = 5) {
    return queryIndex('pension-schemes', query, topK);
}

export async function queryComplianceGuides(query: string, topK = 5) {
    return queryIndex('compilance-guides', query, topK);
}
