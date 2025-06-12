use std::sync::{Arc, Mutex};

/// 全局状态管理未读数
///
/// 这个结构体用于在整个应用程序中管理未读消息的数量
/// 它使用线程安全的方式来存储和操作未读数，确保在多线程环境下的数据一致性
#[derive(Debug, Default)]
pub struct UnreadCount {
    /// Arc<Mutex<T>> 是 Rust 中处理并发访问的常用模式：
    /// - Arc(Atomic Reference Counting): 允许多个线程安全地共享所有权
    ///   Arc 是一个智能指针，它通过引用计数来管理内存，当最后一个引用被删除时自动释放内存
    /// - Mutex: 互斥锁，确保一次只有一个线程可以修改数据
    ///   Mutex 提供了互斥访问，避免了数据竞争和不一致的状态
    /// - u32: 无符号 32 位整数，用于存储未读消息数量（范围: 0 到 4,294,967,295）
    pub count: Arc<Mutex<u32>>,
}

impl UnreadCount {
    /// 创建新的未读数实例
    ///
    /// 使用 Self::default() 创建一个新实例，计数器初始值为 0
    ///
    /// # 返回值
    /// - 新的 UnreadCount 实例
    pub fn new() -> Self {
        Self::default()
    }

    /// 获取当前未读数
    ///
    /// 这个方法会锁定互斥锁以安全地读取未读数的值
    ///
    /// # 返回值
    /// - `Ok(u32)`: 成功获取未读数
    /// - `Err(String)`: 获取失败，通常是因为互斥锁被毒化（poisoned）
    pub fn get(&self) -> Result<u32, String> {
        // 尝试获取互斥锁
        // lock() 方法返回 Result<MutexGuard<u32>, PoisonError<MutexGuard<u32>>>
        self.count
            .lock() // 获取互斥锁
            .map(|count| *count) // 解引用获取实际的 u32 值
            .map_err(|e| e.to_string()) // 将错误转换为 String
    }

    /// 增加未读数
    ///
    /// 这个方法会将未读数增加 1
    /// 它使用互斥锁来确保操作的原子性，防止并发修改导致的数据不一致
    ///
    /// # 返回值
    /// - `Ok(u32)`: 成功增加，返回新的未读数
    /// - `Err(String)`: 操作失败，通常是因为互斥锁被毒化
    pub fn increment(&self) -> Result<u32, String> {
        // 获取互斥锁的可变引用
        // ? 操作符：如果 lock() 失败，立即返回错误
        let mut count = self.count.lock().map_err(|e| e.to_string())?;

        // 增加计数器的值
        // *count 解引用 MutexGuard 以获取对 u32 的可变引用
        *count += 1;

        // 返回新的计数值
        Ok(*count)
    }

    /// 清零未读数
    ///
    /// 这个方法会将未读数重置为 0
    /// 通常在用户查看了所有未读消息后调用
    ///
    /// # 返回值
    /// - `Ok(u32)`: 操作成功，返回清零后的数值（总是0）
    /// - `Err(String)`: 操作失败，包含错误信息
    pub fn clear(&self) -> Result<u32, String> {
        // 直接设置为0而不是调用已删除的set方法
        let mut count = self.count.lock().map_err(|e| e.to_string())?;
        *count = 0;
        Ok(*count)
    }
}
