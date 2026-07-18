/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import "./Profile.css";

const defaultProfile = {
  name: "Karan Kabade",
  email: "karankabade7@gmail.com",
  mobile: "",
  education: "B.Sc Computer Science",
  college: "",
  skills: "React, Node.js, Express.js, MongoDB, PHP, MySQL",
  github: "",
  linkedin: "",
  portfolio: "",
  location: "",
  bio: "",
};

function Profile() {
  const [profile, setProfile] = useState(defaultProfile);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("nexus_profile") || "null");

    if (saved) {
      setProfile({
        ...defaultProfile,
        ...saved,
      });
    }
  }, []);

  const update = (key, value) => {
    setProfile((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const saveProfile = () => {
    localStorage.setItem("nexus_profile", JSON.stringify(profile));
    alert("Profile saved ✅");
  };

  const resetProfile = () => {
    setProfile(defaultProfile);
    localStorage.setItem("nexus_profile", JSON.stringify(defaultProfile));
    alert("Profile reset ✅");
  };

  return (
    <div className="profile-page">
      <h2>NEXUS PROFILE</h2>
      <p className="profile-subtitle">
        Manage your personal, education and developer details
      </p>

      <div className="profile-grid">
        <div className="profile-card">
          <label>Name</label>
          <input
            value={profile.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="Enter your name"
          />
        </div>

        <div className="profile-card">
          <label>Email</label>
          <input
            value={profile.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="Enter your email"
          />
        </div>

        <div className="profile-card">
          <label>Mobile</label>
          <input
            value={profile.mobile}
            onChange={(e) => update("mobile", e.target.value)}
            placeholder="Enter mobile number"
          />
        </div>

        <div className="profile-card">
          <label>Education</label>
          <input
            value={profile.education}
            onChange={(e) => update("education", e.target.value)}
            placeholder="Education"
          />
        </div>

        <div className="profile-card">
          <label>College</label>
          <input
            value={profile.college}
            onChange={(e) => update("college", e.target.value)}
            placeholder="College name"
          />
        </div>

        <div className="profile-card">
          <label>Location</label>
          <input
            value={profile.location}
            onChange={(e) => update("location", e.target.value)}
            placeholder="City / State"
          />
        </div>

        <div className="profile-card profile-card-full">
          <label>Skills</label>
          <textarea
            value={profile.skills}
            onChange={(e) => update("skills", e.target.value)}
            placeholder="HTML, CSS, JavaScript, React..."
          />
        </div>

        <div className="profile-card">
          <label>GitHub</label>
          <input
            value={profile.github}
            onChange={(e) => update("github", e.target.value)}
            placeholder="GitHub profile link"
          />
        </div>

        <div className="profile-card">
          <label>LinkedIn</label>
          <input
            value={profile.linkedin}
            onChange={(e) => update("linkedin", e.target.value)}
            placeholder="LinkedIn profile link"
          />
        </div>

        <div className="profile-card">
          <label>Portfolio</label>
          <input
            value={profile.portfolio}
            onChange={(e) => update("portfolio", e.target.value)}
            placeholder="Portfolio link"
          />
        </div>

        <div className="profile-card profile-card-full">
          <label>Bio</label>
          <textarea
            value={profile.bio}
            onChange={(e) => update("bio", e.target.value)}
            placeholder="Write short bio about yourself..."
          />
        </div>
      </div>

      <div className="profile-actions">
        <button type="button" onClick={saveProfile}>
          Save Profile
        </button>

        <button type="button" onClick={resetProfile}>
          Reset
        </button>
      </div>
    </div>
  );
}

export default Profile;