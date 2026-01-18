import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { startTimer, stopTimer } from "../api/timer";
import { listWorks } from "../api/works";
import { getEntries, getTimerState } from "../api/entries";
import { formatHMS, formatMoneyBRL } from "../lib/format";
import type { TimeEntryItem } from "../api/entries";
import { closeWork } from "../api/workClose";


function formatDateTime(dt: string) {
  const d = new Date(dt);
  return d.toLocaleString("pt-BR");
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

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
        <h2 style={{ margin: 0 }}>{title}</h2>
        <div style={{ opacity: 0.8 }}>{formatMoneyBRL(rateCents)}/h</div>
      </div>

      {loading ? <div>Carregando...</div> : null}
      {err ? <div style={{ color: "crimson" }}>{err}</div> : null}

      <div style={{ padding: 16, border: "1px solid #ddd", borderRadius: 16 }}>
        <div style={{ opacity: 0.7, marginBottom: 6 }}>Cronômetro do trabalho (acumulado)</div>
        <div style={{ fontSize: 44, fontWeight: 800 }}>{formatHMS(totalSeconds)}</div>

        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 8 }}>
          <div>
            <div style={{ opacity: 0.7 }}>Total a receber</div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{formatMoneyBRL(totalEarnedCents)}</div>
          </div>

          <div>
            <div style={{ opacity: 0.7 }}>Sessão atual</div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>
              {formatHMS(currentSessionSeconds)} • {formatMoneyBRL(currentSessionEarnedCents)}
            </div>
          </div>

          <div>
            <div style={{ opacity: 0.7 }}>Status</div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{running ? "Rodando" : "Parado"}</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
          {!running ? (
            <button onClick={onStart}>Start</button>
          ) : (
            <button onClick={onStop}>Stop</button>
          )}
          <button
            onClick={async () => {
                const reason = prompt("Motivo (opcional):") ?? null;
                await closeWork(workId, reason);
                await refreshAll();
            }}
            style={{ opacity: 0.9 }}
            >
            Encerrar trabalho
            </button>

          <button onClick={refreshAll} style={{ opacity: 0.9 }}>
            Atualizar
          </button>
        </div>

        {running && startedAt ? (
          <div style={{ marginTop: 10, opacity: 0.7 }}>Iniciado em: {formatDateTime(startedAt)}</div>
        ) : null}
      </div>

      <div style={{ marginTop: 4 }}>
        <h3>Logs de sessões</h3>
        {entries.length === 0 ? (
          <div style={{ opacity: 0.7 }}>Nenhuma sessão ainda.</div>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {entries.map((e) => (
              <div key={e.id} style={{ padding: 12, border: "1px solid #eee", borderRadius: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{formatHMS(e.duration_seconds)}</div>
                    <div style={{ opacity: 0.7 }}>
                      {formatDateTime(e.started_at)} {e.ended_at ? `→ ${formatDateTime(e.ended_at)}` : "→ (rodando)"}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", opacity: 0.9 }}>
                    {e.ended_at ? formatMoneyBRL(Math.round(rateCents * (e.duration_seconds / 3600))) : ""}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
