import fs from "fs";
import path from "path";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

const extractPdfText = async (filePath) => {
  const buffer = fs.readFileSync(filePath);
  const pdf = await getDocument({
    data: new Uint8Array(buffer),
    disableWorker: true,
  }).promise;

  let text = "";

  for (let pageNo = 1; pageNo <= pdf.numPages; pageNo++) {
    const page = await pdf.getPage(pageNo);
    const content = await page.getTextContent();
    text += content.items.map((item) => item.str).join(" ") + "\n";
  }

  return text;
};

export const analyzeFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "File required",
      });
    }

    const ext = path.extname(req.file.originalname).toLowerCase();
    let fileText = "";

    if (ext === ".pdf") {
      fileText = await extractPdfText(req.file.path);
    } else {
      fileText = fs.readFileSync(req.file.path, "utf8");
    }

    if (!fileText.trim()) {
      return res.status(400).json({
        success: false,
        message: "File text could not be extracted",
      });
    }

    return res.json({
      success: true,
      filename: req.file.originalname,
      text: fileText.slice(0, 18000),
    });
  } catch (error) {
    console.log("FILE ANALYZE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "File analyze failed",
    });
  }
};