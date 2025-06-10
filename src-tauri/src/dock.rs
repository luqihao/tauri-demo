/// macOS Dock 徽章管理模块
/// 
/// 此模块负责在 macOS 上设置和管理 Dock 图标的徽章显示

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
