use mac_address::get_mac_address;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// 设备信息结构体
///
/// 这个结构体包含设备的唯一标识信息
/// 使用 Serialize 和 Deserialize 特性使其可以与 JSON 互相转换
/// 这样前端就可以直接接收和处理这些数据
#[derive(Debug, Serialize, Deserialize)]
pub struct DeviceInfo {
    /// 设备的 MAC 地址字符串表示
    /// MAC 地址是网络接口的硬件地址，通常是唯一的
    mac_address: String,

    /// 基于主机名和 MAC 地址生成的设备唯一标识符
    /// 这是一个 UUID v5 格式的字符串，确保设备的唯一性
    device_id: String,
}

/// 获取设备唯一标识信息
///
/// 这个函数会收集设备的硬件和系统信息来生成唯一的设备标识
/// 它会获取 MAC 地址和主机名，然后基于这些信息生成一个 UUID v5
/// 这种方法确保了设备标识的唯一性和一致性
///
/// # 工作原理
/// 1. 获取第一个网络接口的 MAC 地址
/// 2. 获取系统主机名
/// 3. 使用 UUID v5 算法基于 MAC 地址和主机名生成设备 ID
///
/// # 返回值
/// - `Ok(DeviceInfo)`: 成功获取设备信息
/// - `Err(String)`: 获取失败，包含错误描述
#[tauri::command]
pub fn get_device_info() -> Result<DeviceInfo, String> {
    // 尝试获取第一个MAC地址
    // get_mac_address() 返回 Result<Option<MacAddress>, Error>
    let mac = match get_mac_address() {
        Ok(Some(ma)) => ma.to_string(), // 成功获取到 MAC 地址，转换为字符串
        _ => "unknown".to_string(),     // 获取失败或没有 MAC 地址，使用默认值
    };

    // 基于MAC地址和主机名生成设备ID
    // hostname::get() 获取系统主机名
    let hostname = match hostname::get() {
        Ok(h) => h.to_string_lossy().to_string(), // 成功获取主机名并转换为 UTF-8 字符串
        Err(_) => "unknown-host".to_string(),     // 获取失败时使用默认值
    };

    // 创建一个UUID v5，以MAC地址和主机名作为命名空间
    // UUID v5 使用 SHA-1 哈希算法，基于命名空间和名称生成确定性的 UUID
    // 这意味着相同的输入总是会生成相同的 UUID
    let namespace = Uuid::new_v5(&Uuid::NAMESPACE_DNS, b"tauri.device.id");
    let device_id =
        Uuid::new_v5(&namespace, format!("{}:{}", hostname, mac).as_bytes()).to_string();

    // 构造并返回设备信息
    Ok(DeviceInfo {
        mac_address: mac,
        device_id,
    })
}
