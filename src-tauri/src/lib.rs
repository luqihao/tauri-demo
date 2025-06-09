use std::sync::{Arc, Mutex};
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager, Runtime, State, Emitter,
};

#[cfg(target_os = "macos")]
use cocoa::appkit::NSApp;
#[cfg(target_os = "macos")]
use cocoa::base::nil;
#[cfg(target_os = "macos")]
use cocoa::foundation::NSString;
#[cfg(target_os = "macos")]
use objc::{msg_send, sel, sel_impl};

// 全局状态管理未读数
#[derive(Debug, Default)]
pub struct UnreadCount {
    pub count: Arc<Mutex<u32>>,
}

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn increment_unread(state: State<UnreadCount>, app: tauri::AppHandle) -> Result<u32, String> {
    let mut count = state.count.lock().map_err(|e| e.to_string())?;
    *count += 1;
    let new_count = *count;
    
    // 更新托盘图标标题显示未读数
    update_tray_title(&app, new_count)?;
    
    Ok(new_count)
}

#[tauri::command]
fn get_unread_count(state: State<UnreadCount>) -> Result<u32, String> {
    let count = state.count.lock().map_err(|e| e.to_string())?;
    Ok(*count)
}

#[tauri::command]
fn clear_unread(state: State<UnreadCount>, app: tauri::AppHandle) -> Result<u32, String> {
    let mut count = state.count.lock().map_err(|e| e.to_string())?;
    *count = 0;
    
    // 更新托盘图标标题
    update_tray_title(&app, 0)?;
    
    Ok(0)
}

#[cfg(target_os = "macos")]
fn set_dock_badge(count: u32) {
    unsafe {
        let label = if count > 0 {
            NSString::alloc(nil).init_str(&count.to_string())
        } else {
            NSString::alloc(nil).init_str("")
        };
        let dock_tile: cocoa::base::id = msg_send![NSApp(), dockTile];
        let _: () = msg_send![dock_tile, setBadgeLabel: label];
    }
}

#[cfg(not(target_os = "macos"))]
fn set_dock_badge(_count: u32) {
    // 在非macOS平台上不执行任何操作
}

fn update_tray_title(app: &tauri::AppHandle, count: u32) -> Result<(), String> {
    // 更新托盘提示和标题
    if let Some(tray) = app.tray_by_id("main-tray") {
        let title = if count > 0 {
            format!("Demo {}", count)  // 在标题中显示未读数
        } else {
            "Demo".to_string()
        };
        
        let tooltip = if count > 0 {
            format!("🔴 Demo - {} 条未读消息", count)
        } else {
            "✅ Demo - 没有未读消息".to_string()
        };
        
        // 设置托盘标题（在某些平台可见）
        tray.set_title(Some(&title)).map_err(|e| e.to_string())?;
        // 设置鼠标悬停提示
        tray.set_tooltip(Some(&tooltip)).map_err(|e| e.to_string())?;
    }
    
    // 更新窗口标题显示未读数
    if let Some(window) = app.get_webview_window("main") {
        let window_title = if count > 0 {
            format!("🔴 Demo ({} 条未读)", count)
        } else {
            "Demo".to_string()
        };
        let _ = window.set_title(&window_title);
    }
    
    // 在macOS上设置Dock徽章
    set_dock_badge(count);
    
    Ok(())
}

fn create_tray_menu<R: Runtime>(app: &tauri::AppHandle<R>) -> Result<Menu<R>, tauri::Error> {
    let show_item = MenuItem::with_id(app, "show", "显示窗口", true, None::<&str>)?;
    let increment_item = MenuItem::with_id(app, "increment", "增加未读数 (+1)", true, None::<&str>)?;
    let clear_item = MenuItem::with_id(app, "clear", "清除未读数", true, None::<&str>)?;
    let quit_item = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;
    
    Menu::with_items(app, &[&show_item, &increment_item, &clear_item, &quit_item])
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let unread_count = UnreadCount::default();
    
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(unread_count)
        .setup(|app| {
            // 创建托盘菜单
            let menu = create_tray_menu(app.handle())?;
            
            // 创建托盘图标
            let _tray = TrayIconBuilder::with_id("main-tray")
                .menu(&menu)
                .tooltip("Demo")
                .title("Demo")  // 添加标题，可以在某些平台显示文字
                .icon(app.default_window_icon().unwrap().clone())
                .build(app)?;
            
            Ok(())
        })
        .on_tray_icon_event(|app, event| {
            match event {
                TrayIconEvent::Click { 
                    button: MouseButton::Left, 
                    button_state: MouseButtonState::Up,
                    .. 
                } => {
                    // 左键点击显示/隐藏窗口
                    if let Some(window) = app.get_webview_window("main") {
                        if window.is_visible().unwrap_or(false) {
                            let _ = window.hide();
                        } else {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                }
                _ => {}
            }
        })
        .on_menu_event(|app, event| {
            match event.id().as_ref() {
                "show" => {
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
                "increment" => {
                    // 增加未读数
                    let state = app.state::<UnreadCount>();
                    let new_count = {
                        let mut count = state.count.lock().expect("Failed to lock count");
                        *count += 1;
                        *count
                    };
                    let _ = update_tray_title(app, new_count);
                    let _ = app.emit("unread-count-changed", new_count);
                }
                "clear" => {
                    // 清除未读数
                    let state = app.state::<UnreadCount>();
                    {
                        let mut count = state.count.lock().expect("Failed to lock count");
                        *count = 0;
                    }
                    let _ = update_tray_title(app, 0);
                    let _ = app.emit("unread-count-changed", 0);
                }
                "quit" => {
                    app.exit(0);
                }
                _ => {}
            }
        })
        .invoke_handler(tauri::generate_handler![
            greet, 
            increment_unread, 
            get_unread_count, 
            clear_unread
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
