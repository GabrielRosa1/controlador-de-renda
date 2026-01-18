import { apiFetch } from "./client";

export type LoginRequest = { email: string; password: string };
export type TokenResponse = { access_token: string; token_type: "bearer" };

export async function login(req: LoginRequest) {
  return apiFetch<TokenResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(req),
  });
}

export async function register(req: { name?: string | null; email: string; password: string }) {
  return apiFetch<{ ok: boolean }>("/auth/register", {
    method: "POST",
    body: JSON.stringify(req),
  });
}
