import React, { useState } from 'react'
import { fileAPI, type DownloadProgress } from '../jsBridge'

interface FileModuleProps {
    // 无需接收外部状态和回调，组件自己管理所有状态
}

export const FileModule: React.FC<FileModuleProps> = () => {
    const [selectedPath, setSelectedPath] = useState<string>('')
    const [downloadUrl, setDownloadUrl] = useState<string>(
        'https://yim-chat.yidejia.com/desktop/fb70a0189b798f3c46f04fe57149b128.jpg'
    )
    const [downloadPath, setDownloadPath] = useState<string>('')
    const [isDownloading, setIsDownloading] = useState<boolean>(false)
    const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null)

    async function selectFile() {
        try {
            const selected = await fileAPI.openFileDialog({
                multiple: false,
                directory: false,
                title: '选择一个文件'
            })

            if (selected) {
                setSelectedPath(selected as string)
                console.log('选择的文件路径:', selected)
            }
        } catch (error) {
            console.error('文件选择失败:', error)
            alert('文件选择失败: ' + error)
        }
    }

    function formatBytes(bytes: number): string {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    async function selectDownloadPath() {
        try {
            const filePath = await fileAPI.saveFileDialog({
                defaultPath: 'test.jpg'
            })

            if (filePath) {
                setDownloadPath(filePath)
                console.log('选择的下载路径:', filePath)
            }
        } catch (error) {
            console.error('选择下载路径失败:', error)
            alert('选择下载路径失败: ' + error)
        }
    }

    async function startDownload() {
        if (!downloadUrl.trim()) {
            alert('请输入下载链接')
            return
        }

        if (!downloadPath) {
            await selectDownloadPath()
            return
        }

        try {
            setIsDownloading(true)
            setDownloadProgress({ progress: 0, transferSpeed: 0 })

            console.log('开始下载:', downloadUrl, '到', downloadPath)

            await fileAPI.downloadFile(downloadUrl, downloadPath, (progress: DownloadProgress) => {
                console.log('下载进度:', progress)
                setDownloadProgress({
                    progress: progress.progress || 0,
                    total: progress.total,
                    transferSpeed: progress.transferSpeed || 0
                })
            })

            setIsDownloading(false)
            setDownloadProgress(null)
            console.log('文件下载完成:', downloadPath)

            // 下载完成后打开文件所在的文件夹
            try {
                // 使用revealItemInDir直接打开文件所在的位置，无需截取路径
                await fileAPI.revealInFileManager(downloadPath)
                console.log('已打开文件所在位置:', downloadPath)
            } catch (openError) {
                console.error('打开文件夹失败:', openError)
                alert('打开文件夹失败: ' + openError)
            }
        } catch (error) {
            setIsDownloading(false)
            setDownloadProgress(null)
            console.error('下载失败:', error)
            alert('下载失败: ' + error)
        }
    }

    function cancelDownload() {
        setIsDownloading(false)
        setDownloadProgress(null)
        setDownloadPath('')
    }

    return (
        <div
            style={{
                padding: '12px',
                backgroundColor: '#f5f3ff',
                borderRadius: '6px',
                border: '1px solid #ddd6fe',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '16px', marginRight: '6px' }}>📁</span>
                <h3 style={{ margin: '0', fontSize: '14px', fontWeight: '600', color: '#5b21b6' }}>文件操作</h3>
            </div>

            <div style={{ marginBottom: '16px' }}>
                <label
                    style={{
                        fontSize: '12px',
                        fontWeight: '500',
                        color: '#374151',
                        display: 'block',
                        marginBottom: '4px'
                    }}
                >
                    选择文件:
                </label>

                <div
                    style={{
                        backgroundColor: '#f3f4f6',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        padding: '6px 8px',
                        fontSize: '11px',
                        fontFamily: 'monospace',
                        color: '#4b5563',
                        wordBreak: 'break-all',
                        marginBottom: '6px',
                        minHeight: '20px'
                    }}
                >
                    {selectedPath || '尚未选择文件...'}
                </div>

                <button
                    onClick={selectFile}
                    style={{
                        backgroundColor: '#8b5cf6',
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
                    选择文件...
                </button>
            </div>

            <div style={{ marginBottom: '16px' }}>
                <label
                    style={{
                        fontSize: '12px',
                        fontWeight: '500',
                        color: '#374151',
                        display: 'block',
                        marginBottom: '4px'
                    }}
                >
                    下载文件:
                </label>

                <input
                    type="url"
                    value={downloadUrl}
                    onChange={e => setDownloadUrl(e.target.value)}
                    placeholder="输入下载URL..."
                    disabled={isDownloading}
                    style={{
                        width: '100%',
                        padding: '6px 8px',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '12px',
                        boxSizing: 'border-box',
                        backgroundColor: isDownloading ? '#f9fafb' : 'white',
                        marginBottom: '6px',
                        color: 'black'
                    }}
                />

                <div
                    style={{
                        backgroundColor: '#f3f4f6',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        padding: '6px 8px',
                        fontSize: '11px',
                        fontFamily: 'monospace',
                        color: '#4b5563',
                        wordBreak: 'break-all',
                        marginBottom: '6px',
                        minHeight: '20px'
                    }}
                >
                    {downloadPath || '尚未选择保存路径...'}
                </div>

                {isDownloading && downloadProgress && (
                    <div style={{ marginBottom: '8px' }}>
                        <div style={{ marginBottom: '4px', fontSize: '11px', color: '#6b7280' }}>
                            {downloadProgress.total
                                ? `${formatBytes(
                                      downloadProgress.total * (downloadProgress.progress / 100)
                                  )} / ${formatBytes(downloadProgress.total || 0)}`
                                : `进度: ${downloadProgress.progress.toFixed(1)}%`}
                            {downloadProgress.transferSpeed
                                ? ` - ${formatBytes(downloadProgress.transferSpeed)}/s`
                                : ''}
                        </div>
                        <div
                            style={{
                                backgroundColor: '#e5e7eb',
                                borderRadius: '4px',
                                height: '6px',
                                overflow: 'hidden'
                            }}
                        >
                            <div
                                style={{
                                    backgroundColor: '#7c3aed',
                                    height: '100%',
                                    width: `${downloadProgress.progress}%`,
                                    transition: 'width 0.3s ease-in-out'
                                }}
                            ></div>
                        </div>
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <button
                        onClick={startDownload}
                        disabled={isDownloading}
                        style={{
                            backgroundColor: isDownloading ? '#9ca3af' : '#7c3aed',
                            color: 'white',
                            padding: '6px 12px',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: isDownloading ? 'not-allowed' : 'pointer',
                            fontSize: '12px',
                            fontWeight: '500'
                        }}
                    >
                        {isDownloading ? '下载中...' : '下载文件'}
                    </button>

                    {isDownloading && (
                        <button
                            onClick={cancelDownload}
                            style={{
                                backgroundColor: '#ef4444',
                                color: 'white',
                                padding: '6px 12px',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: '500'
                            }}
                        >
                            取消下载
                        </button>
                    )}
                </div>
            </div>

            <div style={{ fontSize: '10px', color: '#6b7280', lineHeight: '1.3' }}>
                💡 文件操作支持选择对话框、保存对话框、进度跟踪和取消操作。使用<code>@tauri-apps/plugin-dialog</code>和
                <code>@tauri-apps/plugin-upload</code>来提供跨平台文件操作能力。
            </div>
        </div>
    )
}
