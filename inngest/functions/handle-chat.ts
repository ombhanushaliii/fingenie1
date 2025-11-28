import { inngest } from '@/lib/inngest';
import { geminiStructuredOutput, geminiChat } from '@/lib/gemini';
import dbConnect from '@/lib/db';
import { Conversation, User } from '@/lib/schemas';

export const handleChat = inngest.createFunction(
    { id: 'handle-chat-message' },
    { event: 'app/chat.message.received' },
    async ({ event, step }) => {
        const { userId, messageId, text } = event.data;

        await dbConnect();

        // Step 1: Load context
        const context = await step.run('load-context', async () => {
            const user = await User.findOne({ userId });
            const conversation = await Conversation.findOne({ userId });
            return { user, conversation };
        });

        // Step 2: Route intent using Gemini
        const routing = await step.run('route-intent', async () => {
            const prompt = `
Analyze this user message and determine which financial agents should handle it.

User Message: "${text}"
User Context: ${JSON.stringify(context)}

Available agents:
- investment_planning: Asset allocation, investment strategies
- tax_itr: Income tax, ITR filing, deductions
- retirement_pension: Retirement planning, pension schemes
- cashflow_analysis: Spending insights, savings rate
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

        // Step 3: Call appropriate agents in parallel
        const agentResults: any = {};

        // Placeholder for agents (will be implemented in Phase 5)
        if (routing.agents && routing.agents.length > 0) {
            // For now, just simulate agent responses
            agentResults.simulated = await step.run('simulate-agents', async () => {
                return `Agents ${routing.agents.join(', ')} would be called here.`;
            });
        }

        // Step 4: Compose response
        const response = await step.run('compose-response', async () => {
            const prompt = `
Based on these agent results, compose a friendly financial advice response:
${JSON.stringify(agentResults)}

User asked: "${text}"

Response:
`;
            return await geminiChat(prompt);
        });

        // Step 5: Store response in conversation
        await step.run('store-response', async () => {
            await Conversation.updateOne(
                { userId },
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

        return { userId, messageId, status: 'completed' };
    }
);
