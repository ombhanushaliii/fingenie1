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
    chatId: string;
    userId: string;
    title: string;
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
        chatId: { type: String, required: true, unique: true, index: true },
        userId: { type: String, required: true, index: true },
        title: { type: String, default: 'New Chat' },
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

// Financial Profile Schema for Advanced Analysis
export interface IFinancialProfile extends Document {
    userId: string;
    employmentType: 'salaried' | 'gig' | 'business' | 'student' | 'retired';
    taxDetails: {
        regime: 'new' | 'old';
        pan?: string;
        isGSTRegistered: boolean;
        presumptiveTaxation: boolean; // 44ADA/44AD
    };
    assets: {
        emergencyFund: number;
        fixedDeposits: number;
        mutualFunds: number;
        stocks: number;
        gold: number;
        realEstate: number;
    };
    liabilities: Array<{
        type: 'home_loan' | 'car_loan' | 'personal_loan' | 'credit_card' | 'other';
        outstandingAmount: number;
        interestRate: number;
        monthlyEmi: number;
        endDate?: Date;
    }>;
    insurance: {
        lifeInsuranceCover: number; // Term plan
        healthInsuranceCover: number;
        monthlyPremium: number;
    };
    monthlyBurnRate: number; // Calculated average monthly expenses
    incomeVolatilityScore: number; // 0-10 scale (0=stable, 10=highly volatile)
    createdAt: Date;
    updatedAt: Date;
}

const FinancialProfileSchema = new Schema<IFinancialProfile>(
    {
        userId: { type: String, required: true, unique: true, index: true },
        employmentType: {
            type: String,
            enum: ['salaried', 'gig', 'business', 'student', 'retired'],
            default: 'salaried'
        },
        taxDetails: {
            regime: { type: String, enum: ['new', 'old'], default: 'new' },
            pan: String,
            isGSTRegistered: { type: Boolean, default: false },
            presumptiveTaxation: { type: Boolean, default: false },
        },
        assets: {
            emergencyFund: { type: Number, default: 0 },
            fixedDeposits: { type: Number, default: 0 },
            mutualFunds: { type: Number, default: 0 },
            stocks: { type: Number, default: 0 },
            gold: { type: Number, default: 0 },
            realEstate: { type: Number, default: 0 },
        },
        liabilities: [
            {
                type: { type: String, enum: ['home_loan', 'car_loan', 'personal_loan', 'credit_card', 'other'] },
                outstandingAmount: Number,
                interestRate: Number,
                monthlyEmi: Number,
                endDate: Date,
            },
        ],
        insurance: {
            lifeInsuranceCover: { type: Number, default: 0 },
            healthInsuranceCover: { type: Number, default: 0 },
            monthlyPremium: { type: Number, default: 0 },
        },
        monthlyBurnRate: { type: Number, default: 0 },
        incomeVolatilityScore: { type: Number, default: 0 },
    },
    { timestamps: true }
);

if (process.env.NODE_ENV === 'development') {
    if (mongoose.models.FinancialProfile) delete mongoose.models.FinancialProfile;
}

export const FinancialProfile =
    mongoose.models.FinancialProfile || mongoose.model<IFinancialProfile>('FinancialProfile', FinancialProfileSchema);

