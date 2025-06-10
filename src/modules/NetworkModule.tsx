import React, { useState } from 'react'

interface NetworkModuleProps {
    // 无需接收外部状态和回调，组件自己管理所有状态
}

export const NetworkModule: React.FC<NetworkModuleProps> = () => {
    const [apiUrl, setApiUrl] = useState<string>('https://jsonplaceholder.typicode.com/users')
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [response, setResponse] = useState<string>('')

    async function makeRequest() {
        if (!apiUrl.trim()) {
            alert('请输入API地址')
            return
        }

        try {
            setIsLoading(true)
            setResponse('请求中...')

            const response = await fetch(apiUrl)
            const data = await response.json()

            setResponse(JSON.stringify(data, null, 2))
            console.log('API请求成功:', data)
        } catch (error) {
            console.error('API请求失败:', error)
            setResponse(`请求失败: ${error}`)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div
            style={{
                padding: '12px',
                backgroundColor: '#ecfdf5',
                borderRadius: '6px',
                border: '1px solid #a7f3d0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '16px', marginRight: '6px' }}>🌐</span>
                <h3 style={{ margin: '0', fontSize: '14px', fontWeight: '600', color: '#047857' }}>网络请求</h3>
            </div>

            <div style={{ marginBottom: '12px' }}>
                <label
                    style={{
                        fontSize: '12px',
                        fontWeight: '500',
                        color: '#374151',
                        display: 'block',
                        marginBottom: '4px'
                    }}
                >
                    API地址:
                </label>
                <input
                    type="url"
                    value={apiUrl}
                    onChange={e => setApiUrl(e.target.value)}
                    placeholder="输入API地址..."
                    disabled={isLoading}
                    style={{
                        width: '100%',
                        padding: '6px 8px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '12px',
                        boxSizing: 'border-box',
                        backgroundColor: isLoading ? '#f9fafb' : 'white',
                        marginBottom: '8px',
                        color: 'black'
                    }}
                />

                <button
                    onClick={makeRequest}
                    disabled={isLoading}
                    style={{
                        backgroundColor: isLoading ? '#9ca3af' : '#10b981',
                        color: 'white',
                        padding: '6px 12px',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        fontSize: '12px',
                        fontWeight: '500',
                        width: '100%',
                        marginBottom: '8px'
                    }}
                >
                    {isLoading ? '请求中...' : '发送请求'}
                </button>

                <label
                    style={{
                        fontSize: '12px',
                        fontWeight: '500',
                        color: '#374151',
                        display: 'block',
                        marginBottom: '4px'
                    }}
                >
                    响应:
                </label>
                <pre
                    style={{
                        backgroundColor: '#f3f4f6',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        padding: '8px',
                        fontSize: '10px',
                        fontFamily: 'monospace',
                        overflowX: 'auto',
                        color: '#1f2937',
                        maxHeight: '200px',
                        margin: 0
                    }}
                >
                    {response || '响应将显示在这里...'}
                </pre>
            </div>

            <div style={{ fontSize: '10px', color: '#6b7280', lineHeight: '1.3' }}>
                💡 Tauri应用可以使用标准的Web
                API进行网络请求，同时也可以通过Rust后端进行HTTP调用，获得更多的安全控制和功能。
            </div>
        </div>
    )
}
