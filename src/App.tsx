import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import Header from "./Components/Header";
import Sidebar from "./Components/Sidebar";
import ScoreInput from "./Pages/ScoreInput";
import Records from "./Pages/Records";
import Stats from "./Pages/Stats";
import GameDetail from "./Pages/RecordsDetails"; // ★ 追加

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="App min-h-screen bg-gray-100 relative">
      {/* ★★★ モバイルメニューボタンはここ（最上位）に置く */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed top-4 left-4 z-40 lg:hidden bg-blue-600 text-white p-2 rounded"
      >
        ☰
      </button>

      <div className="fixed top-0 left-0 right-0 z-30">
        <Header title="野球スコア管理" />
      </div>

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* メインコンテンツ */}
      <main className="lg:ml-64">
        <Routes>
          <Route path="/" element={<Records />} />
          <Route path="/score-input" element={<ScoreInput />} />
          <Route path="/records" element={<Records />} />
          <Route path="/results/:gameId" element={<GameDetail />} />
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
