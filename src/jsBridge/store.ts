/**
 * 存储相关 API 抽象层
 * 提供键值对存储功能
 */

import { Store } from '@tauri-apps/plugin-store'

export interface StoreAPI {
    /** 加载存储实例 */
    load(fileName: string): Promise<Store>
    /** 获取值 */
    get<T = any>(store: Store, key: string): Promise<T | null>
    /** 设置值 */
    set(store: Store, key: string, value: any): Promise<void>
    /** 删除键 */
    delete(store: Store, key: string): Promise<boolean>
    /** 清空存储 */
    clear(store: Store): Promise<void>
    /** 获取所有键 */
    keys(store: Store): Promise<string[]>
    /** 获取存储项数量 */
    length(store: Store): Promise<number>
    /** 检查键是否存在 */
    has(store: Store, key: string): Promise<boolean>
    /** 保存存储到磁盘 */
    save(store: Store): Promise<void>
}

export const storeAPI: StoreAPI = {
    load: async (fileName: string) => {
        return await Store.load(fileName)
    },

    get: async <T = any>(store: Store, key: string): Promise<T | null> => {
        const value = await store.get<T>(key)
        return value !== undefined ? value : null
    },

    set: async (store: Store, key: string, value: any) => {
        return await store.set(key, value)
    },

    delete: async (store: Store, key: string) => {
        return await store.delete(key)
    },

    clear: async (store: Store) => {
        return await store.clear()
    },

    keys: async (store: Store) => {
        return await store.keys()
    },

    length: async (store: Store) => {
        return await store.length()
    },

    has: async (store: Store, key: string) => {
        return await store.has(key)
    },

    save: async (store: Store) => {
        return await store.save()
    }
}
