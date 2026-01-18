import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { createWork, listWorks } from "../api/works";
import type { WorkListItem } from "../api/works";
import { formatMoneyBRL } from "../lib/format";

export default function Works() {
  const [items, setItems] = useState<WorkListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // form
  const [title, setTitle] = useState("");
  const [sprint, setSprint] = useState("Sprint 6");
  const [startDate, setStartDate] = useState("2026-01-18");
  const [endDate, setEndDate] = useState("2026-01-31");
  const [rate, setRate] = useState(3500);

  async function refresh() {
    setErr(null);
    setLoading(true);
    try {
      const res = await listWorks();
      setItems(res.items);
    } catch (e: any) {
      setErr("Falha ao carregar trabalhos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    try {
      await createWork({
        title,
        sprint_name: sprint,
        start_date: startDate,
        end_date: endDate,
        hourly_rate_cents: rate,
        currency: "BRL",
      });
      setTitle("");
      await refresh();
    } catch {
      setErr("Falha ao criar trabalho");
    }
  }

  const totalRate = useMemo(() => formatMoneyBRL(rate), [rate]);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <h2>Trabalhos</h2>

      <form onSubmit={onCreate} style={{ display: "grid", gap: 8, padding: 12, border: "1px solid #ddd", borderRadius: 12 }}>
        <strong>Novo trabalho</strong>
        <input placeholder="Título (ex: SingleHorn)" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input placeholder="Sprint (ex: Sprint 6)" value={sprint} onChange={(e) => setSprint(e.target.value)} />
        <div style={{ display: "flex", gap: 8 }}>
          <input value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ flex: 1 }} />
          <input value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ flex: 1 }} />
        </div>
        <input
          type="number"
          value={rate}
          onChange={(e) => setRate(Number(e.target.value))}
          placeholder="Valor/hora em centavos (ex: 3500)"
        />
        <div style={{ opacity: 0.7 }}>Valor/hora: {totalRate}</div>
        <button disabled={!title.trim()}>Criar</button>
      </form>

      {loading && <div>Carregando...</div>}
      {err && <div style={{ color: "crimson" }}>{err}</div>}

      <div style={{ display: "grid", gap: 10 }}>
        {items.map((w) => (
          <div key={w.id} style={{ padding: 12, border: "1px solid #eee", borderRadius: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <div>
                <div style={{ fontWeight: 700 }}>{w.title}</div>
                <div style={{ opacity: 0.7 }}>{w.sprint_name}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div>{formatMoneyBRL(w.hourly_rate_cents)}/h</div>
                <Link to={`/works/${w.id}`}>Abrir timer</Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
