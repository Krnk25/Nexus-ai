/* eslint-disable react-hooks/immutability */
import { useEffect, useRef, useState } from "react";
import API from "../services/api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import {
  createChat,
  deleteChat,
  getChat,
  getChats,
  saveMessage,
} from "../services/chatService";

import { saveActivity } from "../services/activityService";

import "../styles/chat.css";

function CodeBlock({ children }) {
  const code = String(children).replace(/\n$/, "");

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      alert("Code copied ✅");
    } catch {
      alert("Copy failed ❌");
    }
  };

  return (
    <div className="code-box">
      <button className="copy-code-btn" onClick={copyCode}>
        Copy
      </button>

      <pre>
        <code>{code}</code>
      </pre>
    </div>
  );
}

export default function Chat() {
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const endRef = useRef(null);

  useEffect(() => {
    loadChats();
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const logActivity = async (type, title, description = "") => {
    try {
      await saveActivity(type, title, description);
    } catch (error) {
      console.log("Activity log failed:", error);
    }
  };

  const loadChats = async () => {
    try {
      const res = await getChats();
      setChats(res.data);
    } catch (error) {
      console.log("Load chats error:", error);
    }
  };

  const handleNewChat = async () => {
    try {
      const res = await createChat();
      setActiveChat(res.data);
      setMessages([]);
      setInput("");
      setSelectedFile(null);
      await loadChats();

      await logActivity("Chat", "New Chat Created", "Started a new chat");
    } catch (error) {
      console.log("Create chat error:", error);
    }
  };

  const openChat = async (id) => {
    try {
      const res = await getChat(id);
      setActiveChat(res.data);
      setMessages(res.data.messages || []);
      setInput("");
      setSelectedFile(null);

      await logActivity("Chat", "Chat Opened", res.data?.title || "Opened chat");
    } catch (error) {
      console.log("Open chat error:", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteChat(id);

      if (activeChat?._id === id) {
        setActiveChat(null);
        setMessages([]);
        setInput("");
        setSelectedFile(null);
      }

      await loadChats();

      await logActivity("Chat", "Chat Deleted", `Deleted chat ID: ${id}`);
    } catch (error) {
      console.log("Delete chat error:", error);
    }
  };

  const uploadSelectedFile = async () => {
    if (!selectedFile) return "";

    const formData = new FormData();
    formData.append("file", selectedFile);

    const uploadRes = await API.post("/file/analyze", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    if (!uploadRes.data?.text) {
      throw new Error("File text not extracted");
    }

    await logActivity(
      "File",
      "File Uploaded In Chat",
      uploadRes.data.filename || selectedFile.name
    );

    return `
Uploaded File: ${uploadRes.data.filename}

File Content:
${uploadRes.data.text}
`;
  };

  const buildHistory = () => {
    return messages
      .filter((msg) => msg?.content)
      .slice(-10)
      .map((msg) => ({
        role: msg.role === "assistant" ? "assistant" : "user",
        content: String(msg.content),
      }));
  };

  const handleSend = async () => {
    if ((!input.trim() && !selectedFile) || loading) return;

    let chat = activeChat;

    try {
      if (!chat) {
        const newChat = await createChat();
        chat = newChat.data;
        setActiveChat(chat);

        await logActivity("Chat", "New Chat Created", "Created chat automatically");
      }

      setLoading(true);

      const userText = input.trim();
      const fileName = selectedFile?.name || "";

      let fileContext = "";

      if (selectedFile) {
        fileContext = await uploadSelectedFile();
      }

      const userMessage = {
        role: "user",
        content: fileContext
          ? `${userText || "Analyze this file"}\n\n📎 Uploaded: ${fileName}\n\n${fileContext}`
          : userText,
      };

      const finalMessage = fileContext
        ? `
User Question:
${userText || "Analyze this file"}

${fileContext}
`
        : userText;

      setInput("");
      setSelectedFile(null);

      setMessages((prev) => [...prev, userMessage]);
      await saveMessage(chat._id, userMessage);

      await logActivity(
        fileContext ? "File" : "Chat",
        fileContext ? "File Chat Message" : "AI Chat Message",
        fileContext ? fileName : userText
      );

      const historyForAI = buildHistory();

      historyForAI.push({
        role: "user",
        content: finalMessage,
      });

      const savedSettings = JSON.parse(
        localStorage.getItem("nexus_settings") || "{}"
      );

      const aiRes = await API.post("/ai/chat", {
        message: finalMessage,
        history: historyForAI,
        settings: savedSettings,
      });

      const aiMessage = {
        role: "assistant",
        content: aiRes.data.reply || "No response received.",
      };

      setMessages((prev) => [...prev, aiMessage]);
      await saveMessage(chat._id, aiMessage);

      await logActivity("Chat", "AI Reply Received", aiMessage.content.slice(0, 120));

      await loadChats();
    } catch (error) {
      console.log("Send message error:", error);

      const errorMessage = {
        role: "assistant",
        content:
          error.response?.data?.message ||
          error.message ||
          "Message save/API failed. Check backend console.",
      };

      setMessages((prev) => [...prev, errorMessage]);

      await logActivity("Chat", "Chat Error", errorMessage.content);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-page">
      <aside className="chat-sidebar">
        <button className="new-chat-btn" onClick={handleNewChat}>
          + New Chat
        </button>

        <div className="chat-history">
          {chats.map((chat) => (
            <div
              className={`chat-history-item ${
                activeChat?._id === chat._id ? "active" : ""
              }`}
              key={chat._id}
            >
              <button onClick={() => openChat(chat._id)}>
                {chat.title || "New Chat"}
              </button>

              <span onClick={() => handleDelete(chat._id)}>×</span>
            </div>
          ))}
        </div>
      </aside>

      <main className="chat-main">
        <header className="chat-header">
          <div className="chat-header-left">
            <h2>NEXUS AI Chat</h2>
            <p>ChatGPT-style AI assistant with upload support</p>
          </div>
        </header>

        <section className="chat-messages">
          {messages.length === 0 ? (
            <div className="empty-chat">
              <h1>NEXUS AI</h1>
              <p>Ask coding, upload resume, PDF, text, or code files.</p>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div className={`message ${msg.role}`} key={index}>
                <div className="message-avatar">
                  {msg.role === "user" ? "YOU" : "AI"}
                </div>

                <div className="message-content">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code({ inline, children }) {
                        if (inline) return <code>{children}</code>;
                        return <CodeBlock>{children}</CodeBlock>;
                      },
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
              </div>
            ))
          )}

          {loading && (
            <div className="message assistant">
              <div className="message-avatar">AI</div>
              <div className="message-content">Thinking...</div>
            </div>
          )}

          <div ref={endRef}></div>
        </section>

        <footer className="chat-input-area">
          {selectedFile && (
            <div className="selected-chat-file">
              📎 {selectedFile.name}
              <button type="button" onClick={() => setSelectedFile(null)}>
                ×
              </button>
            </div>
          )}

          <label className="chat-upload-btn">
            📎
            <input
              type="file"
              hidden
              accept=".pdf,.txt,.js,.jsx,.html,.css,.json,.md"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            />
          </label>

          <textarea
            placeholder="Message Nexus AI..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />

          <button onClick={handleSend} disabled={loading}>
            {loading ? "Wait..." : "Send"}
          </button>
        </footer>
      </main>
    </div>
  );
}