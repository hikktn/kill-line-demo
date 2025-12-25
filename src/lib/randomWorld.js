export const randomEvents = [
    {
        name: '失业 6 个月',
        probability: 0.12,
        apply(profile) {
            return {
                emergencyAssets: (profile.emergencyAssets || 0) - (profile.monthlyLivingCost || 0) * 6
            }
        }
    },
    {
        name: '失业 12 个月',
        probability: 0.06,
        apply(profile) {
            return {
                emergencyAssets: (profile.emergencyAssets || 0) - (profile.monthlyLivingCost || 0) * 12
            }
        }
    },
    {
        name: '部分残疾（长期收入下降）+ 医疗费',
        probability: 0.05,
        apply(profile) {
            return {
                income: (profile.income || 0) * 0.4,
                emergencyAssets: (profile.emergencyAssets || 0) - 50000
            }
        }
    },
    {
        name: '重大医疗事故（高额费用）',
        probability: 0.08,
        apply(profile) {
            return {
                emergencyAssets: (profile.emergencyAssets || 0) - 40000
            }
        }
    },
    {
        name: '重大家庭照护（12 个月）',
        probability: 0.05,
        apply(profile) {
            return {
                emergencyAssets: (profile.emergencyAssets || 0) - (profile.monthlyLivingCost || 0) * 12
            }
        }
    },
    {
        name: '离婚/财产分割（净流失）',
        probability: 0.04,
        apply(profile) {
            return {
                emergencyAssets: (profile.emergencyAssets || 0) * 0.7,
                totalDebt: (profile.totalDebt || 0) * 1.1
            }
        }
    },
    {
        name: '重大房屋维修/自然灾害修复',
        probability: 0.06,
        apply(profile) {
            return {
                emergencyAssets: (profile.emergencyAssets || 0) - 20000
            }
        }
    },
    {
        name: '车辆事故/修理',
        probability: 0.05,
        apply(profile) {
            return {
                emergencyAssets: (profile.emergencyAssets || 0) - 8000
            }
        }
    },
    {
        name: '诈骗/盗窃损失',
        probability: 0.03,
        apply(profile) {
            return {
                emergencyAssets: (profile.emergencyAssets || 0) - 15000
            }
        }
    },
    {
        name: '投资/市场大幅波动（亏损）',
        probability: 0.07,
        apply(profile) {
            return {
                emergencyAssets: (profile.emergencyAssets || 0) * 0.7
            }
        }
    },
    {
        name: '年终奖金/加薪（正向事件）',
        probability: 0.06,
        apply(profile) {
            return {
                income: (profile.income || 0) * 1.15,
                emergencyAssets: (profile.emergencyAssets || 0) + 5000
            }
        }
    },
    {
        name: '获得遗产/一次性收入（正向事件）',
        probability: 0.02,
        apply(profile) {
            return {
                emergencyAssets: (profile.emergencyAssets || 0) + 30000
            }
        }
    },
    {
        name: '利率上升（偿债压力）',
        probability: 0.08,
        apply(profile) {
            return {
                monthlyDebtPayment: (profile.monthlyDebtPayment || 0) * 1.25
            }
        }
    },
    {
        name: '货币贬值/通胀冲击（购买力下降）',
        probability: 0.05,
        apply(profile) {
            return {
                emergencyAssets: (profile.emergencyAssets || 0) * 0.8,
                monthlyLivingCost: (profile.monthlyLivingCost || 0) * 1.15
            }
        }
    }
]

// 高损失事件（会夺走个人大部分可用资产或导致重大负债）
randomEvents.push(
    {
        name: '个人企业破产/生意失败',
        probability: 0.03,
        apply(profile) {
            return {
                // 把投资与应急资产大部分吞噬，并可能增加担保负债
                emergencyAssets: Math.max(0, (profile.emergencyAssets || 0) * 0.1),
                investments: Math.max(0, (profile.investments || 0) * 0.05),
                totalDebt: (profile.totalDebt || 0) + 50000
            }
        }
    },
    {
        name: '重大诉讼/赔偿判决',
        probability: 0.03,
        apply(profile) {
            return {
                emergencyAssets: Math.max(0, (profile.emergencyAssets || 0) - 60000),
                totalDebt: (profile.totalDebt || 0) + 60000
            }
        }
    },
    {
        name: '税务追缴/补缴大额欠税',
        probability: 0.02,
        apply(profile) {
            return {
                emergencyAssets: Math.max(0, (profile.emergencyAssets || 0) - 50000),
                totalDebt: (profile.totalDebt || 0) + 20000
            }
        }
    },
    {
        name: '大额赌博或成瘾性损失',
        probability: 0.02,
        apply(profile) {
            return {
                emergencyAssets: Math.max(0, (profile.emergencyAssets || 0) * 0.05),
                investments: Math.max(0, (profile.investments || 0) * 0.05)
            }
        }
    },
    {
        name: '身份被盗并被清空账户/投资',
        probability: 0.02,
        apply(profile) {
            return {
                emergencyAssets: 0,
                investments: 0,
                totalDebt: (profile.totalDebt || 0) + 10000
            }
        }
    },
    {
        name: '房贷违约导致被止赎/丧失房产',
        probability: 0.03,
        apply(profile) {
            return {
                property: 0,
                emergencyAssets: Math.max(0, (profile.emergencyAssets || 0) - 15000),
                totalDebt: Math.max(0, (profile.totalDebt || 0) + 20000)
            }
        }
    }
)

// 极端/压倒性损失事件（低概率但高冲击）
randomEvents.push(
    {
        name: '重大自然灾害（地震/飓风/龙卷风）',
        probability: 0.01,
        apply(profile) {
            // 可能房屋全毁、保险不足并伴随当地经济停滞与短期失业
            const propertyLoss = profile.property || 0
            const uninsured = Math.max(0, propertyLoss * (0.4 + Math.random() * 0.6))
            const incomeDropMonths = 3 + Math.floor(Math.random() * 12)
            return {
                emergencyAssets: Math.max(0, (profile.emergencyAssets || 0) - uninsured - 20000),
                property: 0,
                income: Math.max(0, (profile.income || 0) * Math.max(0, 1 - incomeDropMonths / 12)),
                totalDebt: (profile.totalDebt || 0) + 20000
            }
        }
    },
    {
        name: '重大法律赔偿（高额诉讼）',
        probability: 0.01,
        apply(profile) {
            const judgement = 100000 + Math.random() * 900000 // 100k - 1M
            const legalFees = 20000 + Math.random() * 80000
            return {
                emergencyAssets: Math.max(0, (profile.emergencyAssets || 0) - Math.min((profile.emergencyAssets || 0), judgement * 0.5) - legalFees),
                totalDebt: (profile.totalDebt || 0) + Math.max(0, judgement - (profile.emergencyAssets || 0) * 0.5),
                income: Math.max(0, (profile.income || 0) * 0.5)
            }
        }
    },
    {
        name: '身份盗窃/账户被黑（重大）',
        probability: 0.02,
        apply(profile) {
            // 大额被盗、信用受损，需要多年清理
            const theft = 20000 + Math.random() * 100000
            return {
                emergencyAssets: Math.max(0, (profile.emergencyAssets || 0) - theft),
                investments: Math.max(0, (profile.investments || 0) - theft * 0.5),
                totalDebt: (profile.totalDebt || 0) + Math.min(50000, theft * 0.5)
            }
        }
    },
    {
        name: '恶意欺诈/庞氏骗局（资金蒸发）',
        probability: 0.015,
        apply(profile) {
            // 全部积蓄投入并蒸发
            return {
                emergencyAssets: 0,
                investments: 0,
                totalDebt: (profile.totalDebt || 0) + 50000
            }
        }
    },
    {
        name: '绑架勒索/恶性敲诈（极端）',
        probability: 0.002,
        apply(profile) {
            const ransom = 50000 + Math.random() * 450000
            return {
                emergencyAssets: Math.max(0, (profile.emergencyAssets || 0) - ransom),
                totalDebt: (profile.totalDebt || 0) + Math.max(0, ransom - (profile.emergencyAssets || 0)),
                income: Math.max(0, (profile.income || 0) * 0.2)
            }
        }
    },
    {
        name: '重度残疾/长期失能',
        probability: 0.01,
        apply(profile) {
            // 永久性工作能力丧失，需要长期护理及康复费用
            const careCost = 50000 + Math.random() * 250000
            return {
                emergencyAssets: Math.max(0, (profile.emergencyAssets || 0) - careCost),
                income: 0,
                totalDebt: (profile.totalDebt || 0) + Math.max(0, careCost - (profile.emergencyAssets || 0))
            }
        }
    }
)

// 使用权重（probability 字段作为权重）进行选择，便于扩展大量事件。
export function simulateRandomWorld(profile) {
    const total = randomEvents.reduce((s, e) => s + (e.probability || 0), 0)
    if (total <= 0) return { event: '无重大事件', newProfile: profile }
    const roll = Math.random() * total
    let acc = 0
    for (const event of randomEvents) {
        acc += event.probability || 0
        if (roll <= acc) {
            try {
                return {
                    event: event.name,
                    newProfile: {
                        ...profile,
                        ...event.apply(profile)
                    }
                }
            } catch (e) {
                return { event: event.name, newProfile: profile }
            }
        }
    }
    return { event: '无重大事件', newProfile: profile }
}

// 以下是用户提供的社会/生活事件（来自表格）：
randomEvents.push(
    {
        name: '被枪击或暴力伤害',
        probability: 0.015,
        apply(profile) {
            const loss = 25000 + Math.random() * (200000 - 25000)
            const monthsLost = 3 + Math.floor(Math.random() * 10) // 3-12 月
            return {
                emergencyAssets: Math.max(0, (profile.emergencyAssets || 0) - loss),
                income: Math.max(0, (profile.income || 0) * Math.max(0, 1 - monthsLost / 12))
            }
        }
    },
    {
        name: '离婚或分手',
        probability: 0.04,
        apply(profile) {
            const legal = 10000 + Math.random() * 40000
            return {
                emergencyAssets: Math.max(0, (profile.emergencyAssets || 0) * 0.6 - legal),
                income: Math.max(0, (profile.income || 0) * 0.7),
                totalDebt: (profile.totalDebt || 0) * 1.05
            }
        }
    },
    {
        name: '丧亲/家庭成员重病',
        probability: 0.03,
        apply(profile) {
            const cost = 20000 + Math.random() * 60000
            const monthsLost = 1 + Math.floor(Math.random() * 6)
            return {
                emergencyAssets: Math.max(0, (profile.emergencyAssets || 0) - cost),
                income: Math.max(0, (profile.income || 0) * Math.max(0, 1 - monthsLost / 12))
            }
        }
    },
    {
        name: '经济暴力/财务控制',
        probability: 0.005,
        apply(profile) {
            const legal = 5000 + Math.random() * 15000
            return {
                emergencyAssets: 0,
                income: Math.max(0, (profile.income || 0) * 0.2),
                totalDebt: (profile.totalDebt || 0) + legal
            }
        }
    },
    {
        name: '冲动消费/财务自毁',
        probability: 0.075,
        apply(profile) {
            return {
                emergencyAssets: Math.max(0, (profile.emergencyAssets || 0) * 0.2),
                investments: Math.max(0, (profile.investments || 0) * 0.2)
            }
        }
    }
)
