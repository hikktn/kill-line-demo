// 斩杀线核心模型（前端可用）
export function calculateKillLine(profile) {
    const {
        income,
        effectiveTaxRate,
        monthlyLivingCost,
        monthlyDebtPayment,
        emergencyAssets,
        totalDebt,
        jobRiskFactor
    } = profile

    const realIncome = income * (1 - effectiveTaxRate)
    const annualFixedCost = (monthlyLivingCost + monthlyDebtPayment) * 12
    const netCashFlow = realIncome - annualFixedCost
    const monthlySurvivalCost = monthlyLivingCost + monthlyDebtPayment
    const baseKillLine = monthlySurvivalCost * 6
    const realKillLine = baseKillLine * jobRiskFactor
    const coverageMonths = monthlySurvivalCost > 0 ? emergencyAssets / monthlySurvivalCost : Infinity

    let state = 'SAFE'
    if (emergencyAssets < realKillLine * 0.7) state = 'DANGER'
    else if (emergencyAssets < realKillLine) state = 'WARNING'
    else if (emergencyAssets < realKillLine * 1.3) state = 'CAUTION'

    return {
        realIncome,
        annualFixedCost,
        netCashFlow,
        monthlySurvivalCost,
        baseKillLine,
        realKillLine,
        emergencyAssets,
        coverageMonths,
        state
    }
}

export function calculateRiskScore(result, profile) {
    let score = 0
    // ① 现金覆盖（月）
    if (result.coverageMonths >= 12) score += 40
    else if (result.coverageMonths >= 6) score += 25
    else if (result.coverageMonths >= 3) score += 15

    // ② 净现金流率
    const netRate = result.realIncome > 0 ? result.netCashFlow / result.realIncome : 0
    if (netRate >= 0.2) score += 20
    else if (netRate >= 0.1) score += 12
    else if (netRate >= 0) score += 5

    // ③ 负债压力
    const debtRate = result.realIncome > 0 ? (profile.monthlyDebtPayment * 12) / result.realIncome : 1
    if (debtRate < 0.25) score += 20
    else if (debtRate < 0.4) score += 10

    // ④ 职业稳定
    score += Math.max(0, (1 / profile.jobRiskFactor) * 20)

    return Math.round(score)
}

export function riskLevel(score) {
    if (score >= 80) return 'S-安全'
    if (score >= 60) return 'A-可承压'
    if (score >= 40) return 'B-脆弱'
    if (score >= 20) return 'C-高危'
    return 'D-随时斩杀'
}
