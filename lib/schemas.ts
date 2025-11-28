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
        balance?: number;
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
            balance: { type: Number, default: 0 },
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
// Export Models
// Prevent Mongoose OverwriteModelError by checking if model exists
// In development, we want to delete the model to ensure schema updates are applied
if (process.env.NODE_ENV === 'development') {
    if (mongoose.models.User) delete mongoose.models.User;
    if (mongoose.models.Transaction) delete mongoose.models.Transaction;
    if (mongoose.models.Conversation) delete mongoose.models.Conversation;
}

export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export const Transaction =
    mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema);
export const Conversation =
    mongoose.models.Conversation || mongoose.model<IConversation>('Conversation', ConversationSchema);
