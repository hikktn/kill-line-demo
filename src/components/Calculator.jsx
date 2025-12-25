import React, { useState, useEffect } from 'react'
import { calculateKillLine, calculateRiskScore, riskLevel } from '../lib/killLineModel'
import { simulateRandomWorld } from '../lib/randomWorld'
import { getProfessionDefaults, professionDefaults } from '../lib/professionProfiles'

function number(v) {
    const n = parseFloat(v)
    return Number.isFinite(n) ? n : 0
}

export default function Calculator({ initialForm = null }) {
    const [form, setForm] = useState({
        profession: '',
        monthlyIncome: 6000,
        monthlyExpenses: 3000,
        effectiveTaxRate: 20,
        cash: 10000,
        investments: 20000,
        property: 0,
        mortgage: 0,
        studentLoans: 0,
        creditCard: 0,
        emergencyFund: 5000,
        insuranceCoverage: ''
    })

    // 支持接收来自模板或父组件的初始值
    useEffect(() => {
        if (initialForm && Object.keys(initialForm).length > 0) {
            // 只拷贝已定义的字段到表单
            setForm(prev => ({ ...prev, ...initialForm }))
        }
    }, [initialForm])

    // 可配置参数（暴露在 UI 中）
    const [config, setConfig] = useState({
        K: 25,
        // 阈值倍数（相对 killLine）
        safeMultiplier: 1.2,
        nearMultiplier: 1.0,
        cautionMultiplier: 0.8,
        // 风险得分权重（可不严格要求和为1，会在计算中归一化）
        w_runway: 0.35,
        w_wealth: 0.35,
        w_dti: 0.2,
        w_emergency: 0.1,
        // 预警阈值
        runwayAlertMonths: 6,
        dtiAlert: 0.5
    })
    const [showSettings, setShowSettings] = useState(false)

    const [result, setResult] = useState(null)
    const [simulation, setSimulation] = useState(null)
    const [simulationHistory, setSimulationHistory] = useState(() => {
        try {
            const raw = localStorage.getItem('simHistory')
            return raw ? JSON.parse(raw) : []
        } catch (e) {
            return []
        }
    })
    const [monteResult, setMonteResult] = useState(null)
    const [monteRunning, setMonteRunning] = useState(false)

    const handleChange = (e) => {
        const { name, value } = e.target
        if (name in form) setForm(prev => ({ ...prev, [name]: value }))
        else setConfig(prev => ({ ...prev, [name]: value }))
    }

    const resetConfig = () => {
        setConfig({
            K: 25,
            safeMultiplier: 1.2,
            nearMultiplier: 1.0,
            cautionMultiplier: 0.8,
            w_runway: 0.35,
            w_wealth: 0.35,
            w_dti: 0.2,
            w_emergency: 0.1,
            runwayAlertMonths: 6,
            dtiAlert: 0.5
        })
    }

    const calculate = (e) => {
        e.preventDefault()
        const monthlyIncome = number(form.monthlyIncome)
        const monthlyExpenses = number(form.monthlyExpenses)
        const cash = number(form.cash)
        const investments = number(form.investments)
        const property = number(form.property)
        const mortgage = number(form.mortgage)
        const studentLoans = number(form.studentLoans)
        const creditCard = number(form.creditCard)
        const emergencyFund = number(form.emergencyFund)
        const effectiveTaxRate = number(form.effectiveTaxRate) / 100
        // 解析配置
        const K = number(config.K)
        const safeMultiplier = number(config.safeMultiplier)
        const nearMultiplier = number(config.nearMultiplier)
        const cautionMultiplier = number(config.cautionMultiplier)
        const w_runway = number(config.w_runway)
        const w_wealth = number(config.w_wealth)
        const w_dti = number(config.w_dti)
        const w_emergency = number(config.w_emergency)
        const runwayAlertMonths = number(config.runwayAlertMonths)
        const dtiAlert = number(config.dtiAlert)

        const liquidAssets = cash + investments
        const totalAssets = cash + investments + property
        const totalLiabilities = mortgage + studentLoans + creditCard
        const netWorth = totalAssets - totalLiabilities

        const annualExpenses = monthlyExpenses * 12
        // Kill-line: 可配置倍数 K
        const killLine = annualExpenses * K

        const monthsRunway = monthlyExpenses > 0 ? (liquidAssets / monthlyExpenses) : Infinity
        const annualIncome = monthlyIncome * 12
        const debtToIncome = annualIncome > 0 ? (totalLiabilities / annualIncome) : Infinity

        // 风险得分（0-100），使用可配置权重
        // 归一化指标：runway（0..12+）、wealth ratio（netWorth/killLine）、dti、emergencyFund/月支出
        const runwayScore = Math.max(0, Math.min(1, monthsRunway / 12))
        const wealthRatio = killLine > 0 ? netWorth / killLine : (netWorth > 0 ? Infinity : -Infinity)
        const wealthScore = Math.max(0, Math.min(2, wealthRatio)) / 2
        const dtiScore = 1 - Math.max(0, Math.min(2, debtToIncome)) / 2
        const emergencyScore = monthlyExpenses > 0 ? Math.max(0, Math.min(6, emergencyFund / monthlyExpenses)) / 6 : 1

        // 归一化权重
        const wSum = w_runway + w_wealth + w_dti + w_emergency || 1
        const nr = w_runway / wSum
        const nw = w_wealth / wSum
        const nd = w_dti / wSum
        const ne = w_emergency / wSum

        let score = Math.round(100 * (nr * runwayScore + nw * wealthScore + nd * dtiScore + ne * emergencyScore))
        score = Math.max(0, Math.min(100, score))

        // 建议
        const suggestions = []
        if (monthsRunway < runwayAlertMonths) suggestions.push(`流动性偏低：建立或增加应急基金（至少覆盖 ${runwayAlertMonths} 个月生活费）。`)
        if (creditCard > 0) suggestions.push('优先偿还高利息债务（信用卡）。')
        if (debtToIncome > 1) suggestions.push('债务与收入比高：重新评估借贷并与金融顾问讨论重组。')
        if (effectiveTaxRate > 0.25) suggestions.push('税率较高：考虑税务优化策略，如税收优惠账户和退休计划。')
        if (!form.insuranceCoverage) suggestions.push('检查并补充必要保险（健康、意外、失能或人寿保险）。')

        // 计算四档状态：使用配置阈值
        let status = ''
        let statusAdvice = ''
        if (netWorth >= killLine * safeMultiplier) {
            status = '安全'
            statusAdvice = '可动用资产充足，远高于斩杀线；风险极低。保持现有储蓄与投资策略，并定期复核。'
        } else if (netWorth >= killLine * nearMultiplier) {
            status = '接近警戒'
            statusAdvice = '资产略高于斩杀线，缓冲有限；建议增加储蓄或减少非必要支出以提高安全边际。'
            suggestions.push('增加储蓄或被动收入，减少非必要支出以扩大缓冲。')
        } else if (netWorth >= killLine * cautionMultiplier) {
            status = '警戒'
            statusAdvice = '资产与斩杀线相当或略低，容易受到突发事件冲击；应立即调整收支结构并建立应急基金。'
            suggestions.push('紧急调整预算、优先建立或扩大应急基金，考虑债务重组。')
        } else {
            status = '危险'
            statusAdvice = '资产明显低于斩杀线，极易陷入财务危机；需采取紧急措施以防止恶化。'
            suggestions.push('立即采取紧急措施：削减支出、出售非核心资产、与债权人协商还款计划。')
        }

        if (netWorth < killLine && !suggestions.includes('你的净资产低于斩杀线，考虑增加储蓄或被动收入以缩短差距。')) {
            suggestions.unshift('你的净资产低于斩杀线，考虑增加储蓄或被动收入以缩短差距。')
        }

        if (suggestions.length === 0) suggestions.push('你的财务状况看起来稳健，继续保持并定期复核。')

        setResult({
            monthlyIncome,
            monthlyExpenses,
            liquidAssets,
            totalAssets,
            totalLiabilities,
            netWorth,
            annualExpenses,
            killLine,
            monthsRunway: Math.round(monthsRunway * 10) / 10,
            debtToIncome: Math.round(debtToIncome * 100) / 100,
            score,
            suggestions,
            status,
            statusAdvice
        })
    }

    // 将当前表单映射为随机模拟所需的 profile（尽量保留可解释的参数）
    function mapFormToProfile() {
        const monthlyIncome = number(form.monthlyIncome)
        const totalLiabilities = number(form.mortgage) + number(form.studentLoans) + number(form.creditCard)
        // 职业导出默认配置（若用户填写职业则尝试匹配并补全缺失字段）
        const profDefaults = getProfessionDefaults(form.profession)

        // 估算月供：优先使用显式提供项（若未来添加月供输入），否则使用职业推荐比率或总负债的 1% 作为回退
        const monthlyDebtPaymentRate = profDefaults ? profDefaults.monthlyDebtPaymentRate : 0.01
        const monthlyDebtPayment = Math.max(0, Math.round(totalLiabilities * monthlyDebtPaymentRate))

        // 税率优先使用表单，否则使用职业默认或 0.2
        const effectiveTaxRate = Math.min(0.99, Math.max(0, number(form.effectiveTaxRate) / 100)) || (profDefaults ? profDefaults.effectiveTaxRate : 0.2)

        // 月生活成本：可能根据职业有轻微差异
        const monthlyLivingCost = number(form.monthlyExpenses) || Math.round((monthlyIncome) * (profDefaults ? profDefaults.livingCostMultiplier : 1.0))

        // jobRiskFactor：使用职业默认或回退为 1.2
        const jobRiskFactor = profDefaults ? profDefaults.jobRiskFactor : 1.2

        return {
            income: monthlyIncome * 12,
            effectiveTaxRate,
            monthlyLivingCost,
            monthlyDebtPayment,
            emergencyAssets: number(form.cash) + number(form.emergencyFund) + number(form.investments) * 0.2,
            totalDebt: totalLiabilities,
            jobRiskFactor
        }
    }

    // 应用职业默认到表单（只在表单为空或覆盖确认时使用）
    function applyProfessionDefaults() {
        const pd = getProfessionDefaults(form.profession)
        if (!pd) return
        // 明确覆盖表单中的若干关键字段，让“应用职业默认”对用户可见
        setForm(prev => {
            const newMonthlyIncome = number(prev.monthlyIncome) || 6000
            const newMonthlyExpenses = Math.round(newMonthlyIncome * (pd.livingCostMultiplier || 1))
            return {
                ...prev,
                effectiveTaxRate: Math.round((pd.effectiveTaxRate || 0.2) * 100),
                monthlyExpenses: newMonthlyExpenses,
                // 可选：调整应急基金建议为 3 个月的生活费（仅示例，不覆盖用户已有较大值）
                emergencyFund: prev.emergencyFund && prev.emergencyFund > 0 ? prev.emergencyFund : Math.round(newMonthlyExpenses * 3)
            }
        })
    }

    // Monte Carlo 模拟：多次随机世界并统计分布
    async function runMonteCarlo(iterations = 1000) {
        setMonteRunning(true)
        const profileBase = mapFormToProfile()
        const eventCounts = {}
        let sumBeforeCoverage = 0
        let sumAfterCoverage = 0
        const scoresBefore = []
        const scoresAfter = []
        for (let i = 0; i < iterations; i++) {
            const before = calculateKillLine(profileBase)
            const beforeScore = calculateRiskScore(before, profileBase)
            const sim = simulateRandomWorld(profileBase)
            const after = calculateKillLine(sim.newProfile)
            const afterScore = calculateRiskScore(after, sim.newProfile)
            eventCounts[sim.event] = (eventCounts[sim.event] || 0) + 1
            sumBeforeCoverage += before.coverageMonths || 0
            sumAfterCoverage += after.coverageMonths || 0
            scoresBefore.push(beforeScore)
            scoresAfter.push(afterScore)
            // allow UI breathe for large runs
            if (i % 200 === 0) await new Promise(r => setTimeout(r, 0))
        }
        const avgBefore = sumBeforeCoverage / iterations
        const avgAfter = sumAfterCoverage / iterations
        const percentile = arr => {
            const s = arr.slice().sort((a, b) => a - b)
            return {
                p10: s[Math.floor(s.length * 0.1)] || 0,
                p50: s[Math.floor(s.length * 0.5)] || 0,
                p90: s[Math.floor(s.length * 0.9)] || 0
            }
        }
        setMonteResult({ iterations, eventCounts, avgBefore, avgAfter, scoresBefore: percentile(scoresBefore), scoresAfter: percentile(scoresAfter) })
        setMonteRunning(false)
    }

    const simulateWorld = () => {
        const profile = mapFormToProfile()
        const before = calculateKillLine(profile)
        const beforeScore = calculateRiskScore(before, profile)
        const sim = simulateRandomWorld(profile)
        const after = calculateKillLine(sim.newProfile)
        const afterScore = calculateRiskScore(after, sim.newProfile)
        const record = {
            id: Date.now(),
            ts: new Date().toISOString(),
            event: sim.event,
            before,
            beforeScore,
            after,
            afterScore
        }
        setSimulation({ event: sim.event, before, beforeScore, after, afterScore })
        setSimulationHistory(prev => {
            const next = [record, ...(prev || [])].slice(0, 50) // 保留最近 50 条
            try { localStorage.setItem('simHistory', JSON.stringify(next)) } catch (e) { }
            return next
        })
    }

    function clearSimulationHistory() {
        setSimulationHistory([])
        try { localStorage.removeItem('simHistory') } catch (e) { }
    }

    return (
        <div className="calculator">
            <form onSubmit={calculate} className="form">
                <section>
                    <h2>基础信息</h2>
                    <label>职业
                        <select name="profession" value={form.profession} onChange={handleChange} title="从预设职业选择，或输入自定义职业。选择后可点击“应用职业默认”填充推荐值。">
                            <option value="">-- 请选择或输入 --</option>
                            {Object.keys(professionDefaults).map((k) => (
                                <option key={k} value={k}>{k}</option>
                            ))}
                        </select>
                        <div style={{ marginTop: 6 }}>
                            <button type="button" onClick={applyProfessionDefaults}>应用职业默认</button>
                        </div>
                    </label>
                    <label>月收入（税前）
                        <input name="monthlyIncome" type="number" value={form.monthlyIncome} onChange={handleChange} title="月名义收入（税前）；用于估算年收入与税后可支配收入。默认示例：6000。" />
                    </label>
                    <label>月支出
                        <input name="monthlyExpenses" type="number" value={form.monthlyExpenses} onChange={handleChange} title="每月基础生活成本（不含可选消费），用于计算年度支出与斩杀线。默认示例：3000。" />
                    </label>
                    <label>有效税率（%）
                        <input name="effectiveTaxRate" type="number" value={form.effectiveTaxRate} onChange={handleChange} title="综合有效税率（百分数），包含各类税费与社保。示例：20 表示 20%。在模型中会除以 100 转为小数。" />
                    </label>
                </section>

                <div className="form-top">
                    <button type="button" className="settings-btn" onClick={() => setShowSettings(true)}>设置</button>
                </div>

                <section>
                    <h2>资产</h2>
                    <label>现金
                        <input name="cash" type="number" value={form.cash} onChange={handleChange} title="可立即动用的现金或活期资产，用于计算流动性覆盖月数。默认示例：10000。" />
                    </label>
                    <label>投资（股票/基金等）
                        <input name="investments" type="number" value={form.investments} onChange={handleChange} title="可变现投资（股票/基金等）；在模拟中按比例计入应急资产。默认示例：20000。" />
                    </label>
                    <label>房产等非流动资产
                        <input name="property" type="number" value={form.property} onChange={handleChange} title="非流动资产估值（房产等），用于计算净资产，但不被视为立即可用的应急资产。默认示例：0。" />
                    </label>
                    <label>应急基金目标（可选）
                        <input name="emergencyFund" type="number" value={form.emergencyFund} onChange={handleChange} title="用户手动设定的应急基金数额，优先计入流动资产用于覆盖月支出。默认示例：5000。" />
                    </label>
                </section>

                <section>
                    <h2>负债</h2>
                    <label>抵押贷款
                        <input name="mortgage" type="number" value={form.mortgage} onChange={handleChange} title="抵押贷款剩余本金总额（非月供），用于计算总负债与净资产。若有明确月供请在下方字段或设置中补充。默认示例：0。" />
                    </label>
                    <label>学生贷款
                        <input name="studentLoans" type="number" value={form.studentLoans} onChange={handleChange} title="学生贷款剩余本金总额，参与净资产与负债计算。默认示例：0。" />
                    </label>
                    <label>信用卡/高利贷
                        <input name="creditCard" type="number" value={form.creditCard} onChange={handleChange} title="高利率短期债务本金总额，建议优先偿还以降低风险。默认示例：0。" />
                    </label>
                </section>

                <section>
                    <h2>保障</h2>
                    <label>保险覆盖情况
                        <input name="insuranceCoverage" value={form.insuranceCoverage} onChange={handleChange} placeholder="例如：健康/人寿/失能" title="填写已有的主要保险类型，以便模型在建议中引用；为空时会提示补充保险。" />
                    </label>
                </section>

                <div className="actions">
                    <button type="submit">计算斩杀线</button>
                    <button type="button" style={{ marginLeft: 12 }} onClick={simulateWorld}>随机世界模拟</button>
                    <button type="button" style={{ marginLeft: 12 }} onClick={() => runMonteCarlo(1000)} disabled={monteRunning}>{monteRunning ? '运行中...' : 'Monte Carlo (1000 次)'}</button>
                </div>
            </form>

            {result && (
                <aside className="results">
                    <div className="results-header">
                        <h2>结果</h2>
                        <div className={`status-badge status-${(result.status === '安全' ? 'safe' : result.status === '接近警戒' ? 'near' : result.status === '警戒' ? 'caution' : 'danger')}`}>
                            {result.status}
                        </div>
                    </div>
                    <ul>
                        <li>净资产（Net Worth）: ${result.netWorth.toLocaleString()}</li>
                        <li>流动资产: ${result.liquidAssets.toLocaleString()}</li>
                        <li>总负债: ${result.totalLiabilities.toLocaleString()}</li>
                        <li>年支出: ${result.annualExpenses.toLocaleString()}</li>
                        <li>建议的斩杀线（25x 年支出）: ${result.killLine.toLocaleString()}</li>
                        <li>可支撑月数（流动性/月支出）: {result.monthsRunway} 月</li>
                        <li>债务与收入比（DTI）: {result.debtToIncome}</li>
                        <li>抗风险得分: {result.score} / 100</li>
                    </ul>
                    <h3>状态说明</h3>
                    <p className="status-advice">{result.statusAdvice}</p>

                    <h3>改进建议</h3>
                    <ul>
                        {result.suggestions.map((s, i) => (
                            <li key={i}>{s}</li>
                        ))}
                    </ul>
                </aside>
            )}

            {simulation && (
                <aside className="simulation">
                    <h3>随机世界模拟结果</h3>
                    <p>触发事件：<strong>{simulation.event}</strong></p>
                    <div className="sim-compare">
                        <div>
                            <h4>模拟前</h4>
                            <p>应急资产: ¥{Math.round(simulation.before.emergencyAssets).toLocaleString()}</p>
                            <p>覆盖月数: {Math.round(simulation.before.coverageMonths * 10) / 10} 月</p>
                            <p>得分: {simulation.beforeScore} ({riskLevel(simulation.beforeScore)})</p>
                        </div>
                        <div>
                            <h4>模拟后</h4>
                            <p>应急资产: ¥{Math.round(simulation.after.emergencyAssets).toLocaleString()}</p>
                            <p>覆盖月数: {Math.round(simulation.after.coverageMonths * 10) / 10} 月</p>
                            <p>得分: {simulation.afterScore} ({riskLevel(simulation.afterScore)})</p>
                        </div>
                    </div>
                </aside>
            )}

            {simulationHistory && simulationHistory.length > 0 && (
                <aside className="sim-history">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3>模拟历史（最近 {simulationHistory.length} 次）</h3>
                        <div>
                            <button type="button" onClick={() => { setSimulation(simulationHistory[0]); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>查看最新</button>
                            <button type="button" style={{ marginLeft: 8 }} onClick={clearSimulationHistory}>清除历史</button>
                        </div>
                    </div>
                    <ul>
                        {simulationHistory.map(r => (
                            <li key={r.id} style={{ padding: '8px 0', borderBottom: '1px solid #eee' }}>
                                <div style={{ fontSize: 12, color: '#555' }}>{new Date(r.ts).toLocaleString()} — {r.event}</div>
                                <div>前: {Math.round((r.before.coverageMonths || 0) * 10) / 10} 月 / {r.beforeScore} 分 → 后: {Math.round((r.after.coverageMonths || 0) * 10) / 10} 月 / {r.afterScore} 分</div>
                            </li>
                        ))}
                    </ul>
                </aside>
            )}
            {monteResult && (
                <aside className="monte-result">
                    <h3>Monte Carlo 结果（{monteResult.iterations} 次）</h3>
                    <div>平均覆盖月数：模拟前 {Math.round(monteResult.avgBefore * 10) / 10} 月 → 模拟后 {Math.round(monteResult.avgAfter * 10) / 10} 月</div>
                    <div style={{ marginTop: 8 }}>
                        <strong>得分分位数（前 → 后）</strong>
                        <div>10%: {monteResult.scoresBefore.p10} → {monteResult.scoresAfter.p10}</div>
                        <div>50%: {monteResult.scoresBefore.p50} → {monteResult.scoresAfter.p50}</div>
                        <div>90%: {monteResult.scoresBefore.p90} → {monteResult.scoresAfter.p90}</div>
                    </div>
                    <div style={{ marginTop: 8 }}>
                        <strong>事件触发频次（前几项）</strong>
                        <ul>
                            {Object.entries(monteResult.eventCounts).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => (
                                <li key={k}>{k}: {v} 次 ({Math.round(v / monteResult.iterations * 10000) / 100}% )</li>
                            ))}
                        </ul>
                    </div>
                </aside>
            )}

            {showSettings && (
                <div className="settings-overlay" onClick={() => setShowSettings(false)}>
                    <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
                        <header>
                            <h3>参数设置</h3>
                        </header>
                        <div className="settings-body">
                            <label>K（斩杀线倍数）
                                <input name="K" type="number" step="0.1" value={config.K} onChange={handleChange} />
                            </label>
                            <label>安全阈值倍数（Safe）
                                <input name="safeMultiplier" type="number" step="0.01" value={config.safeMultiplier} onChange={handleChange} />
                            </label>
                            <label>接近警戒阈值倍数（Near）
                                <input name="nearMultiplier" type="number" step="0.01" value={config.nearMultiplier} onChange={handleChange} />
                            </label>
                            <label>警戒阈值倍数（Caution）
                                <input name="cautionMultiplier" type="number" step="0.01" value={config.cautionMultiplier} onChange={handleChange} />
                            </label>
                            <label>跑道权重（w_runway）
                                <input name="w_runway" type="number" step="0.01" value={config.w_runway} onChange={handleChange} />
                            </label>
                            <label>财富权重（w_wealth）
                                <input name="w_wealth" type="number" step="0.01" value={config.w_wealth} onChange={handleChange} />
                            </label>
                            <label>DTI 权重（w_dti）
                                <input name="w_dti" type="number" step="0.01" value={config.w_dti} onChange={handleChange} />
                            </label>
                            <label>应急权重（w_emergency）
                                <input name="w_emergency" type="number" step="0.01" value={config.w_emergency} onChange={handleChange} />
                            </label>
                            <label>流动性预警（月）
                                <input name="runwayAlertMonths" type="number" step="1" value={config.runwayAlertMonths} onChange={handleChange} />
                            </label>
                            <label>DTI 预警值
                                <input name="dtiAlert" type="number" step="0.01" value={config.dtiAlert} onChange={handleChange} />
                            </label>
                        </div>
                        <div className="settings-actions">
                            <button type="button" onClick={() => setShowSettings(false)}>保存并关闭</button>
                            <button type="button" onClick={resetConfig}>恢复默认</button>
                            <button type="button" onClick={() => setShowSettings(false)}>关闭</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
