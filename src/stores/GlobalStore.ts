import { makeAutoObservable } from 'mobx'
import { emit, listen } from '@tauri-apps/api/event'

export class GlobalStore {
    // 示例状态
    counter = 0
    message = 'Hello from MobX!'
    todos: string[] = []

    constructor() {
        makeAutoObservable(this)
        this.setupEventListeners()
    }

    // 设置事件监听器，监听来自其他窗口的状态更新
    private async setupEventListeners() {
        // 监听计数器更新事件
        await listen('counter-updated', (event: any) => {
            this.counter = event.payload.counter
        })

        // 监听消息更新事件
        await listen('message-updated', (event: any) => {
            this.message = event.payload.message
        })

        // 监听待办事项更新事件
        await listen('todos-updated', (event: any) => {
            this.todos = event.payload.todos
        })
    }

    // 增加计数器并同步到其他窗口
    async incrementCounter() {
        this.counter += 1
        await this.syncCounterToOtherWindows()
    }

    // 减少计数器并同步到其他窗口
    async decrementCounter() {
        this.counter -= 1
        await this.syncCounterToOtherWindows()
    }

    // 更新消息并同步到其他窗口
    async updateMessage(newMessage: string) {
        this.message = newMessage
        await this.syncMessageToOtherWindows()
    }

    // 添加待办事项并同步到其他窗口
    async addTodo(todo: string) {
        this.todos.push(todo)
        await this.syncTodosToOtherWindows()
    }

    // 删除待办事项并同步到其他窗口
    async removeTodo(index: number) {
        this.todos.splice(index, 1)
        await this.syncTodosToOtherWindows()
    }

    // 同步计数器到其他窗口
    private async syncCounterToOtherWindows() {
        try {
            await emit('counter-updated', { counter: this.counter })
        } catch (error) {
            console.error('Failed to sync counter:', error)
        }
    }

    // 同步消息到其他窗口
    private async syncMessageToOtherWindows() {
        try {
            await emit('message-updated', { message: this.message })
        } catch (error) {
            console.error('Failed to sync message:', error)
        }
    }

    // 同步待办事项到其他窗口
    private async syncTodosToOtherWindows() {
        try {
            await emit('todos-updated', { todos: this.todos })
        } catch (error) {
            console.error('Failed to sync todos:', error)
        }
    }
}

// 创建全局 store 实例
export const globalStore = new GlobalStore()
