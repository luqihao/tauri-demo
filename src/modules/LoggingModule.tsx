import React, { useState, useEffect } from 'react'
import { LogLevel, getLogDirectory, appLogger, httpLogger, cleanupAllOldLogs, uploadAllLogsByDate } from '../log'

interface LoggingModuleProps {
    // 无需接收外部状态和回调，组件自己管理所有状态
}

export const LoggingModule: React.FC<LoggingModuleProps> = () => {
    // 日志记录状态
    const [appLogMessage, setAppLogMessage] = useState<string>('这是一条应用日志消息')
    const [httpLogMessage, setHttpLogMessage] = useState<string>('GET /api/users - 200 OK - 150ms')
    const [logDirectory, setLogDirectory] = useState<string>('')
    const [isWritingLog, setIsWritingLog] = useState<boolean>(false)
    const [appLogLevel, setAppLogLevel] = useState<LogLevel>(LogLevel.INFO)
    const [httpLogLevel, setHttpLogLevel] = useState<LogLevel>(LogLevel.INFO)

    // UI状态
    const [activeTab, setActiveTab] = useState<'app' | 'http' | 'manage'>('app')
    const [isExpanded, setIsExpanded] = useState<boolean>(false)

    // 日志上传状态
    const [uploadDate, setUploadDate] = useState<string>('2025-06-10')
    const [uploadUrl, setUploadUrl] = useState<string>('https://api.example.com/logs/upload')
    const [isUploading, setIsUploading] = useState<boolean>(false)
    const [uploadProgress, setUploadProgress] = useState<number>(0)

    useEffect(() => {
        // 初始化日志目录
        const initLogDirectory = async () => {
            setTimeout(() => {
                const logDir = getLogDirectory()
                setLogDirectory(logDir)
            }, 500)
        }
        initLogDirectory()
    }, [])

    // 日志记录相关函数
    async function writeApplicationLog() {
        if (!appLogMessage.trim()) {
            alert('请输入日志消息')
            return
        }

        try {
            setIsWritingLog(true)

            // 尝试解析为JSON对象以展示对象序列化功能
            let messageToLog: any = appLogMessage
            try {
                // 如果消息看起来像JSON，则解析为对象
                if (appLogMessage.trim().startsWith('{') || appLogMessage.trim().startsWith('[')) {
                    messageToLog = JSON.parse(appLogMessage)
                }
            } catch {
                // 如果解析失败，使用原始字符串
                messageToLog = appLogMessage
            }

            await appLogger.log(messageToLog, appLogLevel, 'MyApp')
            console.log('应用日志已写入:', messageToLog, '级别:', appLogLevel)
            // 重置为默认消息
            setAppLogMessage('这是一条应用日志消息')
        } catch (error) {
            console.error('写入应用日志失败:', error)
            alert('写入应用日志失败: ' + error)
        } finally {
            setIsWritingLog(false)
        }
    }

    async function writeHttpApplicationLog() {
        if (!httpLogMessage.trim()) {
            alert('请输入HTTP日志消息')
            return
        }

        try {
            setIsWritingLog(true)

            // 创建结构化的HTTP日志对象
            const httpLogData = {
                request: httpLogMessage,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                url: window.location.href
            }

            await httpLogger.log(httpLogData, httpLogLevel, 'HTTP_CLIENT')
            console.log('HTTP日志已写入:', httpLogData, '级别:', httpLogLevel)

            // 重置为默认消息
            setHttpLogMessage('GET /api/users - 200 OK - 150ms')
        } catch (error) {
            console.error('写入HTTP日志失败:', error)
            alert('写入HTTP日志失败: ' + error)
        } finally {
            setIsWritingLog(false)
        }
    }

    // 测试日志系统功能
    async function testLogSystem() {
        try {
            setIsWritingLog(true)
            console.log('开始测试日志系统...')

            // 获取并显示日志目录
            const logDir = getLogDirectory()
            console.log('当前日志目录:', logDir)

            // 测试不同级别的应用日志
            await appLogger.info('应用日志测试 - INFO 级别')
            await appLogger.warn('应用日志测试 - WARN 级别', 'TEST_MODULE')
            await appLogger.error('应用日志测试 - ERROR 级别', 'TEST_MODULE')
            await appLogger.debug('应用日志测试 - DEBUG 级别', 'TEST_MODULE')

            // 测试HTTP日志
            await httpLogger.info('HTTP日志测试 - GET /api/test', 'HTTP_CLIENT')
            await httpLogger.error('HTTP日志测试 - 请求失败', 'HTTP_CLIENT')

            // 测试复杂对象日志
            const testObject = {
                action: '测试日志系统',
                timestamp: new Date().toISOString(),
                data: {
                    user: 'test_user',
                    operation: 'log_test',
                    details: ['测试1', '测试2', '测试3']
                }
            }
            await appLogger.info(testObject, 'COMPLEX_LOG_TEST')

            console.log('日志系统测试完成！请检查日志目录:', logDir)
            alert('日志系统测试完成！\n请检查控制台查看日志目录信息。')
        } catch (error) {
            console.error('日志系统测试失败:', error)
            alert('日志系统测试失败: ' + error)
        } finally {
            setIsWritingLog(false)
        }
    }

    // 清理旧日志文件
    async function cleanupOldLogFiles() {
        try {
            setIsWritingLog(true)
            console.log('开始清理30天前的日志文件...')

            const result = await cleanupAllOldLogs(30)

            const message = `日志清理完成！\n删除了 ${result.deletedFiles.length} 个文件\n${result.errorFiles.length} 个文件删除失败`

            if (result.deletedFiles.length > 0) {
                console.log('已删除的文件:', result.deletedFiles)
            }

            if (result.errorFiles.length > 0) {
                console.log('删除失败的文件:', result.errorFiles)
            }

            alert(message)
        } catch (error) {
            console.error('清理日志失败:', error)
            alert('清理日志失败: ' + error)
        } finally {
            setIsWritingLog(false)
        }
    }

    // 上传指定日期的日志文件
    async function uploadLogFiles() {
        if (!uploadDate.trim()) {
            alert('请输入上传日期')
            return
        }

        if (!uploadUrl.trim()) {
            alert('请输入上传URL')
            return
        }

        try {
            setIsUploading(true)
            setUploadProgress(0)
            console.log(`开始上传 ${uploadDate} 的日志文件到 ${uploadUrl}...`)

            const result = await uploadAllLogsByDate(uploadDate, uploadUrl, {
                timeout: 60000, // 60秒超时
                headers: {
                    Authorization: 'Bearer your-token' // 可以根据需要添加认证头
                },
                onProgress: progress => {
                    setUploadProgress(progress)
                }
            })

            if (result.success) {
                const message = `日志上传成功！\n上传了 ${result.uploadedFiles.length} 个文件\n总大小: ${formatBytes(
                    result.totalSize
                )}\n${result.failedFiles.length > 0 ? `失败文件: ${result.failedFiles.length} 个` : ''}`

                console.log('上传成功的文件:', result.uploadedFiles)
                if (result.failedFiles.length > 0) {
                    console.log('上传失败的文件:', result.failedFiles)
                }

                alert(message)
            } else {
                throw new Error('上传失败')
            }
        } catch (error) {
            console.error('上传日志失败:', error)
            alert('上传日志失败: ' + error)
        } finally {
            setIsUploading(false)
            setUploadProgress(0)
        }
    }

    async function openLogDirectory() {
        try {
            const logDir = getLogDirectory()
            const { revealItemInDir } = await import('@tauri-apps/plugin-opener')
            await revealItemInDir(logDir)
            console.log('已打开日志目录:', logDir)
        } catch (error) {
            console.error('打开日志目录失败:', error)
            alert('打开日志目录失败: ' + error)
        }
    }

    function formatBytes(bytes: number): string {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    return (
        <div
            style={{
                padding: '8px',
                backgroundColor: '#f0fff4',
                borderRadius: '6px',
                border: '1px solid #68d391',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                width: isExpanded ? '100%' : 'auto',
                transition: 'width 0.3s ease'
            }}
        >
            {/* 标题栏 */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '8px',
                    justifyContent: 'space-between'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', marginRight: '6px' }}>📝</span>
                    <h3 style={{ margin: '0', fontSize: '13px', fontWeight: '600', color: '#22543d' }}>日志</h3>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        style={{
                            backgroundColor: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '2px',
                            fontSize: '12px'
                        }}
                    >
                        {isExpanded ? '⤒' : '⤓'}
                    </button>
                </div>
            </div>

            {/* 标签导航 */}
            <div
                style={{
                    display: 'flex',
                    borderBottom: '1px solid #d1d5db',
                    marginBottom: '8px',
                    gap: '2px'
                }}
            >
                <button
                    onClick={() => setActiveTab('app')}
                    style={{
                        backgroundColor: activeTab === 'app' ? '#10b981' : 'transparent',
                        color: activeTab === 'app' ? 'white' : '#4b5563',
                        border: 'none',
                        padding: '3px 6px',
                        fontSize: '10px',
                        borderRadius: '3px 3px 0 0',
                        cursor: 'pointer',
                        marginBottom: '-1px',
                        flexGrow: 1
                    }}
                >
                    应用日志
                </button>
                <button
                    onClick={() => setActiveTab('http')}
                    style={{
                        backgroundColor: activeTab === 'http' ? '#3b82f6' : 'transparent',
                        color: activeTab === 'http' ? 'white' : '#4b5563',
                        border: 'none',
                        padding: '3px 6px',
                        fontSize: '10px',
                        borderRadius: '3px 3px 0 0',
                        cursor: 'pointer',
                        marginBottom: '-1px',
                        flexGrow: 1
                    }}
                >
                    HTTP日志
                </button>
                <button
                    onClick={() => setActiveTab('manage')}
                    style={{
                        backgroundColor: activeTab === 'manage' ? '#6b7280' : 'transparent',
                        color: activeTab === 'manage' ? 'white' : '#4b5563',
                        border: 'none',
                        padding: '3px 6px',
                        fontSize: '10px',
                        borderRadius: '3px 3px 0 0',
                        cursor: 'pointer',
                        marginBottom: '-1px',
                        flexGrow: 1
                    }}
                >
                    管理
                </button>
            </div>

            {/* 应用日志面板 */}
            {activeTab === 'app' && (
                <div>
                    <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                        <select
                            value={appLogLevel}
                            onChange={e => setAppLogLevel(e.target.value as LogLevel)}
                            disabled={isWritingLog}
                            style={{
                                padding: '3px 4px',
                                border: '1px solid #d1d5db',
                                borderRadius: '3px',
                                fontSize: '10px',
                                backgroundColor: isWritingLog ? '#f9fafb' : 'white',
                                color: 'black',
                                width: '80px'
                            }}
                        >
                            <option value={LogLevel.TRACE}>TRACE</option>
                            <option value={LogLevel.DEBUG}>DEBUG</option>
                            <option value={LogLevel.INFO}>INFO</option>
                            <option value={LogLevel.WARN}>WARN</option>
                            <option value={LogLevel.ERROR}>ERROR</option>
                        </select>
                        <input
                            value={appLogMessage}
                            onChange={e => setAppLogMessage(e.target.value)}
                            placeholder="应用日志消息..."
                            disabled={isWritingLog}
                            style={{
                                flex: 1,
                                padding: '3px 4px',
                                border: '1px solid #d1d5db',
                                borderRadius: '3px',
                                fontSize: '10px',
                                backgroundColor: isWritingLog ? '#f9fafb' : 'white',
                                color: 'black'
                            }}
                        />
                    </div>
                    <button
                        onClick={writeApplicationLog}
                        disabled={isWritingLog || !appLogMessage.trim()}
                        style={{
                            backgroundColor: !appLogMessage.trim() || isWritingLog ? '#9ca3af' : '#10b981',
                            color: 'white',
                            padding: '3px 8px',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: !appLogMessage.trim() || isWritingLog ? 'not-allowed' : 'pointer',
                            fontSize: '10px',
                            fontWeight: '500',
                            width: '100%',
                            marginBottom: '4px'
                        }}
                    >
                        {isWritingLog ? '写入中...' : `写入应用日志 [${appLogLevel}]`}
                    </button>
                </div>
            )}

            {/* HTTP日志面板 */}
            {activeTab === 'http' && (
                <div>
                    <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                        <select
                            value={httpLogLevel}
                            onChange={e => setHttpLogLevel(e.target.value as LogLevel)}
                            disabled={isWritingLog}
                            style={{
                                padding: '3px 4px',
                                border: '1px solid #d1d5db',
                                borderRadius: '3px',
                                fontSize: '10px',
                                backgroundColor: isWritingLog ? '#f9fafb' : 'white',
                                color: 'black',
                                width: '80px'
                            }}
                        >
                            <option value={LogLevel.TRACE}>TRACE</option>
                            <option value={LogLevel.DEBUG}>DEBUG</option>
                            <option value={LogLevel.INFO}>INFO</option>
                            <option value={LogLevel.WARN}>WARN</option>
                            <option value={LogLevel.ERROR}>ERROR</option>
                        </select>
                        <input
                            value={httpLogMessage}
                            onChange={e => setHttpLogMessage(e.target.value)}
                            placeholder="HTTP日志消息..."
                            disabled={isWritingLog}
                            style={{
                                flex: 1,
                                padding: '3px 4px',
                                border: '1px solid #d1d5db',
                                borderRadius: '3px',
                                fontSize: '10px',
                                backgroundColor: isWritingLog ? '#f9fafb' : 'white',
                                color: 'black'
                            }}
                        />
                    </div>
                    <button
                        onClick={writeHttpApplicationLog}
                        disabled={isWritingLog || !httpLogMessage.trim()}
                        style={{
                            backgroundColor: !httpLogMessage.trim() || isWritingLog ? '#9ca3af' : '#3b82f6',
                            color: 'white',
                            padding: '3px 8px',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: !httpLogMessage.trim() || isWritingLog ? 'not-allowed' : 'pointer',
                            fontSize: '10px',
                            fontWeight: '500',
                            width: '100%',
                            marginBottom: '4px'
                        }}
                    >
                        {isWritingLog ? '写入中...' : `写入HTTP日志 [${httpLogLevel}]`}
                    </button>
                </div>
            )}

            {/* 管理面板 */}
            {activeTab === 'manage' && (
                <div>
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '4px',
                            marginBottom: '4px'
                        }}
                    >
                        <button
                            onClick={openLogDirectory}
                            style={{
                                backgroundColor: '#6b7280',
                                color: 'white',
                                padding: '3px 4px',
                                border: 'none',
                                borderRadius: '3px',
                                cursor: 'pointer',
                                fontSize: '10px',
                                fontWeight: '500'
                            }}
                        >
                            📁 打开日志目录
                        </button>
                        <button
                            onClick={testLogSystem}
                            disabled={isWritingLog}
                            style={{
                                backgroundColor: isWritingLog ? '#9ca3af' : '#059669',
                                color: 'white',
                                padding: '3px 4px',
                                border: 'none',
                                borderRadius: '3px',
                                cursor: isWritingLog ? 'not-allowed' : 'pointer',
                                fontSize: '10px',
                                fontWeight: '500'
                            }}
                        >
                            {isWritingLog ? '测试中...' : '🧪 测试'}
                        </button>
                        <button
                            onClick={cleanupOldLogFiles}
                            disabled={isWritingLog || isUploading}
                            style={{
                                backgroundColor: isWritingLog || isUploading ? '#9ca3af' : '#dc2626',
                                color: 'white',
                                padding: '3px 4px',
                                border: 'none',
                                borderRadius: '3px',
                                cursor: isWritingLog || isUploading ? 'not-allowed' : 'pointer',
                                fontSize: '10px',
                                fontWeight: '500'
                            }}
                        >
                            {isWritingLog ? '清理中...' : '🗑️ 清理旧日志'}
                        </button>
                        <button
                            onClick={() => {
                                const elem = document.createElement('div')
                                elem.style.fontSize = '10px'
                                elem.style.padding = '4px'
                                elem.style.backgroundColor = '#f3f4f6'
                                elem.style.border = '1px solid #d1d5db'
                                elem.style.borderRadius = '3px'
                                elem.style.marginTop = '4px'
                                elem.innerText = logDirectory || '获取中...'

                                const container = document.activeElement?.closest('div')
                                if (container) {
                                    const existingPath = container.querySelector('.log-path-popup')
                                    if (existingPath) {
                                        existingPath.remove()
                                    } else {
                                        elem.className = 'log-path-popup'
                                        container.appendChild(elem)
                                    }
                                }
                            }}
                            style={{
                                backgroundColor: '#4b5563',
                                color: 'white',
                                padding: '3px 4px',
                                border: 'none',
                                borderRadius: '3px',
                                cursor: 'pointer',
                                fontSize: '10px',
                                fontWeight: '500'
                            }}
                        >
                            ℹ️ 查看路径
                        </button>
                    </div>

                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '4px',
                            marginBottom: '4px',
                            alignItems: 'center'
                        }}
                    >
                        <input
                            type="date"
                            value={uploadDate}
                            onChange={e => setUploadDate(e.target.value)}
                            disabled={isWritingLog || isUploading}
                            style={{
                                padding: '3px 4px',
                                border: '1px solid #d1d5db',
                                borderRadius: '3px',
                                fontSize: '9px',
                                backgroundColor: isWritingLog || isUploading ? '#f9fafb' : 'white',
                                color: 'black'
                            }}
                        />
                        <button
                            onClick={uploadLogFiles}
                            disabled={isWritingLog || isUploading || !uploadDate.trim() || !uploadUrl.trim()}
                            style={{
                                backgroundColor:
                                    isWritingLog || isUploading || !uploadDate.trim() || !uploadUrl.trim()
                                        ? '#9ca3af'
                                        : '#2563eb',
                                color: 'white',
                                padding: '3px 4px',
                                border: 'none',
                                borderRadius: '3px',
                                cursor:
                                    isWritingLog || isUploading || !uploadDate.trim() || !uploadUrl.trim()
                                        ? 'not-allowed'
                                        : 'pointer',
                                fontSize: '10px',
                                fontWeight: '500'
                            }}
                        >
                            {isUploading ? `上传中... ${uploadProgress}%` : '📤 上传日志'}
                        </button>
                    </div>

                    {isUploading && (
                        <div style={{ marginBottom: '4px' }}>
                            <div
                                style={{
                                    backgroundColor: '#e5e7eb',
                                    borderRadius: '2px',
                                    height: '3px',
                                    overflow: 'hidden'
                                }}
                            >
                                <div
                                    style={{
                                        backgroundColor: '#3b82f6',
                                        height: '100%',
                                        width: `${uploadProgress}%`,
                                        transition: 'width 0.3s ease-in-out'
                                    }}
                                ></div>
                            </div>
                        </div>
                    )}

                    <input
                        type="url"
                        value={uploadUrl}
                        onChange={e => setUploadUrl(e.target.value)}
                        placeholder="日志上传API地址..."
                        disabled={isWritingLog || isUploading}
                        style={{
                            width: '100%',
                            padding: '3px 4px',
                            border: '1px solid #d1d5db',
                            borderRadius: '3px',
                            fontSize: '9px',
                            backgroundColor: isWritingLog || isUploading ? '#f9fafb' : 'white',
                            marginBottom: '4px',
                            color: 'black'
                        }}
                    />
                </div>
            )}

            {/* 信息提示 */}
            {isExpanded && (
                <div style={{ fontSize: '9px', color: '#6b7280', lineHeight: '1.2', marginTop: '4px' }}>
                    💡 支持5个日志级别，日志自动分类存储，支持对象序列化。可清理旧日志，上传日志到API。
                </div>
            )}
        </div>
    )
}
