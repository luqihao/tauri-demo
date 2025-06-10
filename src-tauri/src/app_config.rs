use crate::{tray, window};

/// 应用程序配置和初始化模块
/// 
/// 负责应用程序的插件配置、事件处理器设置等

/// 配置所有 Tauri 插件
/// 
/// # 参数
/// - `builder`: Tauri Builder 实例
/// 
/// # 返回值
/// - 配置好插件的 Builder 实例
pub fn configure_plugins(
    builder: tauri::Builder<tauri::Wry>,
) -> tauri::Builder<tauri::Wry> {
    builder
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        // 单实例插件 - 防止多个应用实例同时运行
        .plugin(tauri_plugin_single_instance::init(|app, _argv, _cwd| {
            // 这个回调会在尝试启动第二个应用实例时触发
            // app: 应用程序的 AppHandle
            // _argv: 启动第二个实例时的命令行参数 (已添加下划线前缀表示有意未使用)
            // _cwd: 启动第二个实例时的当前工作目录 (已添加下划线前缀表示有意未使用)

            // 当尝试启动第二个实例时，显示主窗口并将其置于前台
            window::show_main_window(&app);
        }))
        .plugin(tauri_plugin_upload::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent, // macOS下使用LaunchAgent方式
            None, // 不指定额外的启动参数
        ))
        .plugin(tauri_plugin_window_state::Builder::new().build())
        .plugin(tauri_plugin_opener::init()) // 用于打开外部 URL
        .plugin(tauri_plugin_dialog::init()) // 用于显示文件对话框
        .plugin(tauri_plugin_clipboard_manager::init()) // 用于粘贴板操作
        
}

/// 设置应用程序初始化逻辑
/// 
/// # 参数
/// - `app`: Tauri 应用实例
/// 
/// # 返回值
/// - `Ok(())`: 初始化成功
/// - `Err(Box<dyn std::error::Error>)`: 初始化失败
pub fn setup_app(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    // 创建系统托盘图标
    tray::create_tray_icon(app.handle())?;

    Ok(())
}

/// 设置托盘图标事件处理器
/// 
/// # 参数
/// - `app`: Tauri 应用句柄
/// - `event`: 托盘图标事件
pub fn handle_tray_event(app: &tauri::AppHandle, event: tauri::tray::TrayIconEvent) {
    tray::handle_tray_icon_event(app, event);
}

/// 设置菜单事件处理器
/// 
/// # 参数
/// - `app`: Tauri 应用句柄
/// - `event`: 菜单事件
pub fn handle_menu_event(app: &tauri::AppHandle, event: tauri::menu::MenuEvent) {
    tray::handle_menu_event(app, event);
}
