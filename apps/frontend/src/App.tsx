import React, { useEffect, useState } from "react";
import { Navigate, Route, Routes, Link, useNavigate } from "react-router-dom";
import Login from "./pages/Login";
import Works from "./pages/Works";
import WorkDetail from "./pages/WorkDetail";
import Dashboard from "./pages/Dashboard";
import Register from "./pages/Register";

function isAuthed() {
  return Boolean(localStorage.getItem("access_token"));
}

function Protected({ children }: { children: React.ReactNode }) {
  if (!isAuthed()) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const nav = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme) return storedTheme === "dark";
    if (typeof window === "undefined") return false;
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  function logout() {
    localStorage.removeItem("access_token");
    nav("/login");
  }

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-4 font-sans text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="mx-auto max-w-[980px]">
        {isAuthed() && (
          <header className="mb-6 flex items-center justify-between rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900">
                CR
              </div>
              <div className="leading-tight">
                <div className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Controlador</div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">renda & tempo</div>
              </div>
            </div>

            <nav className="flex items-center gap-2">
              <Link
                to="/dashboard"
                className="rounded-xl px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              >
                Dashboard
              </Link>
              <Link
                to="/works"
                className="rounded-xl px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              >
                Trabalhos
              </Link>
            </nav>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Tema</span>
                <button
                  type="button"
                  onClick={() => setIsDarkMode((prev) => !prev)}
                  aria-pressed={isDarkMode}
                  aria-label={isDarkMode ? "Ativar modo claro" : "Ativar modo escuro"}
                  className="relative inline-flex h-6 w-11 items-center rounded-full bg-zinc-200 transition hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600"
                >
                  <span
                    className={`inline-flex h-5 w-5 transform items-center justify-center rounded-full bg-white text-[10px] font-semibold text-zinc-700 shadow transition ${isDarkMode ? "translate-x-5" : "translate-x-1"}`}
                  >
                    {isDarkMode ? "🌙" : "☀️"}
                  </span>
                </button>
              </div>
              <button
                onClick={logout}
                className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-900 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
              >
                Sair
              </button>
            </div>
          </header>
        )}

        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
          <Route path="/works" element={<Protected><Works /></Protected>} />
          <Route path="/works/:id" element={<Protected><WorkDetail /></Protected>} />
          <Route path="*" element={<Navigate to={isAuthed() ? "/dashboard" : "/login"} replace />} />
        </Routes>
      </div>
    </div>
  );
}
