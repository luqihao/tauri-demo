use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager, Runtime,
};

use crate::{dock, unread_count::UnreadCount, window};

/// 系统托盘管理模块
///
/// 负责创建托盘图标、菜单，处理托盘事件，更新托盘显示等功能

/// 更新托盘标题、提示和相关 UI 元素
///
/// # 参数
/// - `app`: Tauri 应用句柄引用
/// - `count`: 未读消息数量
///
/// # 返回值
/// - `Ok(())`: 操作成功
/// - `Err(String)`: 操作失败，包含错误信息
pub fn update_tray_title(app: &tauri::AppHandle, count: u32) -> Result<(), String> {
    // 更新托盘提示和标题
    // app.tray_by_id 尝试获取指定 ID 的托盘图标
    // if let Some(tray) = ... 是模式匹配，当找到托盘时执行大括号中的代码
    if let Some(tray) = app.tray_by_id("main-tray") {
        // 根据未读数量创建不同的标题文本
        let title = if count > 0 {
            format!("Demo {}", count) // 在标题中显示未读数
        } else {
            "Demo".to_string() // 没有未读消息时显示普通标题
        };

        // 根据未读数量创建不同的提示文本
        let tooltip = if count > 0 {
            format!("🔴 Demo - {} 条未读消息", count)
        } else {
            "✅ Demo - 没有未读消息".to_string()
        };

        // 设置托盘标题（在某些平台可见）
        // Some(&title) 创建 Option 类型，包含 title 的引用
        // map_err 将可能的错误转换为字符串
        // ? 操作符：如果操作失败，立即返回错误
        tray.set_title(Some(&title)).map_err(|e| e.to_string())?;

        // 设置鼠标悬停提示
        tray.set_tooltip(Some(&tooltip))
            .map_err(|e| e.to_string())?;
    }

    // 更新窗口标题
    window::update_window_title(app, count)?;

    // 在macOS上设置Dock徽章
    dock::set_dock_badge(count);

    // 返回成功结果
    Ok(())
}

/// 创建托盘菜单
///
/// # 参数
/// - `app`: Tauri 应用句柄引用
///
/// # 返回值
/// - `Ok(Menu<R>)`: 创建成功，返回菜单对象
/// - `Err(tauri::Error)`: 创建失败，返回错误
pub fn create_tray_menu<R: Runtime>(app: &tauri::AppHandle<R>) -> Result<Menu<R>, tauri::Error> {
    // 创建菜单项: MenuItem::with_id 参数分别是:
    // app: 应用句柄，用于绑定菜单项到应用
    // id: 菜单项唯一标识符，用于处理点击事件
    // title: 菜单项显示的文本
    // enabled: 菜单项是否可点击
    // None::<&str>: 没有快捷键 (类型注解用于指定 None 的类型)
    // ? 运算符: 如果创建菜单项返回错误，则提前返回错误
    let show_item = MenuItem::with_id(app, "show", "显示窗口", true, None::<&str>)?;
    let increment_item =
        MenuItem::with_id(app, "increment", "增加未读数 (+1)", true, None::<&str>)?;
    let clear_item = MenuItem::with_id(app, "clear", "清除未读数", true, None::<&str>)?;
    let quit_item = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;

    // 将菜单项组合成一个菜单并返回
    // &[&item1, &item2] 创建了一个切片，包含对所有菜单项的引用
    Menu::with_items(app, &[&show_item, &increment_item, &clear_item, &quit_item])
}

/// 创建系统托盘图标
///
/// # 参数
/// - `app`: Tauri 应用句柄引用
///
/// # 返回值
/// - `Ok(())`: 创建成功
/// - `Err(tauri::Error)`: 创建失败
pub fn create_tray_icon(app: &tauri::AppHandle) -> Result<(), tauri::Error> {
    // 创建托盘菜单
    let menu = create_tray_menu(app)?;

    // 创建托盘图标
    // TrayIconBuilder 使用构建器模式来设置托盘图标的各种属性
    let _tray = TrayIconBuilder::with_id("main-tray")
        .menu(&menu) // 设置托盘菜单
        .tooltip("Demo") // 设置鼠标悬停提示
        .title("Demo") // 添加标题，可以在某些平台显示文字
        .icon(app.default_window_icon().unwrap().clone()) // 设置图标
        .build(app)?; // 构建托盘图标，? 表示错误时提前返回

    Ok(())
}

/// 处理托盘图标点击事件
///
/// # 参数
/// - `app`: Tauri 应用句柄
/// - `event`: 托盘图标事件
pub fn handle_tray_icon_event(app: &tauri::AppHandle, event: TrayIconEvent) {
    // match 是 Rust 的模式匹配语法，类似于增强版的 switch/case
    match event {
        // 匹配左键单击事件
        TrayIconEvent::Click {
            button: MouseButton::Left, // 指定鼠标按钮是左键
            button_state: MouseButtonState::Up, // 指定鼠标状态是松开状态
            ..                         // .. 表示忽略结构体中的其它字段
        } => {
            // 左键点击显示/隐藏窗口
            window::toggle_main_window(app);
        }
        _ => {} // _ 是通配符，匹配所有其它未处理的事件类型，这里什么也不做
    }
}

/// 处理托盘菜单事件
///
/// # 参数
/// - `app`: Tauri 应用句柄
/// - `event`: 菜单事件
pub fn handle_menu_event(app: &tauri::AppHandle, event: tauri::menu::MenuEvent) {
    // 根据菜单项的 ID 进行不同处理
    match event.id().as_ref() {
        // 获取菜单项 ID 并转换为字符串引用
        "show" => {
            // 处理"显示窗口"菜单项
            window::show_main_window(app);
        }
        "increment" => {
            // 处理"增加未读数 (+1)"菜单项
            // 获取应用程序状态中的 UnreadCount 实例
            let state = app.state::<UnreadCount>();
            
            // 尝试增加未读数
            if let Ok(new_count) = state.increment() {
                // 更新托盘标题等 UI 元素
                let _ = update_tray_title(app, new_count);
                // 使用工具函数发送事件通知前端
                let _ = crate::utils::emit_unread_count_changed(app, new_count);
            }
        }
        "clear" => {
            // 处理"清除未读数"菜单项
            let state = app.state::<UnreadCount>();
            
            // 尝试清除未读数
            if let Ok(_) = state.clear() {
                // 更新 UI 元素显示无未读消息
                let _ = update_tray_title(app, 0);
                // 使用工具函数发出事件通知前端未读数已清零
                let _ = crate::utils::emit_unread_count_changed(app, 0);
            }
        }
        "quit" => {
            // 处理"退出"菜单项
            app.exit(0); // 退出应用程序，0 表示正常退出
        }
        _ => {} // 忽略其它菜单项
    }
}
