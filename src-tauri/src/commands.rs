use tauri::State;

use crate::{tray, unread_count::UnreadCount, pb::*};
use base64::{Engine as _, engine::general_purpose};

/// Tauri 命令处理模块
///
/// 包含所有可从前端调用的 Tauri 命令函数
/// 这些函数使用 #[tauri::command] 属性宏标记，
/// 使得它们可以从前端 JavaScript/TypeScript 代码中调用

/// 问候命令 - 示例命令
///
/// # 参数
/// - `name`: 要问候的名字
///
/// # 返回值
/// - 包含问候信息的字符串
#[tauri::command]
pub fn greet(name: &str) -> String {
    // format! 是 Rust 的格式化宏，类似其他语言的 sprintf
    // 使用 {} 作为占位符，会被 name 参数的值替换
    format!("Hello, {}! You've been greeted from Rust!", name)
}

/// 增加未读数命令
///
/// 此命令会执行以下操作：
/// 1. 增加应用状态中的未读消息计数
/// 2. 更新系统托盘图标的标题和提示文本
/// 3. 更新窗口标题显示未读数
/// 4. 在 macOS 上更新 Dock 图标徽章
/// 5. 向前端发送事件通知计数变化
///
/// # 参数
/// - `state`: 应用状态中的未读数管理器
/// - `app`: Tauri 应用句柄，用于访问应用状态和更新 UI
///
/// # 返回值
/// - `Ok(u32)`: 操作成功，返回新的未读数
/// - `Err(String)`: 操作失败，返回错误信息
#[tauri::command]
pub fn increment_unread(state: State<UnreadCount>, app: tauri::AppHandle) -> Result<u32, String> {
    // 增加未读数
    let new_count = state.increment()?;

    // 更新托盘图标标题显示未读数
    tray::update_tray_title(&app, new_count)?;

    Ok(new_count)
}

/// 获取当前未读数命令
///
/// # 参数
/// - `state`: 应用状态中的未读数管理器
///
/// # 返回值
/// - `Ok(u32)`: 操作成功，返回当前未读数
/// - `Err(String)`: 操作失败，返回错误信息
#[tauri::command]
pub fn get_unread_count(state: State<UnreadCount>) -> Result<u32, String> {
    state.get()
}

/// 清除未读数命令
///
/// # 参数
/// - `state`: 应用状态中的未读数管理器
/// - `app`: Tauri 应用句柄
///
/// # 返回值
/// - `Ok(u32)`: 操作成功，返回新的未读数（应该是0）
/// - `Err(String)`: 操作失败，返回错误信息
#[tauri::command]
pub fn clear_unread(state: State<UnreadCount>, app: tauri::AppHandle) -> Result<u32, String> {
    // 清除未读数
    let new_count = state.clear()?;

    // 更新托盘图标标题和其他 UI 元素，显示没有未读消息
    tray::update_tray_title(&app, new_count)?;

    Ok(new_count)
}

/// 创建事件消息的 protobuf 数据
///
/// # 参数
/// - `event_type`: 事件类型
/// - `data`: 事件数据（JSON 字符串）
///
/// # 返回值
/// - 序列化后的字节数组（base64 编码）
#[tauri::command]
pub fn create_event_message(event_type: i32, data: String) -> Result<String, String> {
    let event = EventCommon {
        r#type: event_type,
        data,
    };
    
    let bytes = event.to_bytes();
    Ok(general_purpose::STANDARD.encode(bytes))
}

/// 解析事件消息的 protobuf 数据
///
/// # 参数
/// - `data`: base64 编码的字节数组
///
/// # 返回值
/// - 解析后的事件对象（JSON 格式）
#[tauri::command]
pub fn parse_event_message(data: String) -> Result<serde_json::Value, String> {
    let bytes = general_purpose::STANDARD.decode(data).map_err(|e| format!("Base64 decode error: {}", e))?;
    let event = EventCommon::from_bytes(&bytes).map_err(|e| format!("Protobuf decode error: {}", e))?;
    
    let json = serde_json::json!({
        "type": event.r#type,
        "data": event.data
    });
    
    Ok(json)
}

/// 创建消息发送的 protobuf 数据
///
/// # 参数
/// - `msg_type`: 消息类型
/// - `content`: 消息内容
/// - `to_id`: 接收者 ID
/// - `is_room`: 是否为群组消息
/// - `meta`: 元数据（可选）
///
/// # 返回值
/// - 序列化后的字节数组（base64 编码）
#[tauri::command]
pub fn create_message_send(
    msg_type: i32,
    content: String,
    to_id: u64,
    is_room: bool,
    meta: Option<String>,
) -> Result<String, String> {
    let message = MessageSend {
        r#type: msg_type,
        content,
        to_id,
        is_room,
        meta: meta.unwrap_or_default(),
    };
    
    let bytes = message.to_bytes();
    Ok(general_purpose::STANDARD.encode(bytes))
}

/// 解析消息发送的 protobuf 数据
///
/// # 参数
/// - `data`: base64 编码的字节数组
///
/// # 返回值
/// - 解析后的消息对象（JSON 格式）
#[tauri::command]
pub fn parse_message_send(data: String) -> Result<serde_json::Value, String> {
    let bytes = general_purpose::STANDARD.decode(data).map_err(|e| format!("Base64 decode error: {}", e))?;
    let message = MessageSend::from_bytes(&bytes).map_err(|e| format!("Protobuf decode error: {}", e))?;
    
    let json = serde_json::json!({
        "type": message.r#type,
        "content": message.content,
        "to_id": message.to_id,
        "is_room": message.is_room,
        "meta": message.meta
    });
    
    Ok(json)
}
