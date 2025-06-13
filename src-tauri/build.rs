fn main() {
    // Tauri 构建
    tauri_build::build();
    
    // 编译 protobuf 文件
    compile_protobufs();
}

fn compile_protobufs() {
    let proto_dir = "src/protobuf";
    
    // 只编译独立的、没有复杂依赖的 proto 文件
    let proto_files = vec![
        "src/protobuf/event_common.proto",
        "src/protobuf/message_send.proto",
        "src/protobuf/logout.proto",
        "src/protobuf/sign_in.proto",
    ];
    
    println!("cargo:rerun-if-changed={}", proto_dir);
    
    // 配置prost构建器以添加serde支持
    let mut config = prost_build::Config::new();
    config.type_attribute(".", "#[derive(serde::Serialize, serde::Deserialize)]");
    
    // 输出到 OUT_DIR，这是 prost 的标准做法
    config.compile_protos(&proto_files, &[proto_dir])
        .expect("Failed to compile proto files");
}
