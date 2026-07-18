import { MemoryRouter, Routes, Route } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Chat from "./pages/Chat";
import Memory from "./pages/Memory";
import VoiceAssistant from "./components/VoiceAssistant/VoiceAssistant";

function App() {
  return (
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/memory" element={<Memory />} />
        <Route path="/voice" element={<VoiceAssistant />} />
      </Routes>
    </MemoryRouter>
  );
}

export default App;