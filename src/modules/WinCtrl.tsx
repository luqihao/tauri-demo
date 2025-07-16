import { useState, useEffect } from 'react'
import { windowAPI, osAPI } from '../jsBridge'

/**
 * Windows 系统标题栏控制组件
 *
 * 这个组件提供了 Windows 系统下的窗口控制按钮（最小化、最大化、关闭）
 * 它会自动检测当前运行的窗口，并根据窗口类型智能选择关闭行为
 *
 * 智能关闭特性：
 * - 主窗口 (label === 'main')：使用 hide() 隐藏到系统托盘
 * - 子窗口/其他窗口：使用 close() 直接关闭
 * - 动态提示文本：根据窗口类型显示不同的操作提示
 * - 错误处理和用户反馈
 *
 * 其他特性：
 * - 自动检测当前窗口实例
 * - 仅在 Windows 平台显示
 * - 提供最小化、最大化、智能关闭功能
 */

const WinCtrl: React.FC = () => {
    const [isWindows, setIsWindows] = useState(false)
    const [isMainWindow, setIsMainWindow] = useState(false)
    const [windowLabel, setWindowLabel] = useState('')

    useEffect(() => {
        // 检测当前平台是否为 Windows
        // 只有在 Windows 平台才显示自定义标题栏控制按钮
        setIsWindows(osAPI.getPlatform() === 'windows')

        // 检测并记录当前窗口信息
        const label = windowAPI.getLabel()
        setWindowLabel(label)
        setIsMainWindow(label === 'main')

        console.log(`WinCtrl 组件初始化 - 窗口标签: ${label}, 是否主窗口: ${label === 'main'}`)
    }, [])

    /**
     * 处理窗口操作的通用错误处理函数
     * 提供统一的错误处理和日志记录
     * @param operation 操作名称（用于错误日志和用户提示）
     * @param windowOperation 要执行的窗口操作 Promise
     */
    const handleWindowOperation = async (operation: string, windowOperation: () => Promise<void>) => {
        try {
            console.log(`执行窗口操作: ${operation}`)
            await windowOperation()
            console.log(`窗口操作成功: ${operation}`)
        } catch (error) {
            console.error(`${operation} 操作失败:`, error)
            // 可以在这里添加用户通知或其他错误处理逻辑
            // 例如：显示错误提示、回退操作等
        }
    }

    /**
     * 智能关闭窗口处理函数
     *
     * 根据窗口类型智能选择关闭行为：
     * - 主窗口 (label === 'main')：使用 hide() 隐藏到系统托盘，保持应用运行
     * - 子窗口/其他窗口：使用 close() 直接关闭，释放资源
     *
     * 这种设计的好处：
     * 1. 主窗口隐藏后可以通过系统托盘快速恢复
     * 2. 子窗口关闭后释放内存，避免资源泄漏
     * 3. 用户体验更加符合预期
     */
    const handleCloseWindow = () => {
        const label = windowAPI.getLabel()

        console.log(`关闭窗口请求 - 窗口标签: ${label}`)

        if (label === 'main') {
            // 主窗口使用隐藏，保持应用在系统托盘运行
            // 用户可以通过托盘图标重新显示主窗口
            handleWindowOperation('隐藏主窗口到系统托盘', () => windowAPI.hide())
        } else {
            // 子窗口直接关闭，释放相关资源
            // 如：设置窗口、关于窗口、帮助窗口等
            handleWindowOperation(`关闭子窗口 (${label})`, () => windowAPI.close())
        }
    }

    /**
     * 最小化窗口处理函数
     * 所有窗口类型都使用相同的最小化行为
     */
    const handleMinimizeWindow = () => {
        handleWindowOperation('最小化窗口', () => windowAPI.minimize())
    }

    /**
     * 切换最大化状态处理函数
     * 在最大化和还原之间切换
     */
    const handleToggleMaximize = async () => {
        try {
            const isMaximized = await windowAPI.isMaximized()
            if (isMaximized) {
                handleWindowOperation('还原窗口', () => windowAPI.unmaximize())
            } else {
                handleWindowOperation('最大化窗口', () => windowAPI.maximize())
            }
        } catch (error) {
            console.error('切换窗口最大化状态失败:', error)
        }
    }

    // 如果不是 Windows 平台，不渲染控制按钮
    if (!isWindows) {
        // return null
    }
    return (
        <>
            {/* 最小化按钮 */}
            <div
                className="titlebar-button"
                id="titlebar-minimize"
                onClick={handleMinimizeWindow}
                title="最小化窗口" // 统一的提示文本
            >
                <img src="https://api.iconify.design/mdi:window-minimize.svg" alt="minimize" />
            </div>

            {/* 最大化/还原按钮 */}
            <div
                className="titlebar-button"
                id="titlebar-maximize"
                onClick={handleToggleMaximize}
                title="最大化/还原窗口" // 统一的提示文本
            >
                <img src="https://api.iconify.design/mdi:window-maximize.svg" alt="maximize" />
            </div>

            {/* 智能关闭按钮 */}
            <div
                className="titlebar-button"
                id="titlebar-close"
                onClick={handleCloseWindow}
                title={isMainWindow ? '隐藏到系统托盘' : `关闭窗口 (${windowLabel})`} // 根据窗口类型显示不同提示
            >
                <img src="https://api.iconify.design/mdi:close.svg" alt="close" />
            </div>
        </>
    )
}

export default WinCtrl
