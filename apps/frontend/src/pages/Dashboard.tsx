import { useEffect, useMemo, useState } from "react";
import { getSummary } from "../api/reports";
import { formatMoneyBRL, formatHMS, todayISO } from "../lib/format";

type Summary = {
  from: string;
  to: string;
  total_seconds: number;
  total_earned_cents: number;
  currency: string;
  by_work: Array<{
    work_id: string;
    title: string;
    sprint_name: string;
    total_seconds: number;
    total_earned_cents: number;
    currency: string;
  }>;
};

function isoAddDays(iso: string, days: number) {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + days);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatRange(from: string, to: string) {
  // YYYY-MM-DD -> DD/MM
  const short = (iso: string) => {
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
  };
  return `${short(from)} → ${short(to)}`;
}

function StatCard({
  title,
  subtitle,
  data,
  loading,
}: {
  title: string;
  subtitle: string;
  data: Summary | null;
  loading: boolean;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-zinc-900">{title}</div>
          <div className="mt-1 text-xs text-zinc-500">{subtitle}</div>
        </div>
        <div className="shrink-0 rounded-full bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-700 ring-1 ring-zinc-200">
          {loading ? "..." : "OK"}
        </div>
      </div>

      <div className="mt-4">
        {loading ? (
          <div className="space-y-2">
            <div className="h-8 w-36 animate-pulse rounded-lg bg-zinc-100" />
            <div className="h-4 w-24 animate-pulse rounded bg-zinc-100" />
          </div>
        ) : (
          <>
            <div className="text-2xl font-semibold tracking-tight text-zinc-900">
              {formatMoneyBRL(data?.total_earned_cents ?? 0)}
            </div>
            <div className="mt-1 text-sm text-zinc-600">
              {formatHMS(data?.total_seconds ?? 0)}
              <span className="text-zinc-400"> • </span>
              tempo total
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function TopWorkRow({
  title,
  sprint,
  seconds,
  earnedCents,
}: {
  title: string;
  sprint: string;
  seconds: number;
  earnedCents: number;
}) {
  return (
    <div className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-zinc-900">{title}</div>
        <div className="mt-1 truncate text-xs text-zinc-500">{sprint}</div>
      </div>

      <div className="shrink-0 text-right">
        <div className="font-mono text-sm font-semibold text-zinc-900">{formatHMS(seconds)}</div>
        <div className="mt-0.5 text-sm font-medium text-zinc-700">{formatMoneyBRL(earnedCents)}</div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const today = useMemo(() => todayISO(), []);
  const weekFrom = useMemo(() => isoAddDays(today, -6), [today]);
  const monthFrom = useMemo(() => isoAddDays(today, -29), [today]);

  const [todaySum, setTodaySum] = useState<Summary | null>(null);
  const [weekSum, setWeekSum] = useState<Summary | null>(null);
  const [monthSum, setMonthSum] = useState<Summary | null>(null);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function refresh() {
    setErr(null);
    setLoading(true);
    try {
      const [t, w, m] = await Promise.all([
        getSummary(today, today),
        getSummary(weekFrom, today),
        getSummary(monthFrom, today),
      ]);
      setTodaySum(t as Summary);
      setWeekSum(w as Summary);
      setMonthSum(m as Summary);
    } catch {
      setErr("Falha ao carregar relatórios.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today, weekFrom, monthFrom]);

  const topWorks = monthSum?.by_work?.slice(0, 8) ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Dashboard</h1>
          <div className="text-sm text-zinc-600">
            Visão rápida do seu tempo e ganhos. <span className="text-zinc-400">•</span>{" "}
            <span className="text-zinc-500">Hoje: {formatRange(today, today)}</span>
          </div>
        </div>

        <button
          onClick={refresh}
          className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-900 shadow-sm transition hover:bg-zinc-50 disabled:opacity-50"
          disabled={loading}
        >
          Atualizar
        </button>
      </div>

      {err ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{err}</div>
      ) : null}

      {/* Cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard title="Hoje" subtitle={formatRange(today, today)} data={todaySum} loading={loading} />
        <StatCard title="Últimos 7 dias" subtitle={formatRange(weekFrom, today)} data={weekSum} loading={loading} />
        <StatCard title="Últimos 30 dias" subtitle={formatRange(monthFrom, today)} data={monthSum} loading={loading} />
      </div>

      {/* Top works */}
      <div className="space-y-3">
        <div className="flex items-baseline justify-between">
          <div>
            <h2 className="text-base font-semibold text-zinc-900">Top trabalhos</h2>
            <div className="mt-1 text-xs text-zinc-500">Últimos 30 dias • ordenado por ganho</div>
          </div>
          <div className="text-xs text-zinc-500">{topWorks.length} itens</div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="space-y-3">
              <div className="h-4 w-56 animate-pulse rounded bg-zinc-100" />
              <div className="h-16 animate-pulse rounded-xl bg-zinc-100" />
              <div className="h-16 animate-pulse rounded-xl bg-zinc-100" />
              <div className="h-16 animate-pulse rounded-xl bg-zinc-100" />
            </div>
          </div>
        ) : topWorks.length === 0 ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm text-zinc-600 shadow-sm">
            Ainda não há dados suficientes para montar o ranking. Rode o timer em algum trabalho e volte aqui.
          </div>
        ) : (
          <div className="divide-y divide-zinc-200 rounded-2xl border border-zinc-200 bg-white shadow-sm">
            {topWorks.map((w) => (
              <TopWorkRow
                key={w.work_id}
                title={w.title}
                sprint={w.sprint_name}
                seconds={w.total_seconds}
                earnedCents={w.total_earned_cents}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer note */}
      <div className="text-xs text-zinc-500">
        Dica: você pode abrir um trabalho e ver o cronômetro acumulado + logs de sessões.
      </div>
    </div>
  );
}
