# FinGenie: Complete Technical Implementation Plan
## Using Next.js + MongoDB + Inngest + Gemini (Free) + Pinecone VectorDB

**Status:** VectorDB ✅ + OAuth + Chat Frontend ✅ | Rest: TODO

---

## TABLE OF CONTENTS
1. [Completed Phase](#completed-phase)
2. [Next Phase: Backend Setup](#next-phase-backend-setup)
3. [Phase 3: Inngest Workflows](#phase-3-inngest-workflows)
4. [Phase 4: Agent Implementations](#phase-4-agent-implementations)
5. [Phase 5: Frontend Integration](#phase-5-frontend-integration)
6. [Phase 6: Testing & Deployment](#phase-6-testing--deployment)

---

## COMPLETED PHASE ✅

- ✅ **Pinecone VectorDB Setup** (4 indexes: tax-rules, pension-schemes, compilance-guide, investment-products)
- ✅ **Investment Product Vector DB** (16 chunks covering equity, debt, tax-saving, gold, hybrid, international)
- ✅ **Auth (OAuth)** with Next-Auth
- ✅ **Chat Interface (Frontend)** with UI components

---

## NEXT PHASE: BACKEND SETUP



**Documentation:**
- Inngest: https://www.inngest.com/docs/getting-started/nodejs-quick-start || https://www.inngest.com/docs/getting-started/nextjs-quick-start
- Gemini: https://ai.google.dev/docs
- Pinecone Python: https://docs.pinecone.io/



**How to get keys:**
1. **GEMINI_API_KEY** (Free): https://aistudio.google.com/app/apikeys → Click "Create API Key"
2. **MONGODB_URI**: https://www.mongodb.com/cloud/atlas → Create cluster → Connect → Copy URI
3. **INNGEST_API_KEY**: https://app.inngest.com/ → Sign up → Copy API keys
4. **PINECONE_API_KEY**: Already created in previous phase

---

## PHASE 2: MongoDB Setup (Steps 1-3)

### Step 2.1: Create Database Connection

**File: `lib/db.ts`**
```typescript
import mongoose from 'mongoose';

declare global {
  var mongoose: any;
}

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI not defined');
}

let cached = global.mongoose || { conn: null, promise: null };

export async function dbConnect() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export default dbConnect;
```

**Documentation:** https://www.mongodb.com/docs/drivers/node/current/

### Step 2.2: Create Schemas

**File: `lib/schemas.ts`**
```typescript
import mongoose, { Schema, Document } from 'mongoose';

// User Schema
export interface IUser extends Document {
  userId: string;
  email: string;
  phoneNumber?: string;
  profile: {
    age?: number;
    riskProfile?: 'conservative' | 'moderate' | 'aggressive';
    occupation?: string;
  };
  goals: Array<{
    goalId: string;
    name: string;
    targetAmount: number;
    timeHorizonMonths: number;
    priority: 'high' | 'medium' | 'low';
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    userId: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    phoneNumber: String,
    profile: {
      age: Number,
      riskProfile: { type: String, enum: ['conservative', 'moderate', 'aggressive'] },
      occupation: String,
    },
    goals: [
      {
        goalId: String,
        name: String,
        targetAmount: Number,
        timeHorizonMonths: Number,
        priority: { type: String, enum: ['high', 'medium', 'low'] },
      },
    ],
  },
  { timestamps: true }
);

// Transaction Schema
export interface ITransaction extends Document {
  transactionId: string;
  userId: string;
  type: 'income' | 'expense' | 'savings';
  amount: number;
  category: string;
  frequency: 'monthly' | 'yearly' | 'one-time';
  date: Date;
  description?: string;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    transactionId: { type: String, required: true, unique: true },
    userId: { type: String, required: true, index: true },
    type: { type: String, enum: ['income', 'expense', 'savings'] },
    amount: Number,
    category: String,
    frequency: { type: String, default: 'one-time' },
    date: { type: Date, default: Date.now },
    description: String,
  },
  { timestamps: true }
);

// Conversation Schema
export interface IConversation extends Document {
  userId: string;
  messages: Array<{
    messageId: string;
    sender: 'user' | 'assistant';
    text: string;
    agentsInvolved?: string[];
    timestamp: Date;
  }>;
}

const ConversationSchema = new Schema<IConversation>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    messages: [
      {
        messageId: String,
        sender: { type: String, enum: ['user', 'assistant'] },
        text: String,
        agentsInvolved: [String],
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// Export Models
export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export const Transaction =
  mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema);
export const Conversation =
  mongoose.models.Conversation || mongoose.model<IConversation>('Conversation', ConversationSchema);
```

**Documentation:** https://mongoosejs.com/docs/guide.html

### Step 2.3: Gemini AI Client

**File: `lib/gemini.ts`**
```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function geminiChat(
  prompt: string,
  model = 'gemini-2.0-flash'
) {
  const modelInstance = genAI.getGenerativeModel({ model });
  const result = await modelInstance.generateContent(prompt);
  return result.response.text();
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
  const text = result.response.text();
  
  // Parse JSON if needed
  try {
    return JSON.parse(text);
  } catch {
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
```

**Documentation:** https://ai.google.dev/docs

### Step 2.4: Inngest Setup

**File: `lib/inngest.ts`**
```typescript
import { Inngest } from 'inngest';

export const inngest = new Inngest({
  id: 'fingenie',
  name: 'FinGenie Financial Agent',
});
```

**File: `app/api/inngest/[[...path]]/route.ts`**
```typescript
import { serve } from 'inngest/next';
import { inngest } from '@/lib/inngest';

export const dynamic = 'force-dynamic';

// Import all Inngest functions (we'll create these in Phase 3)
const functions: any[] = [];

export const { GET, POST, PUT, DELETE } = serve({
  client: inngest,
  functions: functions,
});
```

**Documentation:** https://www.inngest.com/docs/getting-started/nodejs-quick-start

---

## PHASE 3: Core API Routes (Steps 4-6)

### Step 3.1: Chat Message Handler

**File: `app/api/chat/route.ts`**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { inngest } from '@/lib/inngest';
import dbConnect from '@/lib/db';
import { Conversation } from '@/lib/schemas';

export async function POST(req: NextRequest) {
  await dbConnect();

  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { message } = await req.json();
  const userId = session.user.email;
  const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Store user message
  await Conversation.updateOne(
    { userId },
    {
      $push: {
        messages: {
          messageId,
          sender: 'user',
          text: message,
          timestamp: new Date(),
        },
      },
    },
    { upsert: true }
  );

  // Emit to Inngest
  await inngest.send({
    name: 'app/chat.message.received',
    data: { userId, messageId, text: message },
  });

  return NextResponse.json({ messageId, status: 'queued' });
}
```

### Step 3.2: Transaction Input Handler

**File: `app/api/transactions/route.ts`**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { inngest } from '@/lib/inngest';

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { text, source = 'text' } = await req.json();
  const userId = session.user.email;

  await inngest.send({
    name: 'app/transaction.input.received',
    data: { userId, rawInput: text, source },
  });

  return NextResponse.json({ status: 'queued' });
}
```

### Step 3.3: Pinecone Query Helper

**File: `lib/vectordb.ts`**
```typescript
import { Pinecone } from '@pinecone-database/pinecone';
import { SentenceTransformer } from '@xenova/transformers';

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });

export async function queryInvestmentProducts(query: string, topK = 5) {
  const index = pc.Index('investment-products');

  // For now, return mock data (we'll use real embeddings later)
  const results = await index.query({
    topK,
    queryRequest: {
      namespace: '',
      topK,
      includeValues: false,
      includeMetadata: true,
    },
  });

  return results;
}

export async function queryTaxRules(query: string, topK = 5) {
  const index = pc.Index('tax-rules');
  // Similar implementation
  return await index.query({ topK });
}

export async function queryPensionSchemes(query: string, topK = 5) {
  const index = pc.Index('pension-schemes');
  return await index.query({ topK });
}
```

**Documentation:** https://docs.pinecone.io/

---

## PHASE 4: Inngest Workflows (Agent Orchestration)

### Step 4.1: Chat Message Orchestrator

**File: `inngest/functions/handle-chat.ts`**
```typescript
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

    if (routing.agents.includes('investment_planning')) {
      agentResults.investment = await step.run('investment-agent', async () => {
        // Call investment agent (see Phase 4 agents)
        return 'Investment advice here...';
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
```

### Step 4.2: Transaction Processing Workflow

**File: `inngest/functions/process-transaction.ts`**
```typescript
import { inngest } from '@/lib/inngest';
import { geminiStructuredOutput } from '@/lib/gemini';
import dbConnect from '@/lib/db';
import { Transaction } from '@/lib/schemas';

export const processTransaction = inngest.createFunction(
  { id: 'process-transaction' },
  { event: 'app/transaction.input.received' },
  async ({ event, step }) => {
    const { userId, rawInput, source } = event.data;

    await dbConnect();

    // Step 1: Extract transaction details using Gemini
    const extraction = await step.run('extract-transaction', async () => {
      const prompt = `
Extract transaction details from this input: "${rawInput}"

Return JSON:
{
  "type": "income" | "expense" | "savings",
  "amount": number,
  "category": string,
  "frequency": "monthly" | "yearly" | "one-time",
  "date": "YYYY-MM-DD",
  "description": string
}
`;

      return await geminiStructuredOutput(
        prompt,
        'You are a financial transaction parser'
      );
    });

    // Step 2: Store transaction
    const transactionId = await step.run('store-transaction', async () => {
      const result = await Transaction.create({
        transactionId: `txn_${Date.now()}`,
        userId,
        ...extraction,
        source,
      });
      return result._id;
    });

    return { transactionId, status: 'processed' };
  }
);
```

### Step 4.3: Index All Workflows

**File: `inngest/functions/index.ts`**
```typescript
export { handleChat } from './handle-chat';
export { processTransaction } from './process-transaction';
// Add more workflows as you build them
```

**Documentation:** https://www.inngest.com/docs

---

## PHASE 5: Individual Agents (Steps 7-12)

### Step 5.1: Income & Expense Capture Agent

**File: `lib/agents/transaction-agent.ts`**
```typescript
import { geminiStructuredOutput } from '@/lib/gemini';

export async function extractTransactionDetails(text: string) {
  const prompt = `
Extract financial transaction details from: "${text}"

Return JSON with exact format:
{
  "type": "income" | "expense" | "savings",
  "amount": number (only digits),
  "category": string,
  "frequency": "monthly" | "yearly" | "one-time",
  "date": "YYYY-MM-DD",
  "description": string
}
`;

  return await geminiStructuredOutput(
    prompt,
    'Extract transaction details with high precision'
  );
}
```

### Step 5.2: Cashflow Analysis Agent

**File: `lib/agents/cashflow-agent.ts`**
```typescript
import dbConnect from '@/lib/db';
import { Transaction } from '@/lib/schemas';
import { geminiChat } from '@/lib/gemini';

export async function analyzeCashflow(userId: string) {
  await dbConnect();

  const monthStart = new Date();
  monthStart.setDate(1);

  const transactions = await Transaction.find({
    userId,
    date: { $gte: monthStart },
  });

  const income = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const expenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const savings = income - expenses;
  const savingsRate = income > 0 ? (savings / income) * 100 : 0;

  // Generate insights
  const insights = await geminiChat(`
Monthly Financial Summary:
- Income: ₹${income}
- Expenses: ₹${expenses}
- Savings: ₹${savings}
- Savings Rate: ${savingsRate.toFixed(1)}%

Generate a brief, encouraging insight about their finances.
`);

  return { income, expenses, savings, savingsRate, insights };
}
```

### Step 5.3: Investment Planning Agent

**File: `lib/agents/investment-agent.ts`**
```typescript
import { queryInvestmentProducts } from '@/lib/vectordb';
import { geminiChat } from '@/lib/gemini';

export async function generateInvestmentPlan(
  userProfile: any,
  goal: any,
  cashflow: any
) {
  // Query VectorDB for investment products
  const products = await queryInvestmentProducts(
    `investment funds for ${userProfile.profile.riskProfile} risk profile`
  );

  const productsContext = products.matches
    .map((m: any) => m.metadata?.text)
    .join('\n');

  const prompt = `
User Profile:
- Age: ${userProfile.profile.age}
- Risk Profile: ${userProfile.profile.riskProfile}
- Monthly Surplus: ₹${cashflow.monthlyS urplus}

Goal: ${goal.name} in ${goal.timeHorizonMonths} months, Target: ₹${goal.targetAmount}

Available Investment Products:
${productsContext}

Suggest a balanced investment allocation (only categories, no specific funds):
`;

  return await geminiChat(prompt);
}
```

### Step 5.4: Tax & ITR Agent

**File: `lib/agents/tax-agent.ts`**
```typescript
import { queryTaxRules } from '@/lib/vectordb';
import { geminiChat } from '@/lib/gemini';

export async function prepareITRDraft(
  userIncome: number,
  deductions: any
) {
  const taxRules = await queryTaxRules('Income Tax Act 2024 deductions');

  const rulesContext = taxRules.matches
    .map((m: any) => m.metadata?.text)
    .join('\n');

  const prompt = `
Tax Rules Context:
${rulesContext}

User Income Details:
- Salary: ₹${userIncome}
- Deductions: ${JSON.stringify(deductions)}

Generate a pre-ITR summary (not filing, just educational):
`;

  return await geminiChat(prompt);
}
```

### Step 5.5: Retirement & Pension Agent

**File: `lib/agents/retirement-agent.ts`**
```typescript
import { queryPensionSchemes } from '@/lib/vectordb';
import { geminiChat } from '@/lib/gemini';

export async function planRetirement(
  age: number,
  currentSavings: number,
  monthlySurplus: number
) {
  const schemes = await queryPensionSchemes('NPS PPF SCSS retirement schemes');

  const schemesContext = schemes.matches
    .map((m: any) => m.metadata?.text)
    .join('\n');

  const prompt = `
Pension Schemes Available:
${schemesContext}

User Profile:
- Age: ${age}
- Current Savings: ₹${currentSavings}
- Monthly Surplus: ₹${monthlySurplus}

Suggest retirement planning strategy with scheme allocation:
`;

  return await geminiChat(prompt);
}
```

---

## PHASE 6: Frontend Integration

### Step 6.1: Update Chat Component

**File: `components/ChatInterface.tsx`** (Update your existing component)
```typescript
'use client';

import { useState } from 'react';

export function ChatInterface() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message
    const userMessage = { id: Date.now(), role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Call chat API
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });

      const { messageId } = await res.json();

      // Poll for response (simple version)
      setTimeout(async () => {
        const pollRes = await fetch(`/api/chat/${messageId}`);
        const data = await pollRes.json();

        if (data.response) {
          setMessages((prev) => [
            ...prev,
            { id: messageId, role: 'assistant', content: data.response },
          ]);
        }
      }, 1000);
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`mb-4 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}
          >
            <div
              className={`inline-block p-3 rounded-lg ${
                msg.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-black'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={sendMessage} className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about investments, taxes, retirement..."
            className="flex-1 border rounded p-2"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? 'Thinking...' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  );
}
```

---

## PHASE 7: Testing & Deployment

### Step 7.1: Local Testing

```bash
# 1. Start MongoDB locally or use Atlas
# 2. Set all env variables in .env.local
# 3. Run development server
npm run dev

# 4. Test endpoints
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token" \
  -d '{"message": "test"}'

# 5. Check Inngest dashboard: https://app.inngest.com
```

### Step 7.2: Deployment Checklist

- [ ] MongoDB Atlas configured
- [ ] Pinecone indexes created
- [ ] Gemini API key (free)
- [ ] Inngest account linked
- [ ] All env variables set
- [ ] OAuth provider configured
- [ ] Chat UI working
- [ ] API routes tested

**Deploy to Vercel:**
```bash
npm install -g vercel
vercel
# Follow prompts, add env variables in dashboard
```

**Documentation:** https://vercel.com/docs

---

## QUICK REFERENCE: Key Documentation Links

| Component | Link |
|-----------|------|
| **Gemini AI (Free)** | https://ai.google.dev/docs |
| **Inngest** | https://www.inngest.com/docs |
| **MongoDB** | https://www.mongodb.com/docs/drivers/node |
| **Pinecone** | https://docs.pinecone.io |
| **Next.js** | https://nextjs.org/docs |
| **Vercel Deployment** | https://vercel.com/docs |
| **NextAuth** | https://next-auth.js.org |

---

## SUMMARY OF COMPLETION

**Phase Breakdown:**
1. ✅ VectorDB Setup
2. ✅ OAuth + Chat Frontend
3. 📝 **Backend Setup** (MongoDB + Gemini + Inngest) ← START HERE
4. 🔜 API Routes (Chat, Transactions)
5. 🔜 Inngest Workflows
6. 🔜 Agent Implementations
7. 🔜 Frontend Integration
8. 🔜 Testing & Deployment

**Estimated Timeline:**
- Phase 3 (Backend Setup): 2-3 hours
- Phase 4 (API Routes): 2-3 hours
- Phase 5 (Inngest Workflows): 3-4 hours
- Phase 6 (Agents): 4-6 hours
- Phase 7 (Frontend Integration): 2-3 hours
- Phase 8 (Testing): 2-3 hours

**Total: ~18-22 hours of implementation**

---

## NEXT IMMEDIATE STEPS

1. Get free Gemini API key: https://aistudio.google.com/app/apikeys
2. Install all dependencies
3. Set up MongoDB Atlas
4. Configure `.env.local`
5. Implement Phase 3 (Backend Setup)
6. Test with sample API calls
7. Build Phase 4 onwards

**Ready to start? Pick Phase 3 and we'll implement it step-by-step!**
