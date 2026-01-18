import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { startTimer, stopTimer } from "../api/timer";
import { listWorks } from "../api/works";
import { formatHMS, formatMoneyBRL } from "../lib/format";

export default function WorkDetail() {
  const { id } = useParams();
  const workId = id!;
  const [title, setTitle] = useState("Trabalho");
  const [rateCents, setRateCents] = useState(0);

  const [running, setRunning] = useState(false);
  const [startedAt, setStartedAt] = useState<string | null>(null);

  const [tick, setTick] = useState(0);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    (async () => {
      const works = await listWorks();
      const w = works.items.find((x) => x.id === workId);
      if (w) {
        setTitle(w.title);
        setRateCents(w.hourly_rate_cents);
      }
    })();
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

  const elapsedSeconds = useMemo(() => {
    if (!running || !startedAt) return 0;
    const s = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
    return Math.max(0, s);
  }, [running, startedAt, tick]);

  const earnedCents = useMemo(() => {
    if (!running) return 0;
    return Math.round(rateCents * (elapsedSeconds / 3600));
  }, [rateCents, elapsedSeconds, running]);

  async function onStart() {
    const res = await startTimer(workId);
    setRunning(true);
    setStartedAt(res.started_at);
  }

  async function onStop() {
    await stopTimer(workId);
    setRunning(false);
    setStartedAt(null);
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <h2>{title}</h2>

      <div style={{ padding: 16, border: "1px solid #ddd", borderRadius: 16 }}>
        <div style={{ fontSize: 44, fontWeight: 800 }}>{formatHMS(elapsedSeconds)}</div>
        <div style={{ opacity: 0.7 }}>A receber (sessão atual): {formatMoneyBRL(earnedCents)}</div>

        <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
          {!running ? (
            <button onClick={onStart}>Start</button>
          ) : (
            <button onClick={onStop}>Stop</button>
          )}
        </div>

        <div style={{ marginTop: 10, opacity: 0.6 }}>
          (MVP) Ainda não carrega automaticamente timer já em andamento ao abrir a página.
          Próximo passo: endpoint de “estado do timer”.
        </div>
      </div>
    </div>
  );
}
