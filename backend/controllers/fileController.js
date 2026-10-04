import fs from "fs";
import path from "path";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

// ======================================================
// PDF TEXT EXTRACTION
// ======================================================

const extractPdfText = async (filePath) => {
  const buffer = fs.readFileSync(filePath);

  const pdf = await getDocument({
    data: new Uint8Array(buffer),
    disableWorker: true,
  }).promise;

  let text = "";

  for (
    let pageNo = 1;
    pageNo <= pdf.numPages;
    pageNo++
  ) {
    const page = await pdf.getPage(pageNo);

    const content =
      await page.getTextContent();

    const pageText = content.items
      .map((item) => item.str || "")
      .join(" ");

    text += pageText + "\n";
  }

  return text;
};

// ======================================================
// CLEAN TEXT
// ======================================================

const cleanText = (text = "") => {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

// ======================================================
// ANALYZE FILE
// ======================================================

export const analyzeFile = async (req, res) => {
  let filePath = null;

  try {
    // ==================================================
    // FILE CHECK
    // ==================================================

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "File required.",
      });
    }

    filePath = req.file.path;

    const originalName =
      req.file.originalname || "Uploaded file";

    const ext = path
      .extname(originalName)
      .toLowerCase();

    console.log(
      `📄 Analyzing file: ${originalName}`
    );

    console.log(
      `📁 File type: ${ext}`
    );

    // ==================================================
    // SUPPORTED FILE TYPES
    // ==================================================

    const supportedExtensions = [
      ".pdf",
      ".txt",
      ".md",
      ".csv",
      ".json",
    ];

    if (!supportedExtensions.includes(ext)) {
      return res.status(400).json({
        success: false,

        message:
          "Unsupported file type. Supported files: PDF, TXT, MD, CSV and JSON.",
      });
    }

    // ==================================================
    // EXTRACT TEXT
    // ==================================================

    let fileText = "";

    if (ext === ".pdf") {
      // ----------------------------------------------
      // PDF
      // ----------------------------------------------

      fileText =
        await extractPdfText(filePath);
    } else {
      // ----------------------------------------------
      // TEXT / MARKDOWN / CSV / JSON
      // ----------------------------------------------

      fileText = fs.readFileSync(
        filePath,
        "utf8"
      );
    }

    // ==================================================
    // CLEAN TEXT
    // ==================================================

    fileText = cleanText(fileText);

    // ==================================================
    // EMPTY FILE CHECK
    // ==================================================

    if (!fileText) {
      return res.status(400).json({
        success: false,

        message:
          "File text could not be extracted or the file is empty.",
      });
    }

    // ==================================================
    // LIMIT TEXT
    // ==================================================

    const limitedText =
      fileText.slice(0, 18000);

    // ==================================================
    // RESPONSE
    // ==================================================

    return res.status(200).json({
      success: true,

      filename: originalName,

      fileType: ext,

      text: limitedText,

      charactersExtracted:
        fileText.length,

      truncated:
        fileText.length > 18000,
    });
  } catch (error) {
    console.error(
      "❌ FILE ANALYZE ERROR:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        error.message ||
        "File analyze failed.",
    });
  } finally {
    // ==================================================
    // DELETE TEMPORARY UPLOAD
    // ==================================================

    if (
      filePath &&
      fs.existsSync(filePath)
    ) {
      try {
        fs.unlinkSync(filePath);

        console.log(
          "🗑️ Temporary file deleted."
        );
      } catch (deleteError) {
        console.error(
          "⚠️ Temporary file delete failed:",
          deleteError.message
        );
      }
    }
  }
};
// ======================================================
// PDF TEXT EXTRACTION
// ======================================================

const extractPdfText = async (filePath) => {
  const buffer = fs.readFileSync(filePath);

  const pdf = await getDocument({
    data: new Uint8Array(buffer),
    disableWorker: true,
  }).promise;

  let text = "";

  for (
    let pageNo = 1;
    pageNo <= pdf.numPages;
    pageNo++
  ) {
    const page = await pdf.getPage(pageNo);

    const content =
      await page.getTextContent();

    const pageText = content.items
      .map((item) => item.str || "")
      .join(" ");

    text += pageText + "\n";
  }

  return text;
};

// ======================================================
// CLEAN TEXT
// ======================================================

const cleanText = (text = "") => {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

// ======================================================
// ANALYZE FILE
// ======================================================

export const analyzeFile = async (req, res) => {
  let filePath = null;

  try {
    // ==================================================
    // FILE CHECK
    // ==================================================

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "File required.",
      });
    }

    filePath = req.file.path;

    const originalName =
      req.file.originalname || "Uploaded file";

    const ext = path
      .extname(originalName)
      .toLowerCase();

    console.log(
      `📄 Analyzing file: ${originalName}`
    );

    console.log(
      `📁 File type: ${ext}`
    );

    // ==================================================
    // SUPPORTED FILE TYPES
    // ==================================================

    const supportedExtensions = [
      ".pdf",
      ".txt",
      ".md",
      ".csv",
      ".json",
    ];

    if (!supportedExtensions.includes(ext)) {
      return res.status(400).json({
        success: false,

        message:
          "Unsupported file type. Supported files: PDF, TXT, MD, CSV and JSON.",
      });
    }

    // ==================================================
    // EXTRACT TEXT
    // ==================================================

    let fileText = "";

    if (ext === ".pdf") {
      // ----------------------------------------------
      // PDF
      // ----------------------------------------------

      fileText =
        await extractPdfText(filePath);
    } else {
      // ----------------------------------------------
      // TEXT / MARKDOWN / CSV / JSON
      // ----------------------------------------------

      fileText = fs.readFileSync(
        filePath,
        "utf8"
      );
    }

    // ==================================================
    // CLEAN TEXT
    // ==================================================

    fileText = cleanText(fileText);

    // ==================================================
    // EMPTY FILE CHECK
    // ==================================================

    if (!fileText) {
      return res.status(400).json({
        success: false,

        message:
          "File text could not be extracted or the file is empty.",
      });
    }

    // ==================================================
    // LIMIT TEXT
    // ==================================================

    const limitedText =
      fileText.slice(0, 18000);

    // ==================================================
    // RESPONSE
    // ==================================================

    return res.status(200).json({
      success: true,

      filename: originalName,

      fileType: ext,

      text: limitedText,

      charactersExtracted:
        fileText.length,

      truncated:
        fileText.length > 18000,
    });
  } catch (error) {
    console.error(
      "❌ FILE ANALYZE ERROR:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        error.message ||
        "File analyze failed.",
    });
  } finally {
    // ==================================================
    // DELETE TEMPORARY UPLOAD
    // ==================================================

    if (
      filePath &&
      fs.existsSync(filePath)
    ) {
      try {
        fs.unlinkSync(filePath);

        console.log(
          "🗑️ Temporary file deleted."
        );
      } catch (deleteError) {
        console.error(
          "⚠️ Temporary file delete failed:",
          deleteError.message
        );
      }
    }
  }
};