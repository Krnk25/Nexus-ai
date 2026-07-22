/* eslint-disable no-useless-assignment */
/* eslint-disable react-hooks/purity */

import axios from "axios";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import AIAnalytics from "../components/AIAnalytics/AIAnalytics";
import ActivityLogs from "../components/ActivityLogs/ActivityLogs";
import FileAnalyzer from "../components/FileAnalyzer/FileAnalyzer";
import MemoryManager from "../components/MemoryManager/MemoryManager";
import Profile from "../components/Profile/Profile";
import Settings from "../components/Settings/Settings";
import SystemControl from "../components/SystemControl/SystemControl";
import VoiceAssistant from "../components/VoiceAssistant/VoiceAssistant";
import Chat from "./Chat";

import "../styles/dashboard.css";

import {
  FaBars,
  FaBrain,
  FaChartBar,
  FaChartLine,
  FaClipboardList,
  FaCloudSun,
  FaCog,
  FaComments,
  FaDesktop,
  FaGithub,
  FaGoogle,
  FaHome,
  FaMicrophone,
  FaPaperPlane,
  FaUser,
  FaYoutube,
} from "react-icons/fa";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://nexus-ai-backend-1bpy.onrender.com";

const API = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: { "Content-Type": "application/json" },
  timeout: 120000,
});

const menu = [
  { icon: <FaHome />, text: "Dashboard" },
  { icon: <FaComments />, text: "AI Chat" },
  { icon: <FaMicrophone />, text: "Voice Command" },
  { icon: <FaDesktop />, text: "System & Web" },
  { icon: <FaChartBar />, text: "File Analyzer" },
  { icon: <FaChartLine />, text: "AI Analytics" },
  { icon: <FaCog />, text: "Settings" },
];

const quickCommands = [
  { icon: <FaGoogle />, text: "Open Google" },
  { icon: <FaYoutube />, text: "Open YouTube" },
  { icon: <FaGithub />, text: "Open GitHub" },
  { icon: <FaDesktop />, text: "What is React?" },
  { icon: <FaCloudSun />, text: "Weather Update" },
];

const makeBinary = () =>
  Array.from({ length: 22 })
    .map(() => (Math.random() > 0.5 ? "1" : "0"))
    .join("\n");

export default function Dashboard() {
  const navigate = useNavigate();

  const [showChat, setShowChat] = useState(false);
  const [showVoice, setShowVoice] = useState(false);
  const [showSystem, setShowSystem] = useState(false);
  const [showFileAnalyzer, setShowFileAnalyzer] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showMemory, setShowMemory] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [voiceReady, setVoiceReady] = useState(false);
  const [sending, setSending] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  const [networkStatus, setNetworkStatus] = useState(
    navigator.onLine ? "READY" : "OFFLINE",
  );
  const [backendStatus, setBackendStatus] = useState("CHECKING");
  const [systemStatus, setSystemStatus] = useState("READY");

  const [messages, setMessages] = useState([
    "NEXUS AI v3.0.0",
    "Hello Karan 👋",
    "Click mic and ask anything. NEXUS AI will answer directly.",
  ]);

  const consoleEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const speakingRef = useRef(false);
  const autoListenRef = useRef(false);
  const thinkingRef = useRef(false);
  const voicesRef = useRef([]);
  const conversationHistoryRef = useRef([]);
  const lastQuestionRef = useRef({ text: "", time: 0 });

  const rain = useMemo(
    () =>
      Array.from({ length: 60 }).map((_, i) => ({
        id: i,
        left: `${(i / 60) * 100}%`,
        duration: `${7 + Math.random() * 6}s`,
        delay: `${Math.random() * 5}s`,
        text: makeBinary(),
      })),
    [],
  );

  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const updateNetwork = () => {
      setNetworkStatus(navigator.onLine ? "READY" : "OFFLINE");
    };

    window.addEventListener("online", updateNetwork);
    window.addEventListener("offline", updateNetwork);

    return () => {
      window.removeEventListener("online", updateNetwork);
      window.removeEventListener("offline", updateNetwork);
    };
  }, []);

  useEffect(() => {
    const checkBackend = async () => {
      try {
        await axios.get(API_BASE_URL, { timeout: 30000 });
        setBackendStatus("ACTIVE");
      } catch {
        setBackendStatus("FAILED");
      }
    };

    checkBackend();
    const timer = setInterval(checkBackend, 15000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const loadVoices = () => {
      voicesRef.current = window.speechSynthesis?.getVoices() || [];
    };

    loadVoices();
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      try {
        autoListenRef.current = false;
        recognitionRef.current?.stop();
        window.speechSynthesis?.cancel();
      } catch {
        // ignore cleanup error
      }
    };
  }, []);

  const safeText = (value, fallback = "") => {
    if (value === undefined || value === null) return fallback;
    if (typeof value === "string") return value;
    if (typeof value === "number" || typeof value === "boolean") {
      return String(value);
    }
    if (typeof value === "object") {
      return (
        value.reply ||
        value.answer ||
        value.message ||
        value.content ||
        value.error ||
        JSON.stringify(value)
      );
    }
    return String(value);
  };

  const getPersonalData = () => {
    const fallbackProfile = {
      name: "Karan Kabade",
      email: "karankabade7@gmail.com",
      mobile: "8265044456",
      education: "B.Sc Computer Science",
      college: "",
      skills: "React, Node.js, Express.js, MongoDB, PHP, MySQL",
      github: "https://github.com/Krnk25",
      linkedin: "www.linkedin.com/in/karan-kabade",
      portfolio: "",
      location: "beed",
      bio: "",
    };

    try {
      const savedProfile = JSON.parse(
        localStorage.getItem("nexus_profile") || "{}",
      );
      return { ...fallbackProfile, ...savedProfile };
    } catch (error) {
      console.error("Profile read error:", error);
      return fallbackProfile;
    }
  };

  const getAIReply = (data) => {
    if (!data) return "No reply received from AI.";
    if (typeof data === "string") return data;
    return safeText(
      data.reply ||
        data.answer ||
        data.message ||
        data.response ||
        data.text ||
        data.data?.reply ||
        data.data?.answer ||
        data.data?.message ||
        data.result?.reply ||
        data.result?.answer,
      "No reply received from AI.",
    );
  };

  const addMessage = (message) => {
    const finalMessage = safeText(message, "");
    if (!finalMessage || finalMessage === "undefined") return;
    setMessages((prev) => [...prev, finalMessage]);
  };

  const replaceLastMessage = (message) => {
    const finalMessage = safeText(message, "No message.");
    setMessages((prev) => {
      const updated = [...prev];
      if (updated.length === 0) return [finalMessage];
      updated.pop();
      return [...updated, finalMessage];
    });
  };

  const addToConversationHistory = (role, content) => {
    const finalContent = safeText(content, "");
    if (!finalContent || finalContent === "undefined") return;

    conversationHistoryRef.current = [
      ...conversationHistoryRef.current,
      { role, content: finalContent },
    ].slice(-16);
  };

  const getRecognitionLang = () =>
    localStorage.getItem("nexus_recognition_lang") || "en-IN";

  const detectVoiceLang = (text) => {
    const msg = safeText(text, "").toLowerCase();

    const marathiWords = [
      "काय",
      "कसा",
      "कशी",
      "आहे",
      "मला",
      "तुला",
      "सांग",
      "कर",
      "मराठी",
      "महाराष्ट्र",
      "नाव",
      "वेळ",
      "तारीख",
      "वाजले",
      "आजची",
      "kay",
      "kasa",
      "kashi",
      "mala",
      "tula",
      "sang",
      "marathi",
      "maharashtra",
    ];

    const hindiWords = [
      "क्या",
      "कैसे",
      "कैसी",
      "है",
      "मुझे",
      "तुम",
      "बताओ",
      "करो",
      "हिंदी",
      "समय",
      "नाम",
      "तारीख",
      "कितने बजे",
      "kya",
      "kaise",
      "mujhe",
      "tum",
      "batao",
      "hindi",
      "samay",
    ];

    if (marathiWords.some((word) => msg.includes(word))) return "mr-IN";
    if (hindiWords.some((word) => msg.includes(word))) return "hi-IN";
    return "en-IN";
  };

  const getIndianFemaleVoice = (lang = "en-IN") => {
    const voices = voicesRef.current.length
      ? voicesRef.current
      : window.speechSynthesis?.getVoices() || [];

    const femaleNames = [
      "aarohi",
      "heera",
      "kalpana",
      "swara",
      "neerja",
      "sunita",
      "zira",
      "susan",
      "female",
    ];

    const isFemale = (voice) =>
      femaleNames.some((name) => voice.name.toLowerCase().includes(name));

    if (lang === "mr-IN") {
      return (
        voices.find((v) => v.lang === "mr-IN" && isFemale(v)) ||
        voices.find((v) => v.lang === "mr-IN") ||
        voices.find((v) => v.lang === "hi-IN" && isFemale(v)) ||
        voices.find((v) => v.lang === "hi-IN") ||
        voices.find((v) => v.lang === "en-IN") ||
        voices.find((v) => v.lang.startsWith("en")) ||
        voices[0]
      );
    }

    if (lang === "hi-IN") {
      return (
        voices.find((v) => v.lang === "hi-IN" && isFemale(v)) ||
        voices.find((v) => v.lang === "hi-IN") ||
        voices.find((v) => v.lang === "en-IN") ||
        voices.find((v) => v.lang.startsWith("en")) ||
        voices[0]
      );
    }

    return (
      voices.find((v) => v.lang === "en-IN" && isFemale(v)) ||
      voices.find((v) => v.lang === "en-IN") ||
      voices.find((v) => v.lang.startsWith("en")) ||
      voices[0]
    );
  };

  const speak = (replyText) => {
    const finalText = safeText(replyText, "");
    if (!finalText || finalText === "undefined" || !window.speechSynthesis)
      return;

    const cleanText = finalText.replace(
      /```[\s\S]*?```/g,
      "Code block generated in console.",
    );

    const voiceLang = detectVoiceLang(cleanText);
    window.speechSynthesis.cancel();

    const speech = new SpeechSynthesisUtterance(cleanText);
    speech.lang = voiceLang;
    speech.rate = 0.92;
    speech.pitch = 1.2;
    speech.volume = 1;

    const voice = getIndianFemaleVoice(voiceLang);
    if (voice) speech.voice = voice;

    speech.onstart = () => {
      speakingRef.current = true;
    };

    speech.onend = () => {
      speakingRef.current = false;
      if (autoListenRef.current) {
        setTimeout(() => startDirectListening(), 500);
      }
    };

    speech.onerror = () => {
      speakingRef.current = false;
      if (autoListenRef.current) {
        setTimeout(() => startDirectListening(), 700);
      }
    };

    window.speechSynthesis.speak(speech);
  };

  const getCurrentDateReply = (language = "en-IN") => {
    const currentDate = new Date().toLocaleDateString(language, {
      timeZone: "Asia/Kolkata",
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    if (language === "mr-IN") return `आज ${currentDate} आहे.`;
    if (language === "hi-IN") return `आज ${currentDate} है।`;
    return `Today is ${currentDate}.`;
  };

  const getCurrentTimeReply = (language = "en-IN") => {
    const currentTime = new Date().toLocaleTimeString(language, {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    if (language === "mr-IN") return `सध्या ${currentTime} वाजले आहेत.`;
    if (language === "hi-IN") return `अभी ${currentTime} बजे हैं।`;
    return `The current time is ${currentTime}.`;
  };

  const isDateQuestion = (command) => {
    const text = safeText(command, "").toLowerCase();
    const keywords = [
      "आजची तारीख",
      "आज तारीख",
      "आज कोणती तारीख",
      "तारीख सांगा",
      "आज काय तारीख",
      "आज की तारीख",
      "आज कौन सी तारीख",
      "तारीख बताओ",
      "today date",
      "today's date",
      "current date",
      "what is the date",
      "what date is today",
      "tarikh",
    ];
    return keywords.some((keyword) => text.includes(keyword));
  };

  const isTimeQuestion = (command) => {
    const text = safeText(command, "").toLowerCase();
    const keywords = [
      "आताची वेळ",
      "सध्याची वेळ",
      "आत्ता किती वाजले",
      "किती वाजले",
      "वेळ सांगा",
      "अभी कितने बजे",
      "अभी का समय",
      "समय बताओ",
      "current time",
      "what time is it",
      "time now",
      "samay",
    ];
    return keywords.some((keyword) => text.includes(keyword));
  };

  const runLocalCommand = async (command) => {
    const originalCommand = safeText(command, "").trim();
    const cmd = originalCommand.toLowerCase();
    const detectedLanguage = detectVoiceLang(originalCommand);

    if (isDateQuestion(originalCommand)) {
      return getCurrentDateReply(detectedLanguage);
    }

    if (isTimeQuestion(originalCommand)) {
      return getCurrentTimeReply(detectedLanguage);
    }

    if (
      cmd.includes("weather") ||
      cmd.includes("mausam") ||
      cmd.includes("हवामान") ||
      cmd.includes("मौसम")
    ) {
      window.open("https://www.google.com/search?q=weather", "_blank");
      if (detectedLanguage === "mr-IN") return "हवामानाची माहिती उघडत आहे.";
      if (detectedLanguage === "hi-IN") return "मौसम की जानकारी खोल रहा हूँ।";
      return "Opening weather information.";
    }

    if (
      cmd.includes("open") ||
      cmd.includes("kholo") ||
      cmd.includes("खोल") ||
      cmd.includes("start") ||
      cmd.includes("lock") ||
      cmd.includes("shutdown") ||
      cmd.includes("restart")
    ) {
      try {
        const res = await API.post("/system/run", { command: cmd });
        setSystemStatus("READY");
        return getAIReply(res.data) || "Command executed.";
      } catch (error) {
        setSystemStatus("ERROR");
        return (
          error.response?.data?.message ||
          error.response?.data?.error ||
          "System command failed."
        );
      }
    }

    return null;
  };

  const handleQuotaError = (error) => {
    const isQuota =
      error.response?.status === 429 ||
      error.response?.data?.error === "GEMINI_QUOTA_EXCEEDED";

    if (!isQuota) return null;

    autoListenRef.current = false;
    setVoiceReady(false);
    setListening(false);

    return (
      error.response?.data?.message ||
      "AI API quota khatam ho gaya hai. Voice auto mode stop kar diya."
    );
  };

  const sendMessageToBackend = async (userMessage) => {
    return API.post("/ai/chat", {
      message: userMessage,
      history: conversationHistoryRef.current,
      settings: { voiceLang: getRecognitionLang() },
      personalData: getPersonalData(),
    });
  };

  const askGeminiDirect = async (question) => {
    const userQuestion = safeText(question, "").trim();
    if (!userQuestion || userQuestion === "Listening..." || thinkingRef.current)
      return;

    const now = Date.now();
    if (
      lastQuestionRef.current.text === userQuestion &&
      now - lastQuestionRef.current.time < 5000
    ) {
      return;
    }

    lastQuestionRef.current = { text: userQuestion, time: now };
    thinkingRef.current = true;
    setSending(true);
    setInput(userQuestion);
    addMessage(`🎤 ${userQuestion}`);
    addMessage("🤖 Thinking...");

    try {
      const localReply = await runLocalCommand(userQuestion);

      if (localReply) {
        replaceLastMessage(`🤖 ${localReply}`);
        addToConversationHistory("user", userQuestion);
        addToConversationHistory("assistant", localReply);
        speak(localReply);
        setInput("");
        return;
      }

      const res = await sendMessageToBackend(userQuestion);
      const reply = getAIReply(res.data);

      setBackendStatus("ACTIVE");
      setNetworkStatus(navigator.onLine ? "READY" : "OFFLINE");
      replaceLastMessage(`🤖 ${reply}`);
      addToConversationHistory("user", userQuestion);
      addToConversationHistory("assistant", reply);
      speak(reply);
      setInput("");
    } catch (error) {
      console.error("Direct voice AI error:", error);
      const quotaMsg = handleQuotaError(error);
      const errorMsg =
        quotaMsg ||
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        "Backend server error aa raha hai.";

      setBackendStatus("FAILED");
      replaceLastMessage(`🤖 ${errorMsg}`);
      speak(errorMsg);
    } finally {
      thinkingRef.current = false;
      setSending(false);
    }
  };

  const startDirectListening = async () => {
    try {
      if (speakingRef.current || thinkingRef.current || listening) return;

      setVoiceReady(true);
      setInput("Listening...");

      if (!navigator.mediaDevices?.getUserMedia) {
        const msg = "Microphone permission API supported nahi hai.";
        setInput("");
        addMessage(`🤖 ${msg}`);
        speak(msg);
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      stream.getTracks().forEach((track) => track.stop());

      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      if (!SpeechRecognition) {
        const msg = "Voice recognition supported nahi hai.";
        setInput("");
        addMessage(`🤖 ${msg}`);
        speak(msg);
        return;
      }

      try {
        recognitionRef.current?.abort();
      } catch {
        // ignore old recognition abort error
      }

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = getRecognitionLang();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setListening(true);
        setInput("Listening...");
      };

      recognition.onresult = async (event) => {
        const voiceText = event.results?.[0]?.[0]?.transcript?.trim();
        setListening(false);

        if (!voiceText) {
          setInput("");
          return;
        }

        setInput(voiceText);

        try {
          recognition.stop();
        } catch {
          // ignore stop error
        }

        await askGeminiDirect(voiceText);
      };

      recognition.onerror = (event) => {
        console.error("Dashboard Voice Error:", event.error);
        setListening(false);

        if (event.error === "aborted") return;

        if (event.error === "no-speech") {
          setInput("");
          if (autoListenRef.current) {
            setTimeout(() => startDirectListening(), 800);
          }
          return;
        }

        let msg = "";

        if (event.error === "not-allowed") {
          msg =
            "Mic permission blocked hai. Windows aur app settings me microphone Allow karo.";
          autoListenRef.current = false;
        } else if (event.error === "audio-capture") {
          msg = "Mic device detect nahi hua. Windows input mic check karo.";
          autoListenRef.current = false;
        } else if (event.error === "network") {
          msg =
            "Electron Speech Recognition network error. Desktop app me browser speech service reliable nahi hai.";
          autoListenRef.current = false;
          setVoiceReady(false);
        } else {
          msg = `Voice error: ${event.error}`;
        }

        setInput("");
        if (msg) {
          addMessage(`🤖 ${msg}`);
          speak(msg);
        }
      };

      recognition.onend = () => {
        setListening(false);
        if (
          autoListenRef.current &&
          !speakingRef.current &&
          !thinkingRef.current
        ) {
          setTimeout(() => startDirectListening(), 800);
        }
      };

      window.speechSynthesis?.cancel();
      recognition.start();
    } catch (error) {
      console.error("Mic Permission Error:", error);
      setListening(false);
      setInput("");

      let msg = "Mic start failed.";

      if (
        error.name === "NotAllowedError" ||
        error.name === "PermissionDeniedError"
      ) {
        msg =
          "Mic permission blocked hai. Windows Settings me microphone Allow karo.";
        autoListenRef.current = false;
      } else if (error.name === "NotFoundError") {
        msg = "Microphone device nahi mila.";
        autoListenRef.current = false;
      }

      addMessage(`🤖 ${msg}`);
      speak(msg);
    }
  };

  const activateVoice = () => {
    if (listening) return;
    autoListenRef.current = true;
    setVoiceReady(true);
    addMessage("🎤 Voice activated. Ask anything.");
    startDirectListening();
  };

  const stopVoice = () => {
    try {
      autoListenRef.current = false;
      recognitionRef.current?.abort();
      window.speechSynthesis?.cancel();
      setListening(false);
      setVoiceReady(false);
      setInput("");
      addMessage("🤖 Voice stopped.");
    } catch {
      addMessage("🤖 Voice stop failed.");
    }
  };

  const handleSend = async (textValue = input) => {
    const userMessage = safeText(textValue, "").trim();

    if (!userMessage || userMessage === "Listening..." || sending) return;

    setSending(true);
    addMessage(`💬 ${userMessage}`);
    addMessage("🤖 Thinking...");

    try {
      const localReply = await runLocalCommand(userMessage);

      if (localReply) {
        replaceLastMessage(`🤖 ${localReply}`);
        addToConversationHistory("user", userMessage);
        addToConversationHistory("assistant", localReply);
        speak(localReply);
        setInput("");
        return;
      }

      const res = await sendMessageToBackend(userMessage);
      const reply = getAIReply(res.data);

      setBackendStatus("ACTIVE");
      setNetworkStatus(navigator.onLine ? "READY" : "OFFLINE");
      replaceLastMessage(`🤖 ${reply}`);
      addToConversationHistory("user", userMessage);
      addToConversationHistory("assistant", reply);
      speak(reply);
      setInput("");
    } catch (error) {
      console.error("Dashboard console error:", error);

      const quotaMsg = handleQuotaError(error);
      const errorMsg =
        quotaMsg ||
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        "Backend server error aa raha hai.";

      setBackendStatus("FAILED");
      replaceLastMessage(`🤖 ${errorMsg}`);
      speak(errorMsg);
      setInput(userMessage);
    } finally {
      setSending(false);
    }
  };

  const clearConsole = () => {
    conversationHistoryRef.current = [];
    lastQuestionRef.current = { text: "", time: 0 };
    setInput("");
    setMessages([
      "NEXUS AI v3.0.0",
      "Console cleared.",
      "Click mic and ask anything.",
    ]);
  };

  const getStatusWidth = (value) => {
    if (value === "OFF" || value === "FAILED" || value === "OFFLINE") {
      return "25%";
    }
    if (value === "CHECKING" || value === "LOCKED") {
      return "50%";
    }
    return "85%";
  };

  const isBadStatus = (value) =>
    value === "FAILED" || value === "OFFLINE" || value === "ERROR";

  return (
    <div className="nexus-page">
      <div className="matrix-rain">
        {rain.map((item) => (
          <span
            key={item.id}
            style={{
              left: item.left,
              animationDuration: item.duration,
              animationDelay: item.delay,
            }}
          >
            {item.text}
          </span>
        ))}
      </div>

      <header className="topbar">
        <div className="brand">
          <button className="menu-btn" type="button">
            <FaBars />
          </button>

          <div className="brand-text">
            <h1>NEXUS AI</h1>
            <p>KARAN&apos;S PERSONAL ASSISTANT</p>
          </div>
        </div>

        <div className="online-badge">
          <span></span>
          {listening ? "LISTENING" : "SYSTEM ONLINE"}
        </div>

        <div className="header-right">
          <div className="time-box">
            <h3>
              {currentDateTime.toLocaleTimeString("en-IN", {
                timeZone: "Asia/Kolkata",
              })}
            </h3>
            <p>
              {currentDateTime.toLocaleDateString("en-IN", {
                timeZone: "Asia/Kolkata",
                weekday: "short",
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>

          <button
            className="activity-btn"
            type="button"
            onClick={() => setShowActivity(true)}
            title="Activity Logs"
          >
            <FaClipboardList />
          </button>

          <button
            className="memory-btn"
            type="button"
            onClick={() => setShowMemory(true)}
            title="Memory Manager"
          >
            <FaBrain />
          </button>

          <button
            className="user-btn"
            type="button"
            onClick={() => setShowProfile(true)}
            title="Profile"
          >
            <FaUser />
          </button>
        </div>
      </header>

      {showProfile && (
        <div className="profile-overlay">
          <div className="profile-modal">
            <button
              className="close-profile-btn"
              type="button"
              onClick={() => setShowProfile(false)}
            >
              ✕
            </button>
            <Profile />
          </div>
        </div>
      )}

      {showMemory && (
        <div className="memory-overlay">
          <div className="memory-modal">
            <button
              className="close-memory-btn"
              type="button"
              onClick={() => setShowMemory(false)}
            >
              ✕
            </button>
            <MemoryManager />
          </div>
        </div>
      )}

      {showActivity && (
        <div className="activity-overlay">
          <div className="activity-modal">
            <button
              className="close-activity-btn"
              type="button"
              onClick={() => setShowActivity(false)}
            >
              ✕
            </button>
            <ActivityLogs />
          </div>
        </div>
      )}

      <main className="dashboard-layout">
        <aside className="left-side">
          <div className="glass-panel nav-panel">
            {menu.map((item, index) => (
              <div
                key={item.text}
                className={`nav-item ${index === 0 ? "active" : ""}`}
                onClick={() => {
                  switch (item.text) {
                    case "Dashboard":
                      navigate("/");
                      break;
                    case "AI Chat":
                      setShowChat(true);
                      break;
                    case "Voice Command":
                      setShowVoice(true);
                      break;
                    case "System & Web":
                      setShowSystem(true);
                      break;
                    case "AI Analytics":
                      setShowAnalytics(true);
                      break;
                    case "File Analyzer":
                      setShowFileAnalyzer(true);
                      break;
                    case "Settings":
                      setShowSettings(true);
                      break;
                    default:
                      break;
                  }
                }}
              >
                <span>{item.icon}</span>
                <p>{item.text}</p>
                <b>›</b>
              </div>
            ))}
          </div>

          <div className="glass-panel status-panel">
            <div className="panel-title">
              <h3>SYSTEM STATUS</h3>
              <span>⊙</span>
            </div>

            {[
              ["VOICE ENGINE", listening ? "ON" : "OFF"],
              ["VOICE REPLY", voiceReady ? "READY" : "LOCKED"],
              ["AI API", backendStatus],
              ["NETWORK", networkStatus],
              ["SYSTEM", systemStatus],
            ].map(([name, value]) => (
              <div className="status-row" key={name}>
                <p>{name}</p>
                <b className={isBadStatus(value) ? "bad-status" : ""}>
                  {value}
                </b>
                <div className="bar">
                  <span
                    className={isBadStatus(value) ? "danger-bar" : ""}
                    style={{ width: getStatusWidth(value) }}
                  ></span>
                </div>
              </div>
            ))}

            <div className="safe-status">
              <span></span>
              {backendStatus === "FAILED" || networkStatus === "OFFLINE"
                ? " SYSTEM ISSUE DETECTED"
                : " ALL SYSTEMS OPERATIONAL"}
            </div>
          </div>
        </aside>

        <section className="center-stage">
          <div className="ai-orb-wrap">
            <div className="circuit-left"></div>
            <div className="circuit-right"></div>
            <div className="rings"></div>
            <div className="rings ring-two"></div>
            <div className="rings ring-three"></div>

            <div className="ai-orb">
              <div className="orb-mesh mesh-one"></div>
              <div className="orb-mesh mesh-two"></div>
              <div className="orb-mesh mesh-three"></div>
              <h2>NEXUS AI</h2>
            </div>
          </div>

          <div className="voice-active">
            <div className="equalizer">
              {Array.from({ length: 14 }).map((_, i) => (
                <span key={i}></span>
              ))}
            </div>

            <p>VOICE ENGINE: {listening ? "LISTENING" : "ACTIVE"}</p>

            <div className="equalizer">
              {Array.from({ length: 14 }).map((_, i) => (
                <span key={i}></span>
              ))}
            </div>
          </div>

          <div className="voice-panel glass-panel">
            <h3>{input || "CLICK MIC AND ASK ANYTHING"}</h3>
            <div className="wave wave-left"></div>

            <button
              className="mic-btn"
              type="button"
              onClick={listening || voiceReady ? stopVoice : activateVoice}
            >
              <FaMicrophone />
            </button>

            <div className="wave wave-right"></div>

            <h4>
              {listening
                ? "LISTENING..."
                : voiceReady
                  ? "AUTO LISTENING MODE ON — CLICK TO STOP"
                  : "CLICK MIC TO ASK"}
            </h4>
          </div>
        </section>

        <aside className="right-side">
          <div className="glass-panel console-panel">
            <div className="panel-title">
              <h3>AI CONSOLE</h3>
              <button
                className="clear-console-btn"
                type="button"
                onClick={clearConsole}
              >
                CLEAR
              </button>
            </div>

            <div className="console-screen">
              {messages.map((msg, index) => (
                <p
                  key={`${safeText(msg, "msg")}-${index}`}
                  className={index === 0 ? "version" : ""}
                >
                  {safeText(msg, "")}
                </p>
              ))}

              <span className="cursor"></span>
              <div ref={consoleEndRef}></div>
            </div>

            <div className="console-input">
              <input
                placeholder="Type your message..."
                value={input === "Listening..." ? "" : input}
                disabled={sending}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />

              <button
                type="button"
                disabled={sending || !input.trim() || input === "Listening..."}
                onClick={() => handleSend()}
              >
                <FaPaperPlane />
              </button>
            </div>
          </div>

          <div className="glass-panel quick-panel">
            <h3>QUICK COMMANDS</h3>
            {quickCommands.map((item) => (
              <div
                className="command-item"
                key={item.text}
                onClick={() => handleSend(item.text)}
              >
                <span>{item.icon}</span>
                <p>{item.text}</p>
                <b>›</b>
              </div>
            ))}
          </div>
        </aside>
      </main>

      {showChat && (
        <div className="chat-overlay">
          <div className="chat-modal">
            <button
              className="close-chat-btn"
              type="button"
              onClick={() => setShowChat(false)}
            >
              ✕
            </button>
            <Chat />
          </div>
        </div>
      )}

      {showVoice && (
        <div className="voice-overlay">
          <div className="voice-modal">
            <button
              className="close-voice-btn"
              type="button"
              onClick={() => setShowVoice(false)}
            >
              ✕
            </button>
            <VoiceAssistant />
          </div>
        </div>
      )}

      {showSystem && (
        <div className="system-overlay">
          <div className="system-modal">
            <button
              className="close-system-btn"
              type="button"
              onClick={() => setShowSystem(false)}
            >
              ✕
            </button>
            <SystemControl />
          </div>
        </div>
      )}

      {showFileAnalyzer && (
        <div className="file-overlay">
          <div className="file-modal">
            <button
              className="close-file-btn"
              type="button"
              onClick={() => setShowFileAnalyzer(false)}
            >
              ✕
            </button>
            <FileAnalyzer />
          </div>
        </div>
      )}

      {showAnalytics && (
        <div className="analytics-overlay">
          <div className="analytics-modal">
            <button
              className="close-analytics-btn"
              type="button"
              onClick={() => setShowAnalytics(false)}
            >
              ✕
            </button>
            <AIAnalytics />
          </div>
        </div>
      )}

      {showSettings && (
        <div className="settings-overlay">
          <div className="settings-modal">
            <button
              className="close-settings-btn"
              type="button"
              onClick={() => setShowSettings(false)}
            >
              ✕
            </button>
            <Settings />
          </div>
        </div>
      )}
    </div>
  );
}
