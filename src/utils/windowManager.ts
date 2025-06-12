import { WebviewWindow, getAllWebviewWindows } from '@tauri-apps/api/webviewWindow'

// 定义窗口标识常量
export const WINDOWS = {
    FEATURES: 'features-window',
    ABOUT: 'about-window'
}

/**
 * 打开或聚焦窗口
 * @param label 窗口标识
 * @param title 窗口标题
 * @param url 加载的URL路径
 */
export const openOrFocusWindow = async (label: string, title: string, url: string) => {
    // 检查窗口是否已存在
    const allWindows = await getAllWebviewWindows()
    const existingWindow = allWindows.find((w: WebviewWindow) => w.label === label)

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
        const newWindow = new WebviewWindow(label, {
            title,
            url,
            width: 800,
            height: 600,
            center: true,
            resizable: true
        })

        // 监听窗口创建完成事件
        newWindow.once('tauri://created', () => {
            console.log(`${title} 窗口已创建`)
        })

        // 监听窗口错误事件
        newWindow.once('tauri://error', (e: any) => {
            console.error(`${title} 窗口创建失败:`, e)
        })
    }
}

/**
 * 打开功能演示窗口
 */
export const openFeaturesWindow = () => {
    openOrFocusWindow(WINDOWS.FEATURES, 'Tauri功能演示', '/features')
}

/**
 * 打开关于窗口
 */
export const openAboutWindow = () => {
    openOrFocusWindow(WINDOWS.ABOUT, 'Tauri关于', '/about')
}
