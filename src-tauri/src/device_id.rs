use mac_address::get_mac_address;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize)]
pub struct DeviceInfo {
    mac_address: String,
    device_id: String,
}

/// 获取设备唯一标识信息
///
/// 返回MAC地址和一个基于主机名和MAC地址生成的设备ID
#[tauri::command]
pub fn get_device_info() -> Result<DeviceInfo, String> {
    // 尝试获取第一个MAC地址
    let mac = match get_mac_address() {
        Ok(Some(ma)) => ma.to_string(),
        _ => "unknown".to_string(),
    };

    // 基于MAC地址和主机名生成设备ID
    let hostname = match hostname::get() {
        Ok(h) => h.to_string_lossy().to_string(),
        Err(_) => "unknown-host".to_string(),
    };

    // 创建一个UUID v5，以MAC地址和主机名作为命名空间
    let namespace = Uuid::new_v5(&Uuid::NAMESPACE_DNS, b"tauri.device.id");
    let device_id =
        Uuid::new_v5(&namespace, format!("{}:{}", hostname, mac).as_bytes()).to_string();

    Ok(DeviceInfo {
        mac_address: mac,
        device_id,
    })
}
