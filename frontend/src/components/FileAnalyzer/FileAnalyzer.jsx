import { useState } from "react";
import { jsPDF } from "jspdf";
import API from "../../services/api";
import { saveActivity } from "../../services/activityService";
import "./FileAnalyzer.css";

function FileAnalyzer() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const logActivity = async (type, title, description = "") => {
    try {
      await saveActivity(type, title, description);
    } catch (error) {
      console.log("Activity log failed:", error);
    }
  };

  const handleAnalyze = async () => {
    if (!file) {
      alert("Please select a file");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      setResult("");

      const uploadRes = await API.post("/file/analyze", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const fileText = uploadRes.data.text || "";

      const isResume =
        file.name.toLowerCase().includes("resume") ||
        file.name.toLowerCase().includes("cv") ||
        fileText.toLowerCase().includes("education") ||
        fileText.toLowerCase().includes("technical skills") ||
        fileText.toLowerCase().includes("projects");

      await logActivity(
        "File",
        isResume ? "Resume Uploaded For ATS" : "File Uploaded For Analysis",
        file.name
      );

      const aiPrompt = `
You are NEXUS AI Resume & File Analyzer.
ATS Score Rules:
- If resume contains name, contact, summary, skills, education, projects: minimum score must be 70.
- Do not give below 70 unless contact, skills, education, and projects are missing.
- For fresher full stack resume with React, Node, Express, MongoDB, PHP, MySQL projects, score should be 75-85.
- Penalize only real issues: grammar, formatting, missing experience, missing project links, missing deployment links, weak measurable achievements.
Important:
This resume text is successfully extracted. Do not say corrupted, unreadable, or extraction failed.

${
  isResume
    ? `
This file is a RESUME/CV.

Return exactly in this format:

NEXUS AI RESUME ATS REPORT

ATS Score: xx/100

Resume Summary:
Write 3-4 lines.

Strong Points:
- point
- point

Missing / Weak Points:
- point
- point

Skills Found:
- point

Skills Missing:
- point

Project Improvements:
- point

Formatting Issues:
- point

What To Add:
- point

Job Readiness Score: xx/100

Final Recommendation:
Write short final advice.
`
    : `
Return exactly in this format:

NEXUS AI FILE ANALYSIS REPORT

File Summary:
Errors / Bugs:
Improvements:
Suggestions:
Score out of 10:
`
}

File Name: ${uploadRes.data.filename}

File Content:
${fileText}
`;

      const savedSettings = JSON.parse(
        localStorage.getItem("nexus_settings") || "{}"
      );

      const aiRes = await API.post("/ai/file-analyze", {
        message: aiPrompt,
        settings: savedSettings,
      });

      const finalResult = aiRes.data.reply || "AI analysis failed.";
      setResult(finalResult);

      await logActivity(
        "File",
        isResume ? "ATS Resume Report Generated" : "File Analysis Completed",
        file.name
      );

      localStorage.setItem(
        "nexus_files_count",
        String(Number(localStorage.getItem("nexus_files_count") || 0) + 1)
      );

      if (isResume) {
        localStorage.setItem(
          "nexus_ats_count",
          String(Number(localStorage.getItem("nexus_ats_count") || 0) + 1)
        );
      }
    } catch (error) {
      console.log("FILE ANALYZE ERROR:", error);

      const errorMessage =
        error.response?.data?.message || error.message || "File analyze failed";

      setResult(errorMessage);

      await logActivity("File", "File Analysis Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const copyResult = async () => {
    await navigator.clipboard.writeText(result);
    await logActivity("File", "Analysis Result Copied", file?.name || "");
    alert("Result copied ✅");
  };

  const downloadPDF = async () => {
    const doc = new jsPDF();
    const title = "NEXUS AI FILE ANALYSIS REPORT";
    const lines = doc.splitTextToSize(result, 180);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(title, 10, 15);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    let y = 28;

    lines.forEach((line) => {
      if (y > 280) {
        doc.addPage();
        y = 15;
      }
      doc.text(line, 10, y);
      y += 6;
    });

    const name = file?.name?.replace(/\.[^/.]+$/, "") || "nexus-report";
    doc.save(`${name}-analysis-report.pdf`);

    await logActivity("File", "PDF Report Downloaded", file?.name || name);
  };

  return (
    <div className="file-analyzer">
      <h2>FILE ANALYZER</h2>
      <p>Upload PDF resume, text, or code file</p>

      <input
        type="file"
        accept=".pdf,.txt,.js,.jsx,.html,.css,.json,.md"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />

      {file && <p className="selected-file">Selected: {file.name}</p>}

      <button onClick={handleAnalyze} disabled={loading}>
        {loading ? "Analyzing..." : "Analyze File"}
      </button>

      {result && (
        <>
          <div className="file-actions">
            <button onClick={copyResult}>Copy Result</button>
            <button onClick={downloadPDF}>Download PDF Report</button>
          </div>

          <pre className="file-result">{result}</pre>
        </>
      )}
    </div>
  );
}

export default FileAnalyzer;