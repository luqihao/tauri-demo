// 模块声明
mod app_config;
mod commands;
mod device_id;
mod dock;
mod tray;
mod unread_count;
mod window;

// 重新导出主要模块
pub use unread_count::UnreadCount;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // 创建默认的 UnreadCount 实例
    let unread_count = UnreadCount::new();

    // 使用 Builder 模式创建并配置 Tauri 应用
    let builder = tauri::Builder::default();

    // 配置所有插件
    let builder = app_config::configure_plugins(builder);

    let app = builder
        // 使用 manage 将状态添加到应用程序中，使其可在各命令间共享
        .manage(unread_count)
        .setup(app_config::setup_app)
        .on_tray_icon_event(app_config::handle_tray_event)
        .on_menu_event(app_config::handle_menu_event)
        .invoke_handler(tauri::generate_handler![
            // 注册可以从前端调用的命令处理函数
            commands::greet,            // 处理问候功能
            commands::increment_unread, // 增加未读消息数
            commands::get_unread_count, // 获取当前未读消息数
            commands::clear_unread,     // 清除未读消息数
            device_id::get_device_info  // 获取设备信息
        ])
        // 构建应用程序
        .build(tauri::generate_context!())
        // 如果应用程序构建失败，显示错误信息并终止程序
        .expect("error while building tauri application");

    // 在 macOS 上设置 Dock 点击事件处理
    #[cfg(target_os = "macos")]
    {
        let app_handle = app.handle().clone();
        app.run(move |_app_handle, event| {
            match event {
                tauri::RunEvent::Reopen {
                    has_visible_windows,
                    ..
                } => {
                    // 当用户点击 Dock 图标重新打开应用时触发
                    if !has_visible_windows {
                        // 如果没有可见窗口，显示主窗口
                        crate::window::show_main_window(&app_handle);
                    }
                }
                _ => {}
            }
        });
    }

    // 在非 macOS 平台上直接运行应用程序
    #[cfg(not(target_os = "macos"))]
    {
        app.run(|_app_handle, _event| {});
    }
}
