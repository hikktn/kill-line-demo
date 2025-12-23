import React from 'react'

const TEMPLATES = [
    { id: 'software_engineer', title: '软件工程师', profession: 'Software Engineer', monthlyIncome: 9000, monthlyExpenses: 4500, effectiveTaxRate: 22, cash: 15000, investments: 30000, property: 0, mortgage: 0, studentLoans: 10000, creditCard: 2000, emergencyFund: 6000 },
    { id: 'teacher', title: '中学教师', profession: 'Teacher', monthlyIncome: 4000, monthlyExpenses: 2800, effectiveTaxRate: 18, cash: 6000, investments: 8000, property: 0, mortgage: 0, studentLoans: 5000, creditCard: 500, emergencyFund: 3000 },
    { id: 'nurse', title: '护士', profession: 'Nurse', monthlyIncome: 4500, monthlyExpenses: 3000, effectiveTaxRate: 18, cash: 7000, investments: 9000, property: 0, mortgage: 0, studentLoans: 6000, creditCard: 800, emergencyFund: 3500 },
    { id: 'doctor', title: '医生', profession: 'Doctor', monthlyIncome: 15000, monthlyExpenses: 7000, effectiveTaxRate: 28, cash: 40000, investments: 80000, property: 200000, mortgage: 150000, studentLoans: 80000, creditCard: 5000, emergencyFund: 15000 },
    { id: 'lawyer', title: '律师', profession: 'Lawyer', monthlyIncome: 12000, monthlyExpenses: 6000, effectiveTaxRate: 26, cash: 20000, investments: 40000, property: 0, mortgage: 0, studentLoans: 60000, creditCard: 3000, emergencyFund: 10000 },
    { id: 'driver', title: '卡车司机/司机', profession: 'Driver', monthlyIncome: 3500, monthlyExpenses: 2500, effectiveTaxRate: 15, cash: 4000, investments: 2000, property: 0, mortgage: 0, studentLoans: 0, creditCard: 800, emergencyFund: 2000 },
    { id: 'retail', title: '零售店员', profession: 'Retail Worker', monthlyIncome: 2800, monthlyExpenses: 2200, effectiveTaxRate: 12, cash: 3000, investments: 1000, property: 0, mortgage: 0, studentLoans: 0, creditCard: 1000, emergencyFund: 1500 },
    { id: 'manager', title: '中层管理', profession: 'Manager', monthlyIncome: 8000, monthlyExpenses: 4500, effectiveTaxRate: 24, cash: 12000, investments: 25000, property: 0, mortgage: 0, studentLoans: 20000, creditCard: 2000, emergencyFund: 8000 },
    { id: 'small_business', title: '小企业主', profession: 'Small Business Owner', monthlyIncome: 7000, monthlyExpenses: 5000, effectiveTaxRate: 22, cash: 10000, investments: 15000, property: 50000, mortgage: 30000, studentLoans: 0, creditCard: 5000, emergencyFund: 8000 },
    { id: 'engineer', title: '工程师（非软件）', profession: 'Engineer', monthlyIncome: 7000, monthlyExpenses: 3800, effectiveTaxRate: 22, cash: 10000, investments: 20000, property: 0, mortgage: 0, studentLoans: 20000, creditCard: 1000, emergencyFund: 6000 },
    { id: 'sales', title: '销售', profession: 'Sales', monthlyIncome: 6000, monthlyExpenses: 3500, effectiveTaxRate: 20, cash: 8000, investments: 10000, property: 0, mortgage: 0, studentLoans: 5000, creditCard: 1500, emergencyFund: 5000 },
    { id: 'freelancer', title: '自由职业者', profession: 'Freelancer', monthlyIncome: 5000, monthlyExpenses: 3200, effectiveTaxRate: 18, cash: 6000, investments: 5000, property: 0, mortgage: 0, studentLoans: 0, creditCard: 1200, emergencyFund: 4000 },
    { id: 'student', title: '在校学生', profession: 'Student', monthlyIncome: 800, monthlyExpenses: 1000, effectiveTaxRate: 0, cash: 500, investments: 0, property: 0, mortgage: 0, studentLoans: 20000, creditCard: 0, emergencyFund: 200 },
    { id: 'retired', title: '退休人员', profession: 'Retired', monthlyIncome: 3000, monthlyExpenses: 2500, effectiveTaxRate: 12, cash: 30000, investments: 100000, property: 200000, mortgage: 0, studentLoans: 0, creditCard: 0, emergencyFund: 12000 },
    { id: 'software_manager', title: '软件经理', profession: 'Software Manager', monthlyIncome: 12000, monthlyExpenses: 6000, effectiveTaxRate: 24, cash: 25000, investments: 50000, property: 0, mortgage: 0, studentLoans: 20000, creditCard: 3000, emergencyFund: 12000 },
    { id: 'consultant', title: '顾问/顾问师', profession: 'Consultant', monthlyIncome: 10000, monthlyExpenses: 5000, effectiveTaxRate: 24, cash: 20000, investments: 30000, property: 0, mortgage: 0, studentLoans: 0, creditCard: 2000, emergencyFund: 10000 },
    { id: 'police_fire', title: '警察/消防员', profession: 'Public Safety', monthlyIncome: 5000, monthlyExpenses: 3200, effectiveTaxRate: 18, cash: 8000, investments: 10000, property: 0, mortgage: 0, studentLoans: 5000, creditCard: 1000, emergencyFund: 6000 },
    { id: 'electrician', title: '电工/技工', profession: 'Tradesperson', monthlyIncome: 4500, monthlyExpenses: 2800, effectiveTaxRate: 16, cash: 6000, investments: 3000, property: 0, mortgage: 0, studentLoans: 0, creditCard: 800, emergencyFund: 3000 },
    { id: 'chef', title: '厨师/餐饮', profession: 'Chef', monthlyIncome: 3500, monthlyExpenses: 2600, effectiveTaxRate: 15, cash: 3000, investments: 2000, property: 0, mortgage: 0, studentLoans: 0, creditCard: 1000, emergencyFund: 2000 }
]

export default function Home({ onSelectTemplate }) {
    return (
        <div className="home">
            <h2>选择职业模板</h2>
            <p>点击任意模板以预填数据并进入斩杀线计算页面。你也可以选择“自定义”来手动填写。</p>

            <div className="template-list">
                {TEMPLATES.map(t => (
                    <div className="template-card" key={t.id}>
                        <h3>{t.title}</h3>
                        <p>{t.profession}</p>
                        <div className="template-meta">月收入 ${t.monthlyIncome.toLocaleString()} • 月支出 ${t.monthlyExpenses.toLocaleString()}</div>
                        <div className="template-actions">
                            <button onClick={() => onSelectTemplate(t)}>使用模板</button>
                        </div>
                    </div>
                ))}

                <div className="template-card template-custom">
                    <h3>自定义模板</h3>
                    <p>从空白开始填写你自己的财务信息。</p>
                    <div className="template-actions">
                        <button onClick={() => onSelectTemplate({})}>自定义并填写</button>
                    </div>
                </div>
            </div>
        </div>
    )
}
