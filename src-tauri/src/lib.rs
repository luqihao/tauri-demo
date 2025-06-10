// 导入标准库中的同步原语
use std::sync::{Arc, Mutex}; // Arc: 原子引用计数指针，用于线程间安全共享数据; Mutex: 互斥锁，确保一次只有一个线程可以访问数据

// 导入 tauri 框架中的相关模块和功能
use tauri::{
    menu::{Menu, MenuItem}, // 系统菜单相关类型
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent}, // 系统托盘相关类型
    Emitter,                // tauri 核心功能:
    // - Manager: 提供应用程序管理功能(窗口、托盘等)
    // - Runtime: 定义应用程序运行时行为
    // - State: 用于在命令处理器之间共享状态
    // - Emitter: 允许发送事件
    Manager,
    Runtime,
    State,
};

// 下面的导入只在 macOS 平台有效，这是通过 #[cfg(target_os = "macos")] 条件编译属性实现的
#[cfg(target_os = "macos")] // 条件编译：只在 macOS 操作系统上编译下面这行代码
use cocoa::appkit::NSApp; // 导入 macOS 的 NSApp 函数，用来获取主应用程序对象
#[cfg(target_os = "macos")]
use cocoa::base::nil; // 导入 Objective-C 中的 nil 值，相当于 Rust 中的 null
#[cfg(target_os = "macos")]
use cocoa::foundation::NSString; // 导入 Objective-C 的字符串类型
#[cfg(target_os = "macos")]
use objc::{msg_send, sel, sel_impl}; // 导入 Objective-C 消息传递机制相关功能
                                     // msg_send: 发送消息到 Objective-C 对象
                                     // sel: 创建 Objective-C 选择器
                                     // sel_impl: 实现选择器的宏

// 全局状态管理未读数
#[derive(Debug, Default)] // 派生 Debug 和 Default 特性
                          // Debug: 允许使用 {:?} 格式化打印此结构体的内容
                          // Default: 为结构体提供默认值，即 UnreadCount::default() 会创建一个新实例
pub struct UnreadCount {
    // Arc<Mutex<T>> 是 Rust 中处理并发访问的常用模式：
    // - Arc(Atomic Reference Counting): 允许多个线程安全地共享所有权
    // - Mutex: 确保一次只有一个线程可以修改数据
    pub count: Arc<Mutex<u32>>, // u32 是无符号 32 位整数，用于存储未读消息数量
}

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command] // 标记这个函数是一个 Tauri 命令，可以从前端 JavaScript/TypeScript 调用
fn greet(name: &str) -> String {
    // 函数参数 name 是字符串引用类型(&str)，返回值是 String 类型
    // format! 是 Rust 的格式化宏，类似其他语言的 sprintf
    // 使用 {} 作为占位符，会被 name 参数的值替换
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command] // 标记为 Tauri 命令，可从前端调用
fn increment_unread(state: State<UnreadCount>, app: tauri::AppHandle) -> Result<u32, String> {
    // State<T> 是 Tauri 的状态管理类型，它允许从命令中访问应用状态
    // tauri::AppHandle 允许与应用程序交互，如访问窗口、托盘等

    // .lock() 获取 Mutex 的锁，返回 Result<MutexGuard<T>, PoisonError>
    // map_err 将错误类型转换为 String
    // ? 操作符：如果 Result 是 Err，则立即返回错误；如果是 Ok，则解包值
    let mut count = state.count.lock().map_err(|e| e.to_string())?;

    // *count 解引用 MutexGuard 来访问实际的 u32 值
    // += 1 增加计数器的值
    *count += 1;
    let new_count = *count; // 保存新的计数值

    // 更新托盘图标标题显示未读数
    // & 创建引用，这里是将 app 的引用传递给函数
    // ? 操作符：如果 update_tray_title 返回 Err，则此函数也返回错误
    update_tray_title(&app, new_count)?;

    // Ok(value) 创建一个成功结果，包含 new_count 值
    Ok(new_count)
}

#[tauri::command] // 标记为 Tauri 命令
fn get_unread_count(state: State<UnreadCount>) -> Result<u32, String> {
    // 获取 Mutex 锁，如果获取失败则将错误转换为 String 并返回
    // ? 操作符会在出错时提前返回
    let count = state.count.lock().map_err(|e| e.to_string())?;

    // *count 解引用 MutexGuard 以获取其持有的 u32 值
    // Ok() 包装结果为成功状态
    Ok(*count)
}

#[tauri::command] // 标记为 Tauri 命令
fn clear_unread(state: State<UnreadCount>, app: tauri::AppHandle) -> Result<u32, String> {
    // 获取 Mutex 锁以修改计数器值
    let mut count = state.count.lock().map_err(|e| e.to_string())?;
    // 将计数器值设置为 0
    *count = 0;

    // 更新托盘图标标题和其他 UI 元素，显示没有未读消息
    // ? 操作符：如果 update_tray_title 返回错误，则提前返回错误
    update_tray_title(&app, 0)?;

    // 返回成功结果，新的计数值为 0
    Ok(0)
}

#[cfg(target_os = "macos")] // 条件编译：只在 macOS 平台上编译此函数
fn set_dock_badge(count: u32) {
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

#[cfg(not(target_os = "macos"))] // 条件编译：在非 macOS 平台上编译此函数
fn set_dock_badge(_count: u32) {
    // 在非macOS平台上不执行任何操作
    // 参数名前的下划线(_count)表示该参数未使用，避免编译器警告
}

// 更新托盘标题、提示和窗口标题函数
// &tauri::AppHandle 表示接收 AppHandle 的引用（借用而不拥有）
// Result<(), String> 表示成功时返回空元组，失败时返回 String 类型错误
fn update_tray_title(app: &tauri::AppHandle, count: u32) -> Result<(), String> {
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

    // 更新窗口标题显示未读数
    // get_webview_window 尝试获取指定名称的窗口
    if let Some(window) = app.get_webview_window("main") {
        // 根据未读数量创建不同的窗口标题
        let window_title = if count > 0 {
            format!("🔴 Demo ({} 条未读)", count)
        } else {
            "Demo".to_string()
        };
        // let _ = ... 表示我们忽略返回值（可能的错误）
        let _ = window.set_title(&window_title);
    }

    // 在macOS上设置Dock徽章
    set_dock_badge(count);

    // 返回成功结果
    // Ok(()) 创建一个包含空元组的 Ok 值
    Ok(())
}

// 创建托盘菜单函数
// <R: Runtime> 是泛型参数，表示此函数可以与任何实现了 Runtime trait 的类型一起使用
// -> Result<Menu<R>, tauri::Error> 表示返回一个结果，成功时是菜单，失败时是错误
fn create_tray_menu<R: Runtime>(app: &tauri::AppHandle<R>) -> Result<Menu<R>, tauri::Error> {
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

#[cfg_attr(mobile, tauri::mobile_entry_point)] // 这个属性标记函数为移动平台的入口点
pub fn run() {
    // 创建默认的 UnreadCount 实例
    let unread_count = UnreadCount::default();

    // 使用 Builder 模式创建并配置 Tauri 应用
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        // 添加插件
        .plugin(tauri_plugin_single_instance::init(|app, _argv, _cwd| {
            // 这个回调会在尝试启动第二个应用实例时触发
            // app: 应用程序的 AppHandle
            // _argv: 启动第二个实例时的命令行参数 (已添加下划线前缀表示有意未使用)
            // _cwd: 启动第二个实例时的当前工作目录 (已添加下划线前缀表示有意未使用)

            // 例如，可以在这里显示主窗口并将其置于前台
            if let Some(window) = app.get_webview_window("main") {
                window.show().unwrap();
                window.set_focus().unwrap();
            }
        }))
        .plugin(tauri_plugin_upload::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent, // macOS下使用LaunchAgent方式
            None,                                               // 不指定额外的启动参数
        ))
        .plugin(tauri_plugin_window_state::Builder::new().build())
        .plugin(tauri_plugin_opener::init()) // 用于打开外部 URL
        .plugin(tauri_plugin_dialog::init()) // 用于显示文件对话框
        .plugin(tauri_plugin_clipboard_manager::init()) // 用于粘贴板操作
        // 使用 manage 将状态添加到应用程序中，使其可在各命令间共享
        .manage(unread_count)
        .setup(|app| {
            // 创建托盘菜单
            // setup 是在应用程序启动时调用的回调函数
            // |app| 是一个闭包，接收应用实例作为参数
            let menu = create_tray_menu(app.handle())?;

            // 创建托盘图标
            // TrayIconBuilder 使用构建器模式来设置托盘图标的各种属性
            let _tray = TrayIconBuilder::with_id("main-tray")
                .menu(&menu) // 设置托盘菜单
                .tooltip("Demo") // 设置鼠标悬停提示
                .title("Demo") // 添加标题，可以在某些平台显示文字
                .icon(app.default_window_icon().unwrap().clone()) // 设置图标
                .build(app)?; // 构建托盘图标，? 表示错误时提前返回

            Ok(()) // 返回成功结果，() 是空元组，表示无返回值
        })
        .on_tray_icon_event(|app, event| {
            // 设置托盘图标事件处理程序
            // |app, event| 是接收应用句柄和事件的闭包

            // match 是 Rust 的模式匹配语法，类似于增强版的 switch/case
            match event {
                // 匹配左键单击事件
                TrayIconEvent::Click { 
                    button: MouseButton::Left, // 指定鼠标按钮是左键
                    button_state: MouseButtonState::Up, // 指定鼠标状态是松开状态
                    .. // .. 表示忽略结构体中的其它字段
                } => {
                    // 左键点击显示/隐藏窗口
                    // 尝试获取名为 "main" 的窗口
                    if let Some(window) = app.get_webview_window("main") {
                        // 检查窗口是否可见
                        if window.is_visible().unwrap_or(false) { // unwrap_or 在 Result 为错误时提供默认值
                            let _ = window.hide(); // 如果可见则隐藏窗口
                        } else {
                            let _ = window.show(); // 如果不可见则显示窗口
                            let _ = window.set_focus(); // 让窗口获取焦点
                        }
                    }
                }
                _ => {} // _ 是通配符，匹配所有其它未处理的事件类型，这里什么也不做
            }
        })
        .on_menu_event(|app, event| {
            // 处理菜单事件
            // 根据菜单项的 ID 进行不同处理
            match event.id().as_ref() {
                // 获取菜单项 ID 并转换为字符串引用
                "show" => {
                    // 处理"显示窗口"菜单项
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.show(); // 显示窗口
                        let _ = window.set_focus(); // 设置窗口焦点
                    }
                }
                "increment" => {
                    // 增加未读数
                    // 获取应用程序状态中的 UnreadCount 实例
                    let state = app.state::<UnreadCount>();
                    let new_count = {
                        // 获取锁并更新计数器，expect 在失败时会 panic 并显示错误信息
                        let mut count = state.count.lock().expect("Failed to lock count");
                        *count += 1; // 增加计数值
                        *count // 返回新的计数值
                    };
                    // 更新托盘标题等 UI 元素
                    let _ = update_tray_title(app, new_count);
                    // 发出事件，通知前端计数已更改
                    // emit 方法发送一个名为 "unread-count-changed" 的事件，带有 new_count 作为有效负载
                    let _ = app.emit("unread-count-changed", new_count);
                }
                "clear" => {
                    // 清除未读数
                    let state = app.state::<UnreadCount>();
                    {
                        // 使用花括号创建作用域，使锁在操作完成后立即释放
                        let mut count = state.count.lock().expect("Failed to lock count");
                        *count = 0; // 将计数器清零
                    } // 锁在这里被释放
                      // 更新 UI 元素显示无未读消息
                    let _ = update_tray_title(app, 0);
                    // 发出事件通知前端
                    let _ = app.emit("unread-count-changed", 0);
                }
                "quit" => {
                    // 处理"退出"菜单项
                    app.exit(0); // 退出应用程序，0 表示正常退出
                }
                _ => {} // 忽略其它菜单项
            }
        })
        .invoke_handler(tauri::generate_handler![
            // 注册可以从前端调用的命令处理函数
            greet,            // 处理问候功能
            increment_unread, // 增加未读消息数
            get_unread_count, // 获取当前未读消息数
            clear_unread      // 清除未读消息数
        ])
        // 运行应用程序
        // generate_context! 宏生成应用程序运行所需的上下文信息
        // 从 tauri.conf.json 等配置文件中获取
        .run(tauri::generate_context!())
        // 如果应用程序运行失败，显示错误信息并终止程序
        .expect("error while running tauri application");
}
