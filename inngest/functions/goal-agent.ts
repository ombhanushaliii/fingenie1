import { inngest } from '@/lib/inngest';
import { geminiStructuredOutput, geminiChat } from '@/lib/gemini';
import { User } from '@/lib/schemas';
import dbConnect from '@/lib/db';

export const goalAgent = inngest.createFunction(
    { id: 'goal-agent' },
    { event: 'user/goal-input' },
    async ({ event }) => {
        const { message, profile } = event.data;
        await dbConnect();

        // Step 1: Parse goal details from natural language using Gemini
        const parsePrompt = `
      Analyze the user input to extract financial goal details.
      
      Return JSON:
      { 
        "intent": "set_goal",
        "goal": {
            "name": "string (e.g., 'Vacation', 'New Car')",
            "targetAmount": number,
            "timeHorizonMonths": number (estimate if not explicit, e.g., 'next year' = 12),
            "priority": "high" | "medium" | "low" (default to medium if unsure)
        },
        "missingFields": ["string"] (list any critical missing fields like 'targetAmount' or 'name')
      }
      
      User input: "${message}"
    `;

        const result = await geminiStructuredOutput(parsePrompt, 'You are a financial goal parser.');

        if (result?.missingFields && result.missingFields.length > 0) {
            return {
                agent: 'goal_setting',
                error: 'Missing information',
                clarification: `I need a bit more info to set this goal. Please specify: ${result.missingFields.join(', ')}.`,
            };
        }

        const goalData = result?.goal;

        if (!goalData || !goalData.name || !goalData.targetAmount) {
            return {
                agent: 'goal_setting',
                error: 'Could not parse goal',
                clarification: 'Please specify the goal name and target amount.',
            };
        }

        // Step 2: Store in MongoDB
        console.log(`[Goal Agent] Creating goal for user: ${profile.userId}`);

        const newGoal = {
            goalId: `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            ...goalData,
            createdAt: new Date()
        };

        await User.updateOne(
            { userId: profile.userId },
            {
                $setOnInsert: {
                    email: profile.email || `${profile.userId}@placeholder.com`, // Fallback if email missing
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                $push: { goals: newGoal }
            },
            { upsert: true }
        );

        // Step 3: Generate confirmation response
        return {
            agent: 'goal_setting',
            goal: newGoal,
            confirmationMessage: `Great! I've set a goal for "${goalData.name}" with a target of ${goalData.targetAmount}.`,
        };
    }
);