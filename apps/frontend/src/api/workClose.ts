import { apiFetch } from "./client";

export async function closeWork(workId: string, reason?: string | null) {
  return apiFetch<{ id: string; closed_at: string; closed_reason?: string | null }>(
    `/works/${workId}/close`,
    { method: "POST", body: JSON.stringify({ reason: reason ?? null }) }
  );
}
