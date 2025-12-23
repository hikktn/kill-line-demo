import React, { useState } from 'react'
import Calculator from './components/Calculator'
import Home from './components/Home'

export default function App() {
    const [selectedTemplate, setSelectedTemplate] = useState(null)

    return (
        <div className="app">
            <header className="header">
                <h1>斩杀线 计算器</h1>
                <p>选择模板或自定义填写，计算你的斩杀线与抗风险能力。</p>
            </header>
            <main>
                {!selectedTemplate ? (
                    <Home onSelectTemplate={(t) => setSelectedTemplate(t)} />
                ) : (
                    <div>
                        <button className="settings-btn" style={{ marginBottom: 12 }} onClick={() => setSelectedTemplate(null)}>返回模板列表</button>
                        <Calculator initialForm={selectedTemplate} />
                    </div>
                )}
            </main>
        </div>
    )
}
