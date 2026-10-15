
import { useCallback, useEffect, useRef, useState } from "react";

import MyAssistant from "../../assets/images/my_assitancee.png";
import API from "../../services/api";
import SystemAPI from "../../services/systemApi";

import { getSavedVoiceSettings } from "../../services/voiceService";

import "./VoiceAssistant.css";

// ========================================================
// CONFIGURATION
// ========================================================

const RECORDING_INTERVAL = 5000;

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
    return value.map(getTextValue).filter(Boolean).join(", ");
  }

  if (typeof value === "object") return "";

  return String(value).trim();
}

function findProfileIntent(message) {
  const question = normalizeQuestion(message);

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

  for (const key of aliases[field] || [field]) {
    const value = getTextValue(profile?.[key]);
    if (value) return value;
  }

  return "";
}

// ========================================================
// VOICE SELECTION
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

  const exactLanguage = (voice) =>
    voice.lang.toLowerCase() === lang;

  const baseLanguage = (voice) =>
    voice.lang.toLowerCase().startsWith(baseLang);

  const soundsFemale = (voice) => {
    const name = voice.name.toLowerCase();

    return FEMALE_VOICE_KEYWORDS.some((keyword) =>
      name.includes(keyword)
    );
  };

  return (
    voices.find((v) => exactLanguage(v) && soundsFemale(v)) ||
    voices.find((v) => baseLanguage(v) && soundsFemale(v)) ||
    voices.find(exactLanguage) ||
    voices.find(baseLanguage) ||
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

  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const timerRef = useRef(null);
  const mountedRef = useRef(false);

  const shouldListenRef = useRef(false);
  const listeningRef = useRef(false);
  const speakingRef = useRef(false);
  const processingRef = useRef(false);
  const startingRef = useRef(false);
  const discardRef = useRef(false);
  const chunksRef = useRef([]);

  const speechIdRef = useRef(0);

  const startRecordingRef = useRef(null);
  const handleCommandRef = useRef(null);
  const sendToAIRef = useRef(null);

  // ======================================================
  // TIMER HELPERS
  // ======================================================

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const scheduleRecording = useCallback(
    (delay = 500) => {
      clearTimer();

      if (!shouldListenRef.current) return;
      if (speakingRef.current || processingRef.current) return;
      if (startingRef.current || listeningRef.current) return;

      timerRef.current = setTimeout(() => {
        timerRef.current = null;

        if (!shouldListenRef.current) return;
        if (speakingRef.current || processingRef.current) return;

        startRecordingRef.current?.();
      }, delay);
    },
    [clearTimer]
  );

  // ======================================================
  // STOP CURRENT RECORDING
  // ======================================================

  const stopRecording = useCallback(
    (discard = true) => {
      clearTimer();

      const recorder = recorderRef.current;

      if (recorder && recorder.state === "recording") {
        discardRef.current = discard;

        try {
          recorder.stop();
        } catch (error) {
          console.error("Recording stop error:", error);
        }
      }

      listeningRef.current = false;
      setListening(false);
    },
    [clearTimer]
  );

  // ======================================================
  // SPEAK USING BROWSER VOICE
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
      stopRecording(true);

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

      const selectedVoice = selectPreferredVoice(
        window.speechSynthesis.getVoices(),
        language
      );

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      utterance.onstart = () => {
        if (speechIdRef.current !== speechId) return;

        speakingRef.current = true;
        setStatus("🔊 Shifra is speaking...");
      };

      utterance.onend = () => {
        if (speechIdRef.current !== speechId) return;

        speakingRef.current = false;

        if (!mountedRef.current) return;

        if (shouldListenRef.current) {
          setStatus("🎙️ Shifra is listening...");
          scheduleRecording(700);
        } else {
          setVoiceActive(false);
          setStatus("Click Start Voice to activate Shifra.");
        }
      };

      utterance.onerror = (event) => {
        if (speechIdRef.current !== speechId) return;

        speakingRef.current = false;
        console.error("Speech output error:", event.error);

        if (shouldListenRef.current) {
          scheduleRecording(700);
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
    [scheduleRecording, stopRecording]
  );

  // ======================================================
  // SYSTEM COMMANDS
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
        speak("Hello! How can I help you?");
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
          phrases: [
            "open cmd",
            "open command prompt",
            "command prompt kholo",
          ],
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
        if (!window.confirm("Are you sure you want to restart the computer?")) {
          speak("Restart cancelled.");
          return true;
        }

        return runSystemCommand("restart computer");
      }

      if (
        cmd === "shutdown" ||
        cmd.includes("shutdown computer")
      ) {
        if (!window.confirm("Are you sure you want to shut down the computer?")) {
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
  // PROFILE + GEMINI CHAT
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
          const value = getProfileValue(personalData, intent.field);

          speak(
            value
              ? `${intent.label}: ${value}.`
              : `Sorry, ${intent.label.toLowerCase()} profile mein save nahi hai.`
          );

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
  // TRANSCRIBE AUDIO USING YOUR BACKEND
  // ======================================================

  const transcribeAudio = useCallback(async (blob) => {
    if (!blob || blob.size === 0) return "";

    const formData = new FormData();

    const isMp4 = blob.type.includes("mp4");
    const extension = isMp4 ? "mp4" : "webm";

    formData.append(
      "audio",
      blob,
      `voice-${Date.now()}.${extension}`
    );

    // Assumes API baseURL already includes /api.
    const response = await API.post("/voice/transcribe", formData);

    return response?.data?.text?.trim() || "";
  }, []);

  // ======================================================
  // RECORD AUDIO SEGMENTS
  // ======================================================

  const startRecording = useCallback(() => {
    if (!shouldListenRef.current) return;
    if (speakingRef.current || processingRef.current) return;
    if (startingRef.current || listeningRef.current) return;

    const stream = streamRef.current;

    if (!stream || !stream.active) {
      setStatus("Microphone is not available.");
      return;
    }

    if (
      recorderRef.current &&
      recorderRef.current.state === "recording"
    ) {
      return;
    }

    if (!window.MediaRecorder) {
      setStatus("Audio recording is not supported in this environment.");
      return;
    }

    startingRef.current = true;

    try {
      let options = {};

      if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
        options.mimeType = "audio/webm;codecs=opus";
      } else if (MediaRecorder.isTypeSupported("audio/webm")) {
        options.mimeType = "audio/webm";
      } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
        options.mimeType = "audio/mp4";
      }

      const recorder = new MediaRecorder(stream, options);

      recorderRef.current = recorder;
      chunksRef.current = [];
      discardRef.current = false;

      recorder.ondataavailable = (event) => {
        if (event.data?.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstart = () => {
        startingRef.current = false;
        listeningRef.current = true;

        setListening(true);
        setVoiceActive(true);
        setStatus("🎙️ Shifra is Listening...");
      };

      recorder.onerror = (event) => {
        startingRef.current = false;

        console.error("MediaRecorder error:", event.error);
        setStatus("Microphone recording error.");
      };

      recorder.onstop = async () => {
        if (recorderRef.current === recorder) {
          recorderRef.current = null;
        }

        startingRef.current = false;
        listeningRef.current = false;

        if (mountedRef.current) {
          setListening(false);
        }

        const discard = discardRef.current;
        discardRef.current = false;

        const chunks = chunksRef.current;
        chunksRef.current = [];

        if (discard || !shouldListenRef.current) return;

        const blob = new Blob(chunks, {
          type: recorder.mimeType || "audio/webm",
        });

        if (!blob.size) {
          scheduleRecording(300);
          return;
        }

        try {
          processingRef.current = true;
          setStatus("📝 Converting speech to text...");

          const transcript = await transcribeAudio(blob);

          if (!mountedRef.current || !shouldListenRef.current) return;

          if (!transcript) {
            setStatus("Speech not detected. Listening again...");
            return;
          }

          console.log("🎙️ You said:", transcript);

          setStatus(`You said: ${transcript}`);

          const handled = await handleCommandRef.current?.(transcript);

          if (!handled && shouldListenRef.current) {
            await sendToAIRef.current?.(transcript);
          }
        } catch (error) {
          console.error(
            "Voice transcription error:",
            error.response?.data || error.message
          );

          if (mountedRef.current) {
            setStatus(
              error.response?.data?.message ||
                "Voice transcription failed. Check the backend and Gemini API."
            );
          }
        } finally {
          processingRef.current = false;

          if (
            mountedRef.current &&
            shouldListenRef.current &&
            !speakingRef.current
          ) {
            scheduleRecording(500);
          }
        }
      };

      recorder.start();

      timerRef.current = setTimeout(() => {
        timerRef.current = null;

        if (recorder.state === "recording") {
          try {
            // This is a normal segment, so it should be transcribed.
            discardRef.current = false;
            recorder.stop();
          } catch (error) {
            console.error("Recording segment error:", error);
          }
        }
      }, RECORDING_INTERVAL);
    } catch (error) {
      startingRef.current = false;

      console.error("Unable to start recording:", error);

      setStatus(error.message || "Unable to start microphone recording.");

      scheduleRecording(1200);
    }
  }, [scheduleRecording, transcribeAudio]);

  // Keep the newest callback for asynchronous recorder events.
  startRecordingRef.current = startRecording;
  handleCommandRef.current = handleCommand;
  sendToAIRef.current = sendToAI;

  // ======================================================
  // START VOICE ASSISTANT
  // ======================================================

  const startListening = useCallback(async () => {
    if (shouldListenRef.current) return;

    if (
      !navigator.mediaDevices?.getUserMedia ||
      !window.MediaRecorder
    ) {
      setStatus(
        "Microphone recording is not supported in this environment."
      );
      return;
    }

    try {
      setStatus("🎙️ Requesting microphone permission...");

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      if (!mountedRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;
      shouldListenRef.current = true;

      setVoiceActive(true);
      setStatus("🎙️ Shifra is Listening...");

      startRecordingRef.current?.();
    } catch (error) {
      console.error("Microphone permission error:", error);

      shouldListenRef.current = false;
      setListening(false);
      setVoiceActive(false);

      if (error.name === "NotAllowedError") {
        setStatus("Microphone permission denied. Allow microphone access.");
      } else if (error.name === "NotFoundError") {
        setStatus("No microphone was detected.");
      } else {
        setStatus(error.message || "Unable to access microphone.");
      }
    }
  }, []);

  // ======================================================
  // STOP VOICE ASSISTANT
  // ======================================================

  const stopListening = useCallback(() => {
    console.log("🛑 Stopping Shifra...");

    shouldListenRef.current = false;
    startingRef.current = false;
    processingRef.current = false;
    speakingRef.current = false;

    speechIdRef.current += 1;

    clearTimer();
    window.speechSynthesis?.cancel();

    stopRecording(true);

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    setListening(false);
    setVoiceActive(false);
    setStatus("🛑 Shifra stopped.");
  }, [clearTimer, stopRecording]);

  // ======================================================
  // CLEANUP
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

      clearTimer();
      window.speechSynthesis?.cancel();

      const recorder = recorderRef.current;

      if (recorder && recorder.state === "recording") {
        try {
          discardRef.current = true;
          recorder.stop();
        } catch (error) {
          console.error("Recorder cleanup error:", error);
        }
      }

      streamRef.current?.getTracks().forEach((track) => track.stop());

      streamRef.current = null;
      recorderRef.current = null;

      if ("speechSynthesis" in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, [clearTimer]);

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
