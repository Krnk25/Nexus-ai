import fs from "fs";
import path from "path";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

// ======================================================
// CLEAN TEXT
// ======================================================

const cleanText = (text = "") => {
  return String(text)
    .replace(/\r/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
};

// ======================================================
// PDF TEXT EXTRACTION
// ======================================================

const extractPdfText = async (filePath) => {
  try {
    const data = new Uint8Array(
      fs.readFileSync(filePath)
    );

    const pdf = await pdfjsLib.getDocument({
      data,
    }).promise;

    let text = "";

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      const page = await pdf.getPage(pageNumber);

      const content = await page.getTextContent();

      const pageText = content.items
        .map((item) => item.str || "")
        .join(" ");

      text += `\n\n--- Page ${pageNumber} ---\n\n`;
      text += pageText;
    }

    return cleanText(text);
  } catch (error) {
    console.error(
      "❌ PDF EXTRACTION ERROR:",
      error
    );

    throw new Error(
      "Failed to extract PDF text."
    );
  }
};

// ======================================================
// TEXT FILE EXTRACTION
// ======================================================

const extractTextFile = (filePath) => {
  try {
    return cleanText(
      fs.readFileSync(filePath, "utf8")
    );
  } catch (error) {
    console.error(
      "❌ TEXT FILE ERROR:",
      error
    );

    throw new Error(
      "Failed to read text file."
    );
  }
};

// ======================================================
// FILE ANALYSIS
// ======================================================

export const analyzeFile = async (req, res) => {
  let filePath = null;

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "File is required.",
      });
    }

    filePath = req.file.path;

    const originalName =
      req.file.originalname || "";

    const extension =
      path
        .extname(originalName)
        .toLowerCase();

    console.log("");
    console.log("===============================");
    console.log("📄 FILE ANALYSIS");
    console.log("===============================");
    console.log(
      "File:",
      originalName
    );
    console.log(
      "Type:",
      extension
    );
    console.log(
      "Path:",
      filePath
    );
    console.log("===============================");

    let text = "";

    // --------------------------------------------------
    // PDF
    // --------------------------------------------------

    if (extension === ".pdf") {
      text = await extractPdfText(
        filePath
      );
    }

    // --------------------------------------------------
    // TXT
    // --------------------------------------------------

    else if (
      extension === ".txt" ||
      extension === ".md"
    ) {
      text = extractTextFile(
        filePath
      );
    }

    // --------------------------------------------------
    // CSV
    // --------------------------------------------------

    else if (extension === ".csv") {
      text = extractTextFile(
        filePath
      );
    }

    // --------------------------------------------------
    // JSON
    // --------------------------------------------------

    else if (extension === ".json") {
      const raw =
        extractTextFile(filePath);

      try {
        const parsed =
          JSON.parse(raw);

        text = JSON.stringify(
          parsed,
          null,
          2
        );
      } catch {
        text = raw;
      }
    }

    // --------------------------------------------------
    // UNSUPPORTED
    // --------------------------------------------------

    else {
      return res.status(400).json({
        success: false,
        message:
          "Unsupported file type. Supported: PDF, TXT, MD, CSV, JSON.",
      });
    }

    // --------------------------------------------------
    // CHECK TEXT
    // --------------------------------------------------

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "Could not extract readable text from this file.",
      });
    }

    // --------------------------------------------------
    // LIMIT
    // --------------------------------------------------

    const limitedText =
      text.slice(0, 30000);

    console.log(
      "✅ Extracted characters:",
      limitedText.length
    );

    return res.status(200).json({
      success: true,
      file: {
        name: originalName,
        type: extension,
        size: req.file.size,
      },
      text: limitedText,
    });
  } catch (error) {
    console.error("");
    console.error(
      "❌ FILE CONTROLLER ERROR:"
    );
    console.error(error);

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "File analysis failed.",
    });
  } finally {
    // --------------------------------------------------
    // DELETE TEMP FILE
    // --------------------------------------------------

    if (filePath) {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);

          console.log(
            "🗑️ Temporary file deleted."
          );
        }
      } catch (deleteError) {
        console.error(
          "⚠️ FILE DELETE ERROR:",
          deleteError.message
        );
      }
    }
  }
};