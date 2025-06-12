/**
 * 路径相关 API 抽象层
 * 提供路径拼接和系统路径获取功能
 */

import { join, appDataDir } from '@tauri-apps/api/path'

export interface PathAPI {
    /** 拼接路径 */
    join(...paths: string[]): Promise<string>
    /** 获取应用数据目录 */
    appDataDir(): Promise<string>
}

export const pathAPI: PathAPI = {
    join: async (...paths: string[]) => {
        return await join(...paths)
    },

    appDataDir: async () => {
        return await appDataDir()
    }
}
