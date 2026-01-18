import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError } from "../api/client";
import { login } from "../api/auth";

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const res = await login({ email, password });
      localStorage.setItem("access_token", res.access_token);
      nav("/dashboard");
    } catch (e: any) {
      if (e instanceof ApiError) setErr(String(e.detail));
      else setErr("Erro ao logar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "60px auto" }}>
      <h2>Entrar</h2>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
        <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input placeholder="Senha" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button disabled={loading}>{loading ? "Entrando..." : "Entrar"}</button>
        {err && <div style={{ color: "crimson" }}>{err}</div>}
      </form>
      <p style={{ opacity: 0.7, marginTop: 12 }}>
        (MVP) Se você ainda não tem conta, cria via /auth/register no Swagger por enquanto.
      </p>
    </div>
  );
}
