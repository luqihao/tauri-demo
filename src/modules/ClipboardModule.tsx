import React, { useState } from 'react'
import { clipboardAPI } from '../jsBridge'

interface ClipboardModuleProps {
    // 无需接收外部状态和回调，组件自己管理所有状态
}

export const ClipboardModule: React.FC<ClipboardModuleProps> = () => {
    const [clipboardText, setClipboardText] = useState<string>('')
    const [textToCopy, setTextToCopy] = useState<string>('Hello, 这是一段测试文本！🚀')
    const [isImageCopying, setIsImageCopying] = useState<boolean>(false)

    // 示例图片链接
    const sampleImageUrl = 'https://ydj-test-bucket.atido.com/desktop/1443/1749691692832/图片.png'

    async function copyToClipboard() {
        try {
            await clipboardAPI.writeText(textToCopy)
            console.log('文本已复制到粘贴板:', textToCopy)
            alert('文本已复制到粘贴板！')
        } catch (error) {
            console.error('复制到粘贴板失败:', error)
            alert('复制到粘贴板失败: ' + error)
        }
    }

    async function copyImageToClipboard() {
        await clipboardAPI.writeImage(sampleImageUrl)
    }

    async function readFromClipboard() {
        try {
            const text = await clipboardAPI.readText()
            setClipboardText(text || '')
            console.log('从粘贴板读取的文本:', text)
        } catch (error) {
            console.error('读取粘贴板失败:', error)
            setClipboardText('读取失败')
            alert('读取粘贴板失败: ' + error)
        }
    }

    return (
        <div
            style={{
                padding: '12px',
                backgroundColor: '#fff7ed',
                borderRadius: '6px',
                border: '1px solid #fed7aa',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '16px', marginRight: '6px' }}>📋</span>
                <h3 style={{ margin: '0', fontSize: '14px', fontWeight: '600', color: '#9a3412' }}>剪贴板操作</h3>
            </div>

            <div style={{ marginBottom: '12px' }}>
                <label
                    style={{
                        fontSize: '12px',
                        fontWeight: '500',
                        color: '#374151',
                        display: 'block',
                        marginBottom: '4px'
                    }}
                >
                    要复制的文本:
                </label>
                <textarea
                    value={textToCopy}
                    onChange={e => setTextToCopy(e.target.value)}
                    placeholder="输入要复制到粘贴板的文本..."
                    style={{
                        width: '100%',
                        padding: '6px 8px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '12px',
                        boxSizing: 'border-box',
                        marginBottom: '6px',
                        minHeight: '60px',
                        resize: 'vertical'
                    }}
                ></textarea>
                <button
                    onClick={copyToClipboard}
                    style={{
                        backgroundColor: '#f97316',
                        color: 'white',
                        padding: '6px 12px',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '500',
                        width: '100%',
                        marginBottom: '12px'
                    }}
                >
                    复制到粘贴板
                </button>

                {/* 图片复制部分 */}
                <div style={{ marginBottom: '12px' }}>
                    <label
                        style={{
                            fontSize: '12px',
                            fontWeight: '500',
                            color: '#374151',
                            display: 'block',
                            marginBottom: '4px'
                        }}
                    >
                        复制示例图片:
                    </label>
                    <div
                        style={{
                            backgroundColor: '#f9fafb',
                            border: '1px solid #e5e7eb',
                            borderRadius: '4px',
                            padding: '8px',
                            marginBottom: '6px',
                            fontSize: '11px',
                            color: '#6b7280',
                            wordBreak: 'break-all'
                        }}
                    >
                        🖼️ {sampleImageUrl}
                    </div>
                    <img
                        src={sampleImageUrl}
                        alt="示例图片"
                        style={{
                            width: '100%',
                            maxWidth: '200px',
                            height: 'auto',
                            borderRadius: '4px',
                            border: '1px solid #e5e7eb',
                            marginBottom: '6px',
                            display: 'block'
                        }}
                        onError={e => {
                            ;(e.target as HTMLImageElement).style.display = 'none'
                        }}
                    />
                    <button
                        onClick={copyImageToClipboard}
                        disabled={isImageCopying}
                        style={{
                            backgroundColor: isImageCopying ? '#9ca3af' : '#10b981',
                            color: 'white',
                            padding: '6px 12px',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: isImageCopying ? 'not-allowed' : 'pointer',
                            fontSize: '12px',
                            fontWeight: '500',
                            width: '100%',
                            marginBottom: '12px'
                        }}
                    >
                        {isImageCopying ? '正在复制图片...' : '复制图片到粘贴板'}
                    </button>
                </div>

                <label
                    style={{
                        fontSize: '12px',
                        fontWeight: '500',
                        color: '#374151',
                        display: 'block',
                        marginBottom: '4px'
                    }}
                >
                    从粘贴板读取:
                </label>
                <div
                    style={{
                        backgroundColor: '#f3f4f6',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        padding: '6px 8px',
                        fontSize: '12px',
                        minHeight: '40px',
                        wordBreak: 'break-word',
                        marginBottom: '6px',
                        color: '#4b5563',
                        fontFamily: 'monospace'
                    }}
                >
                    {clipboardText || '粘贴板内容将显示在这里...'}
                </div>
                <button
                    onClick={readFromClipboard}
                    style={{
                        backgroundColor: '#d97706',
                        color: 'white',
                        padding: '6px 12px',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '500',
                        width: '100%'
                    }}
                >
                    从粘贴板读取
                </button>
            </div>

            <div style={{ fontSize: '10px', color: '#6b7280', lineHeight: '1.3' }}>
                💡 使用<code>@tauri-apps/plugin-clipboard-manager</code>
                进行跨平台粘贴板操作，支持读写文本内容。在某些平台上，可能需要用户授予应用访问粘贴板的权限。
            </div>
        </div>
    )
}
