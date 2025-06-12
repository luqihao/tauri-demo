/**
 * 应用程序相关 API 抽象层
 * 提供应用版本、标识符等信息获取功能
 */

import { getVersion, getIdentifier } from '@tauri-apps/api/app'

export interface AppAPI {
    /** 获取应用程序版本 */
    getVersion(): Promise<string>
    /** 获取应用程序标识符 */
    getIdentifier(): Promise<string | null>
}

export const appAPI: AppAPI = {
    getVersion: async () => {
        return await getVersion()
    },

    getIdentifier: async () => {
        return await getIdentifier()
    }
}
