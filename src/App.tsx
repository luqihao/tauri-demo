import './App.css'
import { useEffect } from 'react'
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow'

// 如果以后需要路由功能，取消下面的注释
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Features from './pages/Features'
import About from './pages/About'

function App() {
    useEffect(() => {
        getCurrentWebviewWindow().show()
    }, [])

    return (
        <div>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/features" element={<Features />} />
                    <Route path="/about" element={<About />} />
                </Routes>
            </BrowserRouter>
        </div>
    )
}

export default App
