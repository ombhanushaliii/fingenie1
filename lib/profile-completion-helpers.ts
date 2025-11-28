import { IFinancialProfile } from './schemas';

/**
 * Detect missing critical fields in financial profile
 */
export function detectMissingFields(profile: any, user: any): {
    hasMissingFields: boolean;
    missingFields: string[];
    questions: string[];
} {
    const missing: string[] = [];
    const questions: string[] = [];

    // Check user age
    if (!user?.profile?.age) {
        missing.push('age');
        questions.push('What is your age?');
    }

    // Check monthly income/expenses
    if (!profile?.monthlyBurnRate || profile.monthlyBurnRate === 0) {
        missing.push('monthlyExpenses');
        questions.push('What are your average monthly expenses?');
    }

    // Check employment type
    if (!profile?.employmentType || profile.employmentType === 'salaried') {
        missing.push('employmentType');
        questions.push('What is your employment type? (salaried/gig worker/business/student/retired)');
    }

    // Check emergency fund
    if (!profile?.assets?.emergencyFund || profile.assets.emergencyFund === 0) {
        missing.push('emergencyFund');
        questions.push('Do you have an emergency fund? If yes, how much?');
    }

    // Check insurance coverage
    if (!profile?.insurance?.lifeInsuranceCover || profile.insurance.lifeInsuranceCover === 0) {
        missing.push('lifeInsurance');
        questions.push('Do you have life insurance? If yes, what is the coverage amount?');
    }

    if (!profile?.insurance?.healthInsuranceCover || profile.insurance.healthInsuranceCover === 0) {
        missing.push('healthInsurance');
        questions.push('Do you have health insurance? If yes, what is the coverage amount?');
    }

    // Check tax regime preference
    if (!profile?.taxDetails?.regime) {
        missing.push('taxRegime');
        questions.push('Which tax regime do you currently use? (new/old)');
    }

    // Check for any debt
    if (!profile?.liabilities || profile.liabilities.length === 0) {
        missing.push('debts');
        questions.push('Do you have any loans or debts? (home loan, car loan, credit cards, personal loans?)');
    }

    // Check for investments
    const totalInvestments = (profile?.assets?.fixedDeposits || 0) +
        (profile?.assets?.mutualFunds || 0) +
        (profile?.assets?.stocks || 0);

    if (totalInvestments === 0) {
        missing.push('investments');
        questions.push('Do you have any investments? (mutual funds, stocks, fixed deposits, PPF, etc.)');
    }

    return {
        hasMissingFields: missing.length > 0,
        missingFields: missing,
        questions
    };
}

/**
 * Generate profile completeness score
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

/**
 * Prioritize which missing fields to ask for (max 3 at a time)
 */
export function prioritizeMissingFields(missingFields: string[], questions: string[]): string[] {
    const priority = ['age', 'monthlyExpenses', 'employmentType', 'emergencyFund', 'lifeInsurance', 'healthInsurance'];

    const prioritized: string[] = [];

    // Add high priority fields first
    for (const field of priority) {
        const index = missingFields.indexOf(field);
        if (index !== -1 && prioritized.length < 3) {
            prioritized.push(questions[index]);
        }
    }

    // Add remaining fields if less than 3
    for (let i = 0; i < questions.length && prioritized.length < 3; i++) {
        if (!prioritized.includes(questions[i])) {
            prioritized.push(questions[i]);
        }
    }

    return prioritized;
}
