import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ApiError } from "../api/client";
import { register, login } from "../api/auth";

export default function Register() {
  const nav = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return name.trim().length >= 2 && email.trim().length > 3 && password.length >= 6;
  }, [name, email, password]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    try {
      // 1) cria o usuário
      await register({ name: name.trim(), email: email.trim(), password });

      // 2) auto-login (melhor UX pro MVP)
      const res = await login({ email: email.trim(), password });
      localStorage.setItem("access_token", res.access_token);

      nav("/dashboard");
    } catch (e: any) {
      if (e instanceof ApiError) setErr(String(e.detail));
      else setErr("Erro ao cadastrar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-40px)] px-4 py-10">
      <div className="mx-auto w-full max-w-md">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Criar conta</h1>
            <p className="text-sm text-zinc-600">Cadastro rápido para começar a usar o MVP.</p>
          </div>

          {err ? (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {err}
            </div>
          ) : null}

          <form onSubmit={onSubmit} className="mt-5 grid gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700">Nome</label>
              <input
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 shadow-sm outline-none focus:border-zinc-300 focus:ring-2 focus:ring-zinc-200"
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
              <div className="text-xs text-zinc-500">Mínimo 2 caracteres.</div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700">Email</label>
              <input
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 shadow-sm outline-none focus:border-zinc-300 focus:ring-2 focus:ring-zinc-200"
                placeholder="seuemail@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700">Senha</label>
              <input
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 shadow-sm outline-none focus:border-zinc-300 focus:ring-2 focus:ring-zinc-200"
                placeholder="••••••••"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
              <div className="text-xs text-zinc-500">Mínimo 6 caracteres.</div>
            </div>

            <button
              disabled={!canSubmit || loading}
              className="mt-2 inline-flex items-center justify-center rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Criando..." : "Criar conta"}
            </button>
          </form>

          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-zinc-600">Já tem conta?</span>
            <Link
              to="/login"
              className="rounded-lg px-2 py-1 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
            >
              Entrar
            </Link>
          </div>
        </div>

        <div className="mt-4 text-center text-xs text-zinc-500">
          Controlador de Renda • Minimal • Pessoal
        </div>
      </div>
    </div>
  );
}
