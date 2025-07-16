import { Link } from 'react-router-dom'
import { LoggingModule } from '../modules/LoggingModule'
import { AutostartModule } from '../modules/AutostartModule'
import { SystemTrayModule } from '../modules/SystemTrayModule'
import { GlobalShortcutsModule } from '../modules/GlobalShortcutsModule'
import { ClipboardModule } from '../modules/ClipboardModule'
import { FileModule } from '../modules/FileModule'
import { GreetingModule } from '../modules/GreetingModule'
import { SystemInfoModule } from '../modules/SystemInfoModule'
import StoreModule from '../modules/StoreModule'
import NotificationModule from '../modules/NotificationModule'
import WinCtrl from '../modules/WinCtrl'
import StateDemo from '../components/StateDemo'
import reactLogo from '../assets/react.svg'
import { useEffect } from 'react'
import { listen } from '@tauri-apps/api/event'

const Features = () => {
    useEffect(() => {
        listen('about-event', event => {
            console.log('Received event in features page:', event.payload)
        })
        listen('custom-event', event => {
            console.log('Received custom event in features page:', event.payload)
        })
    }, [])
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
                    💻 桌面应用 • 🔔 系统托盘 • 🔕 系统通知 • ⌨️ 全局快捷键 • 📋 粘贴板 • 📁 文件操作 • 📝 日志记录 • 💾
                    本地存储
                </div>
                <WinCtrl />
                <div style={{ marginTop: '10px' }}>
                    <Link
                        to="/"
                        style={{
                            padding: '4px 12px',
                            background: 'rgba(255,255,255,0.2)',
                            color: 'white',
                            borderRadius: '4px',
                            textDecoration: 'none',
                            fontSize: '12px'
                        }}
                    >
                        返回首页
                    </Link>
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
                <LoggingModule />
                <AutostartModule />
                <SystemTrayModule />
                <GlobalShortcutsModule />
                <ClipboardModule />
                <NotificationModule />
                <FileModule />
                <GreetingModule />
                <SystemInfoModule />
                <StoreModule />
                <StateDemo />
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

export default Features
