export const voiceStatus = (req, res) => {
  res.json({
    success: true,
    message:
      "Voice route working. Browser handles microphone using Web Speech API.",
  });
};