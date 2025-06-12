/**
 * 事件系统相关 API 抽象层
 * 提供事件监听和发送功能
 */

import { listen, emit } from '@tauri-apps/api/event'

export type EventCallback<T = any> = (event: { payload: T }) => void
export type UnlistenFn = () => void

export interface EventAPI {
    /** 监听事件 */
    listen<T = any>(event: string, handler: EventCallback<T>): Promise<UnlistenFn>
    /** 发送事件 */
    emit(event: string, payload?: any): Promise<void>
}

export const eventAPI: EventAPI = {
    listen: async <T = any>(event: string, handler: EventCallback<T>): Promise<UnlistenFn> => {
        return await listen(event, handler)
    },

    emit: async (event: string, payload?: any) => {
        return await emit(event, payload)
    }
}
