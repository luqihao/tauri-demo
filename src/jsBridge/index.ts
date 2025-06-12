/**
 * Tauri Bridge - 统一的 Tauri API 抽象层
 *
 * 这个模块提供了对 Tauri 相关 API 的统一抽象，方便将来迁移到其他桌面应用框架（如 Electron）
 * 所有的 web 代码应该通过这个抽象层来调用桌面应用相关的功能，而不是直接使用 Tauri API
 */

// 导出所有 API 接口和实现
export * from './autostart'
export * from './clipboard'
export * from './file'
export * from './globalShortcut'
export * from './core'
export * from './os'
export * from './app'
export * from './window'
export * from './store'
export * from './event'
export * from './opener'
export * from './fs'
export * from './path'
export * from './log'

// 导入所有 API 实现
import { autostartAPI } from './autostart'
import { clipboardAPI } from './clipboard'
import { fileAPI } from './file'
import { globalShortcutAPI } from './globalShortcut'
import { coreAPI } from './core'
import { osAPI } from './os'
import { appAPI } from './app'
import { windowAPI } from './window'
import { storeAPI } from './store'
import { eventAPI } from './event'
import { openerAPI } from './opener'
import { fsAPI } from './fs'
import { pathAPI } from './path'
import { logAPI } from './log'

/**
 * 统一的桌面应用 API 接口
 * 提供所有桌面应用相关功能的统一访问点
 */
export interface DesktopAPI {
    autostart: typeof autostartAPI
    clipboard: typeof clipboardAPI
    file: typeof fileAPI
    globalShortcut: typeof globalShortcutAPI
    core: typeof coreAPI
    os: typeof osAPI
    app: typeof appAPI
    window: typeof windowAPI
    store: typeof storeAPI
    event: typeof eventAPI
    opener: typeof openerAPI
    fs: typeof fsAPI
    path: typeof pathAPI
    log: typeof logAPI
}

/**
 * 桌面应用 API 实例
 *
 * 使用示例：
 * ```typescript
 * import { desktopAPI } from '@/jsBridge'
 *
 * // 使用剪贴板
 * await desktopAPI.clipboard.writeText('Hello')
 * const text = await desktopAPI.clipboard.readText()
 *
 * // 使用文件对话框
 * const file = await desktopAPI.file.openFileDialog()
 *
 * // 调用后端命令
 * const result = await desktopAPI.core.invoke('greet', { name: 'World' })
 *
 * // 使用文件系统
 * const content = await desktopAPI.fs.readTextFile('/path/to/file.txt')
 *
 * // 使用路径操作
 * const appDir = await desktopAPI.path.appDataDir()
 *
 * // 使用日志系统
 * await desktopAPI.log.appLogger.info('Hello World')
 * ```
 */
export const desktopAPI: DesktopAPI = {
    autostart: autostartAPI,
    clipboard: clipboardAPI,
    file: fileAPI,
    globalShortcut: globalShortcutAPI,
    core: coreAPI,
    os: osAPI,
    app: appAPI,
    window: windowAPI,
    store: storeAPI,
    event: eventAPI,
    opener: openerAPI,
    fs: fsAPI,
    path: pathAPI,
    log: logAPI
}

// 为了向后兼容，也单独导出各个 API
export {
    autostartAPI,
    clipboardAPI,
    fileAPI,
    globalShortcutAPI,
    coreAPI,
    osAPI,
    appAPI,
    windowAPI,
    storeAPI,
    eventAPI,
    openerAPI,
    fsAPI,
    pathAPI,
    logAPI
}
