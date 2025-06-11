/// macOS Dock 徽章管理模块
///
/// 此模块负责在 macOS 上设置和管理 Dock 图标的徽章显示以及处理 Dock 点击事件

#[cfg(target_os = "macos")]
use cocoa::appkit::NSApp;
#[cfg(target_os = "macos")]
use cocoa::base::nil;
#[cfg(target_os = "macos")]
use cocoa::foundation::NSString;
#[cfg(target_os = "macos")]
use objc::{msg_send, sel, sel_impl};

/// 设置 macOS Dock 徽章
///
/// # 参数
/// - `count`: 要显示的未读数，如果为 0 则清除徽章
#[cfg(target_os = "macos")]
pub fn set_dock_badge(count: u32) {
    unsafe {
        // unsafe 块：包含不安全的代码，这里是为了调用 Objective-C 运行时
        let label = if count > 0 {
            // 创建包含数字的 NSString 对象
            // alloc: 分配内存, init_str: 用字符串初始化
            // .to_string(): 将数字转换为 Rust 字符串
            NSString::alloc(nil).init_str(&count.to_string())
        } else {
            // 创建空 NSString 对象（清除徽章）
            NSString::alloc(nil).init_str("")
        };
        // msg_send! 是宏，用于发送 Objective-C 消息
        // 获取应用的 dock 图标对象
        let dock_tile: cocoa::base::id = msg_send![NSApp(), dockTile];
        // 设置徽章标签
        // _: () 表示忽略返回值
        let _: () = msg_send![dock_tile, setBadgeLabel: label];
    }
}

/// 非 macOS 平台的空实现
#[cfg(not(target_os = "macos"))]
pub fn set_dock_badge(_count: u32) {
    // 在非macOS平台上不执行任何操作
    // 参数名前的下划线(_count)表示该参数未使用，避免编译器警告
}

/// 设置 macOS Dock 点击事件处理
///
/// 在 Tauri 应用设置中注册回调，当用户点击 Dock 图标时显示主窗口
/// 
/// # 参数
/// - `app`: Tauri 应用实例
#[cfg(target_os = "macos")]
pub fn setup_dock_event_handler(_app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    // 由于 Tauri v2 中 Dock 事件处理比较复杂，我们将在 app_config.rs 中
    // 使用运行时事件监听器来处理应用重新激活
    // 这里只是一个占位函数，实际的 Dock 事件处理将在 lib.rs 中实现
    Ok(())
}

/// 非 macOS 平台的空实现
#[cfg(not(target_os = "macos"))]
pub fn setup_dock_event_handler(_app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    // 在非 macOS 平台上不执行任何操作
    Ok(())
}
