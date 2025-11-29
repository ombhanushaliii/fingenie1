import dbConnect from '@/lib/db';
import { User, FinancialProfile } from '@/lib/schemas';

/**
 * Save user data (age, name, etc.)
 */
export async function saveUserData(userId: string, data: {
    age?: number;
    name?: string;
    email?: string;
}) {
    await dbConnect();

    const updates: any = {};
    if (data.age) updates['profile.age'] = data.age;
    if (data.name) updates.name = data.name;
    if (data.email) updates.email = data.email;

    if (Object.keys(updates).length === 0) return null;

    return await User.findOneAndUpdate(
        { userId },
        {
            $set: updates,
            $setOnInsert: { userId, profile: {} }
        },
        { upsert: true, new: true }
    );
}

/**
 * Save financial profile data
 */
export async function saveFinancialData(userId: string, data: {
    employmentType?: string;
    monthlyExpenses?: number;
    assets?: any;
    liabilities?: any;
    insurance?: any;
    taxDetails?: any;
}) {
    await dbConnect();

    const updates: any = {};

    if (data.employmentType) updates.employmentType = data.employmentType;
    if (data.monthlyExpenses) updates.monthlyBurnRate = data.monthlyExpenses;

    // Handle nested asset updates
    if (data.assets) {
        for (const [key, val] of Object.entries(data.assets)) {
            if (val !== null) updates[`assets.${key}`] = val;
        }
    }

    // Handle nested insurance updates
    if (data.insurance) {
        if (data.insurance.lifeInsuranceCover !== null) {
            updates['insurance.lifeInsuranceCover'] = data.insurance.lifeInsuranceCover;
        }
        if (data.insurance.healthInsuranceCover !== null) {
            updates['insurance.healthInsuranceCover'] = data.insurance.healthInsuranceCover;
        }
    }

    // Handle nested tax details
    if (data.taxDetails) {
        if (data.taxDetails.regime) updates['taxDetails.regime'] = data.taxDetails.regime;
        if (data.taxDetails.pan) updates['taxDetails.pan'] = data.taxDetails.pan;
    }

    if (Object.keys(updates).length === 0) return null;

    return await FinancialProfile.findOneAndUpdate(
        { userId },
        {
            $set: updates,
            $setOnInsert: { userId }
        },
        { upsert: true, new: true }
    );
}

/**
 * Add a liability (loan, debt, etc.)
 */
export async function addLiability(userId: string, liability: any) {
    await dbConnect();
    return await FinancialProfile.findOneAndUpdate(
        { userId },
        { $push: { liabilities: liability } },
        { upsert: true, new: true }
    );
}

/**
 * Get user and profile data
 */
export async function getUserFinancialData(userId: string) {
    await dbConnect();

    const user = await User.findOne({ userId });
    const profile = await FinancialProfile.findOne({ userId });

    return { user, profile };
}

// Legacy helpers (kept for backward compatibility)
export async function getOrCreateFinancialProfile(userId: string) {
    await dbConnect();
    let profile = await FinancialProfile.findOne({ userId });
    if (!profile) {
        profile = await FinancialProfile.create({ userId });
    }
    return profile;
}

export async function updateFinancialProfile(userId: string, updates: any) {
    await dbConnect();
    return await FinancialProfile.findOneAndUpdate(
        { userId },
        { $set: updates },
        { upsert: true, new: true }
    );
}

export async function updateAssets(userId: string, assets: any) {
    await dbConnect();
    const updateQuery: any = {};
    for (const [key, value] of Object.entries(assets)) {
        updateQuery[`assets.${key}`] = value;
    }
    return await FinancialProfile.findOneAndUpdate(
        { userId },
        { $set: updateQuery },
        { upsert: true, new: true }
    );
}

export async function updateTaxDetails(userId: string, details: any) {
    await dbConnect();
    const updateQuery: any = {};
    for (const [key, value] of Object.entries(details)) {
        updateQuery[`taxDetails.${key}`] = value;
    }
    return await FinancialProfile.findOneAndUpdate(
        { userId },
        { $set: updateQuery },
        { upsert: true, new: true }
    );
}

export function calculateProfileCompleteness(profile: any, user: any) {
    let completed = 0;
    const totalFields = 12;

    if (user?.profile?.age) completed++;
    if (profile?.employmentType) completed++;
    if (profile?.monthlyBurnRate) completed++;
    if (profile?.assets?.emergencyFund) completed++;
    if (profile?.assets?.fixedDeposits) completed++;
    if (profile?.assets?.mutualFunds) completed++;
    if (profile?.liabilities?.length) completed++;
    if (profile?.insurance?.lifeInsuranceCover) completed++;
    if (profile?.insurance?.healthInsuranceCover) completed++;
    if (profile?.taxDetails?.regime) completed++;
    if (profile?.taxDetails?.pan) completed++;

    return {
        score: Math.round((completed / totalFields) * 100),
        completedFields: completed,
        totalFields
    };
}
