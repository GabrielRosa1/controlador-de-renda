import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { startTimer, stopTimer } from "../api/timer";
import { listWorks } from "../api/works";
import { getEntries, getTimerState } from "../api/entries";
import type { TimeEntryItem, TimerStateResponse } from "../api/entries";
import { closeWork } from "../api/workClose";
import { formatHMS, formatMoneyBRL } from "../lib/format";

function formatDateTime(dt: string) {
  const d = new Date(dt);
  return d.toLocaleString("pt-BR");
}

function badgeClass(running: boolean) {
  return running
    ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
    : "bg-zinc-50 text-zinc-700 ring-1 ring-zinc-200";
}

function finishedLabel(state: { is_finished: boolean; blocked_reason?: string | null; end_date?: string | null }) {
  if (!state.is_finished) return null;
  if (state.blocked_reason === "EXPIRED") return state.end_date ? `Prazo final: ${state.end_date}` : "Prazo final atingido";
  if (state.blocked_reason === "CLOSED") return "Encerrado manualmente";
  return "Finalizado";
}

export default function WorkDetail() {
  const { id } = useParams();
  const workId = id!;

  const [title, setTitle] = useState("Trabalho");
  const [rateCents, setRateCents] = useState(0);

  const [running, setRunning] = useState(false);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [totalClosedSeconds, setTotalClosedSeconds] = useState(0);

  const [entries, setEntries] = useState<TimeEntryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [tick, setTick] = useState(0);
  const intervalRef = useRef<number | null>(null);

  const [timerState, setTimerState] = useState<TimerStateResponse | null>(null);

  async function refreshAll() {
    setErr(null);
    setLoading(true);
    try {
      const works = await listWorks();
      const w = works.items.find((x) => x.id === workId);
      if (w) {
        setTitle(w.title);
        setRateCents(w.hourly_rate_cents);
      }

      const state = await getTimerState(workId);
      setTimerState(state);
      setRunning(state.running);
      setStartedAt(state.started_at ?? null);
      setTotalClosedSeconds(state.total_closed_seconds);

      const e = await getEntries(workId, 200);
      setEntries(e.items);
    } catch (e: any) {
      setErr("Falha ao carregar work/timer");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workId]);

  useEffect(() => {
    if (running) {
      intervalRef.current = window.setInterval(() => setTick((t) => t + 1), 1000);
    } else if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [running]);

  const currentSessionSeconds = useMemo(() => {
    if (!running || !startedAt) return 0;
    const s = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
    return Math.max(0, s);
  }, [running, startedAt, tick]);

  const totalSeconds = totalClosedSeconds + currentSessionSeconds;

  const totalEarnedCents = useMemo(() => {
    return Math.round(rateCents * (totalSeconds / 3600));
  }, [rateCents, totalSeconds]);

  const currentSessionEarnedCents = useMemo(() => {
    return Math.round(rateCents * (currentSessionSeconds / 3600));
  }, [rateCents, currentSessionSeconds]);

  const isFinished = Boolean(timerState?.is_finished);
  const finishHint = timerState ? finishedLabel(timerState) : null;

  async function onStart() {
    try {
      await startTimer(workId);
    } catch (e: any) {
      alert(typeof e?.detail === "string" ? e.detail : "Esse trabalho já terminou");
    }
    await refreshAll();
  }

  async function onStop() {
    await stopTimer(workId);
    await refreshAll();
  }

  async function onCloseWork() {
    const reason = (prompt("Motivo (opcional):") ?? "").trim() || null;
    try {
      await closeWork(workId, reason);
    } finally {
      await refreshAll();
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900">{title}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${badgeClass(running)}`}>
              {running ? "Rodando" : "Parado"}
            </span>
            {isFinished ? (
              <span className="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 ring-1 ring-rose-200">
                Finalizado
              </span>
            ) : null}
          </div>
        </div>

        <div className="text-sm text-zinc-600">
          <span className="font-medium text-zinc-900">{formatMoneyBRL(rateCents)}</span>
          <span className="text-zinc-500">/h</span>
        </div>
      </div>

      {/* Alerts */}
      {loading ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600">Carregando…</div>
      ) : null}

      {err ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{err}</div>
      ) : null}

      {isFinished ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
          <div className="text-sm font-semibold text-rose-800">Esse trabalho já terminou</div>
          {finishHint ? <div className="mt-1 text-sm text-rose-700">{finishHint}</div> : null}
        </div>
      ) : null}

      {/* Timer Card */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4">
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">Cronômetro do trabalho</div>
            <div className="mt-1 font-mono text-4xl font-semibold tracking-tight text-zinc-900">
              {formatHMS(totalSeconds)}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="text-xs font-medium text-zinc-500">Total a receber</div>
              <div className="mt-1 text-lg font-semibold text-zinc-900">{formatMoneyBRL(totalEarnedCents)}</div>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="text-xs font-medium text-zinc-500">Sessão atual</div>
              <div className="mt-1 text-lg font-semibold text-zinc-900">
                {formatHMS(currentSessionSeconds)}
              </div>
              <div className="mt-0.5 text-sm text-zinc-600">{formatMoneyBRL(currentSessionEarnedCents)}</div>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="text-xs font-medium text-zinc-500">Início</div>
              <div className="mt-1 text-sm font-medium text-zinc-900">
                {running && startedAt ? formatDateTime(startedAt) : "—"}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {!running ? (
                <button
                  onClick={onStart}
                  disabled={isFinished}
                  className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Start
                </button>
              ) : (
                <button
                  onClick={onStop}
                  className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800"
                >
                  Stop
                </button>
              )}

              <button
                onClick={refreshAll}
                className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-900 shadow-sm transition hover:bg-zinc-50"
              >
                Atualizar
              </button>

              <button
                onClick={onCloseWork}
                className="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-800 shadow-sm transition hover:bg-rose-100"
              >
                Encerrar trabalho
              </button>
            </div>

            <div className="text-xs text-zinc-500">
              Total inclui todas as sessões + sessão atual (se estiver rodando).
            </div>
          </div>
        </div>
      </div>

      {/* Entries */}
      <div className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-base font-semibold text-zinc-900">Logs de sessões</h2>
          <div className="text-xs text-zinc-500">{entries.length} registros</div>
        </div>

        {entries.length === 0 ? (
          <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
            Nenhuma sessão ainda.
          </div>
        ) : (
          <div className="divide-y divide-zinc-200 rounded-2xl border border-zinc-200 bg-white shadow-sm">
            {entries.map((e) => {
              const earned = e.ended_at ? Math.round(rateCents * (e.duration_seconds / 3600)) : 0;
              return (
                <div key={e.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="font-mono text-sm font-semibold text-zinc-900">{formatHMS(e.duration_seconds)}</div>
                      {!e.ended_at ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
                          Rodando
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-1 truncate text-sm text-zinc-600">
                      {formatDateTime(e.started_at)}{" "}
                      {e.ended_at ? `→ ${formatDateTime(e.ended_at)}` : "→ (em andamento)"}
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    {e.ended_at ? (
                      <div className="text-sm font-semibold text-zinc-900">{formatMoneyBRL(earned)}</div>
                    ) : (
                      <div className="text-sm text-zinc-500">—</div>
                    )}
                    <div className="text-xs text-zinc-500">sessão</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer helper */}
      <div className="text-xs text-zinc-500">
        Dica: se você fechar o navegador, ao voltar o total fica salvo e continua de onde parou.
      </div>
    </div>
  );
}
