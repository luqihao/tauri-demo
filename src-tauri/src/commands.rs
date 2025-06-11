use tauri::State;

use crate::{tray, unread_count::UnreadCount};

/// Tauri 命令处理模块
///
/// 包含所有可从前端调用的 Tauri 命令函数

/// 问候命令 - 示例命令
///
/// # 参数
/// - `name`: 要问候的名字
///
/// # 返回值
/// - 包含问候信息的字符串
#[tauri::command]
pub fn greet(name: &str) -> String {
    // format! 是 Rust 的格式化宏，类似其他语言的 sprintf
    // 使用 {} 作为占位符，会被 name 参数的值替换
    format!("Hello, {}! You've been greeted from Rust!", name)
}

/// 增加未读数命令
///
/// # 参数
/// - `state`: 应用状态中的未读数管理器
/// - `app`: Tauri 应用句柄
///
/// # 返回值
/// - `Ok(u32)`: 操作成功，返回新的未读数
/// - `Err(String)`: 操作失败，返回错误信息
#[tauri::command]
pub fn increment_unread(state: State<UnreadCount>, app: tauri::AppHandle) -> Result<u32, String> {
    // 增加未读数
    let new_count = state.increment()?;

    // 更新托盘图标标题显示未读数
    tray::update_tray_title(&app, new_count)?;

    Ok(new_count)
}

/// 获取当前未读数命令
///
/// # 参数
/// - `state`: 应用状态中的未读数管理器
///
/// # 返回值
/// - `Ok(u32)`: 操作成功，返回当前未读数
/// - `Err(String)`: 操作失败，返回错误信息
#[tauri::command]
pub fn get_unread_count(state: State<UnreadCount>) -> Result<u32, String> {
    state.get()
}

/// 清除未读数命令
///
/// # 参数
/// - `state`: 应用状态中的未读数管理器
/// - `app`: Tauri 应用句柄
///
/// # 返回值
/// - `Ok(u32)`: 操作成功，返回新的未读数（应该是0）
/// - `Err(String)`: 操作失败，返回错误信息
#[tauri::command]
pub fn clear_unread(state: State<UnreadCount>, app: tauri::AppHandle) -> Result<u32, String> {
    // 清除未读数
    let new_count = state.clear()?;

    // 更新托盘图标标题和其他 UI 元素，显示没有未读消息
    tray::update_tray_title(&app, new_count)?;

    Ok(new_count)
}
