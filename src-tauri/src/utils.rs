/// 工具函数模块
///
/// 包含应用程序中经常使用的通用工具函数和类型别名
/// 这个模块主要提供事件发送和错误处理的通用功能
use tauri::Emitter;

/// 应用程序通用错误类型别名
///
/// 使用 String 作为错误类型，便于错误信息的传递和显示
/// 这样所有的错误都可以统一处理，简化错误处理逻辑
pub type AppResult<T> = Result<T, String>;

/// 发送未读数变化事件到前端
///
/// 这个函数封装了向前端发送事件的逻辑，确保前后端状态同步
/// 当未读数发生变化时，前端可以通过监听 "unread-count-changed" 事件来更新 UI
///
/// # 参数
/// - `app`: Tauri 应用句柄的引用
/// - `count`: 新的未读数
///
/// # 返回值
/// - `Ok(())`: 事件发送成功
/// - `Err(String)`: 事件发送失败，包含错误信息
pub fn emit_unread_count_changed(app: &tauri::AppHandle, count: u32) -> AppResult<()> {
    // 发送事件到前端
    // "unread-count-changed" 是事件名称，前端可以监听这个事件
    // count 是事件携带的数据，前端可以通过事件处理器获取这个值
    app.emit("unread-count-changed", count)
        .map_err(|e| e.to_string()) // 将 Tauri 错误转换为字符串
}
