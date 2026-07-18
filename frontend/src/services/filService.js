import API from "./api";

export const analyzeUploadedFile = async (formData) => {
  return API.post("/file/analyze", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};