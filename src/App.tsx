import './App.css'
import reactLogo from './assets/react.svg'

// 导入模块组件
import { LoggingModule } from './modules/LoggingModule'
import { AutostartModule } from './modules/AutostartModule'
import { SystemTrayModule } from './modules/SystemTrayModule'
import { GlobalShortcutsModule } from './modules/GlobalShortcutsModule'
import { ClipboardModule } from './modules/ClipboardModule'
import { FileModule } from './modules/FileModule'
import { NetworkModule } from './modules/NetworkModule'
import { GreetingModule } from './modules/GreetingModule'

function App() {
    return (
        <main style={{ padding: '12px', margin: '0 auto', fontSize: '14px' }}>
            {/* 标题区域 */}
            <div
                style={{
                    textAlign: 'center',
                    marginBottom: '16px',
                    padding: '8px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: '8px',
                    color: 'white',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
            >
                <h1 style={{ margin: '0', fontSize: '18px', fontWeight: '600' }}>Tauri 功能演示</h1>
                <div style={{ fontSize: '11px', opacity: '0.9', marginTop: '4px' }}>
                    💻 桌面应用 • 🔔 系统托盘 • ⌨️ 全局快捷键 • 📋 粘贴板 • 📁 文件操作 • 📝 日志记录
                </div>
            </div>

            {/* 功能网格布局 */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: '12px',
                    marginBottom: '16px'
                }}
            >
                {/* 日志模块 */}
                <LoggingModule />

                {/* 自动启动模块 */}
                <AutostartModule />

                {/* 系统托盘模块 */}
                <SystemTrayModule />

                {/* 全局快捷键模块 */}
                <GlobalShortcutsModule />

                {/* 剪贴板模块 */}
                <ClipboardModule />

                {/* 文件操作模块 */}
                <FileModule />

                {/* 网络请求模块 */}
                <NetworkModule />

                {/* 问候模块 */}
                <GreetingModule />
            </div>

            {/* Logo 区域 */}
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
                <a href="https://tauri.app" target="_blank" rel="noreferrer">
                    <img src="/tauri.svg" style={{ height: '40px', marginRight: '12px' }} alt="Tauri logo" />
                </a>
                <a href="https://reactjs.org" target="_blank" rel="noreferrer">
                    <img src={reactLogo} style={{ height: '40px' }} alt="React logo" />
                </a>
            </div>
        </main>
    )
}

export default App
