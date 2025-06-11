import { useState, useEffect } from 'react'
import { Window } from '@tauri-apps/api/window'
import { platform } from '@tauri-apps/plugin-os'

const appWindow = new Window('main')

const WinCtrl = () => {
    const [isWindows, setIsWindows] = useState(false)

    useEffect(() => {
        setIsWindows(platform() === 'windows')
    }, [])

    return isWindows ? (
        <>
            <div
                className="titlebar-button"
                id="titlebar-minimize"
                onClick={() => {
                    appWindow.minimize()
                }}
            >
                <img src="https://api.iconify.design/mdi:window-minimize.svg" alt="minimize" />
            </div>
            <div
                className="titlebar-button"
                id="titlebar-maximize"
                onClick={() => {
                    appWindow.toggleMaximize()
                }}
            >
                <img src="https://api.iconify.design/mdi:window-maximize.svg" alt="maximize" />
            </div>
            <div
                className="titlebar-button"
                id="titlebar-close"
                onClick={() => {
                    appWindow.hide()
                }}
            >
                <img src="https://api.iconify.design/mdi:close.svg" alt="close" />
            </div>
        </>
    ) : null
}

export default WinCtrl
