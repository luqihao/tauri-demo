# 桌面应用框架迁移指南

本文档介绍如何使用 `jsBridge` 抽象层来实现从 Tauri 到其他桌面应用框架（如 Electron）的快速迁移。

## 迁移步骤

### 1. 准备工作

在开始迁移前，确保：

-   所有 React 组件都已使用 `jsBridge` 抽象层
-   没有直接调用 Tauri API 的代码
-   充分测试了现有功能

### 2. Electron 迁移示例

以下是将各个 API 模块迁移到 Electron 的示例：

#### 剪贴板 API

```typescript
// jsBridge/clipboard.ts - Electron 版本
import { clipboard } from 'electron'

export interface ClipboardAPI {
    writeText(text: string): Promise<void>
    readText(): Promise<string | null>
}

export const clipboardAPI: ClipboardAPI = {
    writeText: async (text: string) => {
        clipboard.writeText(text)
    },

    readText: async () => {
        return clipboard.readText()
    }
}
```

#### 文件对话框 API

```typescript
// jsBridge/file.ts - Electron 版本
import { dialog, shell } from 'electron'
import { BrowserWindow } from 'electron'

export const fileAPI: FileAPI = {
    openFileDialog: async (options?: OpenDialogOptions) => {
        const result = await dialog.showOpenDialog(BrowserWindow.getFocusedWindow()!, {
            title: options?.title,
            properties: [
                ...(options?.multiple ? ['multiSelections'] : []),
                ...(options?.directory ? ['openDirectory'] : ['openFile'])
            ]
        })

        if (result.canceled) return null
        return options?.multiple ? result.filePaths : result.filePaths[0]
    },

    saveFileDialog: async (options?: SaveDialogOptions) => {
        const result = await dialog.showSaveDialog(BrowserWindow.getFocusedWindow()!, {
            title: options?.title,
            defaultPath: options?.defaultPath
        })

        return result.canceled ? null : result.filePath
    },

    downloadFile: async (url: string, filePath: string, onProgress?: (progress: DownloadProgress) => void) => {
        // 使用 Electron 的下载 API 或 Node.js 的 http/https 模块
        // 实现文件下载和进度跟踪
    },

    revealInFileManager: async (path: string) => {
        shell.showItemInFolder(path)
    }
}
```

#### 窗口控制 API

```typescript
// jsBridge/window.ts - Electron 版本
import { BrowserWindow } from 'electron'

export const windowAPI: WindowAPI = {
    getCurrentWindow: () => {
        return BrowserWindow.getFocusedWindow()!
    },

    minimize: async () => {
        BrowserWindow.getFocusedWindow()?.minimize()
    },

    maximize: async () => {
        const win = BrowserWindow.getFocusedWindow()
        if (win?.isMaximized()) {
            win.unmaximize()
        } else {
            win?.maximize()
        }
    },

    close: async () => {
        BrowserWindow.getFocusedWindow()?.close()
    },

    hide: async () => {
        BrowserWindow.getFocusedWindow()?.hide()
    },

    show: async () => {
        BrowserWindow.getFocusedWindow()?.show()
    },

    isMaximized: async () => {
        return BrowserWindow.getFocusedWindow()?.isMaximized() || false
    },

    isVisible: async () => {
        return BrowserWindow.getFocusedWindow()?.isVisible() || false
    },

    getLabel: () => {
        return 'main' // 或从窗口配置中获取
    }
}
```

#### 系统信息 API

```typescript
// jsBridge/os.ts - Electron 版本
import * as os from 'os'

export const osAPI: OSAPI = {
    getPlatform: () => {
        const platform = os.platform()
        switch (platform) {
            case 'win32':
                return 'windows'
            case 'darwin':
                return 'macos'
            case 'linux':
                return 'linux'
            default:
                return platform as Platform
        }
    },

    getArch: () => {
        const arch = os.arch()
        switch (arch) {
            case 'x64':
                return 'x86_64'
            case 'ia32':
                return 'x86'
            case 'arm64':
                return 'aarch64'
            case 'arm':
                return 'arm'
            default:
                return arch as Arch
        }
    },

    getVersion: async () => {
        return os.release()
    },

    getHostname: async () => {
        return os.hostname()
    },

    getFamily: () => {
        const type = os.type()
        switch (type) {
            case 'Windows_NT':
                return 'windows'
            case 'Darwin':
                return 'unix'
            case 'Linux':
                return 'unix'
            default:
                return 'unix'
        }
    },

    getLocale: async () => {
        return Intl.DateTimeFormat().resolvedOptions().locale
    },

    getSystemInfo: async () => {
        return {
            platform: osAPI.getPlatform(),
            arch: osAPI.getArch(),
            version: await osAPI.getVersion(),
            hostname: await osAPI.getHostname(),
            family: osAPI.getFamily(),
            locale: await osAPI.getLocale()
        }
    }
}
```

#### 核心 API (IPC 通信)

```typescript
// jsBridge/core.ts - Electron 版本
import { ipcRenderer } from 'electron'

export const coreAPI: CoreAPI = {
    invoke: async <T = any>(command: string, args?: Record<string, any>): Promise<T> => {
        return await ipcRenderer.invoke(command, args)
    }
}
```

### 3. 全局快捷键 API

```typescript
// jsBridge/globalShortcut.ts - Electron 版本
import { globalShortcut } from 'electron'

export const globalShortcutAPI: GlobalShortcutAPI = {
    register: async (accelerator: string, handler: ShortcutHandler) => {
        const success = globalShortcut.register(accelerator, handler)
        if (!success) {
            throw new Error(`Failed to register shortcut: ${accelerator}`)
        }
    },

    unregister: async (accelerator: string) => {
        globalShortcut.unregister(accelerator)
    },

    isRegistered: async (accelerator: string) => {
        return globalShortcut.isRegistered(accelerator)
    }
}
```

### 4. 存储 API

```typescript
// jsBridge/store.ts - Electron 版本
import * as fs from 'fs/promises'
import * as path from 'path'
import { app } from 'electron'

class ElectronStore {
    private data: Record<string, any> = {}
    private filePath: string

    constructor(fileName: string) {
        this.filePath = path.join(app.getPath('userData'), fileName)
        this.load()
    }

    private async load() {
        try {
            const content = await fs.readFile(this.filePath, 'utf8')
            this.data = JSON.parse(content)
        } catch (error) {
            // 文件不存在或无法解析，使用空对象
            this.data = {}
        }
    }

    async get<T>(key: string): Promise<T | undefined> {
        return this.data[key]
    }

    async set(key: string, value: any): Promise<void> {
        this.data[key] = value
    }

    async delete(key: string): Promise<boolean> {
        const existed = key in this.data
        delete this.data[key]
        return existed
    }

    async clear(): Promise<void> {
        this.data = {}
    }

    async keys(): Promise<string[]> {
        return Object.keys(this.data)
    }

    async length(): Promise<number> {
        return Object.keys(this.data).length
    }

    async has(key: string): Promise<boolean> {
        return key in this.data
    }

    async save(): Promise<void> {
        await fs.writeFile(this.filePath, JSON.stringify(this.data, null, 2))
    }
}

export const storeAPI: StoreAPI = {
    load: async (fileName: string) => {
        return new ElectronStore(fileName) as any
    },

    get: async <T = any>(store: any, key: string): Promise<T | null> => {
        const value = await store.get<T>(key)
        return value !== undefined ? value : null
    },

    set: async (store: any, key: string, value: any) => {
        return await store.set(key, value)
    },

    delete: async (store: any, key: string) => {
        return await store.delete(key)
    },

    clear: async (store: any) => {
        return await store.clear()
    },

    keys: async (store: any) => {
        return await store.keys()
    },

    length: async (store: any) => {
        return await store.length()
    },

    has: async (store: any, key: string) => {
        return await store.has(key)
    },

    save: async (store: any) => {
        return await store.save()
    }
}
```

#### 文件系统 API

```typescript
// jsBridge/fs.ts - Electron 版本
import { promises as fs } from 'fs'
import { join } from 'path'

export const fsAPI: FSAPI = {
    writeTextFile: async (path: string, content: string) => {
        await fs.writeFile(path, content, 'utf8')
    },

    readTextFile: async (path: string) => {
        return await fs.readFile(path, 'utf8')
    },

    exists: async (path: string) => {
        try {
            await fs.access(path)
            return true
        } catch {
            return false
        }
    },

    readDir: async (path: string) => {
        const entries = await fs.readdir(path, { withFileTypes: true })
        return entries.map(entry => ({
            name: entry.name,
            isFile: entry.isFile(),
            isDirectory: entry.isDirectory()
        }))
    },

    mkdir: async (path: string, options?: FSOptions) => {
        await fs.mkdir(path, { recursive: options?.recursive })
    },

    remove: async (path: string) => {
        const stats = await fs.stat(path)
        if (stats.isDirectory()) {
            await fs.rmdir(path, { recursive: true })
        } else {
            await fs.unlink(path)
        }
    }
}
```

#### 路径 API

```typescript
// jsBridge/path.ts - Electron 版本
import { app } from 'electron'
import { join, basename, dirname } from 'path'
import { homedir } from 'os'

export const pathAPI: PathAPI = {
    appDataDir: async () => {
        return app.getPath('userData')
    },

    documentDir: async () => {
        return app.getPath('documents')
    },

    downloadDir: async () => {
        return app.getPath('downloads')
    },

    homeDir: async () => {
        return homedir()
    },

    tempDir: async () => {
        return app.getPath('temp')
    },

    join: async (...paths: string[]) => {
        return join(...paths)
    },

    basename: async (path: string) => {
        return basename(path)
    },

    dirname: async (path: string) => {
        return dirname(path)
    }
}
```

#### 日志系统 API

```typescript
// jsBridge/log.ts - Electron 版本
// 使用相同的实现，但将文件系统和路径 API 替换为 Electron 版本

import { fsAPI } from './fs'
import { pathAPI } from './path'

// 其余实现保持不变，因为日志系统已经抽象了文件系统操作
export { LogLevel, LogManager, appLogger, httpLogger, getLogDirectory, cleanupAllOldLogs, uploadAllLogsByDate }

// 统一的日志系统 API
export const logAPI = {
    LogLevel,
    LogManager,
    appLogger,
    httpLogger,
    getLogDirectory,
    cleanupAllOldLogs,
    uploadAllLogsByDate
}
```

```markdown
## 迁移检查清单

### 准备阶段

-   [ ] 确认所有组件都使用了 `jsBridge` 抽象层
-   [ ] 移除所有直接的 Tauri API 导入
-   [ ] 测试现有功能完整性

### 实施阶段

-   [ ] 重新实现所有使用的 API 模块
-   [ ] 更新 `package.json` 依赖（移除 Tauri，添加 Electron）
-   [ ] 创建 Electron 主进程代码
-   [ ] 设置 IPC 通信处理
-   [ ] 配置 Electron 构建流程

### 测试阶段

-   [ ] 测试所有 API 功能
-   [ ] 验证窗口控制功能
-   [ ] 检查文件操作功能
-   [ ] 测试全局快捷键
-   [ ] 验证存储功能
-   [ ] 测试系统信息获取

### 优化阶段

-   [ ] 性能优化
-   [ ] 错误处理完善
-   [ ] 用户体验优化
-   [ ] 安全性检查

## 注意事项

1. **API 差异**：不同框架的 API 可能有细微差异，需要仔细适配
2. **权限模型**：Electron 和 Tauri 的权限模型不同，需要相应调整
3. **打包配置**：构建和打包流程需要重新配置
4. **性能考虑**：Electron 应用通常比 Tauri 应用体积更大，内存占用更多
5. **平台特性**：某些平台特定功能可能需要重新实现

## 总结

通过使用 `jsBridge` 抽象层，我们可以大大简化桌面应用框架之间的迁移工作。主要的工作量集中在重新实现抽象层的各个 API 模块，而业务逻辑代码基本不需要修改。这种架构设计为将来的技术选型变更提供了极大的灵活性。
```
