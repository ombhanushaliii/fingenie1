import dbConnect from '@/lib/db';
import { FinancialProfile, IFinancialProfile } from '@/lib/schemas';

/**
 * Check if critical fields are missing (needed before analysis)
 */
export function getCriticalMissingFields(profile: any, user: any): {
    hasCriticalGaps: boolean;
    missingCritical: string[];
    criticalQuestions: string[];
} {
    const missing: string[] = [];
    const questions: string[] = [];

    // Critical for all calculations
    if (!user?.profile?.age) {
        missing.push('age');
        questions.push('What is your age? (Required for retirement planning and insurance calculations)');
    }

    if (!profile?.monthlyBurnRate || profile.monthlyBurnRate === 0) {
        missing.push('monthlyExpenses');
        questions.push('What are your average monthly expenses? (Required for emergency fund and savings analysis)');
    }

    // Critical for meaningful analysis
    if (!profile?.employmentType) {
        missing.push('employmentType');
        questions.push('What is your employment type? Options: salaried, gig worker, business owner, student, or retired');
    }

    return {
        hasCriticalGaps: missing.length > 0,
        missingCritical: missing,
        criticalQuestions: questions
    };
}

/**
 * Calculate profile completeness score
 */
export function calculateProfileCompleteness(profile: any, user: any): {
    score: number;
    completedFields: number;
    totalFields: number;
} {
    let completed = 0;
    const totalFields = 12;

    if (user?.profile?.age) completed++;
    if (profile?.monthlyBurnRate && profile.monthlyBurnRate > 0) completed++;
    if (profile?.employmentType) completed++;
    if (profile?.assets?.emergencyFund && profile.assets.emergencyFund > 0) completed++;
    if (profile?.insurance?.lifeInsuranceCover && profile.insurance.lifeInsuranceCover > 0) completed++;
    if (profile?.insurance?.healthInsuranceCover && profile.insurance.healthInsuranceCover > 0) completed++;
    if (profile?.taxDetails?.regime) completed++;
    if (profile?.liabilities && profile.liabilities.length > 0) completed++;

    const totalInvestments = (profile?.assets?.fixedDeposits || 0) +
        (profile?.assets?.mutualFunds || 0) +
        (profile?.assets?.stocks || 0);
    if (totalInvestments > 0) completed++;

    if (profile?.taxDetails?.pan) completed++;
    if (profile?.incomeVolatilityScore !== undefined) completed++;
    if (profile?.assets?.realEstate && profile.assets.realEstate > 0) completed++;

    return {
        score: Math.round((completed / totalFields) * 100),
        completedFields: completed,
        totalFields
    };
}

export async function getOrCreateFinancialProfile(userId: string): Promise<IFinancialProfile> {
    await dbConnect();

    let profile = await FinancialProfile.findOne({ userId });

    if (!profile) {
        profile = await FinancialProfile.create({
            userId,
            employmentType: 'salaried',
            taxDetails: { regime: 'new', isGSTRegistered: false, presumptiveTaxation: false },
            assets: {
                emergencyFund: 0,
                fixedDeposits: 0,
                mutualFunds: 0,
                stocks: 0,
                gold: 0,
                realEstate: 0
            },
            liabilities: [],
            insurance: {
                lifeInsuranceCover: 0,
                healthInsuranceCover: 0,
                monthlyPremium: 0
            },
            monthlyBurnRate: 0,
            incomeVolatilityScore: 0
        });
    }

    return profile;
}

export async function updateFinancialProfile(userId: string, updates: Partial<IFinancialProfile>) {
    await dbConnect();
    return await FinancialProfile.findOneAndUpdate(
        { userId },
        { $set: updates },
        { new: true, upsert: true }
    );
}

export async function updateAssets(userId: string, assets: Partial<IFinancialProfile['assets']>) {
    await dbConnect();

    // We need to use dot notation for nested updates to avoid overwriting the whole object
    const updateQuery: any = {};
    for (const [key, value] of Object.entries(assets)) {
        updateQuery[`assets.${key}`] = value;
    }

    return await FinancialProfile.findOneAndUpdate(
        { userId },
        { $set: updateQuery },
        { new: true, upsert: true }
    );
}

export async function addLiability(userId: string, liability: any) {
    await dbConnect();
    return await FinancialProfile.findOneAndUpdate(
        { userId },
        { $push: { liabilities: liability } },
        { new: true, upsert: true }
    );
}

export async function updateTaxDetails(userId: string, details: Partial<IFinancialProfile['taxDetails']>) {
    await dbConnect();

    const updateQuery: any = {};
    for (const [key, value] of Object.entries(details)) {
        updateQuery[`taxDetails.${key}`] = value;
    }

    return await FinancialProfile.findOneAndUpdate(
        { userId },
        { $set: updateQuery },
        { new: true, upsert: true }
    );
}
