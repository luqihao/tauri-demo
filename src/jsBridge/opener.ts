/**
 * 系统打开器相关 API 抽象层
 * 提供打开 URL 和文件等功能
 */

import { openUrl } from '@tauri-apps/plugin-opener'

export interface OpenerAPI {
    /** 打开 URL */
    openUrl(url: string): Promise<void>
}

export const openerAPI: OpenerAPI = {
    openUrl: async (url: string) => {
        return await openUrl(url)
    }
}
