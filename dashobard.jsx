/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-hooks/purity */

import { useEffect, useMemo, useRef, useState } from "react";
import API from "../services/api";
import "../styles/dashboard.css";

import {
  FaBars,
  FaChartBar,
  FaCloudSun,
  FaCog,
  FaComments,
  FaDesktop,
  FaGithub,
  FaGlobe,
  FaGoogle,
  FaHome,
  FaMicrophone,
  FaPaperPlane,
  FaTerminal,
  FaUser,
  FaYoutube,
} from "react-icons/fa";

const menu = [
  { icon: <FaHome />, text: "Dashboard" },
  { icon: <FaComments />, text: "AI Chat" },
  { icon: <FaMicrophone />, text: "Voice Command" },
  { icon: <FaTerminal />, text: "System Control" },
  { icon: <FaGlobe />, text: "Web Access" },
  { icon: <FaChartBar />, text: "Data Analytics" },
  { icon: <FaCog />, text: "Settings" },
];

const makeBinary = () =>
  Array.from({ length: 20 })
    .map(() => (Math.random() > 0.5 ? "1" : "0"))
    .join("\n");

export default function Dashboard() {
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [messages, setMessages] = useState([
    "NEXUS AI v2.5.0",
    "Hello Karan 👋",
    "I am NEXUS AI.",
    "How can I assist you today?",
  ]);

  const consoleEndRef = useRef(null);
  const speakingRef = useRef(false);
  const recognitionRef = useRef(null);
  const restartTimerRef = useRef(null);

  const rain = useMemo(
    () =>
      Array.from({ length: 42 }).map((_, i) => ({
        id: i,
        left: `${(i / 42) * 100}%`,
        duration: `${9 + Math.random() * 7}s`,
        delay: `${Math.random() * 5}s`,
        text: makeBinary(),
      })),
    [],
  );

  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const speak = (text) => {
    window.speechSynthesis.cancel();
    speakingRef.current = true;

    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = "en-IN";
    speech.rate = 1;
    speech.pitch = 1;

    speech.onend = () => {
      speakingRef.current = false;
    };

    speech.onerror = () => {
      speakingRef.current = false;
    };

    window.speechSynthesis.speak(speech);
  };

  const runLocalCommand = (command) => {
    const cmd = command.toLowerCase();

    if (cmd.includes("open google")) {
      window.open("https://google.com", "_blank");
      return "Opening Google.";
    }

    if (cmd.includes("open youtube")) {
      window.open("https://youtube.com", "_blank");
      return "Opening YouTube.";
    }

    if (cmd.includes("open github")) {
      window.open("https://github.com", "_blank");
      return "Opening GitHub.";
    }

    if (cmd.includes("open chatgpt")) {
      window.open("https://chatgpt.com", "_blank");
      return "Opening ChatGPT.";
    }

    if (cmd.includes("open gmail")) {
      window.open("https://mail.google.com", "_blank");
      return "Opening Gmail.";
    }

    if (cmd.includes("open linkedin")) {
      window.open("https://linkedin.com", "_blank");
      return "Opening LinkedIn.";
    }

    if (cmd.includes("weather")) {
      window.open("https://www.google.com/search?q=weather", "_blank");
      return "Opening weather information.";
    }

    if (cmd.includes("time")) {
      return `Current time is ${new Date().toLocaleTimeString()}`;
    }

    return null;
  };

  const handleSend = async (textValue = input) => {
    if (!textValue.trim()) return;

    const userMessage = textValue.trim();
    setInput("");

    setMessages((prev) => [...prev, `> ${userMessage}`, "Thinking..."]);

    const localReply = runLocalCommand(userMessage);

    if (localReply) {
      setMessages((prev) => {
        const updated = [...prev];
        updated.pop();
        return [...updated, localReply];
      });
      speak(localReply);
      return;
    }

    try {
      const res = await API.post("/ai/chat", { message: userMessage });
      const reply = res.data.reply || "No reply received.";

      setMessages((prev) => {
        const updated = [...prev];
        updated.pop();
        return [...updated, reply];
      });

      speak(reply);
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        updated.pop();
        return [...updated, "Backend connection failed"];
      });

      speak("Backend connection failed.");
    }
  };

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setMessages((prev) => [
        ...prev,
        "Voice recognition not supported. Use Chrome browser.",
      ]);
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.lang = "en-IN";
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onstart = () => setListening(true);

    recognition.onresult = (event) => {
      if (speakingRef.current) return;

      const text = event.results[event.results.length - 1][0].transcript.trim();
      const lowerText = text.toLowerCase();

      if (!text) return;
      setInput(text);

      const wakeWords = [
        "hey nexus",
        "hi nexus",
        "hello nexus",
        "nexus",
        "next us",
        "hey next us",
        "nexas",
      ];

      const hasWakeWord = wakeWords.some((word) => lowerText.includes(word));

      if (hasWakeWord) {
        let command = lowerText
          .replace("hey nexus", "")
          .replace("hi nexus", "")
          .replace("hello nexus", "")
          .replace("hey next us", "")
          .replace("next us", "")
          .replace("nexas", "")
          .replace("nexus", "")
          .trim();

        if (!command) command = "hello";
        handleSend(command);
      }
    };

    recognition.onerror = () => setListening(false);

    recognition.onend = () => {
      setListening(false);
      clearTimeout(restartTimerRef.current);

      restartTimerRef.current = setTimeout(() => {
        try {
          recognition.start();
        } catch {
          /* empty */
        }
      }, 800);
    };

    try {
      recognition.start();
    } catch {
      /* empty */
    }

    return () => {
      clearTimeout(restartTimerRef.current);
      recognition.onend = null;
      recognition.stop();
    };
  }, []);

  const clearConsole = () => {
    setMessages([
      "NEXUS AI v2.5.0",
      "Console cleared.",
      'Say: "Hey Nexus what is React"',
    ]);
  };

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
          <button className="menu-btn">
            <FaBars />
          </button>

          <div>
            <h1>NEXUS AI</h1>
            <p> KARAN'S PERSONAL ASSISTANT</p>
          </div>
        </div>

        <div className="online-badge">
          <span></span>
          {listening ? "SYSTEM ONLINE" : "VOICE STARTING"}
        </div>

        <div className="header-right">
          <div className="time-box">
            <h3>{new Date().toLocaleTimeString()}</h3>
            <p>{new Date().toDateString()}</p>
          </div>

          <button className="user-btn">
            <FaUser />
          </button>
        </div>
      </header>

      <main className="dashboard-layout">
        <aside className="left-side">
          <div className="glass-panel nav-panel">
            {menu.map((item, index) => (
              <div
                className={`nav-item ${index === 0 ? "active" : ""}`}
                key={index}
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
              ["CPU USAGE", "23%"],
              ["RAM USAGE", "45%"],
              ["NETWORK", "68%"],
              ["BATTERY", "92%"],
            ].map(([name, value]) => (
              <div className="status-row" key={name}>
                <p>{name}</p>
                <b>{value}</b>
                <div className="bar">
                  <span style={{ width: value }}></span>
                </div>
              </div>
            ))}

            <div className="safe-status">
              <span></span> ALL SYSTEMS OPERATIONAL
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

            <p>VOICE ENGINE: ACTIVE</p>

            <div className="equalizer">
              {Array.from({ length: 14 }).map((_, i) => (
                <span key={i}></span>
              ))}
            </div>
          </div>

          <div className="voice-panel glass-panel">
            <h3>CLICK TO SPEAK</h3>

            <div className="wave wave-left"></div>

            <div className="mic-btn">
              <FaMicrophone />
            </div>

            <div className="wave wave-right"></div>

            <h4>I'M LISTENING...</h4>
          </div>
        </section>

        <aside className="right-side">
          <div className="glass-panel console-panel">
            <div className="panel-title">
              <h3>AI CONSOLE</h3>
              <button className="clear-console-btn" onClick={clearConsole}>
                CLEAR
              </button>
            </div>

            <div className="console-screen">
              {messages.map((msg, index) => (
                <p key={index} className={index === 0 ? "version" : ""}>
                  {msg}
                </p>
              ))}
              <span className="cursor"></span>
              <div ref={consoleEndRef}></div>
            </div>

            <div className="console-input">
              <input
                placeholder="Type your message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
              />
              <button onClick={() => handleSend()}>
                <FaPaperPlane />
              </button>
            </div>
          </div>

          <div className="glass-panel quick-panel">
            <h3>QUICK COMMANDS</h3>

            {[
              [<FaGoogle />, "Open Google"],
              [<FaYoutube />, "Open YouTube"],
              [<FaGithub />, "Open GitHub"],
              [<FaDesktop />, "System Information"],
              [<FaCloudSun />, "Weather Update"],
            ].map(([icon, text]) => (
              <div
                className="command-item"
                key={text}
                onClick={() => handleSend(text)}
              >
                <span>{icon}</span>
                <p>{text}</p>
                <b>›</b>
              </div>
            ))}
          </div>
        </aside>
      </main>
    </div>
  );
}
