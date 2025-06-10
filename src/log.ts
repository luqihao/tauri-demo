import { writeTextFile, exists, readTextFile, readDir, remove } from '@tauri-apps/plugin-fs'
import { join, appDataDir } from '@tauri-apps/api/path'
import { mkdir } from '@tauri-apps/plugin-fs'

export enum LogLevel {
    TRACE = 'TRACE',
    DEBUG = 'DEBUG',
    INFO = 'INFO',
    WARN = 'WARN',
    ERROR = 'ERROR'
}

interface LogConfig {
    maxFileSize: number // 最大文件大小（字节）
    logDir: string
}

// 全局配置管理器
class GlobalLogConfig {
    private static instance: GlobalLogConfig
    private config: LogConfig = {
        maxFileSize: 10 * 1024 * 1024, // 10MB
        logDir: ''
    }
    private initialized = false

    private constructor() {
        this.initLogDir()
    }

    static getInstance(): GlobalLogConfig {
        if (!GlobalLogConfig.instance) {
            GlobalLogConfig.instance = new GlobalLogConfig()
        }
        return GlobalLogConfig.instance
    }

    private async initLogDir() {
        if (this.initialized) return

        try {
            // 获取应用数据目录，例如：/Users/cnsusu/Library/Application Support/com.demo.app
            const appDir = await appDataDir()

            // 构建日志目录路径：/Users/cnsusu/Library/Application Support/com.demo.app/logs
            const customLogDir = await join(appDir, 'logs')

            // 检查目录是否存在，不存在则创建
            if (!(await exists(customLogDir))) {
                await this.createDirectoryRecursive(customLogDir)
                console.log('创建日志目录:', customLogDir)
            }

            this.config.logDir = customLogDir
            this.initialized = true
        } catch (error) {
            console.error('初始化日志目录失败:', error)
            // 使用当前目录作为备选
            this.config.logDir = './logs'
            this.initialized = true
        }
    }

    /**
     * 递归创建目录
     */
    private async createDirectoryRecursive(dirPath: string): Promise<void> {
        try {
            await mkdir(dirPath, { recursive: true })
        } catch (error) {
            console.error('创建目录失败:', error)
            throw error
        }
    }

    async getConfig(): Promise<LogConfig> {
        if (!this.initialized) {
            await this.initLogDir()
        }
        return { ...this.config }
    }

    getLogDirectory(): string {
        return this.config.logDir
    }
}

export class LogManager {
    private logType: string
    private globalConfig: GlobalLogConfig

    constructor(logType: string) {
        this.logType = logType
        this.globalConfig = GlobalLogConfig.getInstance()
    }

    /**
     * 格式化日期为 YYYY-MM-DD 格式
     */
    private formatDate(date: Date): string {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
    }

    /**
     * 格式化时间戳
     */
    private formatTimestamp(date: Date): string {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const hours = String(date.getHours()).padStart(2, '0')
        const minutes = String(date.getMinutes()).padStart(2, '0')
        const seconds = String(date.getSeconds()).padStart(2, '0')
        const ms = String(date.getMilliseconds()).padStart(3, '0')

        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${ms}`
    }

    /**
     * 获取日志文件路径
     */
    private async getLogFilePath(date: Date): Promise<string> {
        const config = await this.globalConfig.getConfig()
        const dateStr = this.formatDate(date)
        const filename = `${dateStr}.${this.logType}.log`
        return await join(config.logDir, filename)
    }

    /**
     * 获取可用的日志文件路径（考虑文件大小限制）
     */
    private async getAvailableLogFilePath(date: Date): Promise<string> {
        const config = await this.globalConfig.getConfig()
        let baseFilePath = await this.getLogFilePath(date)

        // 检查基础文件是否存在且是否超过大小限制
        try {
            if (await exists(baseFilePath)) {
                const content = await readTextFile(baseFilePath)
                const sizeInBytes = new TextEncoder().encode(content).length

                if (sizeInBytes < config.maxFileSize) {
                    return baseFilePath
                }
            } else {
                return baseFilePath
            }
        } catch (error) {
            // 文件不存在或读取失败，返回基础路径
            return baseFilePath
        }

        // 如果基础文件超过大小限制，寻找下一个可用的编号文件
        let counter = 1
        while (true) {
            const numberedFilePath = `${baseFilePath}.${counter}`

            try {
                if (await exists(numberedFilePath)) {
                    const content = await readTextFile(numberedFilePath)
                    const sizeInBytes = new TextEncoder().encode(content).length

                    if (sizeInBytes < config.maxFileSize) {
                        return numberedFilePath
                    }
                } else {
                    return numberedFilePath
                }
            } catch (error) {
                // 文件不存在，返回这个路径
                return numberedFilePath
            }

            counter++

            // 防止无限循环，最多尝试1000个文件
            if (counter > 1000) {
                throw new Error('无法找到可用的日志文件路径')
            }
        }
    }

    /**
     * 序列化对象为字符串
     */
    private serializeValue(value: any): string {
        if (typeof value === 'string') {
            return value
        }

        if (value === null || value === undefined) {
            return String(value)
        }

        if (typeof value === 'object') {
            try {
                return JSON.stringify(value, null, 2)
            } catch (error) {
                return `[Object: ${Object.prototype.toString.call(value)}]`
            }
        }

        return String(value)
    }

    /**
     * 格式化日志条目 - 模仿官方插件格式
     * 格式: [TIMESTAMP][TARGET][LEVEL] MESSAGE
     */
    private formatLogEntry(level: LogLevel, target: string, message: any): string {
        const timestamp = this.formatTimestamp(new Date())
        const serializedMessage = this.serializeValue(message)

        return `[${timestamp}][${target}][${level}] ${serializedMessage}`
    }

    /**
     * 写入带级别的日志
     */
    async writeLog(level: LogLevel, message: any, target?: string): Promise<void> {
        try {
            const now = new Date()
            const logTarget = target || this.logType.toUpperCase()
            const logEntry = this.formatLogEntry(level, logTarget, message) + '\n'

            const filePath = await this.getAvailableLogFilePath(now)

            try {
                // 尝试追加到现有文件
                const existingContent = (await exists(filePath)) ? await readTextFile(filePath) : ''
                await writeTextFile(filePath, existingContent + logEntry)
            } catch (error) {
                // 如果追加失败，尝试创建新文件
                await writeTextFile(filePath, logEntry)
            }

            console.log(`${level} 日志已写入 [${this.logType}]: ${filePath}`)
        } catch (error) {
            console.error('写入日志失败:', error)
            throw error
        }
    }

    // 标准日志级别方法
    async trace(message: any, target?: string): Promise<void> {
        return this.writeLog(LogLevel.TRACE, message, target)
    }

    async debug(message: any, target?: string): Promise<void> {
        return this.writeLog(LogLevel.DEBUG, message, target)
    }

    async info(message: any, target?: string): Promise<void> {
        return this.writeLog(LogLevel.INFO, message, target)
    }

    async warn(message: any, target?: string): Promise<void> {
        return this.writeLog(LogLevel.WARN, message, target)
    }

    async error(message: any, target?: string): Promise<void> {
        return this.writeLog(LogLevel.ERROR, message, target)
    }

    // 通用log方法，可以指定级别
    async log(message: any, level: LogLevel = LogLevel.INFO, target?: string): Promise<void> {
        return this.writeLog(level, message, target)
    }

    /**
     * 获取日志目录路径
     */
    getLogDirectory(): string {
        return this.globalConfig.getLogDirectory()
    }

    /**
     * 获取今日日志文件列表
     */
    async getTodayLogFiles(): Promise<string[]> {
        const today = new Date()
        const dateStr = this.formatDate(today)
        const baseFilename = `${dateStr}.${this.logType}.log`

        const config = await this.globalConfig.getConfig()
        const files: string[] = []
        const basePath = await join(config.logDir, baseFilename)

        // 检查基础文件
        if (await exists(basePath)) {
            files.push(basePath)
        }

        // 检查编号文件
        let counter = 1
        while (counter <= 100) {
            // 最多检查100个文件
            const numberedPath = `${basePath}.${counter}`
            if (await exists(numberedPath)) {
                files.push(numberedPath)
                counter++
            } else {
                break
            }
        }

        return files
    }

    /**
     * 读取日志文件内容
     */
    async readLogFile(filePath: string): Promise<string> {
        try {
            return await readTextFile(filePath)
        } catch (error) {
            console.error('读取日志文件失败:', error)
            throw error
        }
    }
}

// 创建预定义的日志管理器实例
export const appLogger = new LogManager('app')
export const httpLogger = new LogManager('http')

// 导出全局配置管理器，用于获取日志目录等全局信息
export const getLogDirectory = () => GlobalLogConfig.getInstance().getLogDirectory()

// 全局日志清理功能
export const cleanupAllOldLogs = async (
    daysToKeep: number = 30
): Promise<{ deletedFiles: string[]; errorFiles: string[] }> => {
    const deletedFiles: string[] = []
    const errorFiles: string[] = []

    try {
        const globalConfig = GlobalLogConfig.getInstance()
        const config = await globalConfig.getConfig()
        const logDir = config.logDir

        // 确保日志目录存在
        if (!(await exists(logDir))) {
            console.log('日志目录不存在，无需清理')
            return { deletedFiles, errorFiles }
        }

        // 读取日志目录中的所有文件
        const dirEntries = await readDir(logDir)

        // 计算截止日期
        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

        console.log(`开始清理所有 ${daysToKeep} 天前的日志文件，截止日期: ${cutoffDate.toISOString().split('T')[0]}`)

        for (const entry of dirEntries) {
            if (!entry.isFile) continue

            const fileName = entry.name
            const fullPath = await join(logDir, fileName)

            try {
                // 检查是否是日志文件（匹配格式：YYYY-MM-DD.*.log 或 YYYY-MM-DD.*.log.数字）
                const logFilePattern = /^(\d{4}-\d{2}-\d{2})\..*\.log(\.\d+)?$/
                const match = fileName.match(logFilePattern)

                if (match) {
                    const fileDateStr = match[1] // 提取日期部分，如 "2024-05-11"
                    const fileDate = new Date(fileDateStr)

                    // 如果文件日期早于截止日期，则删除
                    if (fileDate < cutoffDate) {
                        await remove(fullPath)
                        deletedFiles.push(fullPath)
                        console.log(`已删除旧日志文件: ${fileName} (${fileDateStr})`)
                    }
                }
            } catch (error) {
                console.error(`删除文件失败: ${fileName}`, error)
                errorFiles.push(fullPath)
            }
        }

        console.log(`全局日志清理完成。删除了 ${deletedFiles.length} 个文件，${errorFiles.length} 个文件删除失败`)
    } catch (error) {
        console.error('清理旧日志文件时出错:', error)
        throw error
    }

    return { deletedFiles, errorFiles }
}

// 全局日志上传功能 - 使用文件副本避免并发问题
export const uploadAllLogsByDate = async (
    dateStr: string,
    uploadUrl: string,
    options?: {
        timeout?: number
        headers?: Record<string, string>
        onProgress?: (progress: number, current: number, total: number) => void
    }
): Promise<{
    success: boolean
    uploadedFiles: string[]
    failedFiles: { file: string; error: string }[]
    totalSize: number
}> => {
    try {
        const globalConfig = GlobalLogConfig.getInstance()
        const config = await globalConfig.getConfig()
        const logDir = config.logDir

        // 确保日志目录存在
        if (!(await exists(logDir))) {
            console.log('日志目录不存在')
            return { success: true, uploadedFiles: [], failedFiles: [], totalSize: 0 }
        }

        // 验证日期格式
        const datePattern = /^\d{4}-\d{2}-\d{2}$/
        if (!datePattern.test(dateStr)) {
            throw new Error('日期格式错误，请使用 YYYY-MM-DD 格式，如 2025-05-05')
        }

        console.log(`开始上传 ${dateStr} 的所有日志文件...`)

        // 读取日志目录中的所有文件
        const dirEntries = await readDir(logDir)
        const logFiles: string[] = []

        for (const entry of dirEntries) {
            if (!entry.isFile) continue

            const fileName = entry.name

            // 检查是否是指定日期的日志文件
            const logFilePattern = new RegExp(`^${dateStr}\\..*\\.log(\\.\\d+)?$`)

            if (logFilePattern.test(fileName)) {
                const fullPath = await join(logDir, fileName)
                logFiles.push(fullPath)
            }
        }

        if (logFiles.length === 0) {
            console.log(`未找到 ${dateStr} 的日志文件`)
            return { success: true, uploadedFiles: [], failedFiles: [], totalSize: 0 }
        }

        // 按文件名排序
        logFiles.sort()

        // 创建临时副本目录
        const tempDir = await join(logDir, `temp_upload_${Date.now()}`)
        await mkdir(tempDir, { recursive: true })

        try {
            // 复制文件到临时目录
            const copiedFiles: string[] = []
            for (const filePath of logFiles) {
                try {
                    const fileName = filePath.split('/').pop() || ''
                    const tempFilePath = await join(tempDir, fileName)

                    // 读取原文件内容并写入临时文件
                    const content = await readTextFile(filePath)
                    await writeTextFile(tempFilePath, content)

                    copiedFiles.push(tempFilePath)
                    console.log(`已创建文件副本: ${fileName}`)
                } catch (error) {
                    console.error(`创建文件副本失败: ${filePath}`, error)
                }
            }

            // 读取所有副本文件内容
            const uploadedFiles: string[] = []
            const failedFiles: { file: string; error: string }[] = []
            const logContents: { fileName: string; content: string; size: number; logType: string }[] = []
            let totalSize = 0

            for (const tempFilePath of copiedFiles) {
                try {
                    const content = await readTextFile(tempFilePath)
                    const size = new TextEncoder().encode(content).length
                    const fileName = tempFilePath.split('/').pop() || ''

                    // 从文件名提取日志类型
                    const logTypeMatch = fileName.match(/^\d{4}-\d{2}-\d{2}\.(.+)\.log/)
                    const logType = logTypeMatch ? logTypeMatch[1] : 'unknown'

                    logContents.push({ fileName, content, size, logType })
                    totalSize += size
                } catch (error) {
                    console.error(`读取副本文件失败: ${tempFilePath}`, error)
                    failedFiles.push({
                        file: tempFilePath.split('/').pop() || '',
                        error: `读取失败: ${error}`
                    })
                }
            }

            if (logContents.length === 0) {
                throw new Error('没有可上传的日志内容')
            }

            // 创建上传数据包
            const uploadData = {
                date: dateStr,
                timestamp: new Date().toISOString(),
                totalFiles: logContents.length,
                totalSize,
                isPartialUpload: failedFiles.length > 0,
                logs: logContents
            }

            // 执行上传
            const timeout = options?.timeout || 30000
            const headers = {
                'Content-Type': 'application/json',
                ...options?.headers
            }

            try {
                // 模拟上传进度
                if (options?.onProgress) {
                    options.onProgress(0, 0, 1)
                    setTimeout(() => options.onProgress?.(50, 0, 1), 100)
                    setTimeout(() => options.onProgress?.(100, 1, 1), 200)
                }

                const response = await fetch(uploadUrl, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(uploadData),
                    signal: AbortSignal.timeout(timeout)
                })

                if (!response.ok) {
                    throw new Error(`上传请求失败: ${response.status} ${response.statusText}`)
                }

                const result = await response.json()
                console.log('上传响应:', result)

                // 记录成功上传的文件
                uploadedFiles.push(...logContents.map(log => log.fileName))

                console.log(
                    `成功上传 ${dateStr} 的所有日志文件，共 ${uploadedFiles.length} 个文件，总大小: ${formatBytes(
                        totalSize
                    )}`
                )

                return {
                    success: true,
                    uploadedFiles,
                    failedFiles,
                    totalSize
                }
            } catch (error) {
                if (error instanceof Error && error.name === 'AbortError') {
                    throw new Error(`上传超时 (${timeout}ms)`)
                }
                throw error
            }
        } finally {
            // 清理临时目录
            try {
                const tempEntries = await readDir(tempDir)
                for (const entry of tempEntries) {
                    if (entry.isFile) {
                        const tempFilePath = await join(tempDir, entry.name)
                        await remove(tempFilePath)
                    }
                }
                await remove(tempDir)
                console.log('已清理临时文件')
            } catch (error) {
                console.warn('清理临时文件失败:', error)
            }
        }
    } catch (error) {
        console.error(`上传 ${dateStr} 的日志文件失败:`, error)

        return {
            success: false,
            uploadedFiles: [],
            failedFiles: [{ file: 'all', error: `上传失败: ${error}` }],
            totalSize: 0
        }
    }
}

// 格式化字节数的辅助函数
const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
