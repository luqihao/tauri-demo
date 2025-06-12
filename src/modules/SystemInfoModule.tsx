import React, { useState, useEffect } from 'react'
import { osAPI, appAPI, coreAPI, type Platform, type Arch, type Family } from '../jsBridge'
import CryptoJS from 'crypto-js'

interface SystemInfo {
    platform: Platform
    arch: Arch
    version: string | null
    hostname: string | null
    family: Family
    locale: string | null
    deviceId?: string
    macAddress?: string
    sign?: string
}

interface DeviceIdResponse {
    device_id: string
    mac_address: string
}

interface SystemInfoModuleProps {}

export const SystemInfoModule: React.FC<SystemInfoModuleProps> = () => {
    const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null)
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [error, setError] = useState<string>('')
    const [isExpanded, setIsExpanded] = useState<boolean>(false)

    // 生成设备标识和sign
    const generateSign = async (platformInfo: Platform, versionInfo: string | null) => {
        try {
            const identifier = await appAPI.getIdentifier()
            console.log('应用标识符:', identifier)
            // 获取设备ID和MAC地址
            const deviceInfo = await coreAPI.invoke<DeviceIdResponse>('get_device_info')

            // 获取应用版本
            const appVer = await appAPI.getVersion()

            // 构建签名数据
            const signData = {
                os_name: platformInfo,
                os_version: versionInfo || 'unknown',
                imei: deviceInfo.device_id,
                mac_address: deviceInfo.mac_address,
                app_version: appVer
            }

            // 为了模拟服务器注册，我们本地生成一个sign
            // 实际应用中应该是发送到服务器，服务器返回sign
            const signPayload = JSON.stringify(signData)

            // 使用更安全的方式生成签名
            // 在实际应用中，这里可以调用后端API进行注册
            // 使用crypto-js生成SHA-256哈希作为签名
            const timestamp = Date.now().toString()
            const signString = `${deviceInfo.device_id}:${timestamp}:${signPayload}`
            const sign = CryptoJS.SHA256(signString).toString(CryptoJS.enc.Hex)

            console.log('设备注册信息:', signData)
            console.log('生成的sign:', sign)

            return {
                deviceId: deviceInfo.device_id,
                macAddress: deviceInfo.mac_address,
                sign
            }
        } catch (err) {
            console.error('生成sign失败:', err)
            throw err
        }
    }

    // 获取系统信息
    const fetchSystemInfo = async () => {
        try {
            setIsLoading(true)
            setError('')

            // 使用 osAPI 获取系统信息
            const systemInfo = await osAPI.getSystemInfo()

            // 基本系统信息
            const info: SystemInfo = {
                platform: systemInfo.platform,
                arch: systemInfo.arch,
                version: systemInfo.version,
                hostname: systemInfo.hostname,
                family: systemInfo.family,
                locale: systemInfo.locale
            }

            // 生成设备标识和sign
            try {
                const deviceInfo = await generateSign(systemInfo.platform, systemInfo.version)
                info.deviceId = deviceInfo.deviceId
                info.macAddress = deviceInfo.macAddress
                info.sign = deviceInfo.sign
            } catch (signErr) {
                console.error('获取设备标识失败:', signErr)
                // 继续显示基本系统信息，不中断流程
            }

            setSystemInfo(info)
        } catch (err) {
            setError(`获取系统信息失败: ${err}`)
            console.error('获取系统信息失败:', err)
        } finally {
            setIsLoading(false)
        }
    }

    // 组件挂载时自动获取系统信息
    useEffect(() => {
        fetchSystemInfo()
    }, [])

    // 格式化显示数据
    const formatInfo = (key: string) => {
        const labels: Record<string, string> = {
            platform: '操作系统',
            arch: '架构',
            version: '版本',
            hostname: '主机名',
            family: '系统家族',
            locale: '语言环境',
            deviceId: '设备ID',
            macAddress: 'MAC地址',
            sign: '设备签名'
        }
        return labels[key] || key
    }

    return (
        <div
            style={{
                border: '1px solid #e0e0e0',
                borderRadius: '6px',
                padding: '12px',
                backgroundColor: '#fafafa',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}
        >
            {/* 模块标题 */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '8px'
                }}
            >
                <h3 style={{ margin: '0', fontSize: '14px', fontWeight: '600', color: '#333' }}>🖥️ 系统信息</h3>
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '12px',
                        color: '#666',
                        cursor: 'pointer',
                        padding: '2px 6px',
                        borderRadius: '3px'
                    }}
                >
                    {isExpanded ? '▼' : '▶'}
                </button>
            </div>

            {/* 基本信息显示 */}
            <div style={{ marginBottom: '8px' }}>
                {systemInfo ? (
                    <div style={{ fontSize: '12px', color: '#666' }}>
                        <span style={{ color: '#4CAF50', fontWeight: '500' }}>
                            {systemInfo.platform} {systemInfo.version || '未知版本'}
                        </span>
                        <span style={{ margin: '0 8px', color: '#ddd' }}>|</span>
                        <span>{systemInfo.arch}</span>
                    </div>
                ) : (
                    <div style={{ fontSize: '12px', color: '#999' }}>
                        {isLoading ? '正在获取系统信息...' : '未获取到系统信息'}
                    </div>
                )}
            </div>

            {/* 操作按钮 */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <button
                    onClick={fetchSystemInfo}
                    disabled={isLoading}
                    style={{
                        padding: '4px 8px',
                        fontSize: '11px',
                        border: '1px solid #ddd',
                        borderRadius: '3px',
                        backgroundColor: isLoading ? '#f5f5f5' : '#fff',
                        color: isLoading ? '#999' : '#333',
                        cursor: isLoading ? 'not-allowed' : 'pointer'
                    }}
                >
                    {isLoading ? '🔄 获取中...' : '🔄 刷新信息'}
                </button>
            </div>

            {/* 错误信息 */}
            {error && (
                <div
                    style={{
                        marginTop: '8px',
                        padding: '6px',
                        backgroundColor: '#ffebee',
                        border: '1px solid #ffcdd2',
                        borderRadius: '3px',
                        fontSize: '11px',
                        color: '#d32f2f'
                    }}
                >
                    {error}
                </div>
            )}

            {/* 详细信息展开区域 */}
            {isExpanded && systemInfo && (
                <div
                    style={{
                        marginTop: '12px',
                        padding: '8px',
                        backgroundColor: '#f9f9f9',
                        border: '1px solid #e0e0e0',
                        borderRadius: '4px'
                    }}
                >
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: '600', color: '#333' }}>
                        详细系统信息
                    </h4>
                    <div style={{ display: 'grid', gap: '4px' }}>
                        {Object.entries(systemInfo).map(([key, value]) => (
                            <div key={key} style={{ display: 'flex', fontSize: '11px' }}>
                                <span style={{ minWidth: '70px', color: '#666', fontWeight: '500' }}>
                                    {formatInfo(key)}:
                                </span>
                                <span style={{ color: '#333', marginLeft: '8px', wordBreak: 'break-all' }}>
                                    {String(value) || '未知'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
