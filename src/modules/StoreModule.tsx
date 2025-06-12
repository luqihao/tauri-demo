import { useState, useEffect } from 'react'
import { storeAPI } from '../jsBridge'
import { Store } from '@tauri-apps/plugin-store'

interface StoreItem {
    key: string
    value: any
    type: string
}

const StoreModule = () => {
    const [store, setStore] = useState<Store | null>(null)
    const [items, setItems] = useState<StoreItem[]>([])
    const [newKey, setNewKey] = useState('')
    const [newValue, setNewValue] = useState('')
    const [newType, setNewType] = useState('string')
    const [searchKey, setSearchKey] = useState('')
    const [searchResult, setSearchResult] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [currentStoreFile, setCurrentStoreFile] = useState('settings.json')
    const [customFileName, setCustomFileName] = useState('')

    // 初始化 Store
    useEffect(() => {
        const initStore = async () => {
            try {
                const storeInstance = await storeAPI.load(currentStoreFile)
                setStore(storeInstance)
                await loadAllItems()
            } catch (error) {
                console.error('初始化 Store 失败:', error)
            }
        }
        initStore()
    }, [currentStoreFile])

    // 加载所有存储项
    const loadAllItems = async () => {
        if (!store) return

        try {
            setIsLoading(true)
            const allKeys = await storeAPI.keys(store)
            const itemsData: StoreItem[] = []

            for (const key of allKeys) {
                const value = await storeAPI.get(store, key)
                itemsData.push({
                    key,
                    value,
                    type: typeof value
                })
            }

            setItems(itemsData)
        } catch (error) {
            console.error('加载存储项失败:', error)
        } finally {
            setIsLoading(false)
        }
    }

    // 设置值
    const handleSet = async () => {
        if (!store || !newKey.trim()) {
            alert('请输入有效的键名')
            return
        }

        try {
            let parsedValue: any = newValue

            // 根据类型转换值
            switch (newType) {
                case 'number':
                    parsedValue = Number(newValue)
                    if (isNaN(parsedValue)) {
                        alert('请输入有效的数字')
                        return
                    }
                    break
                case 'boolean':
                    parsedValue = newValue.toLowerCase() === 'true'
                    break
                case 'json':
                    try {
                        parsedValue = JSON.parse(newValue)
                    } catch {
                        alert('请输入有效的 JSON')
                        return
                    }
                    break
                case 'array':
                    try {
                        parsedValue = newValue.split(',').map(item => item.trim())
                    } catch {
                        alert('请输入逗号分隔的数组')
                        return
                    }
                    break
            }

            await storeAPI.set(store, newKey, parsedValue)
            await storeAPI.save(store)

            setNewKey('')
            setNewValue('')
            await loadAllItems()

            console.log(`设置成功: ${newKey} = ${JSON.stringify(parsedValue)}`)
        } catch (error) {
            console.error('设置值失败:', error)
            alert('设置值失败')
        }
    }

    // 获取值
    const handleGet = async () => {
        if (!store || !searchKey.trim()) {
            alert('请输入要搜索的键名')
            return
        }

        try {
            const value = await storeAPI.get(store, searchKey)
            setSearchResult(value)
            console.log(`获取值: ${searchKey} = ${JSON.stringify(value)}`)
        } catch (error) {
            console.error('获取值失败:', error)
            setSearchResult(null)
        }
    }

    // 删除单个项
    const handleDelete = async (key: string) => {
        if (!store) return

        try {
            const exists = await storeAPI.has(store, key)
            if (!exists) {
                alert('键不存在')
                return
            }

            await storeAPI.delete(store, key)
            await storeAPI.save(store)
            await loadAllItems()

            console.log(`删除成功: ${key}`)
        } catch (error) {
            console.error('删除失败:', error)
        }
    }

    // 清除所有
    const handleClear = async () => {
        if (!store) return

        if (!confirm('确定要清除所有存储数据吗？')) {
            return
        }

        try {
            await storeAPI.clear(store)
            await storeAPI.save(store)
            await loadAllItems()
            setSearchResult(null)

            console.log('已清除所有数据')
        } catch (error) {
            console.error('清除失败:', error)
        }
    }

    // 检查键是否存在
    const handleHas = async (key: string) => {
        if (!store) return

        try {
            const exists = await storeAPI.has(store, key)
            alert(`键 "${key}" ${exists ? '存在' : '不存在'}`)
        } catch (error) {
            console.error('检查键失败:', error)
        }
    }

    // 获取存储大小
    const handleLength = async () => {
        if (!store) return

        try {
            const length = await store.length()
            alert(`当前存储了 ${length} 个项目`)
        } catch (error) {
            console.error('获取长度失败:', error)
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
                <span style={{ fontSize: '16px', marginRight: '6px' }}>💾</span>
                <h3 style={{ margin: '0', fontSize: '14px', fontWeight: '600', color: '#0369a1' }}>本地存储 (Store)</h3>
            </div>

            {/* 存储文件选择器 */}
            <div style={{ marginBottom: '12px', padding: '8px', backgroundColor: '#ffffff', borderRadius: '4px' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#0369a1' }}>选择存储文件</h4>

                <div style={{ display: 'flex', gap: '4px', marginBottom: '6px', flexWrap: 'wrap' }}>
                    <select
                        value={currentStoreFile}
                        onChange={e => setCurrentStoreFile(e.target.value)}
                        style={{
                            padding: '4px 8px',
                            fontSize: '11px',
                            border: '1px solid #cbd5e1',
                            borderRadius: '3px',
                            flex: '1',
                            minWidth: '120px'
                        }}
                    >
                        <option value="settings.json">settings.json</option>
                        <option value="settings2.json">settings2.json</option>
                        <option value="config.json">config.json</option>
                        <option value="data.json">data.json</option>
                        <option value="custom">自定义文件名</option>
                    </select>

                    {currentStoreFile === 'custom' && (
                        <>
                            <input
                                type="text"
                                value={customFileName}
                                onChange={e => setCustomFileName(e.target.value)}
                                placeholder="输入文件名，如: my-store.json"
                                style={{
                                    padding: '4px 8px',
                                    fontSize: '11px',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '3px',
                                    flex: '1',
                                    minWidth: '150px'
                                }}
                            />
                            <button
                                onClick={() => {
                                    if (customFileName.trim()) {
                                        setCurrentStoreFile(customFileName.trim())
                                    }
                                }}
                                style={{
                                    padding: '4px 8px',
                                    backgroundColor: '#0369a1',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '3px',
                                    cursor: 'pointer',
                                    fontSize: '11px'
                                }}
                            >
                                确认
                            </button>
                        </>
                    )}
                </div>

                <div style={{ fontSize: '10px', color: '#6b7280' }}>
                    当前文件: <strong>{currentStoreFile}</strong>
                </div>
            </div>

            {/* 添加新项 */}
            <div style={{ marginBottom: '12px', padding: '8px', backgroundColor: '#ffffff', borderRadius: '4px' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#0369a1' }}>添加/更新存储项</h4>

                <div style={{ display: 'flex', gap: '4px', marginBottom: '6px', flexWrap: 'wrap' }}>
                    <input
                        type="text"
                        value={newKey}
                        onChange={e => setNewKey(e.target.value)}
                        placeholder="键名"
                        style={{
                            padding: '4px 8px',
                            fontSize: '11px',
                            border: '1px solid #cbd5e1',
                            borderRadius: '3px',
                            flex: '1',
                            minWidth: '80px'
                        }}
                    />
                    <select
                        value={newType}
                        onChange={e => setNewType(e.target.value)}
                        style={{
                            padding: '4px',
                            fontSize: '11px',
                            border: '1px solid #cbd5e1',
                            borderRadius: '3px'
                        }}
                    >
                        <option value="string">字符串</option>
                        <option value="number">数字</option>
                        <option value="boolean">布尔值</option>
                        <option value="json">JSON对象</option>
                        <option value="array">数组</option>
                    </select>
                </div>

                <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
                    <input
                        type="text"
                        value={newValue}
                        onChange={e => setNewValue(e.target.value)}
                        placeholder={getPlaceholderByType(newType)}
                        style={{
                            padding: '4px 8px',
                            fontSize: '11px',
                            border: '1px solid #cbd5e1',
                            borderRadius: '3px',
                            flex: '1'
                        }}
                    />
                    <button
                        onClick={handleSet}
                        style={{
                            padding: '4px 8px',
                            backgroundColor: '#0369a1',
                            color: 'white',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            fontSize: '11px'
                        }}
                    >
                        💾 设置
                    </button>
                </div>
            </div>

            {/* 搜索/获取项 */}
            <div style={{ marginBottom: '12px', padding: '8px', backgroundColor: '#ffffff', borderRadius: '4px' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#0369a1' }}>搜索存储项</h4>

                <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
                    <input
                        type="text"
                        value={searchKey}
                        onChange={e => setSearchKey(e.target.value)}
                        placeholder="输入要搜索的键名"
                        style={{
                            padding: '4px 8px',
                            fontSize: '11px',
                            border: '1px solid #cbd5e1',
                            borderRadius: '3px',
                            flex: '1'
                        }}
                    />
                    <button
                        onClick={handleGet}
                        style={{
                            padding: '4px 8px',
                            backgroundColor: '#059669',
                            color: 'white',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            fontSize: '11px'
                        }}
                    >
                        🔍 获取
                    </button>
                </div>

                {searchResult !== null && (
                    <div
                        style={{
                            padding: '6px',
                            backgroundColor: '#f0fdf4',
                            border: '1px solid #bbf7d0',
                            borderRadius: '3px',
                            fontSize: '11px',
                            color: 'black'
                        }}
                    >
                        <strong>结果:</strong> {JSON.stringify(searchResult)}
                    </div>
                )}
            </div>

            {/* 操作按钮 */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '12px', flexWrap: 'wrap' }}>
                <button
                    onClick={loadAllItems}
                    disabled={isLoading}
                    style={{
                        padding: '4px 8px',
                        backgroundColor: '#6366f1',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        fontSize: '11px'
                    }}
                >
                    🔄 刷新列表
                </button>
                <button
                    onClick={handleLength}
                    style={{
                        padding: '4px 8px',
                        backgroundColor: '#8b5cf6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        fontSize: '11px'
                    }}
                >
                    📊 获取数量
                </button>
                <button
                    onClick={handleClear}
                    style={{
                        padding: '4px 8px',
                        backgroundColor: '#dc2626',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        fontSize: '11px'
                    }}
                >
                    🗑️ 清除所有
                </button>
            </div>

            {/* 存储项列表 */}
            <div style={{ marginBottom: '8px' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#0369a1' }}>当前存储项 ({items.length})</h4>

                {isLoading ? (
                    <div style={{ textAlign: 'center', color: '#6b7280', fontSize: '11px' }}>加载中...</div>
                ) : items.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#6b7280', fontSize: '11px' }}>暂无存储数据</div>
                ) : (
                    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        {items.map((item, index) => (
                            <div
                                key={index}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '6px',
                                    backgroundColor: index % 2 === 0 ? '#f8fafc' : '#ffffff',
                                    borderRadius: '3px',
                                    marginBottom: '2px',
                                    fontSize: '11px'
                                }}
                            >
                                <div style={{ flex: '1', minWidth: '0' }}>
                                    <div style={{ fontWeight: 'bold', color: '#0f172a' }}>{item.key}</div>
                                    <div style={{ color: '#64748b', fontSize: '10px', marginTop: '2px' }}>
                                        {item.type}: {JSON.stringify(item.value).substring(0, 100)}
                                        {JSON.stringify(item.value).length > 100 && '...'}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                    <button
                                        onClick={() => handleHas(item.key)}
                                        style={{
                                            padding: '2px 6px',
                                            backgroundColor: '#10b981',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '2px',
                                            cursor: 'pointer',
                                            fontSize: '10px'
                                        }}
                                    >
                                        ✓
                                    </button>
                                    <button
                                        onClick={() => handleDelete(item.key)}
                                        style={{
                                            padding: '2px 6px',
                                            backgroundColor: '#ef4444',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '2px',
                                            cursor: 'pointer',
                                            fontSize: '10px'
                                        }}
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div style={{ fontSize: '10px', color: '#6b7280', lineHeight: '1.3' }}>
                💡 Store
                插件支持本地持久化存储，数据保存在应用数据目录中。支持字符串、数字、布尔值、JSON对象等多种数据类型。
            </div>
        </div>
    )
}

function getPlaceholderByType(type: string): string {
    switch (type) {
        case 'string':
            return '输入字符串值'
        case 'number':
            return '输入数字值，如: 42'
        case 'boolean':
            return '输入 true 或 false'
        case 'json':
            return '输入JSON对象，如: {"name": "value"}'
        case 'array':
            return '输入逗号分隔的值，如: item1,item2,item3'
        default:
            return '输入值'
    }
}

export default StoreModule
