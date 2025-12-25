// 职业默认参数库：用于根据职业填充或调整模拟所需的字段（可扩展）
export const professionDefaults = {
    '软件工程师': {
        jobRiskFactor: 1.0,
        effectiveTaxRate: 0.22,
        monthlyDebtPaymentRate: 0.05, // 作为月收入的比例近似月供
        livingCostMultiplier: 1.0
    },
    '教师': {
        jobRiskFactor: 0.9,
        effectiveTaxRate: 0.18,
        monthlyDebtPaymentRate: 0.04,
        livingCostMultiplier: 0.9
    },
    '医生': {
        jobRiskFactor: 0.95,
        effectiveTaxRate: 0.24,
        monthlyDebtPaymentRate: 0.06,
        livingCostMultiplier: 1.1
    },
    '自由职业者': {
        jobRiskFactor: 1.5,
        effectiveTaxRate: 0.2,
        monthlyDebtPaymentRate: 0.03,
        livingCostMultiplier: 1.0
    },
    '公务员': {
        jobRiskFactor: 0.8,
        effectiveTaxRate: 0.16,
        monthlyDebtPaymentRate: 0.03,
        livingCostMultiplier: 0.95
    },
    '建筑/体力劳动': {
        jobRiskFactor: 1.4,
        effectiveTaxRate: 0.18,
        monthlyDebtPaymentRate: 0.04,
        livingCostMultiplier: 1.05
    },
    '司机/运输': {
        jobRiskFactor: 1.3,
        effectiveTaxRate: 0.18,
        monthlyDebtPaymentRate: 0.04,
        livingCostMultiplier: 1.0
    },
    '创业者': {
        jobRiskFactor: 1.8,
        effectiveTaxRate: 0.22,
        monthlyDebtPaymentRate: 0.06,
        livingCostMultiplier: 1.2
    },
    '零售/服务': {
        jobRiskFactor: 1.2,
        effectiveTaxRate: 0.17,
        monthlyDebtPaymentRate: 0.04,
        livingCostMultiplier: 0.95
    }
}

export function getProfessionDefaults(profession) {
    if (!profession) return null
    const key = Object.keys(professionDefaults).find(k => profession.includes(k) || k === profession)
    return key ? professionDefaults[key] : null
}
