import { apiFetch } from "./client";

export type WorkCreateRequest = {
  title: string;
  sprint_name: string;
  start_date: string; // YYYY-MM-DD
  end_date: string;
  hourly_rate_cents: number;
  currency?: string;
};

export type WorkCreateResponse = { id: string };

export type WorkListItem = {
  id: string;
  title: string;
  sprint_name: string;
  hourly_rate_cents: number;
  currency: string;
};

export type WorksListResponse = { items: WorkListItem[] };

export async function createWork(payload: WorkCreateRequest) {
  return apiFetch<WorkCreateResponse>("/works", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function listWorks() {
  return apiFetch<WorksListResponse>("/works");
}
