/**
 * 文件系统相关 API 抽象层
 * 提供文件和目录操作功能
 */

import { writeTextFile, exists, readTextFile, readDir, remove, mkdir } from '@tauri-apps/plugin-fs'

// 定义文件条目接口
export interface FileEntry {
    name: string
    isFile: boolean
    isDirectory: boolean
}

export interface FSOptions {
    recursive?: boolean
}

export interface FSAPI {
    /** 写入文本文件 */
    writeTextFile(path: string, content: string): Promise<void>
    /** 检查文件或目录是否存在 */
    exists(path: string): Promise<boolean>
    /** 读取文本文件内容 */
    readTextFile(path: string): Promise<string>
    /** 读取目录内容 */
    readDir(path: string): Promise<FileEntry[]>
    /** 删除文件或目录 */
    remove(path: string): Promise<void>
    /** 创建目录 */
    mkdir(path: string, options?: FSOptions): Promise<void>
}

export const fsAPI: FSAPI = {
    writeTextFile: async (path: string, content: string) => {
        return await writeTextFile(path, content)
    },

    exists: async (path: string) => {
        return await exists(path)
    },

    readTextFile: async (path: string) => {
        return await readTextFile(path)
    },

    readDir: async (path: string) => {
        return await readDir(path)
    },

    remove: async (path: string) => {
        return await remove(path)
    },

    mkdir: async (path: string, options?: FSOptions) => {
        return await mkdir(path, options)
    }
}
