/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { getMemories, saveMemory } from "../services/memoryService";



function Memory() {
  const [form, setForm] = useState({
    name: "",
    education: "",
    location: "",
    village: "",
    fatherName: "",
    motherName: "",
    brotherName: "",
    skills: "",
  });

  const [memories, setMemories] = useState([]);

  const loadMemories = async () => {
    const res = await getMemories();
    setMemories(res.data.memories || []);
  };

  useEffect(() => {
    loadMemories();
  }, []);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = async () => {
    for (const key in form) {
      if (form[key].trim()) {
        await saveMemory(key, form[key]);
      }
    }

    alert("Memory saved ✅");
    loadMemories();
  };

  return (
    <div style={{ padding: "30px", color: "#fff", background: "#000" }}>
      <h1>NEXUS AI Memory</h1>

      {Object.keys(form).map((key) => (
        <input
          key={key}
          name={key}
          placeholder={key}
          value={form[key]}
          onChange={handleChange}
          style={{
            display: "block",
            margin: "10px 0",
            padding: "12px",
            width: "300px",
          }}
        />
      ))}

      <button onClick={handleSave}>Save Memory</button>

      <hr />

      {memories.map((item) => (
        <p key={item._id}>
          <b>{item.key}</b>: {item.value}
        </p>
      ))}
    </div>
  );
}

export default Memory;