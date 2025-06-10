import React, { useState } from 'react'
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

    // 日志上传状态
    const [uploadDate, setUploadDate] = useState<string>('2025-06-10')
    const [uploadUrl, setUploadUrl] = useState<string>('https://api.example.com/logs/upload')
    const [isUploading, setIsUploading] = useState<boolean>(false)
    const [uploadProgress, setUploadProgress] = useState<number>(0)

    React.useEffect(() => {
        // 初始化日志目录（异步等待初始化完成）
        const initLogDirectory = async () => {
            // 等待一下确保LogManager初始化完成
            setTimeout(() => {
                const logDir = getLogDirectory()
                setLogDirectory(logDir)
                console.log('日志目录已设置:', logDir)
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
                padding: '12px',
                backgroundColor: '#f0fff4',
                borderRadius: '6px',
                border: '1px solid #68d391',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                gridColumn: 'span 2' // 占用两列宽度
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '16px', marginRight: '6px' }}>📝</span>
                <h3 style={{ margin: '0', fontSize: '14px', fontWeight: '600', color: '#22543d' }}>日志记录</h3>
            </div>

            {/* 应用日志 */}
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
                    应用日志:
                </label>

                {/* 日志级别选择器 */}
                <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                    <select
                        value={appLogLevel}
                        onChange={e => setAppLogLevel(e.target.value as LogLevel)}
                        disabled={isWritingLog}
                        style={{
                            padding: '4px 6px',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            fontSize: '11px',
                            backgroundColor: isWritingLog ? '#f9fafb' : 'white',
                            color: 'black',
                            minWidth: '80px'
                        }}
                    >
                        <option value={LogLevel.TRACE}>TRACE</option>
                        <option value={LogLevel.DEBUG}>DEBUG</option>
                        <option value={LogLevel.INFO}>INFO</option>
                        <option value={LogLevel.WARN}>WARN</option>
                        <option value={LogLevel.ERROR}>ERROR</option>
                    </select>
                    <span
                        style={{
                            fontSize: '10px',
                            color: '#6b7280',
                            alignSelf: 'center',
                            flex: 1
                        }}
                    >
                        选择日志级别
                    </span>
                </div>

                <input
                    value={appLogMessage}
                    onChange={e => setAppLogMessage(e.target.value)}
                    placeholder="输入应用日志消息... (支持JSON对象)"
                    disabled={isWritingLog}
                    style={{
                        width: '100%',
                        padding: '6px 8px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '12px',
                        boxSizing: 'border-box',
                        backgroundColor: isWritingLog ? '#f9fafb' : 'white',
                        marginBottom: '6px',
                        color: 'black'
                    }}
                />
                <button
                    onClick={writeApplicationLog}
                    disabled={isWritingLog || !appLogMessage.trim()}
                    style={{
                        backgroundColor: !appLogMessage.trim() || isWritingLog ? '#9ca3af' : '#10b981',
                        color: 'white',
                        padding: '4px 12px',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: !appLogMessage.trim() || isWritingLog ? 'not-allowed' : 'pointer',
                        fontSize: '11px',
                        fontWeight: '500',
                        width: '100%'
                    }}
                >
                    {isWritingLog ? '写入中...' : `写入应用日志 [${appLogLevel}]`}
                </button>
            </div>

            {/* HTTP日志 */}
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
                    HTTP日志:
                </label>

                {/* 日志级别选择器 */}
                <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                    <select
                        value={httpLogLevel}
                        onChange={e => setHttpLogLevel(e.target.value as LogLevel)}
                        disabled={isWritingLog}
                        style={{
                            padding: '4px 6px',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            fontSize: '11px',
                            backgroundColor: isWritingLog ? '#f9fafb' : 'white',
                            color: 'black',
                            minWidth: '80px'
                        }}
                    >
                        <option value={LogLevel.TRACE}>TRACE</option>
                        <option value={LogLevel.DEBUG}>DEBUG</option>
                        <option value={LogLevel.INFO}>INFO</option>
                        <option value={LogLevel.WARN}>WARN</option>
                        <option value={LogLevel.ERROR}>ERROR</option>
                    </select>
                    <span
                        style={{
                            fontSize: '10px',
                            color: '#6b7280',
                            alignSelf: 'center',
                            flex: 1
                        }}
                    >
                        会自动生成结构化日志
                    </span>
                </div>

                <input
                    value={httpLogMessage}
                    onChange={e => setHttpLogMessage(e.target.value)}
                    placeholder="输入HTTP日志消息... (会自动包装为对象)"
                    disabled={isWritingLog}
                    style={{
                        width: '100%',
                        padding: '6px 8px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '12px',
                        boxSizing: 'border-box',
                        backgroundColor: isWritingLog ? '#f9fafb' : 'white',
                        marginBottom: '6px',
                        color: 'black'
                    }}
                />
                <button
                    onClick={writeHttpApplicationLog}
                    disabled={isWritingLog || !httpLogMessage.trim()}
                    style={{
                        backgroundColor: !httpLogMessage.trim() || isWritingLog ? '#9ca3af' : '#3b82f6',
                        color: 'white',
                        padding: '4px 12px',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: !httpLogMessage.trim() || isWritingLog ? 'not-allowed' : 'pointer',
                        fontSize: '11px',
                        fontWeight: '500',
                        width: '100%'
                    }}
                >
                    {isWritingLog ? '写入中...' : `写入HTTP日志 [${httpLogLevel}]`}
                </button>
            </div>

            {/* 日志目录信息 */}
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
                    日志目录:
                </label>
                <div
                    style={{
                        backgroundColor: '#f3f4f6',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        padding: '6px 8px',
                        fontSize: '10px',
                        fontFamily: 'monospace',
                        color: '#374151',
                        wordBreak: 'break-all',
                        marginBottom: '6px'
                    }}
                >
                    {logDirectory || '获取中...'}
                </div>
                <button
                    onClick={openLogDirectory}
                    style={{
                        backgroundColor: '#6b7280',
                        color: 'white',
                        padding: '4px 12px',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: '500',
                        width: '100%',
                        marginBottom: '6px'
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
                        padding: '4px 12px',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: isWritingLog ? 'not-allowed' : 'pointer',
                        fontSize: '11px',
                        fontWeight: '500',
                        width: '100%',
                        marginBottom: '6px'
                    }}
                >
                    {isWritingLog ? '测试中...' : '🧪 测试日志系统'}
                </button>

                <button
                    onClick={cleanupOldLogFiles}
                    disabled={isWritingLog || isUploading}
                    style={{
                        backgroundColor: isWritingLog || isUploading ? '#9ca3af' : '#dc2626',
                        color: 'white',
                        padding: '4px 12px',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: isWritingLog || isUploading ? 'not-allowed' : 'pointer',
                        fontSize: '11px',
                        fontWeight: '500',
                        width: '100%',
                        marginBottom: '6px'
                    }}
                >
                    {isWritingLog ? '清理中...' : '🗑️ 清理30天前日志'}
                </button>
            </div>

            {/* 日志上传模块 */}
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
                    上传日志:
                </label>

                <input
                    type="date"
                    value={uploadDate}
                    onChange={e => setUploadDate(e.target.value)}
                    disabled={isWritingLog || isUploading}
                    style={{
                        width: '100%',
                        padding: '4px 8px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '11px',
                        backgroundColor: isWritingLog || isUploading ? '#f9fafb' : 'white',
                        marginBottom: '4px',
                        color: 'black'
                    }}
                />

                <input
                    type="url"
                    value={uploadUrl}
                    onChange={e => setUploadUrl(e.target.value)}
                    placeholder="输入上传API地址..."
                    disabled={isWritingLog || isUploading}
                    style={{
                        width: '100%',
                        padding: '4px 8px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '11px',
                        backgroundColor: isWritingLog || isUploading ? '#f9fafb' : 'white',
                        marginBottom: '4px',
                        color: 'black'
                    }}
                />

                {isUploading && (
                    <div style={{ marginBottom: '4px' }}>
                        <div
                            style={{
                                backgroundColor: '#e5e7eb',
                                borderRadius: '2px',
                                height: '4px',
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
                        <div style={{ fontSize: '10px', color: '#6b7280', textAlign: 'center' }}>
                            上传进度: {uploadProgress}%
                        </div>
                    </div>
                )}

                <button
                    onClick={uploadLogFiles}
                    disabled={isWritingLog || isUploading || !uploadDate.trim() || !uploadUrl.trim()}
                    style={{
                        backgroundColor:
                            isWritingLog || isUploading || !uploadDate.trim() || !uploadUrl.trim()
                                ? '#9ca3af'
                                : '#2563eb',
                        color: 'white',
                        padding: '4px 12px',
                        border: 'none',
                        borderRadius: '4px',
                        cursor:
                            isWritingLog || isUploading || !uploadDate.trim() || !uploadUrl.trim()
                                ? 'not-allowed'
                                : 'pointer',
                        fontSize: '11px',
                        fontWeight: '500',
                        width: '100%',
                        marginBottom: '4px'
                    }}
                >
                    {isUploading ? `上传中... ${uploadProgress}%` : '📤 上传指定日期日志'}
                </button>
            </div>

            <div style={{ fontSize: '10px', color: '#6b7280', lineHeight: '1.3' }}>
                💡
                支持TRACE/DEBUG/INFO/WARN/ERROR五个日志级别，自动按日期和类型分类日志文件，单个文件最大10MB，超过自动分割。支持对象序列化和结构化日志格式：[TIMESTAMP][TARGET][LEVEL]
                MESSAGE。提供自动清理功能，可删除30天前的旧日志文件。支持按日期上传日志到指定API接口。
            </div>
        </div>
    )
}
