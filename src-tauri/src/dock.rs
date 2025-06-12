/// macOS Dock 徽章管理模块
///
/// 此模块负责在 macOS 上设置和管理 Dock 图标的徽章显示以及处理 Dock 点击事件
/// Dock 徽章是显示在应用图标右上角的红色小圆圈，通常用来显示未读消息数量
///
/// 在其他平台上，这些函数会提供空实现，确保代码的跨平台兼容性

// 只在 macOS 平台上导入 Objective-C 相关的库
// 这些库用于与 macOS 系统的 Objective-C 运行时交互
#[cfg(target_os = "macos")]
use cocoa::appkit::NSApp; // NSApp 是 macOS 应用程序的单例对象
#[cfg(target_os = "macos")]
use cocoa::base::nil; // nil 是 Objective-C 中的空对象指针
#[cfg(target_os = "macos")]
use cocoa::foundation::NSString; // NSString 是 Objective-C 的字符串类
#[cfg(target_os = "macos")]
use objc::{msg_send, sel, sel_impl}; // objc 提供了 Rust 调用 Objective-C 的宏

/// 设置 macOS Dock 徽章
///
/// 这个函数在 macOS 上设置应用程序 Dock 图标的徽章数字
/// 徽章是一个红色的小圆圈，显示在应用图标的右上角
///
/// # 参数
/// - `count`: 要显示的未读数，如果为 0 则清除徽章
///
/// # 实现细节
/// 使用 Objective-C 运行时来调用 macOS 系统 API
/// 通过 NSApp 获取应用的 dock tile，然后设置徽章标签
#[cfg(target_os = "macos")]
pub fn set_dock_badge(count: u32) {
    unsafe {
        // unsafe 块：包含不安全的代码，这里是为了调用 Objective-C 运行时
        // Rust 编译器无法验证 Objective-C 调用的安全性，所以需要 unsafe
        let label = if count > 0 {
            // 创建包含数字的 NSString 对象
            // alloc: 分配内存, init_str: 用字符串初始化
            // .to_string(): 将数字转换为 Rust 字符串
            NSString::alloc(nil).init_str(&count.to_string())
        } else {
            // 创建空 NSString 对象（清除徽章）
            // 空字符串会清除 Dock 徽章的显示
            NSString::alloc(nil).init_str("")
        };
        // msg_send! 是宏，用于发送 Objective-C 消息
        // 这是 Rust 与 Objective-C 运行时交互的标准方式
        // 获取应用的 dock 图标对象
        let dock_tile: cocoa::base::id = msg_send![NSApp(), dockTile];
        // 设置徽章标签
        // _: () 表示忽略返回值，因为我们不需要处理 setBadgeLabel 的返回值
        let _: () = msg_send![dock_tile, setBadgeLabel: label];
    }
}

/// 非 macOS 平台的空实现
///
/// 在其他操作系统上，不存在 Dock 的概念，所以这个函数什么也不做
/// 这样的设计保证了代码的跨平台兼容性
#[cfg(not(target_os = "macos"))]
pub fn set_dock_badge(_count: u32) {
    // 在非macOS平台上不执行任何操作
    // 参数名前的下划线(_count)表示该参数未使用，避免编译器警告
    // 这是 Rust 的惯例，用来标记有意未使用的参数
}

/// 设置 macOS Dock 点击事件处理
///
/// 注意：在 Tauri v2 中，Dock 点击事件通过全局运行时事件处理
/// 实际的事件处理逻辑在 lib.rs 的 app.run() 中实现
/// 这个函数保留用于未来可能的扩展或其他 Dock 相关设置
///
/// # 参数
/// - `app`: Tauri 应用实例
#[cfg(target_os = "macos")]
pub fn setup_dock_event_handler(_app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    // Tauri v2 中 Dock 事件处理已经在 lib.rs 的 RunEvent::Reopen 中实现
    // 这里保留接口以备将来扩展使用
    // 例如：可以在这里添加其他 macOS 特定的 Dock 设置
    println!("macOS Dock 事件处理器已在运行时事件中配置");
    Ok(())
}

/// 非 macOS 平台的空实现
#[cfg(not(target_os = "macos"))]
pub fn setup_dock_event_handler(_app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    // 在非 macOS 平台上不执行任何操作
    Ok(())
}
