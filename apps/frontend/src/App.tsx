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
  <div className="mx-auto max-w-[980px] px-4 py-4 font-sans">
    {isAuthed() && (
      <header className="mb-6 flex items-center justify-between rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-sm font-semibold text-white">
            CR
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight text-zinc-900">Controlador</div>
            <div className="text-xs text-zinc-500">renda & tempo</div>
          </div>
        </div>

        <nav className="flex items-center gap-2">
          <Link
            to="/dashboard"
            className="rounded-xl px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 hover:text-zinc-900"
          >
            Dashboard
          </Link>
          <Link
            to="/works"
            className="rounded-xl px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 hover:text-zinc-900"
          >
            Trabalhos
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={logout}
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-900 shadow-sm transition hover:bg-zinc-50"
          >
            Sair
          </button>
        </div>
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
