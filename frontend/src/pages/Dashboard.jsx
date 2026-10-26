import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import API from "../api/api";

import AIAnalytics from "../components/AIAnalytics/AIAnalytics";
import ActivityLogs from "../components/ActivityLogs/ActivityLogs";
import FileAnalyzer from "../components/FileAnalyzer/FileAnalyzer";
import MemoryManager from "../components/MemoryManager/MemoryManager";
import Profile, {
  getUserProfile,
} from "../components/Profile/Profile";
import Settings from "../components/Settings/Settings";
import SystemControl from "../components/SystemControl/SystemControl";
import VoiceAssistant from "../components/VoiceAssistant/VoiceAssistant";
import Chat from "./Chat";
import SystemAPI from "../services/systemApi";

import "../styles/dashboard.css";
const API_URL = "https://nexus-ai-backend-1bpy.onrender.com/api";
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

/* =========================================================
   BACKEND URL
========================================================= */

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://nexus-ai-backend-1bpy.onrender.com/api";

const HEALTH_URL = API_BASE_URL.replace(/\/api\/?$/, "");

/* =========================================================
   MENU
========================================================= */

const menu = [
  {
    icon: <FaHome />,
    text: "Dashboard",
  },
  {
    icon: <FaComments />,
    text: "AI Chat",
  },
  {
    icon: <FaMicrophone />,
    text: "Voice Command",
  },
  {
    icon: <FaDesktop />,
    text: "System & Web",
  },
  {
    icon: <FaChartBar />,
    text: "File Analyzer",
  },
  {
    icon: <FaChartLine />,
    text: "AI Analytics",
  },
  {
    icon: <FaCog />,
    text: "Settings",
  },
];

/* =========================================================
   QUICK COMMANDS

   IMPORTANT:
   No URL or system command logic here.
   Everything goes through runSystemCommand().
========================================================= */

const quickCommands = [
  {
    icon: <FaGoogle />,
    text: "Open Google",
  },
  {
    icon: <FaYoutube />,
    text: "Open YouTube",
  },
  {
    icon: <FaGithub />,
    text: "Open GitHub",
  },
  {
    icon: <FaDesktop />,
    text: "What is React?",
  },
  {
    icon: <FaCloudSun />,
    text: "Weather Update",
  },
];

/* =========================================================
   MATRIX
========================================================= */

const makeBinary = () =>
  Array.from({ length: 22 }, () => (Math.random() > 0.5 ? "1" : "0")).join(
    "\n",
  );

/* =========================================================
   DASHBOARD
========================================================= */

export default function Dashboard() {
  const navigate = useNavigate();

  /* =======================================================
     MODALS
  ======================================================= */

  const [showChat, setShowChat] = useState(false);
  const [showVoice, setShowVoice] = useState(false);
  const [showSystem, setShowSystem] = useState(false);
  const [showFileAnalyzer, setShowFileAnalyzer] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showMemory, setShowMemory] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  /* =======================================================
     PROFILE
  ======================================================= */

  const [databaseProfile, setDatabaseProfile] = useState(null);

  const [profileLoading, setProfileLoading] = useState(true);

  /* =======================================================
     CHAT
  ======================================================= */

  const [input, setInput] = useState("");

  const [messages, setMessages] = useState([
    "NEXUS AI v3.0.0",
    "Hello Karan 👋",
    "karan Click mic and ask anything. SHIFRA will answer directly.",
  ]);

  const [sending, setSending] = useState(false);

  /* =======================================================
     VOICE
  ======================================================= */

  const [listening, setListening] = useState(false);
  const [voiceReady, setVoiceReady] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);

  /* =======================================================
     SYSTEM
  ======================================================= */

  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  const [networkStatus, setNetworkStatus] = useState(
    navigator.onLine ? "READY" : "OFFLINE",
  );

  const [backendStatus, setBackendStatus] = useState("CHECKING");

  const [systemStatus, setSystemStatus] = useState("READY");

  /* =======================================================
     REFS
  ======================================================= */

  const consoleEndRef = useRef(null);

  const recognitionRef = useRef(null);

  const voiceActiveRef = useRef(false);

  const listeningRef = useRef(false);

  const speakingRef = useRef(false);

  const thinkingRef = useRef(false);

  const restartTimerRef = useRef(null);

  const voicesRef = useRef([]);

  const conversationHistoryRef = useRef([]);

  const lastQuestionRef = useRef({
    text: "",
    time: 0,
  });

  /* =======================================================
     MATRIX RAIN
  ======================================================= */

  const rain = useMemo(
    () =>
      Array.from({ length: 60 }).map((_, index) => ({
        id: index,
        left: `${(index / 60) * 100}%`,
        // eslint-disable-next-line react-hooks/purity
        duration: `${7 + Math.random() * 6}s`,
        delay: `${Math.random() * 5}s`,
        text: makeBinary(),
      })),
    [],
  );

  /* =======================================================
     LOAD PROFILE
  ======================================================= */

/* =========================================================
   LOAD PROFILE — CACHE + MONGODB
========================================================= */

useEffect(() => {
  let cancelled = false;

  const loadProfile = async () => {
    // First load locally cached profile so AI has data immediately.
    try {
      const cachedProfile = getUserProfile();

      if (!cancelled && cachedProfile) {
        setDatabaseProfile(cachedProfile);
      }
    } catch (error) {
      console.error("Local profile read error:", error);
    }

    try {
      setProfileLoading(true);

      const response = await axios.get(
        `${API_BASE_URL.replace(/\/+$/, "").replace(/\/api\/?$/i, "")}/api/profile`,
        {
          params: { userId: "default-user" },
        }
      );

      if (cancelled) return;

      // Do not mistake { success: true, profile: null }
      // for an actual profile.
      const serverProfile = response.data?.profile;

      if (
        response.data?.success === true &&
        serverProfile &&
        typeof serverProfile === "object"
      ) {
        setDatabaseProfile(serverProfile);

        localStorage.setItem(
          "nexus_profile",
          JSON.stringify(serverProfile)
        );

        console.log("✅ Profile loaded from MongoDB:", {
          nameAvailable: Boolean(serverProfile.name),
          fields: Object.keys(serverProfile).length,
        });
      } else {
        console.warn(
          "⚠️ No saved MongoDB profile. Using local/default profile."
        );
      }
    } catch (error) {
      console.error(
        "MongoDB profile fetch error:",
        error.response?.data || error.message
      );

      // Keep the locally cached profile if the backend fails.
      if (!cancelled) {
        try {
          setDatabaseProfile(getUserProfile());
        } catch (localError) {
          console.error("Local profile fallback error:", localError);
        }
      }
    } finally {
      if (!cancelled) {
        setProfileLoading(false);
      }
    }
  };

  loadProfile();

  // Profile.jsx dispatches this event after saving.
  const handleProfileUpdated = () => {
    try {
      setDatabaseProfile(getUserProfile());
      console.log("🔄 Dashboard profile refreshed.");
    } catch (error) {
      console.error("Profile refresh error:", error);
    }
  };

  window.addEventListener(
    "nexus-profile-updated",
    handleProfileUpdated
  );

  return () => {
    cancelled = true;

    window.removeEventListener(
      "nexus-profile-updated",
      handleProfileUpdated
    );
  };
}, []);


  /* =======================================================
     CLOCK
  ======================================================= */

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  /* =======================================================
     NETWORK
  ======================================================= */

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

  /* =======================================================
     BACKEND HEALTH
  ======================================================= */

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch(HEALTH_URL, {
          method: "GET",
          signal: AbortSignal.timeout(30000),
        });

        if (response.ok) {
          setBackendStatus("ACTIVE");
          console.log("🟢 Backend is ACTIVE");
        } else {
          setBackendStatus("FAILED");
          console.error("🔴 Backend health check failed:", response.status);
        }
      } catch (error) {
        console.error("❌ Backend health check error:", error);
        setBackendStatus("FAILED");
      }
    };

    checkBackend();

    const timer = setInterval(checkBackend, 15000);

    return () => clearInterval(timer);
  }, []);

  /* =======================================================
     LOAD TTS VOICES
  ======================================================= */

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

  /* =======================================================
     CLEANUP
  ======================================================= */

  useEffect(() => {
    return () => {
      voiceActiveRef.current = false;

      if (restartTimerRef.current) {
        clearTimeout(restartTimerRef.current);
      }

      try {
        recognitionRef.current?.stop();
      } catch {
        // ignore
      }

      window.speechSynthesis?.cancel();
    };
  }, []);

  /* =======================================================
     SAFE TEXT
  ======================================================= */

  const safeText = (value, fallback = "") => {
    if (value === undefined || value === null) {
      return fallback;
    }

    if (typeof value === "string") {
      return value;
    }

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

  /* =======================================================
     PERSONAL DATA
  ======================================================= */

  const getPersonalData = () => {
    const emptyProfile = {
      name: "",
      email: "",
      mobile: "",
      education: "",
      college: "",
      skills: "",
      github: "",
      linkedin: "",
      portfolio: "",
      location: "",
      bio: "",
    };

    if (!databaseProfile) {
      return emptyProfile;
    }

    return {
      name: databaseProfile.name || "",
      email: databaseProfile.email || "",
      mobile: databaseProfile.mobile || "",
      education: databaseProfile.education || "",
      college: databaseProfile.college || "",
      skills: databaseProfile.skills || "",
      github: databaseProfile.github || "",
      linkedin: databaseProfile.linkedin || "",
      portfolio: databaseProfile.portfolio || "",
      location: databaseProfile.location || "",
      bio: databaseProfile.bio || "",
    };
  };

  /* =======================================================
     AI REPLY
  ======================================================= */

  const getAIReply = (data) => {
    if (!data) {
      return "No reply received from AI.";
    }

    if (typeof data === "string") {
      return data;
    }

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

  /* =======================================================
     ADD MESSAGE
  ======================================================= */

  const addMessage = (message) => {
    const finalMessage = safeText(message, "");

    if (!finalMessage) return;

    setMessages((prev) => [...prev, finalMessage]);
  };

  /* =======================================================
     REPLACE LAST MESSAGE
  ======================================================= */

  const replaceLastMessage = (message) => {
    const finalMessage = safeText(message, "No message.");

    setMessages((prev) => {
      if (!prev.length) {
        return [finalMessage];
      }

      const updated = [...prev];

      updated[updated.length - 1] = finalMessage;

      return updated;
    });
  };

  /* =======================================================
     CONVERSATION HISTORY
  ======================================================= */

  const addToConversationHistory = (role, content) => {
    const finalContent = safeText(content, "");

    if (!finalContent) return;

    conversationHistoryRef.current = [
      ...conversationHistoryRef.current,
      {
        role,
        content: finalContent,
      },
    ].slice(-16);
  };

  /* =======================================================
     LANGUAGE
  ======================================================= */

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
      "अभी",
      "kya",
      "kaise",
      "mujhe",
      "tum",
      "batao",
      "hindi",
      "samay",
    ];

    if (marathiWords.some((word) => msg.includes(word))) {
      return "mr-IN";
    }

    if (hindiWords.some((word) => msg.includes(word))) {
      return "hi-IN";
    }

    return "en-IN";
  };

  /* =======================================================
     FEMALE / INDIAN VOICE
  ======================================================= */

  const getIndianFemaleVoice = (lang) => {
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

    return (
      voices.find((voice) => voice.lang === lang && isFemale(voice)) ||
      voices.find((voice) => voice.lang === lang) ||
      voices.find((voice) => voice.lang.startsWith(lang.split("-")[0])) ||
      voices.find((voice) => voice.lang.toLowerCase().startsWith("en-in")) ||
      voices.find((voice) => voice.lang.toLowerCase().startsWith("en")) ||
      voices[0]
    );
  };

  /* =======================================================
     SPEAK
  ======================================================= */

  const speak = (replyText) => {
    const finalText = safeText(replyText, "");

    if (!finalText || !window.speechSynthesis) {
      return;
    }

    const cleanText = finalText.replace(
      /```[\s\S]*?```/g,
      "Code block generated in console.",
    );

    const language = detectVoiceLang(cleanText);

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(cleanText);

    utterance.lang = language;
    utterance.rate = 0.92;
    utterance.pitch = 1.15;
    utterance.volume = 1;

    const voice = getIndianFemaleVoice(language);

    if (voice) {
      utterance.voice = voice;
    }

    utterance.onstart = () => {
      speakingRef.current = true;

      setInput("NEXUS AI is speaking...");
    };

    utterance.onend = () => {
      speakingRef.current = false;

      setInput("");

      if (voiceActiveRef.current) {
        restartVoiceRecognition();
      }
    };

    utterance.onerror = () => {
      speakingRef.current = false;

      setInput("");

      if (voiceActiveRef.current) {
        restartVoiceRecognition();
      }
    };

    window.speechSynthesis.speak(utterance);
  };

  /* =======================================================
     RESTART VOICE
  ======================================================= */

  const restartVoiceRecognition = () => {
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
    }

    if (!voiceActiveRef.current) {
      return;
    }

    restartTimerRef.current = setTimeout(() => {
      if (
        voiceActiveRef.current &&
        !speakingRef.current &&
        !thinkingRef.current &&
        !listeningRef.current
      ) {
        startVoiceRecognition();
      }
    }, 700);
  };

  /* =======================================================
     SYSTEM COMMAND
  ======================================================= */

  const runSystemCommand = async (command) => {
    const finalCommand = safeText(command, "").trim();

    if (!finalCommand) {
      return "No command received.";
    }

    try {
      setSystemStatus("PROCESSING");

      console.log("🖥️ SYSTEM COMMAND:", finalCommand);

      const response = await SystemAPI.post("/system/run", {
  command,
});

      console.log("🖥️ SYSTEM RESPONSE:", response.data);

      setSystemStatus("READY");

      return getAIReply(response.data) || "Command executed successfully.";
    } catch (error) {
      console.error("❌ System command error:", error);

      setSystemStatus("ERROR");

      return (
        error.response?.data?.message ||
        error.response?.data?.error ||
        "System command failed."
      );
    }
  };

  /* =======================================================
     CREATE SPEECH RECOGNITION
  ======================================================= */

  const createRecognition = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      addMessage("🤖 Speech Recognition supported नाही. Chrome वापरा.");

      return null;
    }

    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;

    // English commands like:
    // Open YouTube
    // Open Google
    // Open GitHub
    recognition.lang = "en-IN";

    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      listeningRef.current = true;

      setListening(true);
      setVoiceReady(true);

      setInput("🎙️ Listening...");
    };

    /* =====================================================
       🔥 IMPORTANT VOICE RESULT
    ===================================================== */

    recognition.onresult = async (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript?.trim();

      if (!transcript) {
        return;
      }

      console.log("🎙️ VOICE COMMAND:", transcript);

      try {
        recognition.stop();
      } catch {
        // ignore
      }

      listeningRef.current = false;
      setListening(false);

      setInput(transcript);

      addMessage(`🎤 ${transcript}`);

      /*
        IMPORTANT:

        Voice command goes into the SAME pipeline
        as text command.

        askGeminiDirect()
              ↓
        runLocalCommand()
              ↓
        runSystemCommand()
              ↓
        /api/system/run
      */

      await askGeminiDirect(transcript, true);
    };

    recognition.onerror = (event) => {
      console.error("🎙️ Speech recognition error:", event.error);

      listeningRef.current = false;
      setListening(false);

      if (!voiceActiveRef.current) {
        return;
      }

      if (
        event.error === "not-allowed" ||
        event.error === "service-not-allowed"
      ) {
        voiceActiveRef.current = false;

        setVoiceActive(false);
        setVoiceReady(false);

        addMessage(
          "🤖 Microphone permission blocked. Chrome microphone permission Allow करा.",
        );

        return;
      }

      if (event.error === "no-speech") {
        setInput("No speech detected...");
      }

      restartVoiceRecognition();
    };

    recognition.onend = () => {
      listeningRef.current = false;

      setListening(false);

      if (
        voiceActiveRef.current &&
        !speakingRef.current &&
        !thinkingRef.current
      ) {
        restartVoiceRecognition();
      }
    };

    return recognition;
  };

  /* =======================================================
     START RECOGNITION
  ======================================================= */

  const startVoiceRecognition = () => {
    if (!voiceActiveRef.current) {
      return;
    }

    if (speakingRef.current || thinkingRef.current || listeningRef.current) {
      return;
    }

    const recognition = createRecognition();

    if (!recognition) {
      voiceActiveRef.current = false;

      setVoiceActive(false);
      setVoiceReady(false);

      return;
    }

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (error) {
      console.error("Recognition start error:", error);
    }
  };

  /* =======================================================
     START / STOP VOICE
  ======================================================= */

  const startVoice = () => {
    if (voiceActiveRef.current) {
      stopVoice();
      return;
    }

    voiceActiveRef.current = true;

    setVoiceActive(true);
    setVoiceReady(true);

    addMessage("🎙️ Voice mode activated.");

    startVoiceRecognition();
  };

  const stopVoice = () => {
    voiceActiveRef.current = false;

    setVoiceActive(false);
    setListening(false);
    setVoiceReady(false);

    listeningRef.current = false;
    speakingRef.current = false;
    thinkingRef.current = false;

    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);

      restartTimerRef.current = null;
    }

    try {
      recognitionRef.current?.stop();
    } catch {
      // ignore
    }

    recognitionRef.current = null;

    window.speechSynthesis?.cancel();

    setInput("");

    addMessage("🛑 Voice mode stopped.");
  };

  /* =======================================================
     DATE
  ======================================================= */

  const getCurrentDateReply = (language) => {
    const date = new Date().toLocaleDateString(language, {
      timeZone: "Asia/Kolkata",
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    if (language === "mr-IN") {
      return `आज ${date} आहे.`;
    }

    if (language === "hi-IN") {
      return `आज ${date} है।`;
    }

    return `Today is ${date}.`;
  };

  /* =======================================================
     TIME
  ======================================================= */

  const getCurrentTimeReply = (language) => {
    const time = new Date().toLocaleTimeString(language, {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    if (language === "mr-IN") {
      return `सध्या ${time} वाजले आहेत.`;
    }

    if (language === "hi-IN") {
      return `अभी ${time} बजे हैं।`;
    }

    return `The current time is ${time}.`;
  };

  /* =======================================================
     LOCAL / SYSTEM COMMAND ROUTER
  ======================================================= */

  const runLocalCommand = async (command) => {
    const original = safeText(command, "").trim();

    const cmd = original.toLowerCase();

    const language = detectVoiceLang(original);

    if (!original) {
      return null;
    }

    /* =====================================================
       DATE
    ===================================================== */

    if (
      cmd.includes("today date") ||
      cmd.includes("today's date") ||
      cmd.includes("current date") ||
      cmd.includes("what is the date") ||
      cmd.includes("तारीख") ||
      cmd.includes("आजची तारीख")
    ) {
      return getCurrentDateReply(language);
    }

    /* =====================================================
       TIME
    ===================================================== */

    if (
      cmd.includes("current time") ||
      cmd.includes("what time is it") ||
      cmd.includes("time now") ||
      cmd.includes("किती वाजले") ||
      cmd.includes("अभी कितने बजे") ||
      cmd.includes("samay")
    ) {
      return getCurrentTimeReply(language);
    }

    /* =====================================================
       MY NAME
    ===================================================== */

    if (
      cmd.includes("my name") ||
      cmd.includes("mera naam") ||
      cmd.includes("मेरा नाम") ||
      cmd.includes("माझं नाव") ||
      cmd.includes("माझे नाव")
    ) {
      const profile = getPersonalData();

      if (profile.name) {
        return `Aapka naam ${profile.name} hai.`;
      }

      return "Mujhe aapka naam database me nahi mila.";
    }

    /* =====================================================
       DEVELOPER
    ===================================================== */

    if (
      cmd.includes("who developed you") ||
      cmd.includes("who created you") ||
      cmd.includes("who made you") ||
      cmd.includes("tumhe kisne develop kiya") ||
      cmd.includes("tumhara developer kaun hai")
    ) {
      const profile = getPersonalData();

      return profile.name
        ? `Mujhe ${profile.name} ne develop kiya hai.`
        : "Developer information database me available nahi hai.";
    }

    /* =====================================================
       WEATHER
    ===================================================== */

    if (
      cmd.includes("weather") ||
      cmd.includes("mausam") ||
      cmd.includes("हवामान") ||
      cmd.includes("मौसम")
    ) {
      return await runSystemCommand(original);
    }

    /* =====================================================
       SYSTEM / WEB COMMANDS
       
       IMPORTANT:
       No URLs here.
       No window.open here.

       systemController.js is the source of truth.
    ===================================================== */

    const systemCommandPatterns = [
      "open ",
      "start ",
      "launch ",
      "kholo",
      "खोल",
      "open youtube",
      "open google",
      "open github",
      "open chrome",
      "open calculator",
      "open notepad",
      "youtube",
      "google",
      "github",
      "chrome",
      "calculator",
      "notepad",
      "lock",
      "restart",
      "shutdown",
    ];

    const isSystemCommand = systemCommandPatterns.some((pattern) =>
      cmd.includes(pattern),
    );

    if (isSystemCommand) {
      console.log("🔥 SYSTEM COMMAND DETECTED:", original);

      return await runSystemCommand(original);
    }

    /* =====================================================
       NORMAL AI QUESTION
    ===================================================== */

    return null;
  };

  /* =======================================================
     SEND TO OPENAI BACKEND
  ======================================================= */

const sendMessageToBackend = async (message) => {
  try {
    const response = await axios.post(
      "https://nexus-ai-backend-1bpy.onrender.com/api/chat",
      {
        message: message,
        prompt: message,
        userId: "default-user",
      }
    );

    console.log("✅ Backend response:", response.data);

    return response.data;
  } catch (error) {
    console.error(
      "❌ Backend error:",
      error.response?.status,
      error.response?.data || error.message
    );

    throw error;
  }
};

  /* =======================================================
     ASK AI / COMMAND ENGINE
  ======================================================= */



  const askGeminiDirect = async (question, voiceAlreadyAdded = false) => {
    const userQuestion = safeText(question, "").trim();

    if (!userQuestion || thinkingRef.current) {
      return;
    }

    const now = Date.now();

    if (
      lastQuestionRef.current.text === userQuestion &&
      now - lastQuestionRef.current.time < 3000
    ) {
      return;
    }

    lastQuestionRef.current = {
      text: userQuestion,
      time: now,
    };

    thinkingRef.current = true;
    setSending(true);
    setInput(userQuestion);

    if (!voiceAlreadyAdded) {
      addMessage(`💬 ${userQuestion}`);
    }

    addMessage("🤖 Shifra Thinking...");

    try {
      /* =================================================
         FIRST: LOCAL / SYSTEM COMMAND
      ================================================= */

      const localReply = await runLocalCommand(userQuestion);

      if (localReply) {
        replaceLastMessage(`🤖 ${localReply}`);

        addToConversationHistory("user", userQuestion);

        addToConversationHistory("assistant", localReply);

        speak(localReply);

        return;
      }

      /* =================================================
         SECOND: OPENAI
      ================================================= */

      const response = await sendMessageToBackend(userQuestion);

      const reply = getAIReply(response.data);

      setBackendStatus("ACTIVE");

      replaceLastMessage(`🤖 ${reply}`);

      addToConversationHistory("user", userQuestion);

      addToConversationHistory("assistant", reply);

      speak(reply);
    } catch (error) {
      console.error("❌ AI error:", error);

      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Karan Backend server error aa raha hai.";

      setBackendStatus("FAILED");

      replaceLastMessage(`🤖 ${errorMessage}`);

      speak(errorMessage);
    } finally {
      thinkingRef.current = false;
      setSending(false);

      /*
        If voice mode is active and no speech
        is currently running, recognition can restart.
      */

      if (voiceActiveRef.current && !speakingRef.current) {
        restartVoiceRecognition();
      }
    }
  };

  /* =======================================================
     TEXT SEND
  ======================================================= */

  const handleSend = async (textValue = input) => {
    const message = safeText(textValue, "").trim();

    if (
      !message ||
      message === "Shifra Listening..." ||
      message === "🎙️ Shifra Listening..." ||
      sending
    ) {
      return;
    }

    await askGeminiDirect(message, false);

    setInput("");
  };

  /* =======================================================
     CLEAR CONSOLE
  ======================================================= */

  const clearConsole = () => {
    conversationHistoryRef.current = [];

    lastQuestionRef.current = {
      text: "",
      time: 0,
    };

    setInput("");

    setMessages([
      "NEXUS AI v3.0.0",
      "Console cleared.",
      "Karan Click mic and ask anything.",
    ]);
  };

  /* =======================================================
     STATUS
  ======================================================= */

  const getStatusWidth = (value) => {
    if (
      value === "OFF" ||
      value === "FAILED" ||
      value === "OFFLINE" ||
      value === "ERROR"
    ) {
      return "25%";
    }

    if (value === "CHECKING" || value === "LOCKED") {
      return "50%";
    }

    if (value === "PROCESSING") {
      return "65%";
    }

    return "85%";
  };

  const isBadStatus = (value) =>
    value === "FAILED" || value === "OFFLINE" || value === "ERROR";

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="nexus-page">
      {/* =================================================
          MATRIX
      ================================================= */}

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

      {/* =================================================
          TOPBAR
      ================================================= */}

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

          {voiceActive
            ? listening
              ? "LISTENING"
              : "VOICE ACTIVE"
            : "SYSTEM ONLINE"}
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
          >
            <FaClipboardList />
          </button>

          <button
            className="memory-btn"
            type="button"
            onClick={() => setShowMemory(true)}
          >
            <FaBrain />
          </button>

          <button
            className="user-btn"
            type="button"
            onClick={() => setShowProfile(true)}
          >
            <FaUser />
          </button>
        </div>
      </header>

      {/* =================================================
          PROFILE
      ================================================= */}

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

            {profileLoading ? (
              <div className="profile-loading">Loading profile...</div>
            ) : (
              <Profile />
            )}
          </div>
        </div>
      )}

      {/* =================================================
          MEMORY
      ================================================= */}

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

      {/* =================================================
          ACTIVITY
      ================================================= */}

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

      {/* =================================================
          MAIN
      ================================================= */}

      <main className="dashboard-layout">
        {/* =================================================
            LEFT
        ================================================= */}

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

          {/* SYSTEM STATUS */}

          <div className="glass-panel status-panel">
            <div className="panel-title">
              <h3>SYSTEM STATUS</h3>

              <span>⊙</span>
            </div>

            {[
              ["VOICE ENGINE", listening ? "ON" : "OFF"],
              ["VOICE MODE", voiceActive ? "ACTIVE" : "LOCKED"],
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
                    style={{
                      width: getStatusWidth(value),
                    }}
                  />
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

        {/* =================================================
            CENTER
        ================================================= */}

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

          {/* VOICE STATUS */}

          <div className="voice-active">
            <div className="equalizer">
              {Array.from({
                length: 14,
              }).map((_, index) => (
                <span key={index} />
              ))}
            </div>

            <p>
              VOICE ENGINE:{" "}
              {voiceActive ? (listening ? "SHIFRA LISTENING" : "PROCESSING") : "OFF"}
            </p>

            <div className="equalizer">
              {Array.from({
                length: 14,
              }).map((_, index) => (
                <span key={index} />
              ))}
            </div>
          </div>

          {/* MIC PANEL */}

          <div className="voice-panel glass-panel">
            <h3>
              {input ||
                (voiceActive
                  ? "VOICE ACTIVE..."
                  : "KARAN CLICK MIC AND ASK ANYTHING")}
            </h3>

            <div className="wave wave-left"></div>

            <button
              className={`mic-btn ${voiceActive ? "mic-active" : ""}`}
              type="button"
              onClick={startVoice}
            >
              <FaMicrophone />
            </button>

            <div className="wave wave-right"></div>

            <h4>
              {voiceActive
                ? listening
                  ? "🎙️SHIFRA LISTENING — CLICK AGAIN TO STOP"
                  : "🔊 PROCESSING — CLICK AGAIN TO STOP"
                : "🎙️KARAN CLICK MIC TO START VOICE"}
            </h4>
          </div>
        </section>

        {/* =================================================
            RIGHT
        ================================================= */}

        <aside className="right-side">
          {/* CONSOLE */}

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
              {messages.map((message, index) => (
                <p
                  key={`${index}-${safeText(message)}`}
                  className={index === 0 ? "version" : ""}
                >
                  {safeText(message)}
                </p>
              ))}

              <span className="cursor"></span>

              <div ref={consoleEndRef} />
            </div>

            {/* INPUT */}

            <div className="console-input">
              <input
                type="text"
                placeholder="Type your message..."
                value={input === "🎙️SHIFRA Listening..." ? "" : input}
                disabled={sending}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();

                    handleSend();
                  }
                }}
              />

              <button
                type="button"
                disabled={sending || !input.trim()}
                onClick={() => handleSend()}
              >
                <FaPaperPlane />
              </button>
            </div>
          </div>

          {/* QUICK COMMANDS */}

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

      {/* =================================================
          CHAT MODAL
      ================================================= */}

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

      {/* =================================================
          VOICE ASSISTANT
      ================================================= */}

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

      {/* =================================================
          SYSTEM
      ================================================= */}

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

      {/* =================================================
          FILE ANALYZER
      ================================================= */}

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

      {/* =================================================
          ANALYTICS
      ================================================= */}

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

      {/* =================================================
          SETTINGS
      ================================================= */}

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
