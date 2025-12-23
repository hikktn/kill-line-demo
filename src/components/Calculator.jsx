import React, { useState, useEffect } from 'react'

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

    return (
        <div className="calculator">
            <form onSubmit={calculate} className="form">
                <section>
                    <h2>基础信息</h2>
                    <label>职业
                        <input name="profession" value={form.profession} onChange={handleChange} placeholder="例如：软件工程师" />
                    </label>
                    <label>月收入（税前）
                        <input name="monthlyIncome" type="number" value={form.monthlyIncome} onChange={handleChange} />
                    </label>
                    <label>月支出
                        <input name="monthlyExpenses" type="number" value={form.monthlyExpenses} onChange={handleChange} />
                    </label>
                    <label>有效税率（%）
                        <input name="effectiveTaxRate" type="number" value={form.effectiveTaxRate} onChange={handleChange} />
                    </label>
                </section>

                <div className="form-top">
                    <button type="button" className="settings-btn" onClick={() => setShowSettings(true)}>设置</button>
                </div>

                <section>
                    <h2>资产</h2>
                    <label>现金
                        <input name="cash" type="number" value={form.cash} onChange={handleChange} />
                    </label>
                    <label>投资（股票/基金等）
                        <input name="investments" type="number" value={form.investments} onChange={handleChange} />
                    </label>
                    <label>房产等非流动资产
                        <input name="property" type="number" value={form.property} onChange={handleChange} />
                    </label>
                    <label>应急基金目标（可选）
                        <input name="emergencyFund" type="number" value={form.emergencyFund} onChange={handleChange} />
                    </label>
                </section>

                <section>
                    <h2>负债</h2>
                    <label>抵押贷款
                        <input name="mortgage" type="number" value={form.mortgage} onChange={handleChange} />
                    </label>
                    <label>学生贷款
                        <input name="studentLoans" type="number" value={form.studentLoans} onChange={handleChange} />
                    </label>
                    <label>信用卡/高利贷
                        <input name="creditCard" type="number" value={form.creditCard} onChange={handleChange} />
                    </label>
                </section>

                <section>
                    <h2>保障</h2>
                    <label>保险覆盖情况
                        <input name="insuranceCoverage" value={form.insuranceCoverage} onChange={handleChange} placeholder="例如：健康/人寿/失能" />
                    </label>
                </section>

                <div className="actions">
                    <button type="submit">计算斩杀线</button>
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
