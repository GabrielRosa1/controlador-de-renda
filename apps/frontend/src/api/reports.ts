import { apiFetch } from "./client";

export type SummaryItem = {
  work_id: string;
  title: string;
  sprint_name: string;
  total_seconds: number;
  total_earned_cents: number;
  currency: string;
};

export type SummaryResponse = {
  from: string;
  to: string;
  total_seconds: number;
  total_earned_cents: number;
  currency: string;
  by_work: SummaryItem[];
};

export async function getSummary(dateFrom: string, dateTo: string) {
  const q = new URLSearchParams({ date_from: dateFrom, date_to: dateTo });
  return apiFetch<SummaryResponse>(`/reports/summary?${q.toString()}`);
}
