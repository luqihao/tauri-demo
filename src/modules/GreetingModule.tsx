import React, { useState } from 'react'
import { coreAPI, openerAPI } from '../jsBridge'

interface GreetingModuleProps {
    // 无需接收外部状态和回调，组件自己管理所有状态
}

export const GreetingModule: React.FC<GreetingModuleProps> = () => {
    const [greetMsg, setGreetMsg] = useState<string>('')
    const [name, setName] = useState<string>('')

    async function greet() {
        // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
        setGreetMsg(await coreAPI.invoke('greet', { name }))
    }

    async function openTauriDocs() {
        try {
            await openerAPI.openUrl('https://v2.tauri.app/zh-cn/learn/')
            console.log('已打开Tauri文档')
        } catch (error) {
            console.error('打开URL失败:', error)
            alert('打开URL失败: ' + error)
        }
    }

    return (
        <div
            style={{
                padding: '12px',
                backgroundColor: '#fcf3f2',
                borderRadius: '6px',
                border: '1px solid #fecaca',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '16px', marginRight: '6px' }}>👋</span>
                <h3 style={{ margin: '0', fontSize: '14px', fontWeight: '600', color: '#b91c1c' }}>问候示例</h3>
            </div>

            <div style={{ marginBottom: '12px' }}>
                <input
                    id="greet-input"
                    onChange={e => setName(e.target.value)}
                    placeholder="输入您的名字..."
                    style={{
                        width: '100%',
                        padding: '8px',
                        fontSize: '12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        marginBottom: '8px',
                        boxSizing: 'border-box'
                    }}
                />

                <button
                    onClick={greet}
                    style={{
                        backgroundColor: '#ef4444',
                        color: 'white',
                        padding: '8px 16px',
                        fontSize: '12px',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: '500',
                        width: '100%',
                        marginBottom: '8px'
                    }}
                >
                    问候
                </button>
            </div>

            {greetMsg && (
                <p
                    style={{
                        fontSize: '14px',
                        padding: '8px',
                        backgroundColor: '#fee2e2',
                        borderRadius: '4px',
                        fontWeight: '500',
                        color: '#991b1b',
                        margin: '0 0 12px 0'
                    }}
                >
                    {greetMsg}
                </p>
            )}

            <button
                onClick={openTauriDocs}
                style={{
                    backgroundColor: '#b91c1c',
                    color: 'white',
                    padding: '8px 16px',
                    fontSize: '12px',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: '500',
                    width: '100%',
                    marginBottom: '8px'
                }}
            >
                打开Tauri文档
            </button>

            <div style={{ fontSize: '10px', color: '#6b7280', lineHeight: '1.3' }}>
                💡 使用<code>invoke</code>调用Rust后端函数，实现前后端跨语言通信。使用<code>openUrl</code>
                可以在系统默认浏览器中打开链接。
            </div>
        </div>
    )
}
