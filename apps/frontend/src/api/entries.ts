import { apiFetch } from "./client";

export type TimerStateResponse = {
  running: boolean;
  started_at?: string | null;
  total_closed_seconds: number;

  is_finished: boolean;
  blocked_reason?: "CLOSED" | "EXPIRED" | null;

  end_date?: string | null;
  closed_at?: string | null;
};


export type TimeEntryItem = {
  id: string;
  started_at: string;
  ended_at?: string | null;
  duration_seconds: number;
};

export type TimeEntriesResponse = {
  items: TimeEntryItem[];
};

export async function getTimerState(workId: string) {
  return apiFetch<TimerStateResponse>(`/works/${workId}/timer`);
}

export async function getEntries(workId: string, limit = 200) {
  return apiFetch<TimeEntriesResponse>(`/works/${workId}/entries?limit=${limit}`);
}
