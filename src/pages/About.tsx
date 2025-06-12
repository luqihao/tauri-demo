import { Link } from 'react-router-dom'
import StateDemo from '../components/StateDemo'

const About = () => {
    return (
        <div style={{ padding: '20px' }}>
            <h1>关于页面</h1>
            <p style={{ marginTop: '10px' }}>这是一个使用 Tauri + React 开发的桌面应用程序。</p>
            <div style={{ marginTop: '20px' }}>
                <Link
                    to="/"
                    style={{
                        padding: '8px 16px',
                        background: '#667eea',
                        color: 'white',
                        borderRadius: '4px',
                        textDecoration: 'none'
                    }}
                >
                    返回首页
                </Link>
            </div>

            {/* 状态同步演示 */}
            <StateDemo />
        </div>
    )
}

export default About
