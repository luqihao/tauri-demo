/**
 * 系统通知相关 API 抽象层
 * 提供系统通知发送和管理功能
 */

import { sendNotification, requestPermission, isPermissionGranted } from '@tauri-apps/plugin-notification'

export interface NotificationOptions {
    /** 通知内容 */
    body?: string
    /** 通知图标 */
    icon?: string
    /** 通知声音 */
    sound?: string
}

export type Permission = 'granted' | 'denied' | 'default'

export interface NotificationAPI {
    /** 发送通知 */
    send(options: string | { title: string; body?: string; icon?: string; sound?: string }): Promise<void>
    /** 检查通知权限是否已授权 */
    isPermissionGranted(): Promise<boolean>
    /** 请求通知权限 */
    requestPermission(): Promise<Permission>
}

export const notificationAPI: NotificationAPI = {
    send: async (options: string | { title: string; body?: string; icon?: string; sound?: string }) => {
        if (typeof options === 'string') {
            await sendNotification({ title: options })
        } else {
            await sendNotification(options)
        }
    },

    isPermissionGranted: async () => {
        return await isPermissionGranted()
    },

    requestPermission: async () => {
        return await requestPermission()
    }
}
