import { useEffect, useState } from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { openUrl } from "@tauri-apps/plugin-opener";
import { open } from "@tauri-apps/plugin-dialog";
import "./App.css";

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");
  const [selectedPath, setSelectedPath] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);

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

  return (
    <main className="container">
      <h1>Tauri 系统托盘演示</h1>

      <div className="row">
        <a href="https://vitejs.dev" target="_blank">
          <img src="/vite.svg" className="logo vite" alt="Vite logo" />
        </a>
        <a href="https://tauri.app" target="_blank">
          <img src="/tauri.svg" className="logo tauri" alt="Tauri logo" />
        </a>
        <a href="https://reactjs.org" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>

      {/* 系统托盘未读数功能 */}
      <div style={{ 
        marginBottom: "30px", 
        padding: "20px", 
        backgroundColor: "#f8f9fa", 
        borderRadius: "8px",
        border: "1px solid #e9ecef"
      }}>
        <h2 style={{ color: "#495057", marginBottom: "15px" }}>系统托盘未读数功能</h2>
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: "15px",
          flexWrap: "wrap"
        }}>
          <div style={{
            backgroundColor: unreadCount > 0 ? "#dc3545" : "#6c757d",
            color: "white",
            padding: "8px 16px",
            borderRadius: "20px",
            fontWeight: "bold",
            fontSize: "16px"
          }}>
            未读数: {unreadCount}
          </div>
          
          <button 
            onClick={incrementUnread}
            style={{
              backgroundColor: "#007bff",
              color: "white",
              padding: "10px 20px",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500"
            }}
          >
            增加未读数 (+1)
          </button>
          
          <button 
            onClick={clearUnread}
            style={{
              backgroundColor: "#28a745",
              color: "white",
              padding: "10px 20px",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500"
            }}
          >
            清除未读数
          </button>
        </div>
        
        <div style={{ 
          marginTop: "15px", 
          padding: "10px", 
          backgroundColor: "#e7f3ff",
          borderRadius: "4px",
          fontSize: "14px",
          color: "#0066cc",
          border: "1px solid #b3d9ff"
        }}>
          <p><strong>💡 未读数显示方式:</strong></p>
          <ul style={{ margin: "5px 0", paddingLeft: "20px" }}>
            <li><strong>系统托盘图标:</strong> 动态生成带红色徽章的图标（跨平台）</li>
            <li><strong>托盘标题:</strong> 在图标旁显示 "Demo(3)" 格式（某些平台）</li>
            <li><strong>悬停提示:</strong> 鼠标悬停显示详细未读数（所有平台）</li>
            <li><strong>窗口标题:</strong> 在标题栏显示未读数（所有平台）</li>
            <li><strong>macOS Dock:</strong> 在Dock图标上显示红色徽章数字（仅macOS）</li>
            <li><strong>托盘菜单:</strong> 右键点击可快速操作（所有平台）</li>
          </ul>
          <p style={{ marginTop: "10px", fontStyle: "italic", fontSize: "12px", color: "#666" }}>
            💎 现在使用程序化生成的图标，可以像微信一样在图标上显示红色徽章！
          </p>
        </div>
      </div>

      {/* 原有的功能 */}
      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          greet();
        }}
      >
        <input
          id="greet-input"
          onChange={(e) => setName(e.currentTarget.value)}
          placeholder="Enter a name..."
        />
        <button type="submit">Greet</button>
      </form>
      <p>{greetMsg}</p>

      <div className="row">
        <button 
          onClick={openTauriDocs}
          style={{
            backgroundColor: "#24292e",
            color: "white",
            padding: "10px 20px",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "500",
            marginRight: "10px"
          }}
        >
          打开 Tauri 文档
        </button>
        
        <button 
          onClick={selectFile}
          style={{
            backgroundColor: "#0066cc",
            color: "white",
            padding: "10px 20px",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "500"
          }}
        >
          选择文件
        </button>
      </div>

      {selectedPath && (
        <div style={{ 
          marginTop: "20px", 
          padding: "10px", 
          backgroundColor: "#f5f5f5", 
          borderRadius: "6px",
          wordBreak: "break-all"
        }}>
          <p><strong>选择的路径:</strong></p>
          <p style={{ color: "#0066cc", fontFamily: "monospace" }}>
            {selectedPath}
          </p>
        </div>
      )}
    </main>
  );
}

export default App;
