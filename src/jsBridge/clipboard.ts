/**
 * 剪贴板相关 API 抽象层
 * 提供剪贴板读写功能
 */

import { writeText, readText, writeImage as _writeImage } from '@tauri-apps/plugin-clipboard-manager'
import { Image } from '@tauri-apps/api/image'

export interface ClipboardAPI {
    /** 将文本写入剪贴板 */
    writeText(text: string): Promise<void>
    /** 从剪贴板读取文本 */
    readText(): Promise<string | null>
    writeImage: (url: string) => Promise<void>
}

export const clipboardAPI: ClipboardAPI = {
    writeText: async (text: string) => {
        return await writeText(text)
    },

    readText: async () => {
        return await readText()
    },

    writeImage: async (url: string) => {
        const bf = await fetch(url).then(res => res.arrayBuffer())
        // 使用 Tauri Image API 创建 Image 对象
        const image = await Image.fromBytes(new Uint8Array(bf))
        return _writeImage(image)
    }
}
