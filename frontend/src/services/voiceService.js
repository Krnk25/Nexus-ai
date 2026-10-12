// =====================================================
// GET SAVED VOICE SETTINGS
// =====================================================

export const getSavedVoiceSettings = () => {
  try {
    return JSON.parse(
      localStorage.getItem("nexus_settings") || "{}"
    );
  } catch {
    return {};
  }
};


// =====================================================
// SUPPORTED LANGUAGES
// =====================================================

export const supportedLanguages = {
  english: "en-IN",
  hindi: "hi-IN",
  marathi: "mr-IN",
};


// =====================================================
// SPEECH RECOGNITION SUPPORT
// =====================================================

export const checkSpeechSupport = () => {
  return (
    window.SpeechRecognition ||
    window.webkitSpeechRecognition ||
    null
  );
};


// =====================================================
// MICROPHONE PERMISSION
// =====================================================

export const requestMicPermission = async () => {
  if (
    !navigator.mediaDevices ||
    !navigator.mediaDevices.getUserMedia
  ) {
    throw new Error(
      "getUserMedia not supported. Chrome/Edge use karo."
    );
  }

  const stream =
    await navigator.mediaDevices.getUserMedia({
      audio: true,
    });

  stream.getTracks().forEach((track) => {
    track.stop();
  });

  return true;
};


// =====================================================
// CREATE SPEECH RECOGNITION
// =====================================================

export const createSpeechRecognition = (
  lang = "en-IN"
) => {
  const SpeechRecognition =
    checkSpeechSupport();

  if (!SpeechRecognition) {
    throw new Error(
      "Speech Recognition not supported. Chrome/Edge use karo."
    );
  }

  const recognition =
    new SpeechRecognition();

  recognition.lang = lang;
  recognition.continuous = true;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  return recognition;
};


// =====================================================
// GET FEMALE VOICE
// =====================================================

const getFemaleVoice = (language) => {
  const voices =
    window.speechSynthesis.getVoices();

  if (!voices.length) {
    return null;
  }

  const langCode =
    language
      .toLowerCase()
      .split("-")[0];

  // Same language + female
  const sameLanguageFemale =
    voices.find((voice) => {
      const voiceLang =
        voice.lang.toLowerCase();

      const sameLanguage =
        voiceLang.startsWith(langCode);

      const femaleName =
        /female|zira|samantha|google.*female|heera|kalpana|veena|swara|shirfra|raveena/i.test(
          voice.name
        );

      return sameLanguage && femaleName;
    });

  if (sameLanguageFemale) {
    return sameLanguageFemale;
  }

  // Any female voice
  const femaleVoice =
    voices.find((voice) =>
      /female|zira|samantha|google.*female|heera|kalpana|veena|swara|shirfra|raveena/i.test(
        voice.name
      )
    );

  if (femaleVoice) {
    return femaleVoice;
  }

  // Same language voice
  const sameLanguageVoice =
    voices.find((voice) =>
      voice.lang
        .toLowerCase()
        .startsWith(langCode)
    );

  return sameLanguageVoice || null;
};


// =====================================================
// SPEAK TEXT
// =====================================================

export const speakText = ({
  message,
  onStart,
  onEnd,
  onError,
}) => {
  if (!message) {
    return;
  }

  const settings =
    getSavedVoiceSettings();

  // Auto speak OFF
  if (settings.autoSpeak === false) {
    if (onEnd) {
      onEnd();
    }

    return;
  }

  // Stop previous speech
  window.speechSynthesis.cancel();

  // Remove code blocks
  const cleanMessage =
    String(message).replace(
      /```[\s\S]*?```/g,
      "Code block generated."
    );

  // Selected language
  const language =
    settings.voiceLang || "en-IN";

  // Create speech
  const utterance =
    new SpeechSynthesisUtterance(
      cleanMessage
    );

  utterance.lang = language;

  utterance.rate = Number(
    settings.voiceSpeed || 1
  );

  utterance.pitch = 1.15;
  utterance.volume = 1;

  // Female voice
  const femaleVoice =
    getFemaleVoice(language);

  if (femaleVoice) {
    utterance.voice = femaleVoice;

    console.log(
      "Selected voice:",
      femaleVoice.name,
      femaleVoice.lang
    );
  } else {
    console.log(
      "No specific female voice found. Browser default used."
    );
  }

  // Events
  utterance.onstart = () => {
    if (onStart) {
      onStart();
    }
  };

  utterance.onend = () => {
    if (onEnd) {
      onEnd();
    }
  };

  utterance.onerror = (error) => {
    console.error(
      "Speech Error:",
      error
    );

    if (onError) {
      onError();
    }
  };

  // Speak
  window.speechSynthesis.speak(
    utterance
  );
};