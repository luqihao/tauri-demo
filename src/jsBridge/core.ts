/**
 * 核心 API 抽象层
 * 提供调用后端命令的功能
 */

import { invoke } from '@tauri-apps/api/core'

export interface CoreAPI {
    /** 调用后端命令 */
    invoke<T = any>(command: string, args?: Record<string, any>): Promise<T>
}

export const coreAPI: CoreAPI = {
    invoke: async <T = any>(command: string, args?: Record<string, any>): Promise<T> => {
        return await invoke<T>(command, args)
    }
}
