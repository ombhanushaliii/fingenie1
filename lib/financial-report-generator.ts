/**
 * Generate comprehensive financial report with clean formatting
 */
export function generateFinancialReport(params: {
  text: string;
  analysis: any;
  agentResults: any;
  profileGaps: any;
}): string {
  const { text, analysis, agentResults, profileGaps } = params;
  const analysisData = analysis as any;

  return `
You are a professional financial advisor creating a comprehensive financial report. Generate a detailed, well-structured report based on the analysis below.

USER QUERY: "${text}"

FINANCIAL ANALYSIS DATA:
${analysis ? JSON.stringify(analysisData, null, 2) : 'No analysis available'}

AGENT INSIGHTS:
${JSON.stringify(agentResults, null, 2)}

Create a comprehensive financial report in the following format:

# Personal Finance Report

## Executive Summary

Provide a 2-3 sentence overview of the user's financial health, highlighting the most critical findings.

${analysisData ? `
## Income Analysis

Monthly Income: Rs.${analysisData.monthlyIncome?.toLocaleString('en-IN') || 'N/A'}

Volatility Score: ${analysisData.volatility?.score || 0}/10 (${analysisData.volatility?.classification || 'N/A'})

Coefficient of Variation: ${analysisData.volatility?.coefficient || 0}%

${analysisData.volatility?.score > 5 ? `
CONCERN: Your income shows ${analysisData.volatility?.classification} volatility. This means your monthly income fluctuates significantly.

Recommendation: Build a larger emergency fund (6+ months) to handle lean months.
` : `
POSITIVE: Your income is stable with low volatility.
`}

## Emergency Fund Health

Current Fund: Rs.${analysisData.emergencyFund?.current?.toLocaleString('en-IN') || 0}

Recommended: Rs.${analysisData.emergencyFund?.recommended?.toLocaleString('en-IN') || 0}

Shortfall: Rs.${analysisData.emergencyFund?.shortfall?.toLocaleString('en-IN') || 0}

Coverage: ${analysisData.emergencyFund?.coverageMonths?.toFixed(1) || 0} months

${analysisData.emergencyFund?.status === 'insufficient' ? `
ACTION REQUIRED:

- Monthly Savings Needed: Rs.${Math.round((analysisData.emergencyFund?.shortfall || 0) / 12).toLocaleString('en-IN')} for 12 months
- Target Timeline: Build your emergency fund within the next year
- Where to Keep: High-yield savings account or liquid funds for easy access
` : `
Excellent! Your emergency fund is adequate for your expense profile.
`}

## Monthly Expenses

Total Monthly Expenses: Rs.${analysisData.monthlyExpenses?.toLocaleString('en-IN') || 0}

Savings Amount: Rs.${((analysisData.monthlyIncome || 0) - (analysisData.monthlyExpenses || 0)).toLocaleString('en-IN')}

Savings Rate: ${analysisData.savings?.savingsRate || 0}% (${analysisData.savings?.status || 'N/A'})

${analysisData.savings?.status === 'poor' || analysisData.savings?.status === 'fair' ? `
IMPROVEMENT NEEDED: ${analysisData.savings?.recommendation || 'Increase your savings rate'}

Suggested Actions:

1. Track all expenses for 30 days to identify spending leaks
2. Apply the 50/30/20 rule: 50% needs, 30% wants, 20% savings
3. Automate savings on salary day before discretionary spending
` : `
Great savings discipline! You're ${analysisData.savings?.status}.
`}

## Tax Optimization

Estimated Annual Income: Rs.${((analysisData.monthlyIncome || 0) * 12).toLocaleString('en-IN')}

Recommended Regime: ${analysisData.tax?.recommendation?.toUpperCase() || 'N/A'} Tax Regime

Potential Tax Savings: Rs.${analysisData.tax?.savings?.toLocaleString('en-IN') || 0}

New Regime Tax: Rs.${analysisData.tax?.newRegime?.totalTax?.toLocaleString('en-IN') || 0}

Old Regime Tax: Rs.${analysisData.tax?.oldRegime?.totalTax?.toLocaleString('en-IN') || 0}

Tax Saving Strategies:

1. Maximize deductions under Section 80C (Rs.1.5L): PPF, ELSS, Life Insurance
2. Health insurance premium deduction (Rs.25k-50k under 80D)
3. Home loan interest deduction (Rs.2L under 24b if applicable)
4. NPS additional deduction (Rs.50k under 80CCD1B)

## Debt Health

Total Outstanding Debt: Rs.${analysisData.debt?.totalDebt?.toLocaleString('en-IN') || 0}

Monthly EMI: Rs.${analysisData.debt?.totalEmi?.toLocaleString('en-IN') || 0}

Debt-to-Income Ratio: ${analysisData.debt?.dtiRatio || 0}%

Status: ${analysisData.debt?.status?.toUpperCase() || 'N/A'}

${analysisData.debt?.dtiRatio > 40 ? `
HIGH DEBT ALERT!

${analysisData.debt?.recommendation}

Debt Repayment Strategy (Avalanche Method):
${analysisData.debt?.highestInterestDebt ? `
1. Focus on: ${analysisData.debt.highestInterestDebt.type} at ${analysisData.debt.highestInterestDebt.interestRate}% interest
2. Pay minimum on other debts, throw extra at highest interest debt
3. Once cleared, roll that payment to next highest interest debt
` : ''}
` : analysisData.debt?.totalDebt > 0 ? `
Your debt levels are ${analysisData.debt?.status}. Continue disciplined repayment.
` : `
Excellent! You are debt-free.
`}

## Insurance Coverage

### Life Insurance

Current Coverage: Rs.${analysisData.insurance?.life?.current?.toLocaleString('en-IN') || 0}

Recommended Coverage: Rs.${analysisData.insurance?.life?.recommended?.toLocaleString('en-IN') || 0}

Gap: Rs.${analysisData.insurance?.life?.gap?.toLocaleString('en-IN') || 0}

### Health Insurance

Current Coverage: Rs.${analysisData.insurance?.health?.current?.toLocaleString('en-IN') || 0}

Recommended Coverage: Rs.${analysisData.insurance?.health?.recommended?.toLocaleString('en-IN') || 0}

Gap: Rs.${analysisData.insurance?.health?.gap?.toLocaleString('en-IN') || 0}

${(analysisData.insurance?.life?.gap || 0) > 0 || (analysisData.insurance?.health?.gap || 0) > 0 ? `
Insurance Recommendations:
${(analysisData.insurance?.life?.gap || 0) > 0 ? `
- Life Insurance: Get a term plan for Rs.${analysisData.insurance.life.gap.toLocaleString('en-IN')}
  Estimated Premium: Rs.${Math.round((analysisData.insurance.life.gap / 1000) * 0.5).toLocaleString('en-IN')}/year
  Buy online term insurance for lowest premiums
` : ''}
${(analysisData.insurance?.health?.gap || 0) > 0 ? `
- Health Insurance: Increase coverage by Rs.${analysisData.insurance.health.gap.toLocaleString('en-IN')}
  Consider family floater or top-up plans for cost efficiency
  Estimated Premium: Rs.${Math.round((analysisData.insurance.health.gap / 100) * 1.2).toLocaleString('en-IN')}/year
` : ''}
` : `
Your insurance coverage is adequate!
`}

${analysisData.retirement && analysisData.retirement.yearsToRetire > 0 ? `
## Retirement Planning

Years to Retirement: ${analysisData.retirement.yearsToRetire}

Corpus Needed at 60: Rs.${analysisData.retirement.corpusNeeded?.toLocaleString('en-IN') || 'N/A'}

Required Monthly SIP: Rs.${analysisData.retirement.monthlySIP?.toLocaleString('en-IN') || 'N/A'}

Retirement Strategy:

1. Start SIP of Rs.${analysisData.retirement.monthlySIP?.toLocaleString('en-IN')} in diversified equity mutual funds
2. Allocate: 70% Equity, 20% Debt, 10% Gold (adjust based on risk tolerance)
3. Increase SIP by 10% annually with salary increments
4. Consider NPS for additional tax benefits (80CCD1B)
` : ''}
` : ''}

## Priority Action Items

Based on your financial profile, here are your Top 5 Priority Actions:

1. ${analysisData?.emergencyFund?.status === 'insufficient' ? `URGENT: Build emergency fund - Save Rs.${Math.round((analysisData.emergencyFund.shortfall) / 12).toLocaleString('en-IN')}/month` : 'Maintain emergency fund'}

2. ${analysisData?.debt?.dtiRatio > 40 ? `HIGH PRIORITY: Reduce debt burden - Focus on ${analysisData.debt?.highestInterestDebt?.type || 'highest interest debt'}` : analysisData?.debt?.totalDebt > 0 ? 'Continue debt repayment as planned' : 'Start investing surplus'}

3. ${analysisData?.tax?.savings > 5000 ? `SAVE TAX: Switch to ${analysisData.tax.recommendation} regime - Save Rs.${analysisData.tax.savings.toLocaleString('en-IN')}/year` : 'Current tax regime is optimal'}

4. ${(analysisData?.insurance?.life?.gap || 0) > 100000 ? `PROTECT: Get term life insurance for Rs.${analysisData.insurance.life.gap.toLocaleString('en-IN')}` : 'Insurance coverage adequate'}

5. ${analysisData?.retirement?.monthlySIP ? `INVEST: Start retirement SIP of Rs.${analysisData.retirement.monthlySIP.toLocaleString('en-IN')}/month` : 'Review and optimize existing investments'}

---

## Profile Completeness: ${profileGaps.completeness.score}%

${profileGaps.completeness.score >= 80 ? 'Your financial profile is comprehensive!' : 'Share more financial details in future chats for even more personalized advice.'}

---

${agentResults.tax || agentResults.investment || agentResults.retirement || agentResults.schemes ? `
## Detailed Expert Advice

${Object.entries(agentResults).map(([agent, advice]) => `
### ${agent.charAt(0).toUpperCase() + agent.slice(1)} Agent

${advice}
`).join('\n')}
` : ''}

Pro Tip: Review this report monthly and track your progress. Small consistent actions compound into significant wealth over time!
`;
}
