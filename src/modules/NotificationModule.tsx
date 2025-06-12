import { useState, useEffect } from 'react'
import { notificationAPI } from '../jsBridge'

const NotificationModule = () => {
    const [isNotificationEnabled, setIsNotificationEnabled] = useState(false)
    const [showDetails, setShowDetails] = useState(false)
    const [permissionStatus, setPermissionStatus] = useState<string>('unknown')
    const [notificationCount, setNotificationCount] = useState(0)
    const [lastNotificationTime, setLastNotificationTime] = useState<string>('')

    // 检查通知权限状态
    useEffect(() => {
        const checkPermission = async () => {
            try {
                const isGranted = await notificationAPI.isPermissionGranted()
                setPermissionStatus(isGranted ? 'granted' : 'not-granted')
                setIsNotificationEnabled(isGranted)
            } catch (error) {
                console.error('检查通知权限失败:', error)
                setPermissionStatus('error')
            }
        }
        checkPermission()
    }, [])

    // 请求通知权限
    const requestPermission = async () => {
        try {
            const permission = await notificationAPI.requestPermission()
            setPermissionStatus(permission)
            setIsNotificationEnabled(permission === 'granted')
            console.log('通知权限状态:', permission)
        } catch (error) {
            console.error('请求通知权限失败:', error)
            alert('请求通知权限失败: ' + error)
        }
    }

    // 发送测试通知
    const sendTestNotification = async () => {
        if (!isNotificationEnabled) {
            alert('通知未启用，请先启用通知权限')
            return
        }

        try {
            const now = new Date()
            const timeString = now.toLocaleTimeString()
            const count = notificationCount + 1

            const notificationOptions = {
                title: `Tauri 测试通知 #${count}`,
                body: showDetails
                    ? `这是一条测试通知，发送时间: ${timeString}\n\n✨ 通知功能正常工作！\n📱 消息计数: ${count}\n⏰ 当前时间: ${timeString}`
                    : `简单测试通知 #${count}`,
                icon: undefined // 可以设置图标路径
            }

            await notificationAPI.send(notificationOptions)

            setNotificationCount(count)
            setLastNotificationTime(timeString)
            console.log('通知发送成功:', notificationOptions)
        } catch (error) {
            console.error('发送通知失败:', error)
            alert('发送通知失败: ' + error)
        }
    }

    // 获取权限状态显示文本和颜色
    const getPermissionDisplay = () => {
        switch (permissionStatus) {
            case 'granted':
                return { text: '已授权', color: '#10b981' }
            case 'denied':
                return { text: '已拒绝', color: '#ef4444' }
            case 'default':
                return { text: '未设置', color: '#f59e0b' }
            case 'not-granted':
                return { text: '未授权', color: '#f59e0b' }
            case 'error':
                return { text: '检查失败', color: '#ef4444' }
            default:
                return { text: '未知', color: '#6b7280' }
        }
    }

    const permissionDisplay = getPermissionDisplay()

    return (
        <div
            style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '8px',
                padding: '16px',
                color: 'white',
                fontSize: '13px',
                lineHeight: '1.4'
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '16px', marginRight: '8px' }}>🔔</span>
                <h3 style={{ margin: '0', fontSize: '14px', fontWeight: '600' }}>系统通知</h3>
                <div
                    style={{
                        marginLeft: 'auto',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        fontSize: '10px',
                        fontWeight: '500'
                    }}
                >
                    {notificationCount} 条已发送
                </div>
            </div>

            {/* 权限状态显示 */}
            <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', opacity: '0.9' }}>权限状态:</span>
                    <span
                        style={{
                            marginLeft: '8px',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: permissionDisplay.color,
                            fontSize: '11px',
                            fontWeight: '500'
                        }}
                    >
                        {permissionDisplay.text}
                    </span>
                </div>

                {permissionStatus !== 'granted' && (
                    <button
                        onClick={requestPermission}
                        style={{
                            backgroundColor: '#f59e0b',
                            color: 'white',
                            padding: '4px 8px',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '11px',
                            fontWeight: '500',
                            marginBottom: '8px'
                        }}
                    >
                        请求通知权限
                    </button>
                )}
            </div>

            {/* 控制开关 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                <div>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={isNotificationEnabled}
                            onChange={e => setIsNotificationEnabled(e.target.checked)}
                            disabled={permissionStatus !== 'granted'}
                            style={{ marginRight: '6px' }}
                        />
                        <span style={{ fontSize: '12px' }}>启用通知</span>
                    </label>
                </div>
                <div>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={showDetails}
                            onChange={e => setShowDetails(e.target.checked)}
                            style={{ marginRight: '6px' }}
                        />
                        <span style={{ fontSize: '12px' }}>详细信息</span>
                    </label>
                </div>
            </div>

            {/* 测试按钮 */}
            <button
                onClick={sendTestNotification}
                disabled={!isNotificationEnabled}
                style={{
                    backgroundColor: isNotificationEnabled ? '#10b981' : '#6b7280',
                    color: 'white',
                    padding: '8px 12px',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: isNotificationEnabled ? 'pointer' : 'not-allowed',
                    fontSize: '12px',
                    fontWeight: '500',
                    width: '100%',
                    marginBottom: '12px'
                }}
            >
                {isNotificationEnabled ? '发送测试通知' : '通知已禁用'}
            </button>

            {/* 状态信息 */}
            {lastNotificationTime && (
                <div
                    style={{
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        borderRadius: '4px',
                        padding: '8px',
                        marginBottom: '8px'
                    }}
                >
                    <div style={{ fontSize: '11px', opacity: '0.8', marginBottom: '4px' }}>
                        最后通知时间: {lastNotificationTime}
                    </div>
                    <div style={{ fontSize: '11px', opacity: '0.8' }}>
                        通知模式: {showDetails ? '详细信息' : '简单模式'}
                    </div>
                </div>
            )}

            {/* 说明文字 */}
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.3' }}>
                💡 系统通知功能演示。支持权限管理、消息切换和详情显示。 使用{' '}
                <code style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: '1px 3px', borderRadius: '2px' }}>
                    @tauri-apps/plugin-notification
                </code>{' '}
                插件实现跨平台通知功能。
            </div>
        </div>
    )
}

export default NotificationModule
