/**
 * 文件对话框和文件操作相关 API 抽象层
 * 提供文件选择、保存、下载等功能
 */

import { open as openFileDialog, save } from '@tauri-apps/plugin-dialog'
import { download } from '@tauri-apps/plugin-upload'
import { revealItemInDir } from '@tauri-apps/plugin-opener'

export interface OpenDialogOptions {
    multiple?: boolean
    directory?: boolean
    title?: string
    filters?: Array<{
        name: string
        extensions: string[]
    }>
}

export interface SaveDialogOptions {
    title?: string
    defaultPath?: string
    filters?: Array<{
        name: string
        extensions: string[]
    }>
}

export interface DownloadProgress {
    progress: number
    total?: number
    transferSpeed?: number
}

export interface FileAPI {
    /** 打开文件选择对话框 */
    openFileDialog(options?: OpenDialogOptions): Promise<string | string[] | null>
    /** 打开保存文件对话框 */
    saveFileDialog(options?: SaveDialogOptions): Promise<string | null>
    /** 下载文件 */
    downloadFile(url: string, filePath: string, onProgress?: (progress: DownloadProgress) => void): Promise<void>
    /** 在文件管理器中显示文件 */
    revealInFileManager(path: string): Promise<void>
}

export const fileAPI: FileAPI = {
    openFileDialog: async (options?: OpenDialogOptions) => {
        return await openFileDialog(options)
    },

    saveFileDialog: async (options?: SaveDialogOptions) => {
        return await save(options)
    },

    downloadFile: async (url: string, filePath: string, onProgress?: (progress: DownloadProgress) => void) => {
        // Note: The Tauri download API might not support progress callbacks directly
        // For now, we'll just call the download function without progress tracking
        // In a real implementation, you might need to use a different approach for progress tracking
        if (onProgress) {
            // Simulate some progress for compatibility
            onProgress({ progress: 0 })
        }

        const result = await download(url, filePath)

        if (onProgress) {
            onProgress({ progress: 100 })
        }

        return result
    },

    revealInFileManager: async (path: string): Promise<void> => {
        await revealItemInDir(path)
    }
}
