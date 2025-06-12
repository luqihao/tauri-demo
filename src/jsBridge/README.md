# Tauri Bridge - 桌面应用 API 抽象层

## 概述

`jsBridge` 是一个抽象层，将 Tauri 相关的 API 调用统一封装，使得 web 代码与 Tauri 特定 API 解耦。这样设计的好处是：

1. **易于迁移**：将来如果要从 Tauri 迁移到 Electron 或其他桌面框架，只需要重新实现 `jsBridge` 层的 API，web 代码无需修改
2. **统一接口**：提供一致的 API 接口，简化使用
3. **类型安全**：完整的 TypeScript 类型支持
4. **可维护性**：桌面相关逻辑集中管理

## 架构设计

```
Web 代码层 (React Components)
           ↓
    jsBridge 抽象层
           ↓
     Tauri API 调用层
           ↓
      Rust 后端实现
```

## API 模块

### 1. 自动启动 API (`autostartAPI`)

```typescript
import { autostartAPI } from '@/jsBridge'

// 启用自动启动
await autostartAPI.enable()

// 禁用自动启动
await autostartAPI.disable()

// 检查是否已启用
const isEnabled = await autostartAPI.isEnabled()
```

### 2. 剪贴板 API (`clipboardAPI`)

```typescript
import { clipboardAPI } from '@/jsBridge'

// 写入文本到剪贴板
await clipboardAPI.writeText('Hello World')

// 从剪贴板读取文本
const text = await clipboardAPI.readText()
```

### 3. 文件操作 API (`fileAPI`)

```typescript
import { fileAPI } from '@/jsBridge'

// 打开文件选择对话框
const filePath = await fileAPI.openFileDialog({
    multiple: false,
    directory: false,
    title: '选择文件'
})

// 保存文件对话框
const savePath = await fileAPI.saveFileDialog({
    title: '保存文件',
    defaultPath: 'document.txt'
})

// 下载文件
await fileAPI.downloadFile('https://example.com/file.zip', '/path/to/save/file.zip', progress => {
    console.log(`下载进度: ${progress.progress}%`)
})

// 在文件管理器中显示文件
await fileAPI.revealInFileManager('/path/to/file')
```

### 4. 全局快捷键 API (`globalShortcutAPI`)

```typescript
import { globalShortcutAPI } from '@/jsBridge'

// 注册全局快捷键
await globalShortcutAPI.register('CmdOrCtrl+Shift+A', () => {
    console.log('快捷键被触发')
})

// 检查快捷键是否已注册
const isRegistered = await globalShortcutAPI.isRegistered('CmdOrCtrl+Shift+A')

// 注销快捷键
await globalShortcutAPI.unregister('CmdOrCtrl+Shift+A')
```

### 5. 核心 API (`coreAPI`)

```typescript
import { coreAPI } from '@/jsBridge'

// 调用后端命令
const result = await coreAPI.invoke('greet', { name: 'World' })
const deviceInfo = await coreAPI.invoke('get_device_info')
```

### 6. 操作系统 API (`osAPI`)

```typescript
import { osAPI } from '@/jsBridge'

// 获取平台信息
const platform = osAPI.getPlatform() // 'windows' | 'macos' | 'linux'

// 获取系统架构
const arch = osAPI.getArch() // 'x86' | 'x86_64' | 'arm' | 'aarch64'

// 获取完整系统信息
const systemInfo = await osAPI.getSystemInfo()
```

### 7. 应用程序 API (`appAPI`)

```typescript
import { appAPI } from '@/jsBridge'

// 获取应用版本
const version = await appAPI.getVersion()

// 获取应用标识符
const identifier = await appAPI.getIdentifier()
```

### 8. 窗口 API (`windowAPI`)

```typescript
import { windowAPI, WINDOWS } from '@/jsBridge'

// 基本窗口控制
await windowAPI.minimize() // 最小化窗口
await windowAPI.maximize() // 最大化窗口
await windowAPI.unmaximize() // 取消最大化
await windowAPI.close() // 关闭窗口
await windowAPI.hide() // 隐藏窗口
await windowAPI.show() // 显示窗口

// 检查窗口状态
const isMaximized = await windowAPI.isMaximized()
const isMinimized = await windowAPI.isMinimized()
const isVisible = await windowAPI.isVisible()

// 获取窗口信息
const label = windowAPI.getLabel()
const currentWindow = windowAPI.getCurrentWindow()
const allWindows = await windowAPI.getAllWindows()

// 窗口管理
const window = await windowAPI.createWindow('my-window', {
    title: '我的窗口',
    url: '/my-page',
    width: 800,
    height: 600,
    center: true,
    resizable: true
})

// 打开或聚焦窗口（如果已存在则聚焦，否则创建新窗口）
await windowAPI.openOrFocusWindow('settings', '设置', '/settings')

// 查找窗口
const foundWindow = await windowAPI.findWindowByLabel('my-window')

// 关闭指定窗口
await windowAPI.closeWindowByLabel('my-window')

// 预定义的窗口快捷方法
await windowAPI.openFeaturesWindow() // 打开功能演示窗口
await windowAPI.openAboutWindow() // 打开关于窗口

// 使用窗口常量
console.log(WINDOWS.FEATURES) // 'features-window'
console.log(WINDOWS.ABOUT) // 'about-window'
```

### 9. 存储 API (`storeAPI`)

```typescript
import { storeAPI } from '@/jsBridge'

// 加载存储实例
const store = await storeAPI.load('settings.json')

// 设置值
await storeAPI.set(store, 'theme', 'dark')

// 获取值
const theme = await storeAPI.get(store, 'theme')

// 删除键
await storeAPI.delete(store, 'oldKey')

// 清空存储
await storeAPI.clear(store)

// 保存到磁盘
await storeAPI.save(store)
```

### 10. 事件 API (`eventAPI`)

```typescript
import { eventAPI } from '@/jsBridge'

// 监听事件
const unlisten = await eventAPI.listen('window-closed', event => {
    console.log('窗口关闭事件:', event.payload)
})

// 发送事件
await eventAPI.emit('custom-event', { data: 'hello' })

// 取消监听
unlisten()
```

### 11. 打开器 API (`openerAPI`)

```typescript
import { openerAPI } from '@/jsBridge'

// 打开 URL
await openerAPI.openUrl('https://github.com')
```

### 12. 文件系统 API (`fsAPI`)

```typescript
import { fsAPI } from '@/jsBridge'

// 写入文本文件
await fsAPI.writeTextFile('/path/to/file.txt', 'content')

// 读取文本文件
const content = await fsAPI.readTextFile('/path/to/file.txt')

// 检查文件是否存在
const exists = await fsAPI.exists('/path/to/file.txt')

// 读取目录内容
const entries = await fsAPI.readDir('/path/to/directory')

// 创建目录
await fsAPI.mkdir('/path/to/directory', { recursive: true })

// 删除文件或目录
await fsAPI.remove('/path/to/file')
```

### 13. 路径 API (`pathAPI`)

```typescript
import { pathAPI } from '@/jsBridge'

// 获取应用数据目录
const appDir = await pathAPI.appDataDir()

// 获取文档目录
const docsDir = await pathAPI.documentDir()

// 获取下载目录
const downloadDir = await pathAPI.downloadDir()

// 路径拼接
const fullPath = await pathAPI.join(appDir, 'logs', 'app.log')

// 获取文件名
const filename = await pathAPI.basename('/path/to/file.txt')

// 获取目录名
const dirname = await pathAPI.dirname('/path/to/file.txt')
```

### 14. 日志系统 API (`logAPI`)

```typescript
import { logAPI } from '@/jsBridge'

// 使用预定义的日志记录器
await logAPI.appLogger.info('Application started')
await logAPI.httpLogger.error('HTTP request failed')

// 创建自定义日志记录器
const customLogger = new logAPI.LogManager('custom')
await customLogger.warn('Custom warning message')

// 获取日志目录
const logDir = logAPI.getLogDirectory()

// 清理旧日志文件
const result = await logAPI.cleanupAllOldLogs(30) // 保留30天

// 上传日志文件
const uploadResult = await logAPI.uploadAllLogsByDate('2025-06-12', 'https://api.example.com/logs')
```

## 统一使用方式

您也可以通过统一的 `desktopAPI` 对象访问所有功能：

```typescript
import { desktopAPI } from '@/jsBridge'

// 使用各种 API
await desktopAPI.clipboard.writeText('Hello')
const text = await desktopAPI.clipboard.readText()

await desktopAPI.window.minimize()
const isMaximized = await desktopAPI.window.isMaximized()

const result = await desktopAPI.core.invoke('my_command', { arg: 'value' })
```

## 迁移到 Electron

当需要迁移到 Electron 时，只需要：

1. 重新实现 `jsBridge` 文件夹下的各个 API 文件
2. 将 Tauri API 调用替换为对应的 Electron API 调用
3. Web 代码无需任何修改

例如，`clipboardAPI` 的 Electron 实现可能是：

```typescript
// clipboard.ts - Electron 版本
import { clipboard } from 'electron'

export const clipboardAPI: ClipboardAPI = {
    writeText: async (text: string) => {
        clipboard.writeText(text)
    },

    readText: async () => {
        return clipboard.readText()
    }
}
```

## 最佳实践

1. **始终使用抽象层**：在 React 组件中，始终通过 `jsBridge` 调用桌面功能，而不直接使用 Tauri API
2. **类型安全**：充分利用 TypeScript 类型检查
3. **错误处理**：所有 API 调用都要进行适当的错误处理
4. **异步操作**：所有 API 都是异步的，记得使用 `await` 或 `.then()`

## 示例：重构前后对比

### 重构前（直接使用 Tauri API）

```typescript
import { writeText, readText } from '@tauri-apps/plugin-clipboard-manager'

// 组件中直接使用 Tauri API
const handleCopy = async () => {
    await writeText('Hello World')
}
```

### 重构后（使用抽象层）

```typescript
import { clipboardAPI } from '@/jsBridge'

// 组件中使用抽象层
const handleCopy = async () => {
    await clipboardAPI.writeText('Hello World')
}
```

这样的重构使得代码更易维护，也为将来的平台迁移做好了准备。
