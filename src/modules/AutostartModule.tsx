import React, { useState, useEffect } from 'react'
import { enable, disable, isEnabled } from '@tauri-apps/plugin-autostart'

interface AutostartModuleProps {
    // 无需接收外部状态和回调，组件自己管理所有状态
}

export const AutostartModule: React.FC<AutostartModuleProps> = () => {
    const [isAutoStartEnabled, setIsAutoStartEnabled] = useState<boolean>(false)
    const [isLoading, setIsLoading] = useState<boolean>(false)

    useEffect(() => {
        // 获取自动启动状态（使用纯JavaScript API）
        isEnabled()
            .then(enabled => {
                setIsAutoStartEnabled(enabled)
                console.log('自动启动状态:', enabled ? '已启用' : '已禁用')
            })
            .catch(err => {
                console.error('检查自动启动状态失败:', err)
            })
    }, [])

    async function toggleAutoStart() {
        try {
            setIsLoading(true)

            if (isAutoStartEnabled) {
                // 如果已启用，则禁用（使用纯JavaScript API）
                await disable()
                setIsAutoStartEnabled(false)
                console.log('已禁用开机自启动')
            } else {
                // 如果已禁用，则启用（使用纯JavaScript API）
                await enable()
                setIsAutoStartEnabled(true)
                console.log('已启用开机自启动')
            }
        } catch (error) {
            console.error('切换自动启动状态失败:', error)
            alert('切换自动启动状态失败: ' + error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div
            style={{
                padding: '12px',
                backgroundColor: '#eff6ff',
                borderRadius: '6px',
                border: '1px solid #93c5fd',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '16px', marginRight: '6px' }}>🚀</span>
                <h3 style={{ margin: '0', fontSize: '14px', fontWeight: '600', color: '#1e40af' }}>开机自启动</h3>
            </div>

            <button
                onClick={toggleAutoStart}
                disabled={isLoading}
                style={{
                    backgroundColor: isLoading ? '#9ca3af' : isAutoStartEnabled ? '#dc2626' : '#059669',
                    color: 'white',
                    padding: '6px 12px',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    fontSize: '12px',
                    fontWeight: '500',
                    width: '100%'
                }}
            >
                {isLoading ? '处理中...' : isAutoStartEnabled ? '🔴 禁用开机自启' : '🟢 启用开机自启'}
            </button>

            <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '8px', lineHeight: '1.3' }}>
                💡 通过<code>app-settings</code>来统一管理设置项。当前状态: {isAutoStartEnabled ? '已启用' : '已禁用'}
            </div>
        </div>
    )
}
