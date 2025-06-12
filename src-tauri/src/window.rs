use tauri::Manager;

/// 窗口管理相关功能模块
///
/// 提供窗口显示、隐藏、标题更新等功能
/// 这个模块封装了与窗口操作相关的所有逻辑，避免重复代码

/// 更新窗口标题显示未读数
///
/// 这个函数会根据未读消息数量来动态更新主窗口的标题
/// 如果有未读消息，会在标题中显示红色圆点和未读数量
/// 如果没有未读消息，显示普通的应用标题
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
    // 使用工具函数获取主窗口，避免重复的窗口获取逻辑
    if let Some(window) = app.get_webview_window("main") {
        // 根据未读数量创建不同的窗口标题
        let window_title = if count > 0 {
            format!("🔴 Demo ({} 条未读)", count)
        } else {
            "Demo".to_string()
        };
        // 设置窗口标题，忽略可能的错误
        // 这里使用 let _ = 是因为窗口标题设置失败通常不会影响应用程序的核心功能
        let _ = window.set_title(&window_title);
    }
    Ok(())
}

/// 显示主窗口并设置焦点
///
/// 这个函数用于显示主窗口并将其置于前台
/// 通常在用户点击托盘图标或 Dock 图标时调用
///
/// # 参数
/// - `app`: Tauri 应用句柄
pub fn show_main_window(app: &tauri::AppHandle) {
    // 获取名为 "main" 的 WebView 窗口
    // get_webview_window 返回 Option<WebviewWindow>
    if let Some(window) = app.get_webview_window("main") {
        println!("显示主窗口并设置焦点");
        // show() 显示窗口，如果窗口已经显示则无效果
        let _ = window.show();
        // set_focus() 将焦点设置到窗口，使其成为活动窗口
        let _ = window.set_focus();
        // unminimize() 如果窗口被最小化则取消最小化
        let _ = window.unminimize();
        println!("主窗口已显示并获得焦点");
    } else {
        println!("警告：无法找到名为 'main' 的窗口");
    }
}

/// 隐藏主窗口
///
/// 这个函数用于隐藏主窗口而不关闭应用程序
/// 隐藏后应用程序继续在后台运行，可以通过系统托盘或 Dock 图标访问
///
/// # 参数
/// - `app`: Tauri 应用句柄
pub fn hide_main_window(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        println!("隐藏主窗口");
        // hide() 隐藏窗口但不关闭应用程序
        // 这与 close() 不同，close() 会关闭窗口并可能退出应用
        let _ = window.hide();
        println!("主窗口已隐藏");
    } else {
        println!("警告：无法找到名为 'main' 的窗口");
    }
}

/// 切换主窗口显示状态
///
/// 这个函数会检查主窗口当前的可见性状态：
/// - 如果窗口当前可见，则隐藏它
/// - 如果窗口当前隐藏，则显示并设置焦点
///
/// 这是用户点击托盘图标时的常见行为
///
/// # 参数
/// - `app`: Tauri 应用句柄
pub fn toggle_main_window(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        // 检查窗口是否可见
        // is_visible() 返回 Result<bool, Error>
        // unwrap_or(false) 表示如果获取可见性状态失败，则假设窗口不可见
        if window.is_visible().unwrap_or(false) {
            // 窗口当前可见，隐藏它
            hide_main_window(app);
        } else {
            // 窗口当前隐藏，显示它
            show_main_window(app);
        }
    }
}
