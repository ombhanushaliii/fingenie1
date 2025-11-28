
// Verification script for Phase 2 and 3
import { dbConnect } from './lib/db';
import { User, Transaction, Conversation } from './lib/schemas';
import { geminiChat } from './lib/gemini';
import { inngest } from './lib/inngest';
import { queryInvestmentProducts } from './lib/vectordb';

async function verify() {
    console.log('Starting verification...');

    // 1. Verify DB Connection (Mocking environment variables if needed, but assuming they exist or we catch error)
    try {
        console.log('Checking DB connection function...');
        // We won't actually connect to avoid timeout if env vars are missing, just checking import and function existence
        if (typeof dbConnect === 'function') {
            console.log('✅ dbConnect is a function');
        }
    } catch (e) {
        console.error('❌ dbConnect check failed', e);
    }

    // 2. Verify Schemas
    try {
        console.log('Checking Schemas...');
        if (User && Transaction && Conversation) {
            console.log('✅ Schemas imported successfully');
        }
    } catch (e) {
        console.error('❌ Schema check failed', e);
    }

    // 3. Verify Gemini
    try {
        console.log('Checking Gemini client...');
        if (typeof geminiChat === 'function') {
            console.log('✅ geminiChat is a function');
        }
    } catch (e) {
        console.error('❌ Gemini check failed', e);
    }

    // 4. Verify Inngest
    try {
        console.log('Checking Inngest client...');
        if (inngest) {
            console.log('✅ Inngest client initialized');
        }
    } catch (e) {
        console.error('❌ Inngest check failed', e);
    }

    // 5. Verify VectorDB
    try {
        console.log('Checking VectorDB helper...');
        const result = await queryInvestmentProducts('test');
        if (result && result.matches) {
            console.log('✅ VectorDB query returned mock data');
        }
    } catch (e) {
        console.error('❌ VectorDB check failed', e);
    }

    console.log('Verification complete.');
}

verify().catch(console.error);
