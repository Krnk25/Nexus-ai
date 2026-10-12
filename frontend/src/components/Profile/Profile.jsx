
import { useEffect, useState } from "react";
import "./Profile.css";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://nexus-ai-backend-1bpy.onrender.com";

const defaultProfile = {
  name: "Karan Kabade",
  email: "karankabade7@gmail.com",
  mobile: "8265044456",
  education: "B.Sc Computer Science",
  college: "swa. sawarkar collage beed",
  skills: "React, Node.js, Express.js, MongoDB, PHP, MySQL",
  github: "https://github.com/Krnk25",
  linkedin: "www.linkedin.com/in/karan-kabade",
  portfolio: "",
  location: "Beed",
  bio: "",
  village: "Kumbharwadi",
  fatherName: "Asaram",
  motherName: "Chaya",
  brotherName: "Arjun, Hanuman",
};

// Read cached profile for Dashboard and Voice Assistant
export const getUserProfile = () => {
  try {
    const saved = localStorage.getItem("nexus_profile");

    if (!saved) {
      return { ...defaultProfile };
    }

    const parsed = JSON.parse(saved);

    return {
      ...defaultProfile,
      ...(parsed && typeof parsed === "object" ? parsed : {}),
    };
  } catch (error) {
    console.error("Profile read error:", error);
    return { ...defaultProfile };
  }
};

function Profile() {
  const [profile, setProfile] = useState(defaultProfile);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load profile from MongoDB
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/profile`);
        const result = await response.json();

        if (response.ok && result.success && result.profile) {
          const loadedProfile = {
            ...defaultProfile,
            ...result.profile,
          };

          setProfile(loadedProfile);

          localStorage.setItem(
            "nexus_profile",
            JSON.stringify(loadedProfile)
          );

          setMessage("Profile loaded from MongoDB.");
        } else if (response.status === 404) {
          // No profile in DB yet; use cached/default values
          const cachedProfile = getUserProfile();
          setProfile(cachedProfile);
          setMessage("No database profile found. Save to create one.");
        } else {
          throw new Error(result.message || "Unable to load profile");
        }
      } catch (error) {
        console.error("Profile fetch error:", error);

        // Fallback to cached data if backend is unavailable
        setProfile(getUserProfile());
        setMessage("Backend unavailable. Showing cached profile.");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const update = (key, value) => {
    setProfile((previous) => ({
      ...previous,
      [key]: value,
    }));

    setMessage("");
  };

  // Save profile to MongoDB
  const saveProfile = async () => {
    setSaving(true);
    setMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profile),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Profile save failed");
      }

      const savedProfile = {
        ...defaultProfile,
        ...result.profile,
      };

      setProfile(savedProfile);

      localStorage.setItem(
        "nexus_profile",
        JSON.stringify(savedProfile)
      );

      window.dispatchEvent(new Event("nexus-profile-updated"));

      setMessage("Profile saved to MongoDB successfully!");
    } catch (error) {
      console.error("Profile save error:", error);
      setMessage(
        "Save failed. Check backend URL, API route and MongoDB connection."
      );
    } finally {
      setSaving(false);
    }
  };

  // Reset profile to defaults and save those defaults to MongoDB
  const resetProfile = async () => {
    const confirmed = window.confirm(
      "Reset all profile fields to their default values?"
    );

    if (!confirmed) return;

    setSaving(true);
    setMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(defaultProfile),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Profile reset failed");
      }

      const resetData = {
        ...defaultProfile,
        ...result.profile,
      };

      setProfile(resetData);

      localStorage.setItem(
        "nexus_profile",
        JSON.stringify(resetData)
      );

      window.dispatchEvent(new Event("nexus-profile-updated"));

      setMessage("Profile reset and saved to MongoDB.");
    } catch (error) {
      console.error("Profile reset error:", error);
      setMessage("Reset failed. MongoDB profile was not updated.");
    } finally {
      setSaving(false);
    }
  };

  const renderInput = (key, label, placeholder = label, type = "text") => (
    <div className="profile-card" key={key}>
      <label htmlFor={`profile-${key}`}>{label}</label>
      <input
        id={`profile-${key}`}
        type={type}
        value={profile[key] ?? ""}
        onChange={(event) => update(key, event.target.value)}
        placeholder={placeholder}
      />
    </div>
  );

  const renderTextarea = (key, label, placeholder = label) => (
    <div className="profile-card profile-card-full" key={key}>
      <label htmlFor={`profile-${key}`}>{label}</label>
      <textarea
        id={`profile-${key}`}
        value={profile[key] ?? ""}
        onChange={(event) => update(key, event.target.value)}
        placeholder={placeholder}
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
            {renderInput("email", "Email", "Enter your email", "email")}
            {renderInput("mobile", "Mobile", "Enter mobile number", "tel")}
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
              "HTML, CSS, JavaScript, React..."
            )}

            {renderInput("github", "GitHub", "GitHub profile URL")}
            {renderInput("linkedin", "LinkedIn", "LinkedIn profile URL")}
            {renderInput("portfolio", "Portfolio", "Portfolio URL")}

            {renderTextarea(
              "bio",
              "Bio",
              "Write a short bio about yourself..."
            )}
          </div>

          {message && (
            <p role="status" className="profile-message">
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
              Reset Profile
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default Profile;
