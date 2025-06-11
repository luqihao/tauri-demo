use tauri::Manager;

/// 窗口管理相关功能模块
///
/// 提供窗口显示、隐藏、标题更新等功能

/// 更新窗口标题显示未读数
///
/// # 参数
/// - `app`: Tauri 应用句柄
/// - `count`: 未读消息数量
///
/// # 返回值
/// - `Ok(())`: 操作成功
/// - `Err(String)`: 操作失败，包含错误信息
pub fn update_window_title(app: &tauri::AppHandle, count: u32) -> Result<(), String> {
    // 更新窗口标题显示未读数
    // get_webview_window 尝试获取指定名称的窗口
    if let Some(window) = app.get_webview_window("main") {
        // 根据未读数量创建不同的窗口标题
        let window_title = if count > 0 {
            format!("🔴 Demo ({} 条未读)", count)
        } else {
            "Demo".to_string()
        };
        // 设置窗口标题，忽略可能的错误
        let _ = window.set_title(&window_title);
    }
    Ok(())
}

/// 显示主窗口并设置焦点
///
/// # 参数
/// - `app`: Tauri 应用句柄
pub fn show_main_window(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.set_focus();
    }
}

/// 隐藏主窗口
///
/// # 参数
/// - `app`: Tauri 应用句柄
pub fn hide_main_window(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.hide();
    }
}

/// 切换主窗口显示状态
///
/// # 参数
/// - `app`: Tauri 应用句柄
pub fn toggle_main_window(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        // 检查窗口是否可见
        if window.is_visible().unwrap_or(false) {
            hide_main_window(app);
        } else {
            show_main_window(app);
        }
    }
}
