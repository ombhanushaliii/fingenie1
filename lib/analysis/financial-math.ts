/**
 * Financial Calculation Engine
 * Comprehensive financial analysis functions for Indian market
 */

// ==================== TAX CALCULATIONS ====================

/**
 * Calculate tax under New Tax Regime (FY 2024-25)
 * Slabs:
 * 0-3L: Nil
 * 3-7L: 5%
 * 7-10L: 10%
 * 10-12L: 15%
 * 12-15L: 20%
 * >15L: 30%
 * Rebate u/s 87A: Full rebate if taxable income <= 7L
 */
export function calculateTaxNewRegime(taxableIncome: number): {
    grossTax: number;
    rebate: number;
    cess: number;
    totalTax: number;
    effectiveRate: number;
} {
    let grossTax = 0;

    // Apply tax slabs
    if (taxableIncome > 300000) {
        grossTax += Math.min(taxableIncome - 300000, 400000) * 0.05;
    }
    if (taxableIncome > 700000) {
        grossTax += Math.min(taxableIncome - 700000, 300000) * 0.10;
    }
    if (taxableIncome > 1000000) {
        grossTax += Math.min(taxableIncome - 1000000, 200000) * 0.15;
    }
    if (taxableIncome > 1200000) {
        grossTax += Math.min(taxableIncome - 1200000, 300000) * 0.20;
    }
    if (taxableIncome > 1500000) {
        grossTax += (taxableIncome - 1500000) * 0.30;
    }

    // Rebate under Section 87A
    const rebate = taxableIncome <= 700000 ? grossTax : 0;

    // Health & Education Cess (4%)
    const cess = (grossTax - rebate) * 0.04;

    const totalTax = grossTax - rebate + cess;
    const effectiveRate = taxableIncome > 0 ? (totalTax / taxableIncome) * 100 : 0;

    return {
        grossTax,
        rebate,
        cess,
        totalTax,
        effectiveRate
    };
}

/**
 * Calculate tax under Old Tax Regime
 */
export function calculateTaxOldRegime(taxableIncome: number): {
    grossTax: number;
    rebate: number;
    cess: number;
    totalTax: number;
    effectiveRate: number;
} {
    let grossTax = 0;

    // Old regime slabs
    if (taxableIncome > 250000) {
        grossTax += Math.min(taxableIncome - 250000, 250000) * 0.05;
    }
    if (taxableIncome > 500000) {
        grossTax += Math.min(taxableIncome - 500000, 500000) * 0.20;
    }
    if (taxableIncome > 1000000) {
        grossTax += (taxableIncome - 1000000) * 0.30;
    }

    // Rebate under Section 87A (if taxable income <= 5L)
    const rebate = taxableIncome <= 500000 ? Math.min(grossTax, 12500) : 0;

    const cess = (grossTax - rebate) * 0.04;
    const totalTax = grossTax - rebate + cess;
    const effectiveRate = taxableIncome > 0 ? (totalTax / taxableIncome) * 100 : 0;

    return {
        grossTax,
        rebate,
        cess,
        totalTax,
        effectiveRate
    };
}

/**
 * Compare tax regimes and recommend better one
 */
export function compareTaxRegimes(grossIncome: number, deductions: number = 0) {
    // New Regime: No deductions, 50k standard deduction for salaried
    const newRegimeTaxableIncome = grossIncome - 50000;
    const newRegimeTax = calculateTaxNewRegime(newRegimeTaxableIncome);

    // Old Regime: Deductions allowed
    const oldRegimeTaxableIncome = grossIncome - deductions;
    const oldRegimeTax = calculateTaxOldRegime(oldRegimeTaxableIncome);

    return {
        newRegime: newRegimeTax,
        oldRegime: oldRegimeTax,
        recommendation: newRegimeTax.totalTax < oldRegimeTax.totalTax ? 'new' : 'old',
        savings: Math.abs(newRegimeTax.totalTax - oldRegimeTax.totalTax)
    };
}

// ==================== EMERGENCY FUND ====================

export function calculateEmergencyFund(params: {
    monthlyExpenses: number;
    employmentType: 'salaried' | 'gig' | 'business' | 'student' | 'retired';
    dependents: number;
    hasHealthInsurance: boolean;
}): {
    recommendedMonths: number;
    recommendedAmount: number;
    reasoning: string;
} {
    let months = 3; // Base

    // Employment stability
    if (params.employmentType === 'gig' || params.employmentType === 'business') {
        months = 6;
    }
    if (params.employmentType === 'retired') {
        months = 12; // Higher for retirees
    }

    // Dependents
    if (params.dependents > 2) {
        months += 1;
    }

    // Health insurance
    if (!params.hasHealthInsurance) {
        months += 2; // Medical emergency buffer
    }

    const recommendedAmount = params.monthlyExpenses * months;

    return {
        recommendedMonths: months,
        recommendedAmount,
        reasoning: `Based on ${params.employmentType} employment, ${params.dependents} dependents, and ${params.hasHealthInsurance ? 'with' : 'without'} health insurance.`
    };
}

// ==================== DEBT ANALYSIS ====================

export interface Liability {
    type: string;
    outstandingAmount: number;
    interestRate: number;
    monthlyEmi: number;
}

export function analyzeDebt(liabilities: Liability[], monthlyIncome: number) {
    const totalDebt = liabilities.reduce((sum, l) => sum + l.outstandingAmount, 0);
    const totalEmi = liabilities.reduce((sum, l) => sum + l.monthlyEmi, 0);

    const dtiRatio = monthlyIncome > 0 ? (totalEmi / monthlyIncome) * 100 : 0;

    // Calculate weighted average interest rate
    const weightedInterest = totalDebt > 0
        ? liabilities.reduce((sum, l) => sum + (l.interestRate * l.outstandingAmount), 0) / totalDebt
        : 0;

    // Debt health status
    let status: 'healthy' | 'moderate' | 'critical';
    let recommendation: string;

    if (dtiRatio < 30) {
        status = 'healthy';
        recommendation = 'Your debt levels are manageable. Focus on increasing emergency fund.';
    } else if (dtiRatio < 50) {
        status = 'moderate';
        recommendation = 'Consider debt consolidation or prioritize high-interest debt repayment.';
    } else {
        status = 'critical';
        recommendation = 'URGENT: Your debt burden is very high. Seek professional financial counseling.';
    }

    // Sort debts by interest rate (for avalanche method)
    const sortedByInterest = [...liabilities].sort((a, b) => b.interestRate - a.interestRate);

    return {
        totalDebt,
        totalEmi,
        dtiRatio: parseFloat(dtiRatio.toFixed(2)),
        weightedInterest: parseFloat(weightedInterest.toFixed(2)),
        status,
        recommendation,
        highestInterestDebt: sortedByInterest[0] || null
    };
}

// ==================== INCOME VOLATILITY ====================

/**
 * Calculate income volatility score based on monthly history
 * Returns score from 0-10 (0 = stable, 10 = highly volatile)
 */
export function calculateIncomeVolatility(monthlyIncomes: number[]): {
    score: number;
    stdDev: number;
    coefficient: number;
    classification: 'stable' | 'moderate' | 'volatile';
} {
    if (monthlyIncomes.length < 3) {
        return { score: 0, stdDev: 0, coefficient: 0, classification: 'stable' };
    }

    const mean = monthlyIncomes.reduce((a, b) => a + b, 0) / monthlyIncomes.length;
    const variance = monthlyIncomes.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / monthlyIncomes.length;
    const stdDev = Math.sqrt(variance);

    // Coefficient of Variation (CV) = (Std Dev / Mean) * 100
    const coefficient = mean > 0 ? (stdDev / mean) * 100 : 0;

    // Score 0-10 based on CV
    let score = 0;
    if (coefficient < 10) score = 0;
    else if (coefficient < 20) score = 3;
    else if (coefficient < 30) score = 5;
    else if (coefficient < 40) score = 7;
    else score = 10;

    const classification = score < 4 ? 'stable' : score < 7 ? 'moderate' : 'volatile';

    return {
        score,
        stdDev: parseFloat(stdDev.toFixed(2)),
        coefficient: parseFloat(coefficient.toFixed(2)),
        classification
    };
}

// ==================== INSURANCE ADEQUACY ====================

export function calculateInsuranceNeeds(params: {
    age: number;
    annualIncome: number;
    dependents: number;
    liabilities: number;
}): {
    lifeInsurance: { recommended: number; reasoning: string };
    healthInsurance: { recommended: number; reasoning: string };
} {
    // Life Insurance: Human Life Value method
    // Formula: Annual Income × (60 - Age) + Outstanding Liabilities
    const yearsToRetirement = Math.max(60 - params.age, 0);
    const lifeCover = (params.annualIncome * yearsToRetirement * 0.7) + params.liabilities;

    // Add for dependents
    const dependentFactor = params.dependents * 500000;
    const recommendedLifeCover = lifeCover + dependentFactor;

    // Health Insurance: Based on age and dependents
    let healthCover = 500000; // Base
    if (params.age > 45) healthCover = 1000000;
    if (params.dependents > 0) healthCover += params.dependents * 300000;
    if (params.age > 60) healthCover = 1500000;

    return {
        lifeInsurance: {
            recommended: Math.round(recommendedLifeCover),
            reasoning: `Based on ${yearsToRetirement} years to retirement, current income, and ${params.dependents} dependents.`
        },
        healthInsurance: {
            recommended: healthCover,
            reasoning: `Recommended for age ${params.age} with ${params.dependents} dependents.`
        }
    };
}

// ==================== RETIREMENT PLANNING ====================

export function calculateRetirementCorpus(params: {
    currentAge: number;
    retirementAge: number;
    monthlyExpensesToday: number;
    inflationRate: number;
    returnRate: number;
}): {
    corpusNeeded: number;
    monthlySIP: number;
    yearsToRetire: number;
} {
    const yearsToRetire = params.retirementAge - params.currentAge;
    const yearsInRetirement = 85 - params.retirementAge;

    // Future monthly expenses adjusted for inflation
    const futureMonthlyExpense = params.monthlyExpensesToday * Math.pow(1 + params.inflationRate, yearsToRetire);

    // Corpus needed (assuming post-retirement return = inflation + 2%)
    const postRetirementReturn = params.inflationRate + 0.02;
    const corpusNeeded = (futureMonthlyExpense * 12) / postRetirementReturn;

    // Monthly SIP calculation
    const monthlyRate = params.returnRate / 12;
    const months = yearsToRetire * 12;
    const monthlySIP = corpusNeeded / (((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate));

    return {
        corpusNeeded: Math.round(corpusNeeded),
        monthlySIP: Math.round(monthlySIP),
        yearsToRetire
    };
}

// ==================== SAVINGS RATE ====================

export function analyzeSavingsRate(params: {
    monthlyIncome: number;
    monthlyExpenses: number;
    monthlyInvestments: number;
}): {
    savingsRate: number;
    status: 'excellent' | 'good' | 'fair' | 'poor';
    recommendation: string;
} {
    const savings = params.monthlyIncome - params.monthlyExpenses;
    const savingsRate = params.monthlyIncome > 0 ? (savings / params.monthlyIncome) * 100 : 0;

    let status: 'excellent' | 'good' | 'fair' | 'poor';
    let recommendation: string;

    if (savingsRate >= 30) {
        status = 'excellent';
        recommendation = 'Outstanding! Consider increasing investments in equity for long-term growth.';
    } else if (savingsRate >= 20) {
        status = 'good';
        recommendation = 'Great job! Aim to increase savings rate by reducing discretionary expenses.';
    } else if (savingsRate >= 10) {
        status = 'fair';
        recommendation = 'Room for improvement. Review expenses and identify areas to cut back.';
    } else {
        status = 'poor';
        recommendation = 'URGENT: You are barely saving. Create a strict budget and reduce expenses.';
    }

    return {
        savingsRate: parseFloat(savingsRate.toFixed(2)),
        status,
        recommendation
    };
}
