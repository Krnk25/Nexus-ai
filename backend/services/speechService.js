
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

let recognition = null;

export function isSpeechSupported() {
  return typeof window !== "undefined" && !!SpeechRecognition;
}

export function startSpeechRecognition({
  onResult,
  onError,
  onEnd,
  language = "en-IN",
} = {}) {
  if (!isSpeechSupported()) {
    onError?.({
      error: "not-supported",
      message: "Speech recognition is not supported in this environment.",
    });
    return null;
  }

  if (recognition) {
    try {
      recognition.abort();
    } catch (error) {
      // Recognition may already be stopped.
    }
  }

  recognition = new SpeechRecognition();
  recognition.lang = language;
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event) => {
    const transcript = event.results?.[0]?.[0]?.transcript;
    if (transcript) onResult?.(transcript);
  };

  recognition.onerror = (event) => {
    console.error("Speech recognition error:", event.error);
    onError?.({
      error: event.error,
      message: event.message || "Speech recognition failed.",
    });
  };

  recognition.onend = () => {
    onEnd?.();
    recognition = null;
  };

  try {
    recognition.start();
  } catch (error) {
    onError?.({
      error: "start-failed",
      message: error.message,
    });
  }

  return recognition;
}

export function stopSpeechRecognition() {
  if (recognition) {
    try {
      recognition.stop();
    } catch (error) {
      console.error("Could not stop speech recognition:", error);
    }
  }
}
