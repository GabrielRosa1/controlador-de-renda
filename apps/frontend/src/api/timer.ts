import { apiFetch } from "./client";

export type TimerStartResponse = {
  status: "started" | "already_running";
  entry_id: string;
  started_at: string;
};

export type TimerStopResponse = {
  status: "stopped" | "not_running";
  entry_id?: string | null;
  ended_at?: string | null;
};

export async function startTimer(workId: string) {
  return apiFetch<TimerStartResponse>(`/works/${workId}/timer/start`, { method: "POST" });
}

export async function stopTimer(workId: string) {
  return apiFetch<TimerStopResponse>(`/works/${workId}/timer/stop`, { method: "POST" });
}
