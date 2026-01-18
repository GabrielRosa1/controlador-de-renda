import { useEffect, useMemo, useState } from "react";
import { getSummary } from "../api/reports";
import { formatMoneyBRL, formatHMS, todayISO } from "../lib/format";

function isoAddDays(iso: string, days: number) {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + days);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function Dashboard() {
  const today = useMemo(() => todayISO(), []);
  const weekFrom = useMemo(() => isoAddDays(today, -6), [today]);
  const monthFrom = useMemo(() => isoAddDays(today, -29), [today]);

  const [todaySum, setTodaySum] = useState<any>(null);
  const [weekSum, setWeekSum] = useState<any>(null);
  const [monthSum, setMonthSum] = useState<any>(null);

  useEffect(() => {
    (async () => {
      setTodaySum(await getSummary(today, today));
      setWeekSum(await getSummary(weekFrom, today));
      setMonthSum(await getSummary(monthFrom, today));
    })();
  }, [today, weekFrom, monthFrom]);

  const Card = ({ title, data }: any) => (
    <div style={{ padding: 14, border: "1px solid #ddd", borderRadius: 14 }}>
      <div style={{ fontWeight: 700 }}>{title}</div>
      {!data ? (
        <div style={{ opacity: 0.7 }}>Carregando...</div>
      ) : (
        <>
          <div style={{ fontSize: 24, fontWeight: 800 }}>{formatMoneyBRL(data.total_earned_cents)}</div>
          <div style={{ opacity: 0.7 }}>{formatHMS(data.total_seconds)}</div>
        </>
      )}
    </div>
  );

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <h2>Dashboard</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        <Card title="Hoje" data={todaySum} />
        <Card title="Últimos 7 dias" data={weekSum} />
        <Card title="Últimos 30 dias" data={monthSum} />
      </div>

      {monthSum?.by_work?.length ? (
        <div style={{ marginTop: 8 }}>
          <h3>Top trabalhos (30 dias)</h3>
          <div style={{ display: "grid", gap: 8 }}>
            {monthSum.by_work.slice(0, 6).map((w: any) => (
              <div key={w.work_id} style={{ padding: 12, border: "1px solid #eee", borderRadius: 12 }}>
                <div style={{ fontWeight: 700 }}>{w.title}</div>
                <div style={{ opacity: 0.7 }}>{w.sprint_name}</div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                  <span>{formatHMS(w.total_seconds)}</span>
                  <span>{formatMoneyBRL(w.total_earned_cents)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
