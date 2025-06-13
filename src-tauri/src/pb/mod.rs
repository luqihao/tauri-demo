// 自动生成的 protobuf 文件
// 这个文件会在构建时被 build.rs 重新生成

use prost::Message;

// 包含所有生成的 protobuf 结构
// 注意：这里的路径是构建时生成的，所有 .proto 文件会被编译到这个单一文件中
include!(concat!(env!("OUT_DIR"), "/pb.rs"));

// 为常用的消息类型实现便捷方法
impl EventCommon {
    /// 从字节数组解码
    pub fn from_bytes(data: &[u8]) -> Result<Self, prost::DecodeError> {
        Self::decode(data)
    }
    
    /// 编码为字节数组
    pub fn to_bytes(&self) -> Vec<u8> {
        let mut buf = Vec::new();
        self.encode(&mut buf).expect("Failed to encode EventCommon");
        buf
    }
}

impl MessageSend {
    /// 从字节数组解码
    pub fn from_bytes(data: &[u8]) -> Result<Self, prost::DecodeError> {
        Self::decode(data)
    }
    
    /// 编码为字节数组
    pub fn to_bytes(&self) -> Vec<u8> {
        let mut buf = Vec::new();
        self.encode(&mut buf).expect("Failed to encode MessageSend");
        buf
    }
}

impl MessageSendAck {
    /// 从字节数组解码
    pub fn from_bytes(data: &[u8]) -> Result<Self, prost::DecodeError> {
        Self::decode(data)
    }
    
    /// 编码为字节数组
    pub fn to_bytes(&self) -> Vec<u8> {
        let mut buf = Vec::new();
        self.encode(&mut buf).expect("Failed to encode MessageSendACK");
        buf
    }
}

// 通用的 protobuf 处理函数
pub fn decode_message<T: Message + Default>(data: &[u8]) -> Result<T, prost::DecodeError> {
    T::decode(data)
}

pub fn encode_message<T: Message>(message: &T) -> Vec<u8> {
    let mut buf = Vec::new();
    message.encode(&mut buf).expect("Failed to encode message");
    buf
}
