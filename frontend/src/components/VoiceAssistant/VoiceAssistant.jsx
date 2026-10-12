
import { useCallback, useEffect, useRef, useState } from "react";

import MyAssistant from "../../assets/images/my_assitancee.png";
import API from "../../services/api";
import SystemAPI from "../../services/systemApi";

import {
  createSpeechRecognition,
  getSavedVoiceSettings,
  requestMicPermission,
} from "../../services/voiceService";

import "./VoiceAssistant.css";

// ========================================================
// PROFILE QUESTIONS
// ========================================================

const PROFILE_INTENTS = [
  {
    field: "name",
    label: "Aapka naam",
    phrases: [
      "mera naam", "mera name", "my name",
      "what is my name", "what's my name",
      "naam kya", "name kya", "मेरा नाम",
      "मेरा नाम क्या", "माझं नाव", "माझे नाव",
    ],
  },
  {
    field: "fatherName",
    label: "Aapke papa ka naam",
    phrases: [
      "father name", "my father", "father",
      "papa ka naam", "mere papa", "pitaji",
      "पापा", "पिताजी", "वडिलांचे नाव",
    ],
  },
  {
    field: "motherName",
    label: "Aapki mummy ka naam",
    phrases: [
      "mother name", "my mother", "mother",
      "mummy ka naam", "meri mummy", "maa",
      "मम्मी", "आईचे नाव", "आईचं नाव",
    ],
  },
  {
    field: "brotherName",
    label: "Aapke bhaiyon ke naam",
    phrases: [
      "brother name", "my brother", "brothers",
      "mere bhai", "bhai ka naam", "भाई", "भाऊ",
    ],
  },
  {
    field: "sister",
    label: "Aapki sister ka naam",
    phrases: [
      "my sister", "sister name", "my sisters",
      "meri behen", "behen ka naam", "बहन", "बहिण",
    ],
  },
  {
    field: "village",
    label: "Aapke village ka naam",
    phrases: [
      "my village", "village name", "mera gaon",
      "my gaon", "गाँव", "गाव", "माझं गाव",
    ],
  },
  {
    field: "college",
    label: "Aapke college ka naam",
    phrases: ["college name", "my college", "कॉलेज"],
  },
  {
    field: "education",
    label: "Aapki education",
    phrases: [
      "my education", "education", "qualification",
      "my degree", "पढ़ाई", "शिक्षण",
    ],
  },
  {
    field: "skills",
    label: "Aapki skills",
    phrases: [
      "my skills", "my skill", "meri skills",
      "my technical skills", "मेरी स्किल", "माझी कौशल्ये",
    ],
  },
  {
    field: "location",
    label: "Aapki location",
    phrases: [
      "my location", "where do i live", "where am i from",
      "mera address", "meri location", "मेरा पता", "माझा पत्ता",
    ],
  },
  {
    field: "email",
    label: "Aapka email",
    phrases: ["my email", "email address", "mera email"],
  },
  {
    field: "mobile",
    label: "Aapka mobile number",
    phrases: [
      "my mobile", "my phone number",
      "mobile number", "mera phone number",
    ],
  },
  {
    field: "github",
    label: "Aapka GitHub link",
    phrases: ["my github", "github link", "mera github"],
  },
  {
    field: "linkedin",
    label: "Aapka LinkedIn link",
    phrases: ["my linkedin", "linkedin link", "mera linkedin"],
  },
];

// ========================================================
// HELPERS
// ========================================================

function normalizeQuestion(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/[?!.,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getTextValue(value) {
  if (value == null) return "";

  if (Array.isArray(value)) {
    return value
      .map(getTextValue)
      .filter(Boolean)
      .join(", ");
  }

  if (typeof value === "object") return "";

  return String(value).trim();
}

function findProfileIntent(message) {
  const question = normalizeQuestion(message);

  // More specific phrases should be checked first.
  return [...PROFILE_INTENTS]
    .sort(
      (a, b) =>
        Math.max(...b.phrases.map((p) => p.length)) -
        Math.max(...a.phrases.map((p) => p.length))
    )
    .find(({ phrases }) =>
      phrases.some((phrase) =>
        question.includes(normalizeQuestion(phrase))
      )
    );
}

function getProfileValue(profile, field) {
  const aliases = {
    sister: ["sister", "sisterName"],
    brotherName: ["brotherName", "brothers"],
    location: ["location", "address"],
  };

  const keys = aliases[field] || [field];

  for (const key of keys) {
    const value = getTextValue(profile?.[key]);
    if (value) return value;
  }

  return "";
}

// ========================================================
// FEMALE-SOUNDING VOICE SELECTION
// ========================================================

const FEMALE_VOICE_KEYWORDS = [
  "heera",
  "zira",
  "kalpana",
  "samantha",
  "jenny",
  "aria",
  "sara",
  "priya",
  "female",
];

function selectPreferredVoice(voices, language) {
  if (!voices.length) return null;

  const lang = String(language || "en-IN").toLowerCase();
  const baseLang = lang.split("-")[0];

  const matchesLanguage = (voice) =>
    voice.lang.toLowerCase() === lang;

  const matchesBaseLanguage = (voice) =>
    voice.lang.toLowerCase().startsWith(baseLang);

  const soundsFemale = (voice) => {
    const name = voice.name.toLowerCase();

    return FEMALE_VOICE_KEYWORDS.some((keyword) =>
      name.includes(keyword)
    );
  };

  return (
    voices.find(
      (voice) =>
        matchesLanguage(voice) && soundsFemale(voice)
    ) ||
    voices.find(
      (voice) =>
        matchesBaseLanguage(voice) && soundsFemale(voice)
    ) ||
    voices.find(matchesLanguage) ||
    voices.find(matchesBaseLanguage) ||
    voices[0]
  );
}

// ========================================================
// MAIN COMPONENT
// ========================================================

function VoiceAssistant() {
  const [listening, setListening] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);
  const [status, setStatus] = useState(
    "Click Start Voice to activate Shifra."
  );

  const recognitionRef = useRef(null);
  const restartTimerRef = useRef(null);
  const mountedRef = useRef(false);

  const shouldListenRef = useRef(false);
  const listeningRef = useRef(false);
  const speakingRef = useRef(false);
  const processingRef = useRef(false);
  const startingRef = useRef(false);

  const speechIdRef = useRef(0);

  const startRecognitionRef = useRef(null);
  const handleCommandRef = useRef(null);
  const sendToAIRef = useRef(null);

  // ======================================================
  // TIMER
  // ======================================================

  const clearRestartTimer = useCallback(() => {
    if (restartTimerRef.current !== null) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
  }, []);

  // ======================================================
  // STOP SPEECH RECOGNITION
  // ======================================================

  const stopRecognition = useCallback(() => {
    clearRestartTimer();

    listeningRef.current = false;
    setListening(false);

    try {
      recognitionRef.current?.stop();
    } catch {
      // Recognition may already have stopped.
    }
  }, [clearRestartTimer]);

  // ======================================================
  // RESTART LISTENING AFTER SPEAKING
  // ======================================================

  const scheduleRecognition = useCallback(
    (delay = 600) => {
      clearRestartTimer();

      if (!shouldListenRef.current) return;
      if (speakingRef.current || processingRef.current) return;
      if (startingRef.current || listeningRef.current) return;

      restartTimerRef.current = setTimeout(() => {
        restartTimerRef.current = null;

        if (!shouldListenRef.current) return;
        if (speakingRef.current || processingRef.current) return;
        if (startingRef.current || listeningRef.current) return;

        startRecognitionRef.current?.();
      }, delay);
    },
    [clearRestartTimer]
  );

  // ======================================================
  // SPEAK USING FEMALE-SOUNDING BROWSER VOICE
  // ======================================================

  const speak = useCallback(
    (message) => {
      const text = getTextValue(message);
      if (!text || !mountedRef.current) return;

      if (
        !("speechSynthesis" in window) ||
        !("SpeechSynthesisUtterance" in window)
      ) {
        setStatus("Browser speech output is not supported.");
        return;
      }

      const speechId = ++speechIdRef.current;

      window.speechSynthesis.cancel();

      clearRestartTimer();
      stopRecognition();

      speakingRef.current = true;
      setVoiceActive(true);
      setStatus("🔊 Shifra is preparing to speak...");

      const settings = getSavedVoiceSettings() || {};
      const language = settings.voiceLang || "en-IN";

      const utterance = new SpeechSynthesisUtterance(text);

      utterance.lang = language;
      utterance.rate = 0.92;
      utterance.pitch = 1.12;
      utterance.volume = 1;

      const voices = window.speechSynthesis.getVoices();
      const selectedVoice = selectPreferredVoice(
        voices,
        language
      );

      if (selectedVoice) {
        utterance.voice = selectedVoice;

        console.log(
          "🎙️ Shifra voice:",
          selectedVoice.name,
          selectedVoice.lang
        );
      } else {
        console.warn("No browser voice is currently available.");
      }

      utterance.onstart = () => {
        if (speechIdRef.current !== speechId) return;

        speakingRef.current = true;
        setStatus("🔊 Shifra is Speaking...");
      };

      utterance.onend = () => {
        if (speechIdRef.current !== speechId) return;

        speakingRef.current = false;

        if (!mountedRef.current) return;

        if (shouldListenRef.current) {
          setStatus("🎙️ Shifra is Listening...");
          scheduleRecognition(700);
        } else {
          setVoiceActive(false);
          setStatus("Click Start Voice to activate Shifra.");
        }
      };

      utterance.onerror = (event) => {
        if (speechIdRef.current !== speechId) return;

        speakingRef.current = false;

        console.error("Speech output error:", event.error);

        if (!mountedRef.current) return;

        if (shouldListenRef.current) {
          scheduleRecognition(700);
        } else {
          setVoiceActive(false);
          setStatus("Speech output failed.");
        }
      };

      try {
        window.speechSynthesis.resume();
        window.speechSynthesis.speak(utterance);
      } catch (error) {
        speakingRef.current = false;

        console.error("Speech could not start:", error);

        setStatus("Unable to start speech output.");
      }
    },
    [clearRestartTimer, scheduleRecognition, stopRecognition]
  );

  // ======================================================
  // SYSTEM COMMAND
  // ======================================================

  const runSystemCommand = useCallback(
    async (command) => {
      const settings = getSavedVoiceSettings() || {};

      if (settings.systemCommands === false) {
        speak("System commands are disabled in settings.");
        return true;
      }

      try {
        setStatus("⚙️ Executing command...");

        const response = await SystemAPI.post("/system/run", {
          command,
        });

        console.log("System command response:", response.data);

        speak(
          response.data?.message ||
            "Command executed successfully."
        );
      } catch (error) {
        console.error(
          "System command failed:",
          error.response?.data || error.message
        );

        speak(
          error.response?.data?.message ||
            "System command failed. Please check your backend."
        );
      }

      return true;
    },
    [speak]
  );

  // ======================================================
  // LOCAL COMMANDS
  // ======================================================

  const handleCommand = useCallback(
    async (command) => {
      const cmd = normalizeQuestion(command);

      if (!cmd) return false;

      if (
        ["hello", "hi", "hey"].includes(cmd) ||
        cmd.includes("hello shifra")
      ) {
        speak("Hello Karan! How can I help you?");
        return true;
      }

      const commands = [
        {
          phrases: ["open youtube", "youtube kholo", "youtube open"],
          command: "open youtube",
        },
        {
          phrases: ["open google", "google kholo", "google open"],
          command: "open google",
        },
        {
          phrases: ["open chrome", "chrome kholo"],
          command: "open chrome",
        },
        {
          phrases: ["open notepad", "notepad kholo"],
          command: "open notepad",
        },
        {
          phrases: ["open calculator", "calculator kholo", "open calc"],
          command: "open calculator",
        },
        {
          phrases: ["open vs code", "open vscode", "vs code kholo"],
          command: "open vs code",
        },
        {
          phrases: [
            "open file explorer",
            "file explorer kholo",
            "open explorer",
          ],
          command: "open file explorer",
        },
        {
          phrases: ["open cmd", "open command prompt", "command prompt kholo"],
          command: "open cmd",
        },
        {
          phrases: ["open github", "github kholo"],
          command: "open github",
        },
        {
          phrases: ["open gmail", "gmail kholo"],
          command: "open gmail",
        },
        {
          phrases: ["open linkedin", "open linkdin", "linkedin kholo"],
          command: "open linkedin",
        },
        {
          phrases: ["open instagram", "instagram kholo", "open insta"],
          command: "open instagram",
        },
        {
          phrases: ["open snapchat", "open snap"],
          command: "open snapchat",
        },
        {
          phrases: ["open facebook"],
          command: "open facebook",
        },
        {
          phrases: ["open whatsapp"],
          command: "open whatsapp",
        },
        {
          phrases: ["open telegram"],
          command: "open telegram",
        },
        {
          phrases: ["open twitter"],
          command: "open twitter",
        },
        {
          phrases: ["lock screen", "lock computer"],
          command: "lock screen",
        },
      ];

      const matched = commands.find(({ phrases }) =>
        phrases.some((phrase) => cmd.includes(phrase))
      );

      if (matched) {
        return runSystemCommand(matched.command);
      }

      if (
        cmd === "restart" ||
        cmd.includes("restart computer")
      ) {
        if (
          !window.confirm(
            "Are you sure you want to restart the computer?"
          )
        ) {
          speak("Restart cancelled.");
          return true;
        }

        return runSystemCommand("restart computer");
      }

      if (
        cmd === "shutdown" ||
        cmd.includes("shutdown computer")
      ) {
        if (
          !window.confirm(
            "Are you sure you want to shut down the computer?"
          )
        ) {
          speak("Shutdown cancelled.");
          return true;
        }

        return runSystemCommand("shutdown computer");
      }

      if (
        cmd === "time" ||
        cmd.includes("current time") ||
        cmd.includes("what is the time") ||
        cmd.includes("what's the time") ||
        cmd.includes("samay")
      ) {
        speak(`Current time is ${new Date().toLocaleTimeString()}.`);
        return true;
      }

      if (
        cmd === "date" ||
        cmd.includes("today date") ||
        cmd.includes("today's date") ||
        cmd.includes("what is today's date") ||
        cmd.includes("tarikh")
      ) {
        speak(`Today's date is ${new Date().toLocaleDateString()}.`);
        return true;
      }

      if (cmd.startsWith("search ") || cmd.startsWith("google ")) {
        const settings = getSavedVoiceSettings() || {};

        if (settings.websiteCommands === false) {
          speak("Website commands are disabled in settings.");
          return true;
        }

        const query = cmd
          .replace(/^search\s+/, "")
          .replace(/^google\s+/, "")
          .trim();

        if (!query) {
          speak("Please tell me what you want to search.");
          return true;
        }

        window.open(
          `https://www.google.com/search?q=${encodeURIComponent(query)}`,
          "_blank",
          "noopener,noreferrer"
        );

        speak(`Searching ${query}.`);
        return true;
      }

      return false;
    },
    [runSystemCommand, speak]
  );

  // ======================================================
  // PROFILE FETCH + AI CHAT
  // ======================================================

  const sendToAI = useCallback(
    async (message) => {
      try {
        setStatus("👤 Checking saved profile...");

        let personalData = {};

        try {
          const response = await API.get("/profile");

          personalData =
            response?.data?.profile ||
            response?.data?.data?.profile ||
            response?.data?.data ||
            {};

          console.log("👤 Profile loaded:", personalData);
        } catch (error) {
          console.error(
            "Profile fetch failed:",
            error.response?.data || error.message
          );
        }

        const intent = findProfileIntent(message);

        if (intent) {
          const value = getProfileValue(
            personalData,
            intent.field
          );

          if (value) {
            speak(`${intent.label}: ${value}.`);
          } else {
            speak(
              `Sorry, ${intent.label.toLowerCase()} profile mein save nahi hai.`
            );
          }

          return;
        }

        setStatus("🤖 Shifra is thinking...");

        const response = await API.post("/ai/chat", {
          message,
          history: [],
          personalData,
          profile: personalData,
        });

        const data = response?.data || {};

        const reply =
          data.reply ||
          data.message ||
          data.response ||
          data.text ||
          "Sorry, I could not understand that.";

        console.log("🤖 Shifra reply:", reply);

        speak(reply);
      } catch (error) {
        console.error(
          "AI request failed:",
          error.response?.data || error.message
        );

        speak(
          error.response?.data?.message ||
            "Backend connection failed. Please check your server."
        );
      }
    },
    [speak]
  );

  // ======================================================
  // START SPEECH RECOGNITION
  // ======================================================

  const startRecognition = useCallback(() => {
    if (!shouldListenRef.current) return;
    if (speakingRef.current || processingRef.current) return;
    if (startingRef.current || listeningRef.current) return;

    startingRef.current = true;

    try {
      const settings = getSavedVoiceSettings() || {};
      const language = settings.voiceLang || "en-IN";

      const recognition = createSpeechRecognition(language);

      if (!recognition) {
        throw new Error(
          "Speech recognition is not supported. Use Chrome or Edge."
        );
      }

      recognitionRef.current = recognition;
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.lang = language;

      recognition.onstart = () => {
        startingRef.current = false;

        if (!shouldListenRef.current) {
          try {
            recognition.stop();
          } catch {
            // Ignore.
          }

          return;
        }

        listeningRef.current = true;
        setListening(true);
        setVoiceActive(true);
        setStatus("🎙️ Shifra is Listening...");
      };

      recognition.onresult = async (event) => {
        if (!shouldListenRef.current) return;
        if (speakingRef.current || processingRef.current) return;

        const result =
          event.results?.[event.results.length - 1];

        const transcript = result?.[0]?.transcript?.trim();

        if (!transcript) return;

        console.log("🎙️ You said:", transcript);

        processingRef.current = true;
        setStatus(`You said: ${transcript}`);

        try {
          recognition.stop();
        } catch {
          // Ignore.
        }

        listeningRef.current = false;
        setListening(false);

        try {
          const handled =
            await handleCommandRef.current?.(transcript);

          if (!handled) {
            await sendToAIRef.current?.(transcript);
          }
        } catch (error) {
          console.error("Voice processing error:", error);
          speak("Sorry, something went wrong.");
        } finally {
          processingRef.current = false;

          if (
            shouldListenRef.current &&
            !speakingRef.current
          ) {
            scheduleRecognition(700);
          }
        }
      };

      recognition.onerror = (event) => {
        startingRef.current = false;
        listeningRef.current = false;
        setListening(false);

        if (event.error === "aborted") {
          console.log("Speech recognition stopped normally.");
          return;
        }

        console.error("Speech recognition error:", event.error);

        if (event.error === "no-speech") {
          scheduleRecognition(500);
          return;
        }

        if (event.error === "network") {
          setStatus(
            "🌐 Speech service network error. Check internet connection."
          );

          scheduleRecognition(1500);
          return;
        }

        if (event.error === "not-allowed") {
          shouldListenRef.current = false;
          setVoiceActive(false);
          setStatus("Microphone permission denied.");
          return;
        }

        setStatus(`Voice error: ${event.error}`);
        scheduleRecognition(1000);
      };

      recognition.onend = () => {
        listeningRef.current = false;
        startingRef.current = false;
        setListening(false);

        if (!shouldListenRef.current) {
          setVoiceActive(false);
          setStatus("🛑 Shifra stopped.");
          return;
        }

        if (speakingRef.current || processingRef.current) {
          return;
        }

        scheduleRecognition(500);
      };

      recognition.start();
    } catch (error) {
      startingRef.current = false;
      listeningRef.current = false;
      setListening(false);

      console.error("Recognition start failed:", error);

      setStatus(error.message || "Voice engine failed.");

      if (shouldListenRef.current) {
        scheduleRecognition(1200);
      }
    }
  }, [scheduleRecognition, speak]);

  // Keep latest callbacks available to recognition events.
  startRecognitionRef.current = startRecognition;
  handleCommandRef.current = handleCommand;
  sendToAIRef.current = sendToAI;

  // ======================================================
  // START VOICE
  // ======================================================

  const startListening = useCallback(async () => {
    if (shouldListenRef.current) return;

    try {
      setStatus("🎙️ Checking microphone permission...");

      await requestMicPermission();

      clearRestartTimer();

      shouldListenRef.current = true;
      setVoiceActive(true);

      startRecognitionRef.current?.();
    } catch (error) {
      console.error("Microphone permission error:", error);

      shouldListenRef.current = false;
      setListening(false);
      setVoiceActive(false);

      if (error?.name === "NotAllowedError") {
        setStatus("Allow microphone access in browser settings.");
      } else if (error?.name === "NotFoundError") {
        setStatus("No microphone was detected.");
      } else {
        setStatus(error?.message || "Voice engine failed.");
      }
    }
  }, [clearRestartTimer]);

  // ======================================================
  // STOP VOICE
  // ======================================================

  const stopListening = useCallback(() => {
    console.log("🛑 Stopping Shifra...");

    shouldListenRef.current = false;
    processingRef.current = false;
    speakingRef.current = false;
    startingRef.current = false;

    speechIdRef.current += 1;

    clearRestartTimer();

    try {
      recognitionRef.current?.stop();
    } catch {
      // Recognition may already be stopped.
    }

    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignore.
    }

    listeningRef.current = false;

    setListening(false);
    setVoiceActive(false);
    setStatus("🛑 Shifra stopped.");
  }, [clearRestartTimer]);

  // ======================================================
  // LOAD BROWSER VOICES + CLEANUP
  // ======================================================

  useEffect(() => {
    mountedRef.current = true;

    const loadVoices = () => {
      const voices = window.speechSynthesis?.getVoices?.() || [];

      console.log(
        "Available browser voices:",
        voices.map((voice) => ({
          name: voice.name,
          lang: voice.lang,
        }))
      );
    };

    loadVoices();

    if ("speechSynthesis" in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      mountedRef.current = false;

      shouldListenRef.current = false;
      listeningRef.current = false;
      processingRef.current = false;
      speakingRef.current = false;
      startingRef.current = false;

      speechIdRef.current += 1;

      clearRestartTimer();

      if ("speechSynthesis" in window) {
        window.speechSynthesis.onvoiceschanged = null;
        window.speechSynthesis.cancel();
      }

      try {
        recognitionRef.current?.stop();
      } catch {
        // Ignore cleanup errors.
      }

      recognitionRef.current = null;
    };
  }, [clearRestartTimer]);

  // ======================================================
  // UI
  // ======================================================

  return (
    <div className="voice-assistant">
      <h2>NEXUS Voice Assistant [Shifra]</h2>

      <div className={`voice-orb ${listening ? "active" : ""}`}>
        <img
          src={MyAssistant}
          alt="Shifra AI Assistant"
          className="assistant-image"
        />
      </div>

      <p className="voice-status" aria-live="polite">
        {status}
      </p>

      <div className="voice-buttons">
        <button
          type="button"
          onClick={startListening}
          disabled={voiceActive}
        >
          🎙️ Start Voice
        </button>

        <button
          type="button"
          onClick={stopListening}
          disabled={!voiceActive}
        >
          🛑 Stop Voice
        </button>
      </div>
    </div>
  );
}

export default VoiceAssistant;


