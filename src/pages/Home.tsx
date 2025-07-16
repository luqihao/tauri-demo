import { Link } from 'react-router-dom'
import { windowAPI } from '../jsBridge/window'
import StateDemo from '../components/StateDemo'
import { emit, emitTo, listen, UnlistenFn } from '@tauri-apps/api/event'
import { useEffect, useRef } from 'react'

const Home = () => {
    const unlistenFn = useRef<UnlistenFn | null>(null)

    const handleListen = async () => {
        console.log('开始监听 mounted 事件')
        unlistenFn.current = await listen('mounted', event => {})
    }

    const addScript = () => {
        const script = document.createElement('script')
        script.src = 'https://turing.captcha.qcloud.com/TCaptcha.js'
        script.async = true
        document.head.appendChild(script)
    }

    useEffect(() => {
        handleListen()
        return () => {
            console.log('组件卸载，注销 mounted 事件监听', unlistenFn.current)
            if (unlistenFn.current) {
                unlistenFn.current()
                console.log('注销成功')
            }
        }
    }, [])

    return (
        <div style={{ padding: '20px' }}>
            <h1 onClick={addScript}>首页</h1>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <Link
                    to="/features"
                    style={{
                        padding: '8px 16px',
                        background: '#667eea',
                        color: 'white',
                        borderRadius: '4px',
                        textDecoration: 'none'
                    }}
                >
                    功能演示页面
                </Link>
                <Link
                    to="/about"
                    style={{
                        padding: '8px 16px',
                        background: '#764ba2',
                        color: 'white',
                        borderRadius: '4px',
                        textDecoration: 'none'
                    }}
                >
                    关于页面
                </Link>
            </div>

            <button
                onClick={() => {
                    emit('custom-event', { message: 'Hello from Home!' })
                }}
            >
                广播事件
            </button>
            <button
                onClick={async () => {
                    // 使用 emitTo 向特定窗口发送事件
                    try {
                        await emitTo({ kind: 'WebviewWindow', label: 'about-window' }, 'about-event', {
                            message: 'Hello from Home!'
                        })
                        console.log('Event sent to about-window specifically')
                    } catch (error) {
                        console.error('Failed to send event to about-window:', error)
                    }
                }}
            >
                针对关于页面的广播事件
            </button>
            <h2 style={{ marginTop: '30px' }}>新窗口打开</h2>
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                    onClick={windowAPI.openFeaturesWindow}
                    style={{
                        padding: '8px 16px',
                        background: '#4299e1',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    在新窗口打开功能演示
                </button>
                <button
                    onClick={windowAPI.openAboutWindow}
                    style={{
                        padding: '8px 16px',
                        background: '#ed64a6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    在新窗口打开关于页面
                </button>
            </div>
            <button onClick={() => emit('mounted')}>发送事件给所有窗口</button>
            {/* 状态同步演示 */}
            <StateDemo />
        </div>
    )
}

export default Home
