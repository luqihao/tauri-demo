// 模块声明
// 在 Rust 中，模块系统用于组织代码
// mod 关键字声明一个模块，这里声明的模块对应同名的 .rs 文件
mod app_config; // 应用程序配置和插件管理
mod commands; // Tauri 命令处理函数
mod device_id; // 设备标识信息获取
mod dock; // macOS Dock 徽章管理
mod pb; // Protobuf 消息处理
mod tray; // 系统托盘管理
mod unread_count; // 未读消息数量状态管理
pub mod utils; // 通用工具函数
mod window; // 窗口管理功能

// 导入必要的 trait
use tauri::Manager;

// 重新导出主要模块
// pub use 将模块中的类型重新导出，使其可以在库的根级别访问
// 这样外部代码就可以直接使用 demo_lib::UnreadCount 而不是 demo_lib::unread_count::UnreadCount
pub use unread_count::UnreadCount;
pub use pb::*; // 导出所有 protobuf 类型

/// Tauri 应用程序的主入口函数
///
/// 这个函数负责创建、配置和运行整个 Tauri 应用程序
/// 它使用 Builder 模式来逐步构建应用程序的各个组件
///
/// # 功能概述
/// 1. 创建和管理应用程序状态（未读数管理）
/// 2. 配置所有必要的 Tauri 插件
/// 3. 注册命令处理函数，使前端可以调用后端功能
/// 4. 设置事件处理器（托盘、菜单、窗口事件）
/// 5. 处理平台特定的功能（如 macOS 的 Dock 事件）
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // 创建默认的 UnreadCount 实例
    // 这个实例将作为全局状态在整个应用程序中共享
    let unread_count = UnreadCount::new();

    // 使用 Builder 模式创建并配置 Tauri 应用
    let builder = tauri::Builder::default();

    // 配置所有插件
    // 插件为 Tauri 应用程序提供额外的功能，如文件系统访问、HTTP 请求等
    let builder = app_config::configure_plugins(builder);

    let app = builder
        // 使用 manage 将状态添加到应用程序中，使其可在各命令间共享
        // 这样所有的命令函数都可以通过 State<UnreadCount> 参数访问这个状态
        .manage(unread_count)
        // 设置应用程序初始化函数，在应用启动时调用
        .setup(app_config::setup_app)
        // 设置系统托盘图标事件处理器
        .on_tray_icon_event(app_config::handle_tray_event)
        // 设置托盘菜单事件处理器
        .on_menu_event(app_config::handle_menu_event)
        // 注册可以从前端调用的命令处理函数
        // generate_handler! 宏会生成必要的代码来路由前端调用到这些函数
        .invoke_handler(tauri::generate_handler![
            // 注册可以从前端调用的命令处理函数
            commands::greet,            // 处理问候功能
            commands::increment_unread, // 增加未读消息数
            commands::get_unread_count, // 获取当前未读消息数
            commands::clear_unread,     // 清除未读消息数
            device_id::get_device_info, // 获取设备信息
            // Protobuf 相关命令
            commands::create_event_message,  // 创建事件消息
            commands::parse_event_message,   // 解析事件消息
            commands::create_message_send,   // 创建发送消息
            commands::parse_message_send,    // 解析发送消息
        ])
        // 构建应用程序
        .build(tauri::generate_context!())
        // 如果应用程序构建失败，显示错误信息并终止程序
        // expect 会在 Result 为 Err 时 panic，并显示指定的错误信息
        .expect("error while building tauri application");

    // 运行应用程序，并设置全局事件处理
    // 这里统一处理所有平台的事件，包括 macOS 的 Dock 点击事件
    app.run(|app_handle, event| {
        match event {
            // macOS 特定：当用户点击 Dock 图标重新打开应用时触发
            #[cfg(target_os = "macos")]
            tauri::RunEvent::Reopen { .. } => {
                // 修复：无论是否有其他可见窗口，只要主窗口隐藏就显示它
                // 这样解决了当存在多个窗口时，主窗口隐藏后无法通过 Dock 图标恢复的问题
                if let Some(main_window) = app_handle.get_webview_window("main") {
                    // 检查主窗口是否隐藏
                    // is_visible() 返回 Result<bool, Error>，如果出错则假设窗口不可见
                    if !main_window.is_visible().unwrap_or(false) {
                        println!("Dock 图标被点击，恢复隐藏的主窗口");
                        crate::window::show_main_window(app_handle);
                    } else {
                        // 如果主窗口已经可见，则将其置于前台
                        println!("Dock 图标被点击，主窗口已可见，将其置于前台");
                        let _ = main_window.set_focus();
                    }
                } else {
                    // 如果主窗口不存在（这种情况很少见），尝试显示它
                    println!("Dock 图标被点击，但主窗口不存在，尝试显示");
                    crate::window::show_main_window(app_handle);
                }
            }
            _ => {}
        }
    });
}
