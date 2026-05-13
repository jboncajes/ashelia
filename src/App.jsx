// src/App.jsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Home from "./pages/Home";
import Streaks from "./pages/Streaks";
import Profile from "./pages/Profile";
import CreateCouple from "./pages/CreateCouple";
import JoinCouple from "./pages/JoinCouple";

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="streaks" element={<Streaks />} />
        <Route path="profile" element={<Profile />} />
        <Route path="create-couple" element={<CreateCouple />} />
        <Route path="join-couple" element={<JoinCouple />} />
      </Route>
    </Routes>
  );
}

export default App;