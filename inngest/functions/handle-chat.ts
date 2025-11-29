import { inngest } from '@/lib/inngest';
import { geminiStructuredOutput, geminiChat } from '@/lib/gemini';
import dbConnect from '@/lib/db';
import { Conversation, User } from '@/lib/schemas';
import { investmentAgent } from './investment-agent';
import { retirementAgent } from './retirement-agent';
import { schemeAgent } from './scheme-agent';
import { transactionAgent } from './transaction-agent';
import { analysisAgent } from './analysis-agent';

export const handleChat = inngest.createFunction(
    { id: 'handle-chat-message' },
    { event: 'app/chat.message.received' },
    async ({ event, step }) => {
        const { userId, messageId, text, chatId } = event.data;

        await dbConnect();

        // Step 1: Load context
        const context = await step.run('load-context', async () => {
            const user = await User.findOne({ userId });
            const conversation = await Conversation.findOne({ chatId, userId });
            return { user, conversation };
        });

        // ... (Step 2 and 3 are unchanged)

        // Step 2: Route intent using Gemini

        const routing = await step.run('route-intent', async () => {
            const prompt = `
Analyze this user message and determine which financial agents should handle it.
Select ONLY the most relevant agent(s). Do not select multiple agents unless absolutely necessary.
For simple transaction updates (e.g., "I spent 500"), ONLY select 'transaction_tracking'.

User Message: "${text}"
User Context: ${JSON.stringify(context)}

Available agents:
- investment_planning: Asset allocation, investment strategies
- retirement_pension: Retirement planning, pension schemes
- government_schemes: Government schemes, subsidies
- transaction_tracking: Logging expenses, income, balance updates
- analysis: Financial analysis, investment strategies
- general_qa: Financial literacy, explanations

Return JSON:
{
  "intent": "string",
  "agents": ["array", "of", "agents"],
  "confidence": 0.0-1.0
}
`;
            const result = await geminiStructuredOutput(prompt, 'You are a financial agent router');
            return result;
        });

        // Step 3: Call appropriate agents
        const agentResults: any = {};
        // Ensure profile includes userId, even if fetching from DB where it's not in the profile subdoc
        const profile = context.user
            ? { ...context.user.profile, userId }
            : { userId, balance: 0 }; // Default for new users if not found (though load-context should find it if created)

        if (routing.agents && routing.agents.length > 0) {
            for (const agent of routing.agents) {

                if (agent === 'investment_planning') {
                    agentResults.investment = await step.invoke('call-investment-agent', {
                        function: investmentAgent,
                        data: { message: text, profile },
                    });
                } else if (agent === 'retirement_pension') {
                    agentResults.retirement = await step.invoke('call-retirement-agent', {
                        function: retirementAgent,
                        data: { message: text, profile },
                    });
                } else if (agent === 'government_schemes') {
                    agentResults.schemes = await step.invoke('call-scheme-agent', {
                        function: schemeAgent,
                        data: { message: text, profile },
                    });
                } else if (agent === 'transaction_tracking') {
                    agentResults.transaction = await step.invoke('call-transaction-agent', {
                        function: transactionAgent,
                        data: { message: text, profile },
                    });
                } else if (agent === 'analysis') {
                    agentResults.analysis = await step.invoke('call-analysis-agent', {
                        function: analysisAgent,
                        data: { message: text, profile },
                    });
                } else if (agent === 'general_qa') {
                    // For general QA, we can just use the Gemini chat directly or a specific agent
                    // For now, we'll let the compose-response step handle it with the context
                    agentResults.general = "User asked a general question. Please answer based on general financial knowledge.";
                }
            }
        } else {
            // Default fallback if no agent is selected
            agentResults.general = "No specific agent selected. Please answer the user's question generally.";
        }

        // Step 4: Compose response
        const response = await step.run('compose-response', async () => {
            const prompt = `Based on these agent results, compose a friendly financial advice response:
                ${JSON.stringify(agentResults)}

                User asked: "${text}"

                Response:
                `;

            return await geminiChat(prompt);
        });

        // Step 5: Store response in conversation
        await step.run('store-response', async () => {
            await Conversation.updateOne(
                { chatId, userId },
                {
                    $push: {
                        messages: {
                            messageId: `${messageId}-response`,
                            sender: 'assistant',
                            text: response,
                            agentsInvolved: routing.agents,
                            timestamp: new Date(),
                        },
                    },
                }
            );
        });

        // Step 6: Generate Title if needed (Parallel-ish)
        // We check if the title is "New Chat" or missing, and if so, generate a new one.
        // Note: In a real parallel setup, we might run this alongside 'compose-response' using Promise.all if we weren't using step.run sequentially.
        // But Inngest steps are sequential. To make it "feel" parallel to the user, the UI is already polling.
        // We can just run this after storing the response, or even before.

        await step.run('generate-title', async () => {
            const conversation = await Conversation.findOne({ chatId, userId });
            if (conversation && (conversation.title === 'New Chat' || !conversation.title)) {
                const { generateChatTitle } = await import('@/lib/gemini');
                const newTitle = await generateChatTitle(text);

                await Conversation.updateOne(
                    { chatId, userId },
                    { $set: { title: newTitle } }
                );
                return newTitle;
            }
        });

        return { userId, messageId, status: 'completed' };
    }
);