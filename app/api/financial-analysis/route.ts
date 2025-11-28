import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { FinancialProfile, Transaction } from '@/lib/schemas';
import {
    compareTaxRegimes,
    calculateEmergencyFund,
    analyzeDebt,
    calculateIncomeVolatility,
    calculateInsuranceNeeds,
    analyzeSavingsRate
} from '@/lib/analysis/financial-math';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'userId required' }, { status: 400 });
        }

        await dbConnect();

        const profile = await FinancialProfile.findOne({ userId });
        if (!profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        // Get last 6 months transactions
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const transactions = await Transaction.find({
            userId,
            date: { $gte: sixMonthsAgo }
        });

        // Calculate income volatility
        const monthlyIncomes = transactions
            .filter((t: any) => t.type === 'income')
            .reduce((acc: any, t: any) => {
                const month = new Date(t.date).toISOString().slice(0, 7);
                acc[month] = (acc[month] || 0) + t.amount;
                return acc;
            }, {});

        const incomeValues = Object.values(monthlyIncomes) as number[];
        const volatility = calculateIncomeVolatility(incomeValues);

        // Calculate average monthly income
        const avgMonthlyIncome = incomeValues.length > 0
            ? incomeValues.reduce((a, b) => a + b, 0) / incomeValues.length
            : 50000;

        // Run all analyses
        const analysis = {
            volatility,
            emergencyFund: calculateEmergencyFund({
                monthlyExpenses: profile.monthlyBurnRate || 30000,
                employmentType: profile.employmentType,
                dependents: 2,
                hasHealthInsurance: profile.insurance.healthInsuranceCover > 0
            }),
            tax: compareTaxRegimes(avgMonthlyIncome * 12, 150000),
            debt: analyzeDebt(profile.liabilities, avgMonthlyIncome),
            insurance: calculateInsuranceNeeds({
                age: 30, // Should come from user profile
                annualIncome: avgMonthlyIncome * 12,
                dependents: 2,
                liabilities: profile.liabilities.reduce((sum: number, l: any) => sum + l.outstandingAmount, 0)
            }),
            savings: analyzeSavingsRate({
                monthlyIncome: avgMonthlyIncome,
                monthlyExpenses: profile.monthlyBurnRate || 30000,
                monthlyInvestments: 0
            })
        };

        return NextResponse.json({
            profile,
            analysis,
            monthlyIncome: avgMonthlyIncome
        });

    } catch (error: any) {
        console.error('Financial analysis error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { userId, updates } = body;

        if (!userId) {
            return NextResponse.json({ error: 'userId required' }, { status: 400 });
        }

        await dbConnect();

        const profile = await FinancialProfile.findOneAndUpdate(
            { userId },
            { $set: updates },
            { new: true, upsert: true }
        );

        return NextResponse.json({ profile });

    } catch (error: any) {
        console.error('Financial profile update error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
