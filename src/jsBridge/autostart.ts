/**
 * 自动启动相关 API 抽象层
 * 提供跨平台的自动启动功能
 */

import { enable, disable, isEnabled } from '@tauri-apps/plugin-autostart'

export interface AutostartAPI {
    /** 启用自动启动 */
    enable(): Promise<void>
    /** 禁用自动启动 */
    disable(): Promise<void>
    /** 检查是否已启用自动启动 */
    isEnabled(): Promise<boolean>
}

export const autostartAPI: AutostartAPI = {
    enable: async () => {
        return await enable()
    },

    disable: async () => {
        return await disable()
    },

    isEnabled: async () => {
        return await isEnabled()
    }
}
