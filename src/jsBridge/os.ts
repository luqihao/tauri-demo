/**
 * 操作系统信息相关 API 抽象层
 * 提供系统平台、架构等信息获取功能
 */

import {
    platform,
    arch,
    version,
    hostname,
    family,
    locale,
    type Platform,
    type Arch,
    type Family
} from '@tauri-apps/plugin-os'

export type { Platform, Arch, Family }

export interface SystemInfo {
    platform: Platform
    arch: Arch
    version: string | null
    hostname: string | null
    family: Family
    locale: string | null
}

export interface OSAPI {
    /** 获取操作系统平台 */
    getPlatform(): Platform
    /** 获取系统架构 */
    getArch(): Arch
    /** 获取系统版本 */
    getVersion(): Promise<string | null>
    /** 获取主机名 */
    getHostname(): Promise<string | null>
    /** 获取系统族 */
    getFamily(): Family
    /** 获取系统语言环境 */
    getLocale(): Promise<string | null>
    /** 获取完整系统信息 */
    getSystemInfo(): Promise<SystemInfo>
}

export const osAPI: OSAPI = {
    getPlatform: () => {
        return platform()
    },

    getArch: () => {
        return arch()
    },

    getVersion: async () => {
        return await version()
    },

    getHostname: async () => {
        return await hostname()
    },

    getFamily: () => {
        return family()
    },

    getLocale: async () => {
        return await locale()
    },

    getSystemInfo: async () => {
        return {
            platform: platform(),
            arch: arch(),
            version: await version(),
            hostname: await hostname(),
            family: family(),
            locale: await locale()
        }
    }
}
