/**
 * WebView 窗口相关 API 抽象层
 * 提供窗口控制功能
 */

import { eventAPI } from './event'
import { Window, getCurrentWindow, getAllWindows } from '@tauri-apps/api/window'

// 窗口配置选项
export interface WindowOptions {
    title: string
    url: string
    width?: number
    height?: number
    center?: boolean
    resizable?: boolean
    minimizable?: boolean
    maximizable?: boolean
    closable?: boolean
    alwaysOnTop?: boolean
}

// 窗口标识常量
export const WINDOWS = {
    FEATURES: 'features-window',
    ABOUT: 'about-window'
} as const

export interface WindowAPI {
    /** 获取当前窗口 */
    getCurrentWindow(): Window
    /** 最小化窗口 */
    minimize(): Promise<void>
    /** 最大化窗口 */
    maximize(): Promise<void>
    /** 取消最大化窗口 */
    unmaximize(): Promise<void>
    /** 关闭窗口 */
    close(): Promise<void>
    /** 隐藏窗口 */
    hide(): Promise<void>
    /** 显示窗口 */
    show(): Promise<void>
    /** 检查窗口是否最大化 */
    isMaximized(): Promise<boolean>
    /** 检查窗口是否最小化 */
    isMinimized(): Promise<boolean>
    /** 检查窗口是否可见 */
    isVisible(): Promise<boolean>
    /** 获取窗口标签 */
    getLabel(): string
    /** 获取所有窗口 */
    getAllWindows(): Promise<Window[]>
    /** 创建新窗口 */
    createWindow(label: string, options: WindowOptions): Promise<Window>
    /** 打开或聚焦窗口 */
    openOrFocusWindow(label: string, title: string, url: string): Promise<void>
    /** 通过标签查找窗口 */
    findWindowByLabel(label: string): Promise<Window | null>
    /** 关闭指定窗口 */
    closeWindowByLabel(label: string): Promise<void>
    /** 打开功能演示窗口 */
    openFeaturesWindow(): Promise<void>
    /** 打开关于窗口 */
    openAboutWindow(): Promise<void>
}

export const windowAPI: WindowAPI = {
    getCurrentWindow: () => {
        return getCurrentWindow()
    },

    minimize: async () => {
        const window = getCurrentWindow()
        return await window.minimize()
    },

    maximize: async () => {
        const window = getCurrentWindow()
        return await window.maximize()
    },

    unmaximize: async () => {
        const window = getCurrentWindow()
        return await window.unmaximize()
    },

    close: async () => {
        const window = getCurrentWindow()
        return await window.close()
    },

    hide: async () => {
        const window = getCurrentWindow()
        return await window.hide()
    },

    show: async () => {
        const window = getCurrentWindow()
        return await window.show()
    },

    isMaximized: async () => {
        const window = getCurrentWindow()
        return await window.isMaximized()
    },

    isMinimized: async () => {
        const window = getCurrentWindow()
        return await window.isMinimized()
    },

    isVisible: async () => {
        const window = getCurrentWindow()
        return await window.isVisible()
    },

    getLabel: () => {
        const window = getCurrentWindow()
        return window.label
    },

    getAllWindows: async () => {
        return await getAllWindows()
    },

    createWindow: async (label: string, options: WindowOptions) => {
        const newWindow = new Window(label, {
            title: options.title,
            url: options.url,
            width: options.width || 800,
            height: options.height || 600,
            center: options.center !== false,
            resizable: options.resizable !== false,
            minimizable: options.minimizable !== false,
            maximizable: options.maximizable !== false,
            closable: options.closable !== false,
            alwaysOnTop: options.alwaysOnTop || false
        })

        // 监听窗口创建完成事件
        newWindow.once('tauri://created', () => {
            console.log(`窗口 ${options.title} 已创建`)
        })

        // 监听窗口错误事件
        newWindow.once('tauri://error', (e: any) => {
            console.error(`窗口 ${options.title} 创建失败:`, e)
        })

        return newWindow
    },

    findWindowByLabel: async (label: string) => {
        const allWindows = await getAllWebviewWindows()
        return allWindows.find((w: Window) => w.label === label) || null
    },

    openOrFocusWindow: async (label: string, title: string, url: string) => {
        const existingWindow = await windowAPI.findWindowByLabel(label)

        if (existingWindow) {
            // 如果窗口已存在，让其聚焦
            try {
                // 先显示窗口（可能是隐藏状态）
                await existingWindow.show()
                // 再让窗口聚焦
                await existingWindow.setFocus()
            } catch (error) {
                console.error(`无法聚焦窗口 ${label}:`, error)
            }
        } else {
            // 如果窗口不存在，创建新窗口
            const win = await windowAPI.createWindow(label, {
                title,
                url,
                width: 800,
                height: 600,
                center: true,
                resizable: true
            })
            win.listen('mounted', event => {
                console.log(`窗口 ${title} mounted`)

                if (label === WINDOWS.FEATURES) {
                    eventAPI.unlisten({
                        event: 'mounted',
                        eventId: event.id
                    })
                }
            })
        }
    },

    closeWindowByLabel: async (label: string) => {
        const window = await windowAPI.findWindowByLabel(label)
        if (window) {
            await window.close()
        }
    },

    openFeaturesWindow: async () => {
        await windowAPI.openOrFocusWindow(WINDOWS.FEATURES, 'Tauri功能演示', '/features')
    },

    openAboutWindow: async () => {
        await windowAPI.openOrFocusWindow(WINDOWS.ABOUT, 'Tauri关于', '/about')
    }
}
