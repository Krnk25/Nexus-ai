export const getSavedVoiceSettings = () => {
  try {
    return JSON.parse(localStorage.getItem("nexus_settings") || "{}");
  } catch {
    return {};
  }
};

export const checkSpeechSupport = () => {
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
};

export const requestMicPermission = async () => {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error("getUserMedia not supported. Chrome/Edge use karo.");
  }

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

  // Permission check ke baad stream close
  stream.getTracks().forEach((track) => track.stop());

  return true;
};

export const createSpeechRecognition = (lang = "en-IN") => {
  const SpeechRecognition = checkSpeechSupport();

  if (!SpeechRecognition) {
    throw new Error("Speech Recognition not supported. Chrome/Edge use karo.");
  }

  const recognition = new SpeechRecognition();

  recognition.lang = lang;
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  return recognition;
};

export const speakText = ({ message, onStart, onEnd, onError }) => {
  if (!message) return;

  const settings = getSavedVoiceSettings();

  if (settings.autoSpeak === false) {
    if (onEnd) onEnd();
    return;
  }

  window.speechSynthesis.cancel();

  const cleanMessage = String(message).replace(
    /```[\s\S]*?```/g,
    "Code block generated."
  );

  const utterance = new SpeechSynthesisUtterance(cleanMessage);

  utterance.lang = settings.voiceLang || "en-IN";
  utterance.rate = Number(settings.voiceSpeed || 1);
  utterance.pitch = 1;
  utterance.volume = 1;

  utterance.onstart = () => {
    if (onStart) onStart();
  };

  utterance.onend = () => {
    if (onEnd) onEnd();
  };

  utterance.onerror = () => {
    if (onError) onError();
  };

  window.speechSynthesis.speak(utterance);
};