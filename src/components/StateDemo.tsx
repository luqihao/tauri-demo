import { useState } from 'react'
import { observer } from 'mobx-react-lite'
import { globalStore } from '../stores/GlobalStore'

const StateDemo = observer(() => {
    const [newTodo, setNewTodo] = useState('')
    const [newMessage, setNewMessage] = useState('')

    const handleAddTodo = async () => {
        if (newTodo.trim()) {
            await globalStore.addTodo(newTodo.trim())
            setNewTodo('')
        }
    }

    const handleUpdateMessage = async () => {
        if (newMessage.trim()) {
            await globalStore.updateMessage(newMessage.trim())
            setNewMessage('')
        }
    }

    return (
        <div
            style={{
                padding: '20px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                margin: '20px 0',
                backgroundColor: '#000000'
            }}
        >
            <h3>🔄 多窗口状态同步演示</h3>

            {/* 计数器演示 */}
            <div style={{ marginBottom: '20px' }}>
                <h4>计数器: {globalStore.counter}</h4>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={() => globalStore.incrementCounter()}
                        style={{
                            padding: '8px 16px',
                            background: '#4CAF50',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        增加 (+1)
                    </button>
                    <button
                        onClick={() => globalStore.decrementCounter()}
                        style={{
                            padding: '8px 16px',
                            background: '#f44336',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        减少 (-1)
                    </button>
                </div>
            </div>

            {/* 消息演示 */}
            <div style={{ marginBottom: '20px' }}>
                <h4>当前消息: "{globalStore.message}"</h4>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input
                        type="text"
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        placeholder="输入新消息..."
                        style={{
                            padding: '8px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            minWidth: '200px'
                        }}
                        onKeyPress={e => e.key === 'Enter' && handleUpdateMessage()}
                    />
                    <button
                        onClick={handleUpdateMessage}
                        style={{
                            padding: '8px 16px',
                            background: '#2196F3',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        更新消息
                    </button>
                </div>
            </div>

            {/* 待办事项演示 */}
            <div>
                <h4>待办事项 ({globalStore.todos.length})</h4>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                    <input
                        type="text"
                        value={newTodo}
                        onChange={e => setNewTodo(e.target.value)}
                        placeholder="添加新的待办事项..."
                        style={{
                            padding: '8px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            minWidth: '200px'
                        }}
                        onKeyPress={e => e.key === 'Enter' && handleAddTodo()}
                    />
                    <button
                        onClick={handleAddTodo}
                        style={{
                            padding: '8px 16px',
                            background: '#FF9800',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        添加
                    </button>
                </div>

                {globalStore.todos.length > 0 && (
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {globalStore.todos.map((todo, index) => (
                            <li
                                key={index}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '8px',
                                    background: 'white',
                                    margin: '4px 0',
                                    borderRadius: '4px',
                                    border: '1px solid #eee'
                                }}
                            >
                                <span>{todo}</span>
                                <button
                                    onClick={() => globalStore.removeTodo(index)}
                                    style={{
                                        padding: '4px 8px',
                                        background: '#f44336',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '3px',
                                        cursor: 'pointer',
                                        fontSize: '12px'
                                    }}
                                >
                                    删除
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div
                style={{
                    marginTop: '15px',
                    padding: '10px',
                    border: '1px solid #e3f2fd',
                    borderRadius: '4px',
                    fontSize: '14px'
                }}
            >
                💡 <strong>测试说明：</strong> 打开多个窗口，在任意窗口中修改状态，观察其他窗口的实时同步效果
            </div>
        </div>
    )
})

export default StateDemo
