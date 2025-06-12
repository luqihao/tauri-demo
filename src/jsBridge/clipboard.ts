/**
 * 剪贴板相关 API 抽象层
 * 提供剪贴板读写功能
 */

import { writeText, readText } from '@tauri-apps/plugin-clipboard-manager'

export interface ClipboardAPI {
    /** 将文本写入剪贴板 */
    writeText(text: string): Promise<void>
    /** 从剪贴板读取文本 */
    readText(): Promise<string | null>
}

export const clipboardAPI: ClipboardAPI = {
    writeText: async (text: string) => {
        return await writeText(text)
    },

    readText: async () => {
        return await readText()
    }
}
