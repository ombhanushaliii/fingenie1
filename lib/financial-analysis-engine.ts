import {
    compareTaxRegimes,
    calculateEmergencyFund,
    analyzeDebt,
    calculateIncomeVolatility,
    calculateInsuranceNeeds,
    calculateRetirementCorpus,
    analyzeSavingsRate
} from './analysis/financial-math';
import { updateFinancialProfile } from './financial-profile-helpers';

/**
 * Run comprehensive financial analysis on user profile
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

    // Update volatility score in profile
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
