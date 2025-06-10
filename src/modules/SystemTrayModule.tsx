import React, { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'

interface SystemTrayModuleProps {
    // 无需接收外部状态和回调，组件自己管理所有状态
}

export const SystemTrayModule: React.FC<SystemTrayModuleProps> = () => {
    const [unreadCount, setUnreadCount] = useState<number>(0)

    useEffect(() => {
        // 获取初始未读数
        invoke('get_unread_count').then(count => {
            setUnreadCount(count as number)
        })

        // 监听托盘菜单触发的未读数变化事件
        const unlisten = listen('unread-count-changed', event => {
            setUnreadCount(event.payload as number)
        })

        return () => {
            unlisten.then(f => f())
        }
    }, [])

    async function incrementUnread() {
        try {
            const newCount = (await invoke('increment_unread')) as number
            setUnreadCount(newCount)
        } catch (error) {
            console.error('增加未读数失败:', error)
            alert('增加未读数失败: ' + error)
        }
    }

    async function clearUnread() {
        try {
            const newCount = (await invoke('clear_unread')) as number
            setUnreadCount(newCount)
        } catch (error) {
            console.error('清除未读数失败:', error)
            alert('清除未读数失败: ' + error)
        }
    }

    return (
        <div
            style={{
                padding: '12px',
                backgroundColor: '#fdf2f8',
                borderRadius: '6px',
                border: '1px solid #fbcfe8',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '16px', marginRight: '6px' }}>🔔</span>
                <h3 style={{ margin: '0', fontSize: '14px', fontWeight: '600', color: '#9d174d' }}>系统托盘</h3>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                <div
                    style={{
                        backgroundColor: unreadCount > 0 ? '#ef4444' : '#9ca3af',
                        color: 'white',
                        borderRadius: '8px',
                        padding: '4px 8px',
                        fontSize: '12px',
                        fontWeight: '600',
                        marginRight: '8px'
                    }}
                >
                    {unreadCount}
                </div>
                <div style={{ fontSize: '12px', color: '#374151' }}>未读通知数</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                <button
                    onClick={incrementUnread}
                    style={{
                        backgroundColor: '#8b5cf6',
                        color: 'white',
                        padding: '6px 8px',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: '500'
                    }}
                >
                    🔼 增加未读数
                </button>

                <button
                    onClick={clearUnread}
                    style={{
                        backgroundColor: '#dc2626',
                        color: 'white',
                        padding: '6px 8px',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: '500'
                    }}
                >
                    🔽 清除未读数
                </button>
            </div>

            <div style={{ fontSize: '10px', color: '#6b7280', lineHeight: '1.3' }}>
                💡 系统托盘支持显示未读数、自定义菜单项和点击事件，还可以捕获托盘事件并更新图标状态。
            </div>
        </div>
    )
}
