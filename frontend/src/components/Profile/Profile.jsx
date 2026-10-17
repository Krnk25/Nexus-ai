
import { useEffect, useState } from "react";
import "./Profile.css";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  "https://nexus-ai-backend-1bpy.onrender.com"
)
  .replace(/\/+$/, "")
  .replace(/\/api$/, "");

const PROFILE_API_URL = `${API_BASE_URL}/api/profile`;

const defaultProfile = {
  name: "Karan Kabade",
  email: "karankabade7@gmail.com",
  mobile: "8265044456",
  education: "B.Sc Computer Science",
  college: "swa. sawarkar collage beed",
  skills: "React, Node.js, Express.js, MongoDB, PHP, MySQL",
  github: "https://github.com/Krnk25",
  linkedin: "https://www.linkedin.com/in/karan-kabade/",
  portfolio: "",
  location: "Beed",
  bio: "",
  village: "Kumbharwadi",
  fatherName: "Asaram",
  motherName: "Chaya",
  brotherName: "Arjun, Hanuman",
};

const PROFILE_STORAGE_KEY = "nexus_profile";

// Safely merge profile data
const normalizeProfile = (data = {}) => ({
  ...defaultProfile,
  ...(data && typeof data === "object" && !Array.isArray(data)
    ? data
    : {}),
});

// Read cached profile for Dashboard and Voice Assistant
export const getUserProfile = () => {
  try {
    const saved = localStorage.getItem(PROFILE_STORAGE_KEY);

    if (!saved) {
      return { ...defaultProfile };
    }

    return normalizeProfile(JSON.parse(saved));
  } catch (error) {
    console.error("Profile localStorage read error:", error);
    return { ...defaultProfile };
  }
};

// Save profile locally and notify other components
const cacheProfile = (profile) => {
  localStorage.setItem(
    PROFILE_STORAGE_KEY,
    JSON.stringify(normalizeProfile(profile)),
  );

  window.dispatchEvent(new Event("nexus-profile-updated"));
};

// Read API response safely
const readResponse = async (response) => {
  const text = await response.text();

  let result = {};

  try {
    result = text ? JSON.parse(text) : {};
  } catch {
    result = { message: text };
  }

  if (!response.ok) {
    throw new Error(
      result.message ||
        result.error ||
        `Request failed with status ${response.status}`,
    );
  }

  return result;
};

function Profile() {
  const [profile, setProfile] = useState(() => getUserProfile());
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load profile from backend
  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      try {
        const response = await fetch(PROFILE_API_URL, {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        });

        const result = await readResponse(response);

        if (cancelled) return;

        // Supports APIs returning { success, profile }
        if (result.success && result.profile) {
          const loadedProfile = normalizeProfile(result.profile);

          setProfile(loadedProfile);
          cacheProfile(loadedProfile);

          setMessage("Profile loaded successfully.");
          setMessageType("success");
        } else {
          // Keep cached data when API has no saved profile
          setProfile(getUserProfile());
          setMessage(
            result.message || "Profile not found. Save to create your profile.",
          );
          setMessageType("info");
        }
      } catch (error) {
        if (cancelled) return;

        console.error("Profile fetch error:", error);

        setProfile(getUserProfile());
        setMessage(
          `Could not load profile from backend: ${error.message}. Showing cached data.`,
        );
        setMessageType("error");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  // Update input fields
  const update = (key, value) => {
    setProfile((previous) => ({
      ...previous,
      [key]: value,
    }));

    setMessage("");
    setMessageType("");
  };

  // Save profile to backend
  const saveProfile = async () => {
    setSaving(true);
    setMessage("");
    setMessageType("");

    try {
      const response = await fetch(PROFILE_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(profile),
      });

      const result = await readResponse(response);

      if (result.success === false) {
        throw new Error(result.message || "Profile save failed.");
      }

      // Supports APIs returning { success, profile }
      const savedProfile = normalizeProfile(result.profile || profile);

      setProfile(savedProfile);
      cacheProfile(savedProfile);

      setMessage("Profile saved successfully to MongoDB!");
      setMessageType("success");
    } catch (error) {
      console.error("Profile save error:", error);

      setMessage(
        `Profile save failed: ${error.message}. Check the backend route and MongoDB connection.`,
      );
      setMessageType("error");
    } finally {
      setSaving(false);
    }
  };

  // Reset profile and save defaults to backend
  const resetProfile = async () => {
    const confirmed = window.confirm(
      "Reset all profile fields to their default values?",
    );

    if (!confirmed) return;

    setSaving(true);
    setMessage("");
    setMessageType("");

    try {
      const response = await fetch(PROFILE_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(defaultProfile),
      });

      const result = await readResponse(response);

      if (result.success === false) {
        throw new Error(result.message || "Profile reset failed.");
      }

      const resetData = normalizeProfile(result.profile || defaultProfile);

      setProfile(resetData);
      cacheProfile(resetData);

      setMessage("Default profile saved successfully.");
      setMessageType("success");
    } catch (error) {
      console.error("Profile reset error:", error);

      setMessage(`Profile reset failed: ${error.message}`);
      setMessageType("error");
    } finally {
      setSaving(false);
    }
  };

  // Render a text input
  const renderInput = (
    key,
    label,
    placeholder = label,
    type = "text",
  ) => (
    <div className="profile-card" key={key}>
      <label htmlFor={`profile-${key}`}>{label}</label>

      <input
        id={`profile-${key}`}
        name={key}
        type={type}
        value={profile[key] ?? ""}
        onChange={(event) => update(key, event.target.value)}
        placeholder={placeholder}
        disabled={saving}
      />
    </div>
  );

  // Render a textarea
  const renderTextarea = (key, label, placeholder = label) => (
    <div className="profile-card profile-card-full" key={key}>
      <label htmlFor={`profile-${key}`}>{label}</label>

      <textarea
        id={`profile-${key}`}
        name={key}
        value={profile[key] ?? ""}
        onChange={(event) => update(key, event.target.value)}
        placeholder={placeholder}
        disabled={saving}
        rows={4}
      />
    </div>
  );

  return (
    <div className="profile-page">
      <h2>NEXUS PROFILE</h2>

      <p className="profile-subtitle">
        Manage your personal, family, education and developer details.
      </p>

      {loading ? (
        <p role="status">Loading profile...</p>
      ) : (
        <>
          <div className="profile-grid">
            {renderInput("name", "Full Name", "Enter your name")}

            {renderInput(
              "email",
              "Email",
              "Enter your email",
              "email",
            )}

            {renderInput(
              "mobile",
              "Mobile",
              "Enter mobile number",
              "tel",
            )}

            {renderInput("education", "Education")}
            {renderInput("college", "College")}
            {renderInput("location", "Location")}
            {renderInput("village", "Village")}
            {renderInput("fatherName", "Father's Name")}
            {renderInput("motherName", "Mother's Name")}
            {renderInput("brotherName", "Brother(s) Name")}

            {renderTextarea(
              "skills",
              "Skills",
              "React, Node.js, MongoDB...",
            )}

            {renderInput("github", "GitHub", "GitHub profile URL")}
            {renderInput(
              "linkedin",
              "LinkedIn",
              "LinkedIn profile URL",
            )}

            {renderInput(
              "portfolio",
              "Portfolio",
              "Portfolio URL",
            )}

            {renderTextarea(
              "bio",
              "Bio",
              "Write a short bio about yourself...",
            )}
          </div>

          {message && (
            <p
              role="status"
              className={`profile-message ${messageType}`}
            >
              {message}
            </p>
          )}

          <div className="profile-actions">
            <button
              type="button"
              onClick={saveProfile}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Profile"}
            </button>

            <button
              type="button"
              onClick={resetProfile}
              disabled={saving}
            >
              {saving ? "Please wait..." : "Reset Profile"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default Profile;
