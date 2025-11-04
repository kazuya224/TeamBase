import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import Header from "./Components/Header";
import Sidebar from "./Components/Sidebar";
import ScoreInput from "./Pages/ScoreInput";
import Records from "./Pages/Records";
import Stats from "./Pages/Stats";

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="App min-h-screen bg-gray-100">
      <Header title="野球スコア管理" />

      {/* メニューボタン（モバイル用） */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed top-4 left-4 z-30 lg:hidden bg-blue-600 text-white p-2 rounded"
      >
        ☰
      </button>

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* メインコンテンツ */}
      <main className="lg:ml-64 pt-16">
        <Routes>
          <Route path="/" element={<ScoreInput />} />
          <Route path="/score-input" element={<ScoreInput />} />
          <Route path="/records" element={<Records />} />
          <Route path="/stats" element={<Stats />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
