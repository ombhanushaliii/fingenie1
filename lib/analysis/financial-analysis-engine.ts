/**
 * Analyze financial data extracted from user message (stateless)
 */
export function analyzeFinancialData(data: any) {
    // Safely extract values with defaults
    const age = data?.age || 30;
    const monthlyIncome = data?.monthlyIncome || 0;
    const monthlyExpenses = data?.monthlyExpenses || 0;
    const employmentType = data?.employmentType || 'salaried';

    // Calculate savings
    const monthlySavings = monthlyIncome - monthlyExpenses;
    const savingsRate = monthlyIncome > 0 ? (monthlySavings / monthlyIncome) * 100 : 0;

    // Emergency fund recommendation
    const emergencyMonths = employmentType === 'gig' ? 6 : 3;
    const recommendedEmergencyFund = monthlyExpenses * emergencyMonths;
    const currentEmergencyFund = data?.assets?.emergencyFund || 0;
    const emergencyFundGap = Math.max(0, recommendedEmergencyFund - currentEmergencyFund);

    // Insurance needs (10x annual income for life, 5L minimum for health)
    const annualIncome = monthlyIncome * 12;
    const lifeInsuranceNeeded = annualIncome * 10;
    const healthInsuranceNeeded = 500000;

    const currentLifeInsurance = data?.insurance?.lifeInsuranceCover || 0;
    const currentHealthInsurance = data?.insurance?.healthInsuranceCover || 0;

    const lifeInsuranceGap = Math.max(0, lifeInsuranceNeeded - currentLifeInsurance);
    const healthInsuranceGap = Math.max(0, healthInsuranceNeeded - currentHealthInsurance);

    // Debt analysis
    const liabilities = data?.liabilities || [];
    const totalDebt = Array.isArray(liabilities)
        ? liabilities.reduce((sum: number, l: any) => sum + (l?.outstandingAmount || 0), 0)
        : 0;
    const totalEmi = Array.isArray(liabilities)
        ? liabilities.reduce((sum: number, l: any) => sum + (l?.monthlyEmi || 0), 0)
        : 0;
    const debtToIncomeRatio = monthlyIncome > 0 ? (totalEmi / monthlyIncome) * 100 : 0;

    // Tax estimation (simplified Indian tax slabs)
    let estimatedTax = 0;
    if (annualIncome > 1500000) {
        // Above 15L: 30%
        estimatedTax = (annualIncome - 1500000) * 0.30 + 125000 + 112500;
    } else if (annualIncome > 1000000) {
        // 10L-15L: 20%
        estimatedTax = (annualIncome - 1000000) * 0.20 + 125000;
    } else if (annualIncome > 500000) {
        // 5L-10L: 10%  
        estimatedTax = (annualIncome - 500000) * 0.10;
    }
    // Under 5L: 0% (new regime)

    // Retirement calculation
    const yearsToRetirement = Math.max(0, 60 - age);
    const retirementCorpusNeeded = monthlyExpenses * 12 * 25; // 25 years post-retirement
    const monthlySipNeeded = yearsToRetirement > 0 && retirementCorpusNeeded > 0
        ? Math.round(retirementCorpusNeeded / (yearsToRetirement * 12 * 1.8)) // Assuming 12% returns
        : 0;

    return {
        income: {
            monthly: monthlyIncome,
            annual: annualIncome
        },
        expenses: {
            monthly: monthlyExpenses,
            annual: monthlyExpenses * 12
        },
        savings: {
            monthly: monthlySavings,
            rate: savingsRate,
            status: savingsRate >= 20 ? 'excellent' : savingsRate >= 10 ? 'good' : savingsRate > 0 ? 'fair' : 'poor'
        },
        emergencyFund: {
            current: currentEmergencyFund,
            recommended: recommendedEmergencyFund,
            gap: emergencyFundGap,
            months: monthlyExpenses > 0 ? currentEmergencyFund / monthlyExpenses : 0,
            status: emergencyFundGap === 0 ? 'adequate' : 'insufficient'
        },
        insurance: {
            life: {
                current: currentLifeInsurance,
                recommended: lifeInsuranceNeeded,
                gap: lifeInsuranceGap
            },
            health: {
                current: currentHealthInsurance,
                recommended: healthInsuranceNeeded,
                gap: healthInsuranceGap
            }
        },
        debt: {
            total: totalDebt,
            totalEmi: totalEmi,
            debtToIncomeRatio: debtToIncomeRatio,
            status: debtToIncomeRatio > 40 ? 'high' : debtToIncomeRatio > 20 ? 'moderate' : 'low',
            liabilities: liabilities
        },
        tax: {
            estimatedAnnual: Math.round(estimatedTax),
            effectiveRate: annualIncome > 0 ? (estimatedTax / annualIncome) * 100 : 0
        },
        retirement: {
            yearsToRetirement,
            corpusNeeded: retirementCorpusNeeded,
            monthlySipNeeded: monthlySipNeeded
        },
        profile: {
            age,
            employmentType
        }
    };
}

// Keep existing MongoDB-based analysis for backward compatibility
import {
    compareTaxRegimes,
    calculateEmergencyFund,
    analyzeDebt,
    calculateIncomeVolatility,
    calculateInsuranceNeeds,
    calculateRetirementCorpus,
    analyzeSavingsRate
} from './financial-math';
import { updateFinancialProfile } from './financial-profile-helpers';

/**
 * Run comprehensive financial analysis on user profile (MongoDB-based)
 */
export async function runFinancialAnalysis(params: {
    userId: string;
    profile: any;
    user: any;
    transactions: any[];
}) {
    const { userId, profile, user, transactions } = params;

    if (!profile) {
        console.log('No financial profile found, skipping analysis');
        return null;
    }

    const userAge = user?.profile?.age || 30;
    const monthlyExpenses = profile.monthlyBurnRate || 30000;

    // 1. Income Volatility Analysis
    const monthlyIncomes = transactions
        .filter((t: any) => t.type === 'income')
        .reduce((acc: any, t: any) => {
            const month = new Date(t.date).toISOString().slice(0, 7);
            acc[month] = (acc[month] || 0) + t.amount;
            return acc;
        }, {});

    const incomeValues = Object.values(monthlyIncomes) as number[];
    const volatility = calculateIncomeVolatility(incomeValues);

    await updateFinancialProfile(userId, { incomeVolatilityScore: volatility.score });

    // 2. Emergency Fund Analysis
    const emergencyFund = calculateEmergencyFund({
        monthlyExpenses,
        employmentType: profile.employmentType || 'salaried',
        dependents: 2,
        hasHealthInsurance: (profile.insurance?.healthInsuranceCover || 0) > 0
    });

    const currentEmergencyFund = profile.assets?.emergencyFund || 0;
    const emergencyFundHealth = {
        current: currentEmergencyFund,
        recommended: emergencyFund.recommendedAmount,
        coverageMonths: monthlyExpenses > 0 ? currentEmergencyFund / monthlyExpenses : 0,
        shortfall: Math.max(0, emergencyFund.recommendedAmount - currentEmergencyFund),
        status: currentEmergencyFund >= emergencyFund.recommendedAmount ? 'adequate' : 'insufficient'
    };

    // 3. Tax Analysis
    const avgMonthlyIncome = incomeValues.length > 0
        ? incomeValues.reduce((a, b) => a + b, 0) / incomeValues.length
        : 50000;
    const estimatedAnnualIncome = avgMonthlyIncome * 12;

    const taxComparison = compareTaxRegimes(estimatedAnnualIncome, 150000);

    // 4. Debt Analysis
    const debtAnalysis = analyzeDebt(profile.liabilities || [], avgMonthlyIncome);

    // 5. Insurance Adequacy
    const insuranceNeeds = calculateInsuranceNeeds({
        age: userAge,
        annualIncome: estimatedAnnualIncome,
        dependents: 2,
        liabilities: debtAnalysis.totalDebt
    });

    const insuranceAnalysis = {
        life: {
            current: profile.insurance?.lifeInsuranceCover || 0,
            recommended: insuranceNeeds.lifeInsurance.recommended,
            gap: insuranceNeeds.lifeInsurance.recommended - (profile.insurance?.lifeInsuranceCover || 0)
        },
        health: {
            current: profile.insurance?.healthInsuranceCover || 0,
            recommended: insuranceNeeds.healthInsurance.recommended,
            gap: insuranceNeeds.healthInsurance.recommended - (profile.insurance?.healthInsuranceCover || 0)
        }
    };

    // 6. Retirement Planning
    let retirementPlan = null;
    if (userAge < 60) {
        retirementPlan = calculateRetirementCorpus({
            currentAge: userAge,
            retirementAge: 60,
            monthlyExpensesToday: monthlyExpenses,
            inflationRate: 0.06,
            returnRate: 0.12
        });
    }

    // 7. Savings Rate
    const savingsAnalysis = analyzeSavingsRate({
        monthlyIncome: avgMonthlyIncome,
        monthlyExpenses,
        monthlyInvestments: 0
    });

    return {
        volatility,
        emergencyFund: emergencyFundHealth,
        tax: taxComparison,
        debt: debtAnalysis,
        insurance: insuranceAnalysis,
        retirement: retirementPlan,
        savings: savingsAnalysis,
        monthlyIncome: avgMonthlyIncome,
        monthlyExpenses
    };
}
