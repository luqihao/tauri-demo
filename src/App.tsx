import { useEffect, useState } from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { openUrl } from "@tauri-apps/plugin-opener";
import { open } from "@tauri-apps/plugin-dialog";
import { writeText, readText } from "@tauri-apps/plugin-clipboard-manager";
import "./App.css";

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");
  const [selectedPath, setSelectedPath] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [clipboardText, setClipboardText] = useState("");
  const [textToCopy, setTextToCopy] = useState("Hello, 这是一段测试文本！🚀");

  useEffect(() => {
    // 获取初始未读数
    invoke("get_unread_count").then((count) => {
      setUnreadCount(count as number);
    });

    // 监听托盘菜单触发的未读数变化事件
    const unlisten = listen("unread-count-changed", (event) => {
      setUnreadCount(event.payload as number);
    });

    return () => {
      unlisten.then(f => f());
    };
  }, []);
  
  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    setGreetMsg(await invoke("greet", { name }));
  }

  async function incrementUnread() {
    try {
      const newCount = await invoke("increment_unread") as number;
      setUnreadCount(newCount);
    } catch (error) {
      console.error("增加未读数失败:", error);
    }
  }

  async function clearUnread() {
    try {
      const newCount = await invoke("clear_unread") as number;
      setUnreadCount(newCount);
    } catch (error) {
      console.error("清除未读数失败:", error);
    }
  }

  async function openTauriDocs() {
    try {
      await openUrl("https://v2.tauri.app/zh-cn/learn/");
    } catch (error) {
      console.error("Failed to open URL:", error);
    }
  }

  async function selectFile() {
    try {
      const selected = await open({
        multiple: false,
        directory: false,
        title: "选择一个文件"
      });
      
      if (selected) {
        setSelectedPath(selected as string);
        console.log("选择的文件路径:", selected);
      }
    } catch (error) {
      console.error("文件选择失败:", error);
    }
  }

  async function copyToClipboard() {
    try {
      await writeText(textToCopy);
      console.log("文本已复制到粘贴板:", textToCopy);
    } catch (error) {
      console.error("复制到粘贴板失败:", error);
    }
  }

  async function readFromClipboard() {
    try {
      const text = await readText();
      setClipboardText(text || "");
      console.log("从粘贴板读取的文本:", text);
    } catch (error) {
      console.error("读取粘贴板失败:", error);
      setClipboardText("读取失败");
    }
  }

  return (
    <main style={{ padding: "12px", maxWidth: "800px", margin: "0 auto", fontSize: "14px" }}>
      {/* 标题区域 */}
      <div style={{ 
        textAlign: "center", 
        marginBottom: "16px",
        padding: "8px",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        borderRadius: "8px",
        color: "white",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
      }}>
        <h1 style={{ margin: "0", fontSize: "18px", fontWeight: "600" }}>Tauri 功能演示</h1>
        <div style={{ fontSize: "11px", opacity: "0.9", marginTop: "4px" }}>
          💻 桌面应用 • 🔔 系统托盘 • 📋 粘贴板 • 📁 文件操作
        </div>
      </div>

      {/* 功能网格布局 */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", 
        gap: "12px",
        marginBottom: "16px"
      }}>
        
        {/* 系统托盘模块 */}
        <div style={{ 
          padding: "12px", 
          backgroundColor: "#fff3cd", 
          borderRadius: "6px",
          border: "1px solid #ffeaa7",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
        }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "16px", marginRight: "6px" }}>🔔</span>
            <h3 style={{ margin: "0", fontSize: "14px", fontWeight: "600", color: "#856404" }}>系统托盘</h3>
          </div>
          
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "8px",
            marginBottom: "8px",
            flexWrap: "wrap"
          }}>
            <div style={{
              backgroundColor: unreadCount > 0 ? "#dc3545" : "#6c757d",
              color: "white",
              padding: "4px 8px",
              borderRadius: "12px",
              fontWeight: "600",
              fontSize: "12px",
              minWidth: "60px",
              textAlign: "center"
            }}>
              {unreadCount}
            </div>
            
            <button 
              onClick={incrementUnread}
              style={{
                backgroundColor: "#007bff",
                color: "white",
                padding: "4px 8px",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "11px",
                fontWeight: "500"
              }}
            >
              +1
            </button>
            
            <button 
              onClick={clearUnread}
              style={{
                backgroundColor: "#28a745",
                color: "white",
                padding: "4px 8px",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "11px",
                fontWeight: "500"
              }}
            >
              清零
            </button>
          </div>
          
          <div style={{ fontSize: "10px", color: "#6c757d", lineHeight: "1.3" }}>
            💡 托盘图标显示徽章、窗口标题更新、macOS Dock徽章
          </div>
        </div>

        {/* 粘贴板模块 */}
        <div style={{ 
          padding: "12px", 
          backgroundColor: "#e7f3ff", 
          borderRadius: "6px",
          border: "1px solid #74b9ff",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
        }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "16px", marginRight: "6px" }}>📋</span>
            <h3 style={{ margin: "0", fontSize: "14px", fontWeight: "600", color: "#0066cc" }}>粘贴板</h3>
          </div>
          
          <div style={{ marginBottom: "8px" }}>
            <input 
              value={textToCopy}
              onChange={(e) => setTextToCopy(e.target.value)}
              placeholder="输入要复制的文本..."
              style={{
                width: "100%",
                padding: "4px 6px",
                border: "1px solid #ddd",
                borderRadius: "3px",
                fontSize: "12px",
                boxSizing: "border-box"
              }}
            />
          </div>
          
          <div style={{ display: "flex", gap: "6px", marginBottom: "8px" }}>
            <button 
              onClick={copyToClipboard}
              style={{
                backgroundColor: "#17a2b8",
                color: "white",
                padding: "4px 8px",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "11px",
                fontWeight: "500",
                flex: "1"
              }}
            >
              复制
            </button>
            
            <button 
              onClick={readFromClipboard}
              style={{
                backgroundColor: "#6f42c1",
                color: "white",
                padding: "4px 8px",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "11px",
                fontWeight: "500",
                flex: "1"
              }}
            >
              读取
            </button>
          </div>

          {clipboardText && (
            <div style={{ 
              backgroundColor: "#e8f5e8",
              border: "1px solid #c3e6c3",
              borderRadius: "3px",
              padding: "6px",
              fontSize: "10px",
              wordBreak: "break-all",
              maxHeight: "60px",
              overflow: "auto"
            }}>
              <div style={{ fontWeight: "500", color: "#155724", marginBottom: "2px" }}>内容:</div>
              <div style={{ fontFamily: "monospace", color: "#333" }}>
                {clipboardText}
              </div>
            </div>
          )}
        </div>

        {/* 文件操作模块 */}
        <div style={{ 
          padding: "12px", 
          backgroundColor: "#f0f0f0", 
          borderRadius: "6px",
          border: "1px solid #b2b2b2",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
        }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "16px", marginRight: "6px" }}>📁</span>
            <h3 style={{ margin: "0", fontSize: "14px", fontWeight: "600", color: "#495057" }}>文件操作</h3>
          </div>
          
          <button 
            onClick={selectFile}
            style={{
              backgroundColor: "#0066cc",
              color: "white",
              padding: "6px 12px",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: "500",
              width: "100%",
              marginBottom: "8px"
            }}
          >
            选择文件
          </button>

          {selectedPath && (
            <div style={{ 
              backgroundColor: "white",
              border: "1px solid #ddd",
              borderRadius: "3px",
              padding: "6px",
              fontSize: "10px",
              wordBreak: "break-all",
              maxHeight: "60px",
              overflow: "auto"
            }}>
              <div style={{ fontWeight: "500", color: "#495057", marginBottom: "2px" }}>路径:</div>
              <div style={{ fontFamily: "monospace", color: "#0066cc" }}>
                {selectedPath}
              </div>
            </div>
          )}
        </div>

        {/* 网络操作模块 */}
        <div style={{ 
          padding: "12px", 
          backgroundColor: "#fff0f6", 
          borderRadius: "6px",
          border: "1px solid #fd79a8",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
        }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "16px", marginRight: "6px" }}>🌐</span>
            <h3 style={{ margin: "0", fontSize: "14px", fontWeight: "600", color: "#721c24" }}>网络操作</h3>
          </div>
          
          <button 
            onClick={openTauriDocs}
            style={{
              backgroundColor: "#e84393",
              color: "white",
              padding: "6px 12px",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: "500",
              width: "100%"
            }}
          >
            🔗 打开 Tauri 文档
          </button>
        </div>

      </div>

      {/* 问候功能模块 */}
      <div style={{ 
        padding: "12px", 
        backgroundColor: "#f8f9fa", 
        borderRadius: "6px",
        border: "1px solid #dee2e6",
        marginBottom: "16px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
      }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
          <span style={{ fontSize: "16px", marginRight: "6px" }}>👋</span>
          <h3 style={{ margin: "0", fontSize: "14px", fontWeight: "600", color: "#495057" }}>问候功能</h3>
        </div>
        
        <form
          onSubmit={(e) => {
            e.preventDefault();
            greet();
          }}
          style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "8px" }}
        >
          <input
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
            placeholder="输入姓名..."
            style={{
              flex: "1",
              padding: "6px 8px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              fontSize: "12px"
            }}
          />
          <button 
            type="submit"
            style={{
              backgroundColor: "#28a745",
              color: "white",
              padding: "6px 12px",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: "500"
            }}
          >
            问候
          </button>
        </form>
        
        {greetMsg && (
          <div style={{ 
            backgroundColor: "#d4edda",
            border: "1px solid #c3e6cb",
            borderRadius: "3px",
            padding: "6px",
            fontSize: "12px",
            color: "#155724"
          }}>
            {greetMsg}
          </div>
        )}
      </div>

      {/* 技术栈展示 */}
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        gap: "12px", 
        alignItems: "center",
        padding: "8px",
        backgroundColor: "#ffffff",
        borderRadius: "6px",
        border: "1px solid #e9ecef",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
      }}>
        <a href="https://vitejs.dev" target="_blank" style={{ textDecoration: "none" }}>
          <img src="/vite.svg" style={{ width: "24px", height: "24px" }} alt="Vite" />
        </a>
        <a href="https://tauri.app" target="_blank" style={{ textDecoration: "none" }}>
          <img src="/tauri.svg" style={{ width: "24px", height: "24px" }} alt="Tauri" />
        </a>
        <a href="https://reactjs.org" target="_blank" style={{ textDecoration: "none" }}>
          <img src={reactLogo} style={{ width: "24px", height: "24px" }} alt="React" />
        </a>
        <div style={{ fontSize: "10px", color: "#6c757d", marginLeft: "8px" }}>
          Powered by Vite + Tauri + React
        </div>
      </div>
    </main>
  );
}

export default App;
