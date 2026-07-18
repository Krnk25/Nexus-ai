import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

const savedSettings = JSON.parse(localStorage.getItem("nexus_settings") || "{}");
document.body.setAttribute("data-theme", savedSettings.theme || "hacker");

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);