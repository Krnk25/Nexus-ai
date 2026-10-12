
/* eslint-disable react-hooks/immutability */

import { useCallback, useEffect, useRef, useState } from "react";
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

// Safely extract an array from different API response formats.
function getArray(data, keys = []) {
  if (Array.isArray(data)) return data;

  for (const key of keys) {
    if (Array.isArray(data?.[key])) {
      return data[key];
    }
  }

  return [];
}

// Extract a chat object from common response formats.
function getChatObject(data) {
  if (!data || typeof data !== "object") return null;

  const chat = data.chat || data.data || data;

  if (!chat || typeof chat !== "object" || Array.isArray(chat)) {
    return null;
  }

  return chat._id || chat.id ? chat : null;
}

function getMessageArray(data) {
  return getArray(data, ["messages", "data"]);
}

function CodeBlock({ children }) {
  const code = String(children ?? "").replace(/\n$/, "");

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      alert("Code copied ✅");
    } catch (error) {
      console.error("Copy failed:", error);
      alert("Code copy failed ❌");
    }
  };

  return (
    <div className="code-box">
      <button
        type="button"
        className="copy-code-btn"
        onClick={copyCode}
      >
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
  const [chatsLoading, setChatsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const endRef = useRef(null);
  const fileInputRef = useRef(null);
  const messagesRef = useRef([]);
  const activeChatRef = useRef(null);

  // Keep refs synchronized with current state.
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const logActivity = useCallback(
    async (type, title, description = "") => {
      try {
        await saveActivity(type, title, description);
      } catch (error) {
        console.warn(
          "Activity log failed:",
          error.response?.data || error.message
        );
      }
    },
    []
  );

  // Load chat history safely.
  const loadChats = useCallback(async () => {
    setChatsLoading(true);

    try {
      const res = await getChats();
      const data = res?.data;

      console.log("📦 Chats API Response:", data);

      const list = getArray(data, [
        "chats",
        "data",
        "results",
      ]);

      setChats(list);
      return list;
    } catch (error) {
      console.error(
        "Load chats error:",
        error.response?.data || error.message
      );

      setChats([]);
      return [];
    } finally {
      setChatsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  // Create a new chat.
  const handleNewChat = async () => {
    if (loading) return;

    setErrorMessage("");

    try {
      const res = await createChat();
      const chat = getChatObject(res?.data);

      if (!chat) {
        throw new Error(
          "Backend did not return a valid chat. Check createChat API."
        );
      }

      setActiveChat(chat);
      activeChatRef.current = chat;

      setMessages([]);
      messagesRef.current = [];

      setInput("");
      setSelectedFile(null);

      await loadChats();

      await logActivity(
        "Chat",
        "New Chat Created",
        "Started a new chat"
      );
    } catch (error) {
      console.error(
        "Create chat error:",
        error.response?.data || error.message
      );

      setErrorMessage(
        error.response?.data?.message ||
          error.message ||
          "Unable to create a new chat."
      );
    }
  };

  // Open an existing chat.
  const openChat = async (id) => {
    if (!id || loading) return;

    setErrorMessage("");

    try {
      const res = await getChat(id);
      const chat = getChatObject(res?.data);

      if (!chat) {
        throw new Error("Invalid chat response from backend.");
      }

      const chatMessages = getMessageArray(chat);

      setActiveChat(chat);
      activeChatRef.current = chat;

      setMessages(chatMessages);
      messagesRef.current = chatMessages;

      setInput("");
      setSelectedFile(null);

      await logActivity(
        "Chat",
        "Chat Opened",
        chat.title || "Opened chat"
      );
    } catch (error) {
      console.error(
        "Open chat error:",
        error.response?.data || error.message
      );

      setErrorMessage(
        error.response?.data?.message ||
          error.message ||
          "Unable to open this chat."
      );
    }
  };

  // Delete a chat.
  const handleDelete = async (id) => {
    if (!id || loading) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this chat?"
    );

    if (!confirmed) return;

    setErrorMessage("");

    try {
      await deleteChat(id);

      const currentChat = activeChatRef.current;
      const currentId = currentChat?._id || currentChat?.id;

      if (String(currentId) === String(id)) {
        setActiveChat(null);
        activeChatRef.current = null;

        setMessages([]);
        messagesRef.current = [];

        setInput("");
        setSelectedFile(null);
      }

      await loadChats();

      await logActivity(
        "Chat",
        "Chat Deleted",
        `Deleted chat ID: ${id}`
      );
    } catch (error) {
      console.error(
        "Delete chat error:",
        error.response?.data || error.message
      );

      setErrorMessage(
        error.response?.data?.message ||
          error.message ||
          "Unable to delete chat."
      );
    }
  };

  // Upload the selected file and extract its text.
  const uploadSelectedFile = async () => {
    if (!selectedFile) return "";

    const formData = new FormData();
    formData.append("file", selectedFile);

    const response = await API.post(
      "/file/analyze",
      formData
    );

    const data = response?.data;

    if (!data || typeof data.text !== "string") {
      throw new Error(
        data?.message || "File text could not be extracted."
      );
    }

    await logActivity(
      "File",
      "File Uploaded In Chat",
      data.filename || selectedFile.name
    );

    return {
      filename: data.filename || selectedFile.name,
      text: data.text,
    };
  };

  // Send a message to Nexus AI.
  const handleSend = async () => {
    const userText = input.trim();
    const file = selectedFile;

    if ((!userText && !file) || loading) return;

    setLoading(true);
    setErrorMessage("");

    let chat = activeChatRef.current;
    let userMessage = null;

    try {
      // Automatically create a chat if none is selected.
      if (!chat) {
        const newChatResponse = await createChat();
        chat = getChatObject(newChatResponse?.data);

        if (!chat) {
          throw new Error(
            "Unable to create a chat. Check backend response."
          );
        }

        setActiveChat(chat);
        activeChatRef.current = chat;
      }

      const chatId = chat._id || chat.id;

      if (!chatId) {
        throw new Error("Chat ID is missing.");
      }

      let fileContext = "";

      if (file) {
        const uploaded = await uploadSelectedFile();

        fileContext =
          `\n\nUploaded File: ${uploaded.filename}\n\n` +
          `File Content:\n${uploaded.text}`;
      }

      const finalMessage =
        (userText || "Analyze this file") + fileContext;

      userMessage = {
        role: "user",
        content: file
          ? `${userText || "Analyze this file"}\n\n` +
            `📎 Uploaded: ${file.name}\n\n${fileContext}`
          : userText,
      };

      // Display immediately.
      const previousMessages = messagesRef.current;
      const updatedMessages = [
        ...previousMessages,
        userMessage,
      ];

      messagesRef.current = updatedMessages;
      setMessages(updatedMessages);

      setInput("");
      setSelectedFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Save user message.
      await saveMessage(chatId, userMessage);

      await logActivity(
        file ? "File" : "Chat",
        file ? "File Chat Message" : "AI Chat Message",
        file ? file.name : userText
      );

      // Send conversation history to AI.
      const history = previousMessages
        .filter(
          (message) =>
            message?.content &&
            ["user", "assistant"].includes(message.role)
        )
        .slice(-10)
        .map((message) => ({
          role: message.role,
          content: String(message.content),
        }));

      history.push({
        role: "user",
        content: finalMessage,
      });

      let savedSettings = {};

      try {
        savedSettings = JSON.parse(
          localStorage.getItem("nexus_settings") || "{}"
        );
      } catch {
        savedSettings = {};
      }

      const aiResponse = await API.post("/ai/chat", {
        message: finalMessage,
        history,
        settings: savedSettings,
      });

      const reply =
        typeof aiResponse?.data?.reply === "string"
          ? aiResponse.data.reply
          : typeof aiResponse?.data?.message === "string"
          ? aiResponse.data.message
          : "";

      if (!reply) {
        throw new Error(
          aiResponse?.data?.error ||
            "AI returned an empty response."
        );
      }

      const aiMessage = {
        role: "assistant",
        content: reply,
      };

      const finalMessages = [
        ...messagesRef.current,
        aiMessage,
      ];

      messagesRef.current = finalMessages;
      setMessages(finalMessages);

      // Save assistant reply.
      await saveMessage(chatId, aiMessage);

      await logActivity(
        "Chat",
        "AI Reply Received",
        reply.slice(0, 120)
      );

      await loadChats();
    } catch (error) {
      console.error(
        "Send message error:",
        error.response?.data || error.message
      );

      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Message failed. Check the backend.";

      setErrorMessage(message);

      // Show an error in the conversation.
      const errorReply = {
        role: "assistant",
        content: `⚠️ ${message}`,
      };

      const updatedMessages = [
        ...messagesRef.current,
        errorReply,
      ];

      messagesRef.current = updatedMessages;
      setMessages(updatedMessages);

      await logActivity("Chat", "Chat Error", message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
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