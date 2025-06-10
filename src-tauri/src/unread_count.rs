use std::sync::{Arc, Mutex};

/// 全局状态管理未读数
#[derive(Debug, Default)]
pub struct UnreadCount {
    /// Arc<Mutex<T>> 是 Rust 中处理并发访问的常用模式：
    /// - Arc(Atomic Reference Counting): 允许多个线程安全地共享所有权
    /// - Mutex: 确保一次只有一个线程可以修改数据
    pub count: Arc<Mutex<u32>>, // u32 是无符号 32 位整数，用于存储未读消息数量
}

impl UnreadCount {
    /// 创建新的未读数实例
    pub fn new() -> Self {
        Self::default()
    }

    /// 获取当前未读数
    pub fn get(&self) -> Result<u32, String> {
        self.count.lock().map(|count| *count).map_err(|e| e.to_string())
    }

    /// 设置未读数
    pub fn set(&self, value: u32) -> Result<u32, String> {
        let mut count = self.count.lock().map_err(|e| e.to_string())?;
        *count = value;
        Ok(*count)
    }

    /// 增加未读数
    pub fn increment(&self) -> Result<u32, String> {
        let mut count = self.count.lock().map_err(|e| e.to_string())?;
        *count += 1;
        Ok(*count)
    }

    /// 清零未读数
    pub fn clear(&self) -> Result<u32, String> {
        self.set(0)
    }
}
