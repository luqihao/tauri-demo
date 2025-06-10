import React, { useState, useEffect } from 'react'
import { register, unregister, isRegistered } from '@tauri-apps/plugin-global-shortcut'
import { invoke } from '@tauri-apps/api/core'

// 全局快捷键类型定义
interface Shortcut {
    id: string
    combination: string
    description: string
    isRegistered: boolean
}

interface GlobalShortcutsModuleProps {
    // 无需接收外部状态和回调，组件自己管理所有状态
}

export const GlobalShortcutsModule: React.FC<GlobalShortcutsModuleProps> = () => {
    const [shortcuts, setShortcuts] = useState<Shortcut[]>([
        { id: 'show-window', combination: 'CmdOrCtrl+Shift+A', description: '显示/隐藏窗口', isRegistered: false },
        { id: 'increment-unread', combination: 'CmdOrCtrl+Shift+I', description: '增加未读数', isRegistered: false },
        { id: 'clear-unread', combination: 'CmdOrCtrl+Shift+C', description: '清除未读数', isRegistered: false }
    ])
    const [editingShortcut, setEditingShortcut] = useState<string | null>(null)
    const [newShortcutInput, setNewShortcutInput] = useState('')

    useEffect(() => {
        // 初始化全局快捷键状态
        const initializeShortcuts = async () => {
            const updatedShortcuts = await Promise.all(
                shortcuts.map(async shortcut => {
                    try {
                        const registered = await isRegistered(shortcut.combination)
                        return { ...shortcut, isRegistered: registered }
                    } catch (error) {
                        console.error(`检查快捷键 ${shortcut.combination} 状态失败:`, error)
                        return shortcut
                    }
                })
            )
            setShortcuts(updatedShortcuts)
        }

        initializeShortcuts()
    }, [])

    async function registerShortcut(shortcutId: string, combination: string) {
        try {
            await register(combination, async () => {
                console.log(`全局快捷键 ${combination} 被触发`)

                // 根据快捷键ID执行不同操作
                switch (shortcutId) {
                    case 'show-window':
                        // 显示/隐藏窗口的逻辑 - 这里我们调用后端的逻辑
                        console.log('触发显示/隐藏窗口')
                        break
                    case 'increment-unread':
                        await invoke('increment_unread')
                        break
                    case 'clear-unread':
                        await invoke('clear_unread')
                        break
                }
            })

            // 更新快捷键注册状态
            setShortcuts(prev => prev.map(s => (s.id === shortcutId ? { ...s, isRegistered: true } : s)))

            console.log(`快捷键 ${combination} 注册成功`)
        } catch (error) {
            console.error(`注册快捷键 ${combination} 失败:`, error)
            alert(`注册快捷键失败: ${error}`)
        }
    }

    async function unregisterShortcut(combination: string) {
        try {
            await unregister(combination)

            // 更新快捷键注册状态
            setShortcuts(prev => prev.map(s => (s.combination === combination ? { ...s, isRegistered: false } : s)))

            console.log(`快捷键 ${combination} 取消注册成功`)
        } catch (error) {
            console.error(`取消注册快捷键 ${combination} 失败:`, error)
            alert(`取消注册快捷键失败: ${error}`)
        }
    }

    async function toggleShortcut(shortcut: Shortcut) {
        if (shortcut.isRegistered) {
            await unregisterShortcut(shortcut.combination)
        } else {
            await registerShortcut(shortcut.id, shortcut.combination)
        }
    }

    async function updateShortcutCombination(shortcutId: string, newCombination: string) {
        const shortcut = shortcuts.find(s => s.id === shortcutId)
        if (!shortcut) return

        try {
            // 如果当前快捷键已注册，先取消注册
            if (shortcut.isRegistered) {
                await unregisterShortcut(shortcut.combination)
            }

            // 更新快捷键组合
            setShortcuts(prev =>
                prev.map(s => (s.id === shortcutId ? { ...s, combination: newCombination, isRegistered: false } : s))
            )

            console.log(`快捷键组合已更新为: ${newCombination}`)
        } catch (error) {
            console.error('更新快捷键组合失败:', error)
            alert(`更新快捷键组合失败: ${error}`)
        }
    }

    function startEditingShortcut(shortcutId: string) {
        const shortcut = shortcuts.find(s => s.id === shortcutId)
        if (shortcut) {
            setEditingShortcut(shortcutId)
            setNewShortcutInput(shortcut.combination)
        }
    }

    async function saveShortcutEdit() {
        if (editingShortcut && newShortcutInput.trim()) {
            await updateShortcutCombination(editingShortcut, newShortcutInput.trim())
            setEditingShortcut(null)
            setNewShortcutInput('')
        }
    }

    function cancelShortcutEdit() {
        setEditingShortcut(null)
        setNewShortcutInput('')
    }

    // 键盘事件处理，用于捕获快捷键输入
    function handleShortcutKeyDown(e: React.KeyboardEvent) {
        e.preventDefault()

        const keys = []
        if (e.ctrlKey || e.metaKey) keys.push(e.metaKey ? 'Cmd' : 'Ctrl')
        if (e.altKey) keys.push('Alt')
        if (e.shiftKey) keys.push('Shift')

        if (e.key && !['Control', 'Meta', 'Alt', 'Shift'].includes(e.key)) {
            const key = e.key.toUpperCase()
            keys.push(key)
        }

        if (keys.length > 1) {
            const combination = keys.join('+').replace('Cmd', 'CmdOrCtrl').replace('Ctrl', 'CmdOrCtrl')
            setNewShortcutInput(combination)
        }
    }

    return (
        <div
            style={{
                padding: '12px',
                backgroundColor: '#f0f9ff',
                borderRadius: '6px',
                border: '1px solid #bae6fd',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '16px', marginRight: '6px' }}>⌨️</span>
                <h3 style={{ margin: '0', fontSize: '14px', fontWeight: '600', color: '#0e7490' }}>全局快捷键</h3>
            </div>

            <div style={{ marginBottom: '16px' }}>
                {shortcuts.map(shortcut => (
                    <div
                        key={shortcut.id}
                        style={{
                            marginBottom: '8px',
                            backgroundColor: 'white',
                            padding: '8px',
                            borderRadius: '4px',
                            border: '1px solid #e5e7eb'
                        }}
                    >
                        {editingShortcut === shortcut.id ? (
                            <>
                                <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                                    <input
                                        value={newShortcutInput}
                                        onChange={e => setNewShortcutInput(e.target.value)}
                                        onKeyDown={handleShortcutKeyDown}
                                        placeholder="按下组合键..."
                                        style={{
                                            flex: 1,
                                            padding: '4px 8px',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '4px',
                                            fontSize: '12px'
                                        }}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                    <button
                                        onClick={saveShortcutEdit}
                                        style={{
                                            backgroundColor: '#10b981',
                                            color: 'white',
                                            padding: '4px 12px',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontSize: '11px',
                                            fontWeight: '500',
                                            flex: 1
                                        }}
                                    >
                                        保存
                                    </button>
                                    <button
                                        onClick={cancelShortcutEdit}
                                        style={{
                                            backgroundColor: '#6b7280',
                                            color: 'white',
                                            padding: '4px 12px',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontSize: '11px',
                                            fontWeight: '500',
                                            flex: 1
                                        }}
                                    >
                                        取消
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginBottom: '6px'
                                    }}
                                >
                                    <div style={{ fontSize: '12px', fontWeight: '500', color: '#374151' }}>
                                        {shortcut.description}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: '10px',
                                            padding: '2px 6px',
                                            backgroundColor: shortcut.isRegistered ? '#dcfce7' : '#fee2e2',
                                            color: shortcut.isRegistered ? '#166534' : '#991b1b',
                                            borderRadius: '8px',
                                            fontWeight: '500'
                                        }}
                                    >
                                        {shortcut.isRegistered ? '已注册' : '未注册'}
                                    </div>
                                </div>

                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: '8px'
                                    }}
                                >
                                    <div
                                        style={{
                                            backgroundColor: '#f3f4f6',
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            fontSize: '11px',
                                            fontFamily: 'monospace',
                                            color: '#4b5563'
                                        }}
                                    >
                                        {shortcut.combination}
                                    </div>
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        <button
                                            onClick={() => startEditingShortcut(shortcut.id)}
                                            style={{
                                                backgroundColor: '#f3f4f6',
                                                color: '#4b5563',
                                                border: '1px solid #d1d5db',
                                                borderRadius: '4px',
                                                padding: '2px 8px',
                                                fontSize: '10px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            编辑
                                        </button>
                                        <button
                                            onClick={() => toggleShortcut(shortcut)}
                                            style={{
                                                backgroundColor: shortcut.isRegistered ? '#f87171' : '#34d399',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                padding: '2px 8px',
                                                fontSize: '10px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {shortcut.isRegistered ? '取消' : '注册'}
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>

            <div style={{ fontSize: '10px', color: '#6b7280', lineHeight: '1.3' }}>
                💡 使用<code>@tauri-apps/plugin-global-shortcut</code>
                注册系统级全局快捷键。要使用按键组合，请按下组合键（例如Ctrl+Shift+C）。在编辑框中点击并按下组合键可直接更新组合。
            </div>
        </div>
    )
}
