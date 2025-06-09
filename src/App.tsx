import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { openUrl, revealItemInDir } from "@tauri-apps/plugin-opener";
import { open as openFileDialog, save } from "@tauri-apps/plugin-dialog";
import { writeText, readText } from "@tauri-apps/plugin-clipboard-manager";
import { enable, disable, isEnabled } from '@tauri-apps/plugin-autostart';
import { register, unregister, isRegistered } from '@tauri-apps/plugin-global-shortcut';
import { download } from '@tauri-apps/plugin-upload';

import "./App.css";

import reactLogo from "./assets/react.svg";

// 全局快捷键类型定义
interface Shortcut {
  id: string;
  combination: string;
  description: string;
  isRegistered: boolean;
}

// 下载进度类型定义
interface DownloadProgress {
  progress: number;
  total?: number;
  transferSpeed?: number;
}

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");
  const [selectedPath, setSelectedPath] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [clipboardText, setClipboardText] = useState("");
  const [textToCopy, setTextToCopy] = useState("Hello, 这是一段测试文本！🚀");
  const [isAutoStartEnabled, setIsAutoStartEnabled] = useState(false);
  
  // 全局快捷键状态
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([
    { id: 'show-window', combination: 'CmdOrCtrl+Shift+A', description: '显示/隐藏窗口', isRegistered: false },
    { id: 'increment-unread', combination: 'CmdOrCtrl+Shift+I', description: '增加未读数', isRegistered: false },
    { id: 'clear-unread', combination: 'CmdOrCtrl+Shift+C', description: '清除未读数', isRegistered: false }
  ]);
  const [editingShortcut, setEditingShortcut] = useState<string | null>(null);
  const [newShortcutInput, setNewShortcutInput] = useState('');

  // 文件下载状态
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState("https://yim-chat.yidejia.com/desktop/fb70a0189b798f3c46f04fe57149b128.jpg");
  const [downloadPath, setDownloadPath] = useState("");

  useEffect(() => {
    // 获取初始未读数
    invoke("get_unread_count").then((count) => {
      setUnreadCount(count as number);
    });
    
    // 获取自动启动状态（使用纯JavaScript API）
    isEnabled()
      .then((enabled) => {
        setIsAutoStartEnabled(enabled);
        console.log("自动启动状态:", enabled ? "已启用" : "已禁用");
      })
      .catch(err => {
        console.error("检查自动启动状态失败:", err);
      });

    // 初始化全局快捷键状态
    const initializeShortcuts = async () => {
      const updatedShortcuts = await Promise.all(
        shortcuts.map(async (shortcut) => {
          try {
            const registered = await isRegistered(shortcut.combination);
            return { ...shortcut, isRegistered: registered };
          } catch (error) {
            console.error(`检查快捷键 ${shortcut.combination} 状态失败:`, error);
            return shortcut;
          }
        })
      );
      setShortcuts(updatedShortcuts);
    };
    
    initializeShortcuts();

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
  
  async function toggleAutoStart() {
    try {
      if (isAutoStartEnabled) {
        // 如果已启用，则禁用（使用纯JavaScript API）
        await disable();
        setIsAutoStartEnabled(false);
        console.log("已禁用开机自启动");
      } else {
        // 如果已禁用，则启用（使用纯JavaScript API）
        await enable();
        setIsAutoStartEnabled(true);
        console.log("已启用开机自启动");
      }
    } catch (error) {
      console.error("切换自动启动状态失败:", error);
    }
  }

  // 全局快捷键相关函数
  async function registerShortcut(shortcutId: string, combination: string) {
    try {
      await register(combination, async () => {
        console.log(`全局快捷键 ${combination} 被触发`);
        
        // 根据快捷键ID执行不同操作
        switch (shortcutId) {
          case 'show-window':
            // 显示/隐藏窗口的逻辑 - 这里我们调用后端的逻辑
            console.log('触发显示/隐藏窗口');
            break;
          case 'increment-unread':
            await incrementUnread();
            break;
          case 'clear-unread':
            await clearUnread();
            break;
        }
      });
      
      // 更新快捷键注册状态
      setShortcuts(prev => prev.map(s => 
        s.id === shortcutId ? { ...s, isRegistered: true } : s
      ));
      
      console.log(`快捷键 ${combination} 注册成功`);
    } catch (error) {
      console.error(`注册快捷键 ${combination} 失败:`, error);
    }
  }

  async function unregisterShortcut(combination: string) {
    try {
      await unregister(combination);
      
      // 更新快捷键注册状态
      setShortcuts(prev => prev.map(s => 
        s.combination === combination ? { ...s, isRegistered: false } : s
      ));
      
      console.log(`快捷键 ${combination} 取消注册成功`);
    } catch (error) {
      console.error(`取消注册快捷键 ${combination} 失败:`, error);
    }
  }

  async function toggleShortcut(shortcut: Shortcut) {
    if (shortcut.isRegistered) {
      await unregisterShortcut(shortcut.combination);
    } else {
      await registerShortcut(shortcut.id, shortcut.combination);
    }
  }

  async function updateShortcutCombination(shortcutId: string, newCombination: string) {
    const shortcut = shortcuts.find(s => s.id === shortcutId);
    if (!shortcut) return;

    try {
      // 如果当前快捷键已注册，先取消注册
      if (shortcut.isRegistered) {
        await unregisterShortcut(shortcut.combination);
      }

      // 更新快捷键组合
      setShortcuts(prev => prev.map(s => 
        s.id === shortcutId ? { ...s, combination: newCombination, isRegistered: false } : s
      ));

      console.log(`快捷键组合已更新为: ${newCombination}`);
    } catch (error) {
      console.error('更新快捷键组合失败:', error);
    }
  }

  function startEditingShortcut(shortcutId: string) {
    const shortcut = shortcuts.find(s => s.id === shortcutId);
    if (shortcut) {
      setEditingShortcut(shortcutId);
      setNewShortcutInput(shortcut.combination);
    }
  }

  async function saveShortcutEdit() {
    if (editingShortcut && newShortcutInput.trim()) {
      await updateShortcutCombination(editingShortcut, newShortcutInput.trim());
      setEditingShortcut(null);
      setNewShortcutInput('');
    }
  }

  function cancelShortcutEdit() {
    setEditingShortcut(null);
    setNewShortcutInput('');
  }

  // 键盘事件处理，用于捕获快捷键输入
  function handleShortcutKeyDown(e: React.KeyboardEvent) {
    e.preventDefault();
    
    const keys = [];
    if (e.ctrlKey || e.metaKey) keys.push(e.metaKey ? 'Cmd' : 'Ctrl');
    if (e.altKey) keys.push('Alt');
    if (e.shiftKey) keys.push('Shift');
    
    if (e.key && !['Control', 'Meta', 'Alt', 'Shift'].includes(e.key)) {
      const key = e.key.toUpperCase();
      keys.push(key);
    }
    
    if (keys.length > 1) {
      const combination = keys.join('+').replace('Cmd', 'CmdOrCtrl').replace('Ctrl', 'CmdOrCtrl');
      setNewShortcutInput(combination);
    }
  }

  // 文件下载相关函数
  async function selectDownloadPath() {
    try {
      const filePath = await save({
        defaultPath: 'test.jpg'
      });
      
      if (filePath) {
        setDownloadPath(filePath);
        console.log("选择的下载路径:", filePath);
      }
    } catch (error) {
      console.error("选择下载路径失败:", error);
    }
  }

  async function startDownload() {
    if (!downloadUrl.trim()) {
      alert("请输入下载链接");
      return;
    }

    if (!downloadPath) {
      await selectDownloadPath();
      return;
    }

    try {
      setIsDownloading(true);
      setDownloadProgress({ progress: 0, transferSpeed: 0 });
      
      console.log("开始下载:", downloadUrl, "到", downloadPath);
      
      await download(
        downloadUrl,
        downloadPath,
        (progress) => {
          console.log("下载进度:", progress);
          setDownloadProgress({
            progress: progress.progress || 0,
            total: progress.total,
            transferSpeed: progress.transferSpeed || 0
          });
        }
      );
      
      setIsDownloading(false);
      setDownloadProgress(null);
      console.log("文件下载完成:", downloadPath);
      
      // 下载完成后打开文件所在的文件夹
      try {
        // 使用revealItemInDir直接打开文件所在的位置，无需截取路径
        await revealItemInDir(downloadPath);
        console.log("已打开文件所在位置:", downloadPath);
      } catch (openError) {
        console.error("打开文件夹失败:", openError);
      }
    } catch (error) {
      setIsDownloading(false);
      setDownloadProgress(null);
      console.error("下载失败:", error);
      alert("下载失败: " + error);
    }
  }

  function cancelDownload() {
    setIsDownloading(false);
    setDownloadProgress(null);
    setDownloadPath("");
  }

  function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async function selectFile() {
    try {
      const selected = await openFileDialog({
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

        {/* 自动启动模块 */}
        <div style={{ 
          padding: "12px", 
          backgroundColor: "#e8f4f8", 
          borderRadius: "6px",
          border: "1px solid #a2d4f2",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
        }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "16px", marginRight: "6px" }}>🚀</span>
            <h3 style={{ margin: "0", fontSize: "14px", fontWeight: "600", color: "#0056b3" }}>自动启动</h3>
          </div>
          
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "8px",
            marginBottom: "8px"
          }}>
            <div style={{
              backgroundColor: isAutoStartEnabled ? "#198754" : "#6c757d",
              color: "white",
              padding: "4px 8px",
              borderRadius: "12px",
              fontWeight: "600",
              fontSize: "12px",
              width: "80px",
              textAlign: "center"
            }}>
              {isAutoStartEnabled ? "已启用" : "已禁用"}
            </div>
            
            <button 
              onClick={toggleAutoStart}
              style={{
                backgroundColor: isAutoStartEnabled ? "#dc3545" : "#198754",
                color: "white",
                padding: "4px 8px",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "11px",
                fontWeight: "500",
                minWidth: "80px"
              }}
            >
              {isAutoStartEnabled ? "禁用" : "启用"}
            </button>
          </div>
          
          <div style={{ fontSize: "10px", color: "#6c757d", lineHeight: "1.3" }}>
            💡 设置应用程序开机自动启动，自动以最小化状态运行
          </div>
        </div>
        
        {/* 全局快捷键模块 */}
        <div style={{ 
          padding: "12px", 
          backgroundColor: "#f8e6ff", 
          borderRadius: "6px",
          border: "1px solid #d946ef",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          gridColumn: "span 2" // 占用两列宽度
        }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: "12px" }}>
            <span style={{ fontSize: "16px", marginRight: "6px" }}>⌨️</span>
            <h3 style={{ margin: "0", fontSize: "14px", fontWeight: "600", color: "#7c2d12" }}>全局快捷键</h3>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {shortcuts.map((shortcut) => (
              <div key={shortcut.id} style={{
                backgroundColor: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "4px",
                padding: "8px",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}>
                {/* 快捷键状态指示器 */}
                <div style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: shortcut.isRegistered ? "#10b981" : "#6b7280",
                  flexShrink: 0
                }}></div>
                
                {/* 快捷键描述 */}
                <div style={{ 
                  fontSize: "12px", 
                  fontWeight: "500",
                  color: "#374151",
                  minWidth: "80px",
                  flexShrink: 0
                }}>
                  {shortcut.description}
                </div>
                
                {/* 快捷键组合显示/编辑 */}
                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "6px" }}>
                  {editingShortcut === shortcut.id ? (
                    <>
                      <input
                        type="text"
                        value={newShortcutInput}
                        onChange={(e) => setNewShortcutInput(e.target.value)}
                        onKeyDown={handleShortcutKeyDown}
                        placeholder="按下快捷键组合..."
                        style={{
                          flex: 1,
                          padding: "4px 6px",
                          border: "1px solid #d1d5db",
                          borderRadius: "3px",
                          fontSize: "11px",
                          fontFamily: "monospace"
                        }}
                      />
                      <button
                        onClick={saveShortcutEdit}
                        style={{
                          backgroundColor: "#10b981",
                          color: "white",
                          border: "none",
                          borderRadius: "3px",
                          padding: "4px 8px",
                          fontSize: "10px",
                          cursor: "pointer"
                        }}
                      >
                        保存
                      </button>
                      <button
                        onClick={cancelShortcutEdit}
                        style={{
                          backgroundColor: "#6b7280",
                          color: "white",
                          border: "none",
                          borderRadius: "3px",
                          padding: "4px 8px",
                          fontSize: "10px",
                          cursor: "pointer"
                        }}
                      >
                        取消
                      </button>
                    </>
                  ) : (
                    <>
                      <div style={{
                        backgroundColor: "#f3f4f6",
                        border: "1px solid #d1d5db",
                        borderRadius: "3px",
                        padding: "4px 8px",
                        fontSize: "11px",
                        fontFamily: "monospace",
                        color: "#374151",
                        flex: 1
                      }}>
                        {shortcut.combination}
                      </div>
                      <button
                        onClick={() => startEditingShortcut(shortcut.id)}
                        style={{
                          backgroundColor: "#3b82f6",
                          color: "white",
                          border: "none",
                          borderRadius: "3px",
                          padding: "4px 8px",
                          fontSize: "10px",
                          cursor: "pointer"
                        }}
                      >
                        编辑
                      </button>
                    </>
                  )}
                </div>
                
                {/* 启用/禁用按钮 */}
                {editingShortcut !== shortcut.id && (
                  <button
                    onClick={() => toggleShortcut(shortcut)}
                    style={{
                      backgroundColor: shortcut.isRegistered ? "#ef4444" : "#10b981",
                      color: "white",
                      border: "none",
                      borderRadius: "3px",
                      padding: "4px 8px",
                      fontSize: "10px",
                      cursor: "pointer",
                      minWidth: "50px"
                    }}
                  >
                    {shortcut.isRegistered ? "禁用" : "启用"}
                  </button>
                )}
              </div>
            ))}
          </div>
          
          <div style={{ fontSize: "10px", color: "#6b7280", lineHeight: "1.3", marginTop: "8px" }}>
            💡 设置全局快捷键，即使应用在后台也能快速操作。点击输入框并按下新的快捷键组合来修改。
          </div>
        </div>
        
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

        {/* 文件下载模块 */}
        <div style={{ 
          padding: "12px", 
          backgroundColor: "#f0f9ff", 
          borderRadius: "6px",
          border: "1px solid #0ea5e9",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          gridColumn: "span 2" // 占用两列宽度
        }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: "12px" }}>
            <span style={{ fontSize: "16px", marginRight: "6px" }}>📥</span>
            <h3 style={{ margin: "0", fontSize: "14px", fontWeight: "600", color: "#0c4a6e" }}>文件下载</h3>
          </div>
          
          {/* 下载 URL 输入 */}
          <div style={{ marginBottom: "8px" }}>
            <label style={{ fontSize: "12px", fontWeight: "500", color: "#374151", display: "block", marginBottom: "4px" }}>
              下载链接:
            </label>
            <input 
              value={downloadUrl}
              onChange={(e) => setDownloadUrl(e.target.value)}
              placeholder="输入文件下载链接..."
              disabled={isDownloading}
              style={{
                width: "100%",
                padding: "6px 8px",
                border: "1px solid #d1d5db",
                borderRadius: "4px",
                fontSize: "12px",
                boxSizing: "border-box",
                backgroundColor: isDownloading ? "#f9fafb" : "white",
                color:"black"
              }}
            />
          </div>

          {/* 下载路径显示 */}
          {downloadPath && (
            <div style={{ marginBottom: "8px" }}>
              <label style={{ fontSize: "12px", fontWeight: "500", color: "#374151", display: "block", marginBottom: "4px" }}>
                保存路径:
              </label>
              <div style={{
                backgroundColor: "#f3f4f6",
                border: "1px solid #d1d5db",
                borderRadius: "4px",
                padding: "6px 8px",
                fontSize: "11px",
                fontFamily: "monospace",
                color: "#374151",
                wordBreak: "break-all"
              }}>
                {downloadPath}
              </div>
            </div>
          )}

          {/* 下载进度显示 */}
          {downloadProgress && (
            <div style={{ marginBottom: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                <span style={{ fontSize: "12px", fontWeight: "500", color: "#374151" }}>下载进度:</span>
                <span style={{ fontSize: "11px", color: "#6b7280" }}>
                  {Math.round(downloadProgress.progress)}%
                  {downloadProgress.transferSpeed && (
                    <span> • {formatBytes(downloadProgress.transferSpeed)}/s</span>
                  )}
                </span>
              </div>
              <div style={{
                width: "100%",
                height: "8px",
                backgroundColor: "#e5e7eb",
                borderRadius: "4px",
                overflow: "hidden"
              }}>
                <div style={{
                  width: `${downloadProgress.progress}%`,
                  height: "100%",
                  backgroundColor: "#3b82f6",
                  transition: "width 0.3s ease-in-out"
                }}></div>
              </div>
              {downloadProgress.total && (
                <div style={{ fontSize: "10px", color: "#6b7280", marginTop: "2px" }}>
                  总大小: {formatBytes(downloadProgress.total)}
                </div>
              )}
            </div>
          )}

          {/* 操作按钮 */}
          <div style={{ display: "flex", gap: "8px" }}>
            {!isDownloading ? (
              <>
                <button 
                  onClick={selectDownloadPath}
                  style={{
                    backgroundColor: "#6b7280",
                    color: "white",
                    padding: "6px 12px",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: "500",
                    flex: "1"
                  }}
                >
                  选择路径
                </button>
                <button 
                  onClick={startDownload}
                  disabled={!downloadUrl.trim()}
                  style={{
                    backgroundColor: downloadUrl.trim() ? "#0ea5e9" : "#9ca3af",
                    color: "white",
                    padding: "6px 12px",
                    border: "none",
                    borderRadius: "4px",
                    cursor: downloadUrl.trim() ? "pointer" : "not-allowed",
                    fontSize: "12px",
                    fontWeight: "500",
                    flex: "2"
                  }}
                >
                  📥 开始下载
                </button>
              </>
            ) : (
              <button 
                onClick={cancelDownload}
                style={{
                  backgroundColor: "#ef4444",
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
                取消下载
              </button>
            )}
          </div>
          
          <div style={{ fontSize: "10px", color: "#6b7280", lineHeight: "1.3", marginTop: "8px" }}>
            💡 输入下载链接，选择保存路径，点击开始下载。支持显示下载进度和传输速度，下载完成后自动打开文件夹。
          </div>
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
