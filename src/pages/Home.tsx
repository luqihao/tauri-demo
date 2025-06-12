import { Link } from 'react-router-dom'
import { openFeaturesWindow, openAboutWindow } from '../utils/windowManager'
import StateDemo from '../components/StateDemo'

const Home = () => {
    return (
        <div style={{ padding: '20px' }}>
            <h1>首页</h1>
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

            <h2 style={{ marginTop: '30px' }}>新窗口打开</h2>
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                    onClick={openFeaturesWindow}
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
                    onClick={openAboutWindow}
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

            {/* 状态同步演示 */}
            <StateDemo />
        </div>
    )
}

export default Home
