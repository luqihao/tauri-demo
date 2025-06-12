/**
 * 全局快捷键相关 API 抽象层
 * 提供全局快捷键注册、注销等功能
 */

import { register, unregister, isRegistered } from '@tauri-apps/plugin-global-shortcut'

export type ShortcutHandler = () => void | Promise<void>

export interface GlobalShortcutAPI {
    /** 注册全局快捷键 */
    register(accelerator: string, handler: ShortcutHandler): Promise<void>
    /** 注销全局快捷键 */
    unregister(accelerator: string): Promise<void>
    /** 检查快捷键是否已注册 */
    isRegistered(accelerator: string): Promise<boolean>
}

export const globalShortcutAPI: GlobalShortcutAPI = {
    register: async (accelerator: string, handler: ShortcutHandler) => {
        return await register(accelerator, handler)
    },

    unregister: async (accelerator: string) => {
        return await unregister(accelerator)
    },

    isRegistered: async (accelerator: string) => {
        return await isRegistered(accelerator)
    }
}
