# FinGenie

A financial advisor application using AI agents to help with investment planning, tax analysis, retirement planning, and cashflow tracking.

# Video Link
https://drive.google.com/file/d/1tlkqk9lCmEU_h8Y8ikqgLb__foM7gG4K/view?usp=sharing

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: MongoDB (Mongoose)
- **AI/LLM**: Google Gemini
- **Vector DB**: Pinecone
- **Queue/Workflows**: Inngest
- **Auth**: NextAuth.js

## Prerequisites

- Node.js 18+
- MongoDB Atlas account
- Google AI Studio account (Gemini API)
- Pinecone account
- Inngest account (optional for local dev, but needed for keys)

## Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd fingenie1
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the root directory with the following variables:

   ```env
   # Database
   MONGODB_URI=mongodb+srv://...

   # Auth
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_generated_secret

   # AI & Vector DB
   GEMINI_API_KEY=your_gemini_key
   PINECONE_API_KEY=your_pinecone_key

   # Inngest
   INNGEST_EVENT_KEY=local  # or your production key
   INNGEST_SIGNING_KEY=local # or your production key
   ```

4. **Run the Application**
   Start the Next.js development server:
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:3000`.

5. **Run Inngest Dev Server**
   To enable background workflows and agent orchestration, run Inngest in a separate terminal:
   ```bash
   npx inngest-cli@latest dev
   ```
   Open `http://localhost:8288` to view the Inngest dashboard.

## Architecture Overview

- **Agents**: Located in `lib/agents/`. Specialized logic for different financial domains.
- **Workflows**: Located in `inngest/functions/`. Handles complex multi-step processes like chat routing and transaction processing.
- **Vector Search**: Uses Pinecone to retrieve relevant financial context (tax rules, investment products) for the AI.