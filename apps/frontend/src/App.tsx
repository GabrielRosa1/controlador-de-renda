import React from "react";
import { Navigate, Route, Routes, Link, useNavigate } from "react-router-dom";
import Login from "./pages/Login";
import Works from "./pages/Works";
import WorkDetail from "./pages/WorkDetail";
import Dashboard from "./pages/Dashboard";

function isAuthed() {
  return Boolean(localStorage.getItem("access_token"));
}

function Protected({ children }: { children: React.ReactNode }) {
  if (!isAuthed()) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const nav = useNavigate();

  function logout() {
    localStorage.removeItem("access_token");
    nav("/login");
  }

  return (
    <div style={{ fontFamily: "system-ui", maxWidth: 980, margin: "0 auto", padding: 16 }}>
      {isAuthed() && (
        <header style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/works">Trabalhos</Link>
          <div style={{ flex: 1 }} />
          <button onClick={logout}>Sair</button>
        </header>
      )}

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
        <Route path="/works" element={<Protected><Works /></Protected>} />
        <Route path="/works/:id" element={<Protected><WorkDetail /></Protected>} />
        <Route path="*" element={<Navigate to={isAuthed() ? "/dashboard" : "/login"} replace />} />
      </Routes>
    </div>
  );
}
