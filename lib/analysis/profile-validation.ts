/**
 * Identify critical missing fields that are REQUIRED for calculations
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
 * Check if we have minimum data needed for income-based calculations
 */
export function canPerformIncomeAnalysis(transactions: any[]): boolean {
    // Need at least some transaction history
    const incomeTransactions = transactions.filter((t: any) => t.type === 'income');
    return incomeTransactions.length > 0;
}

/**
 * Detect which specific analyses can be performed with available data
 */
export function getAvailableAnalyses(profile: any, user: any, transactions: any[]): {
    canCalculateTax: boolean;
    canCalculateEmergencyFund: boolean;
    canCalculateDebt: boolean;
    canCalculateInsurance: boolean;
    canCalculateRetirement: boolean;
    canCalculateSavings: boolean;
    canCalculateVolatility: boolean;
} {
    const hasAge = Boolean(user?.profile?.age);
    const hasExpenses = Boolean(profile?.monthlyBurnRate && profile.monthlyBurnRate > 0);
    const hasIncome = canPerformIncomeAnalysis(transactions);
    const hasEmploymentType = Boolean(profile?.employmentType);

    return {
        canCalculateTax: hasIncome,
        canCalculateEmergencyFund: hasExpenses && hasEmploymentType,
        canCalculateDebt: hasIncome && Boolean(profile?.liabilities?.length),
        canCalculateInsurance: hasAge && hasIncome,
        canCalculateRetirement: hasAge && hasExpenses,
        canCalculateSavings: hasIncome && hasExpenses,
        canCalculateVolatility: hasIncome
    };
}

// Re-export existing functions
export { detectMissingFields, calculateProfileCompleteness, prioritizeMissingFields } from './profile-completion-helpers';
