import { useEffect, useRef, useState } from "react";
import API from "../../services/api";
import {
  createSpeechRecognition,
  getSavedVoiceSettings,
  requestMicPermission,
  speakText,
} from "../../services/voiceService";
import "./VoiceAssistant.css";

function VoiceAssistant() {
  const [listening, setListening] = useState(false);
  const [text, setText] = useState("");
  const [reply, setReply] = useState("");
  const [status, setStatus] = useState("Click Start and speak");

  const recognitionRef = useRef(null);
  const speakingRef = useRef(false);

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.stop();
        window.speechSynthesis.cancel();
      } catch {
        // ignore cleanup error
      }
    };
  }, []);

  const getVoiceErrorMessage = (error) => {
    if (error === "not-allowed") {
      return "Mic permission blocked hai. Chrome me microphone Allow karo.";
    }

    if (error === "audio-capture") {
      return "Mic device detect nahi hua. Windows Sound Input check karo.";
    }

    if (error === "no-speech") {
      return "Voice detect nahi hui. Mic ke paas bolke dobara try karo.";
    }

    if (error === "network") {
      return "Speech service network error. Internet check karo.";
    }

    if (error === "aborted") {
      return "Voice listening stopped.";
    }

    return `Voice error: ${error}`;
  };

  const speak = (message) => {
    speakText({
      message,
      onStart: () => {
        speakingRef.current = true;
        setStatus("Speaking...");
      },
      onEnd: () => {
        speakingRef.current = false;
        setStatus("Click Start and speak");
      },
      onError: () => {
        speakingRef.current = false;
        setStatus("Speech output failed.");
      },
    });
  };

  const handleCommand = async (command) => {
    const cmd = command.toLowerCase();
    const settings = getSavedVoiceSettings();

    const wantsSystem =
      cmd.includes("open") ||
      cmd.includes("kholo") ||
      cmd.includes("notepad") ||
      cmd.includes("calculator") ||
      cmd.includes("calc") ||
      cmd.includes("cmd") ||
      cmd.includes("command prompt") ||
      cmd.includes("chrome") ||
      cmd.includes("vs code") ||
      cmd.includes("vscode") ||
      cmd.includes("explorer") ||
      cmd.includes("file explorer");

    if (wantsSystem) {
      if (settings.systemCommands === false) {
        const msg = "System commands are disabled in settings.";
        setReply(msg);
        speak(msg);
        return true;
      }

      try {
        const res = await API.post("/system/run", { command: cmd });
        const msg = res.data?.message || "Command executed.";
        setReply(msg);
        speak(msg);
        return true;
      } catch (error) {
        console.log("System Command Error:", error);
        const msg = error.response?.data?.message || "System command failed.";
        setReply(msg);
        speak(msg);
        return true;
      }
    }

    if (cmd.includes("time") || cmd.includes("samay")) {
      const msg = `Current time is ${new Date().toLocaleTimeString()}`;
      setReply(msg);
      speak(msg);
      return true;
    }

    if (cmd.includes("date") || cmd.includes("tarikh")) {
      const msg = `Today is ${new Date().toDateString()}`;
      setReply(msg);
      speak(msg);
      return true;
    }

    if (cmd.startsWith("search ")) {
      const query = cmd.replace("search ", "").trim();

      if (!query) return false;

      if (settings.websiteCommands === false) {
        const msg = "Website commands are disabled in settings.";
        setReply(msg);
        speak(msg);
        return true;
      }

      window.open(
        `https://www.google.com/search?q=${encodeURIComponent(query)}`,
        "_blank"
      );

      const msg = `Searching ${query}`;
      setReply(msg);
      speak(msg);
      return true;
    }

    return false;
  };

  const sendToAI = async (message) => {
    try {
      const settings = getSavedVoiceSettings();

      const res = await API.post("/ai/chat", {
        message,
        history: [{ role: "user", content: message }],
        settings,
      });

      const aiReply = res.data?.reply || "No reply received.";
      setReply(aiReply);
      speak(aiReply);
    } catch (error) {
      console.log("AI Error:", error);

      const msg =
        error.response?.data?.message ||
        "Backend connection failed. Backend server check karo.";

      setReply(msg);
      speak(msg);
    }
  };

  const startListening = async () => {
    try {
      setStatus("Checking microphone permission...");

      await requestMicPermission();

      const settings = getSavedVoiceSettings();
      const lang = settings.voiceLang || "en-IN";

      const recognition = createSpeechRecognition(lang);
      recognitionRef.current = recognition;

      recognition.onstart = () => {
        setListening(true);
        setStatus("Listening...");
      };

      recognition.onresult = async (event) => {
        if (speakingRef.current) return;

        const transcript = event.results[0][0].transcript.trim();

        if (!transcript) {
          setStatus("No voice input detected.");
          return;
        }

        setText(transcript);
        setStatus("Thinking...");

        try {
          recognition.stop();
        } catch {
          // ignore stop error
        }

        setListening(false);

        const handled = await handleCommand(transcript);

        if (!handled) {
          await sendToAI(transcript);
        }
      };

      recognition.onerror = (event) => {
        console.log("Voice Recognition Error:", event.error);

        setListening(false);
        setStatus(getVoiceErrorMessage(event.error));
      };

      recognition.onend = () => {
        setListening(false);

        setStatus((oldStatus) => {
          if (oldStatus === "Listening...") return "Click Start and speak";
          return oldStatus;
        });
      };

      window.speechSynthesis.cancel();
      recognition.start();
    } catch (error) {
      console.log("Mic Permission Error:", error);

      setListening(false);

      if (error.name === "NotAllowedError") {
        setStatus("Mic blocked hai. Browser me microphone permission Allow karo.");
      } else if (error.name === "NotFoundError") {
        setStatus("Microphone device nahi mila.");
      } else {
        setStatus(error.message || "Voice engine failed.");
      }
    }
  };

  const stopListening = () => {
    try {
      recognitionRef.current?.stop();
      window.speechSynthesis.cancel();

      setListening(false);
      setStatus("Stopped");
    } catch {
      setStatus("Stop failed");
    }
  };

  return (
    <div className="voice-assistant">
      <h2>NEXUS Voice Assistant</h2>

      <div className={`voice-orb ${listening ? "active" : ""}`}>🎤</div>

      <p className="voice-status">{status}</p>

      <div className="voice-buttons">
        <button onClick={startListening} disabled={listening}>
          {listening ? "Listening..." : "Start"}
        </button>

        <button onClick={stopListening}>Stop</button>
      </div>

      <div className="voice-box">
        <h4>You Said:</h4>
        <p>{text || "No voice input yet."}</p>
      </div>

      <div className="voice-box">
        <h4>NEXUS Reply:</h4>
        <p>{reply || "No reply yet."}</p>
      </div>
    </div>
  );
}

export default VoiceAssistant;