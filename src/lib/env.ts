import "server-only";

import crypto from "node:crypto";

export const ADMIN_SESSION_COOKIE = "priceai_admin_session";
export const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export function getAdminPassword(): string {
  const pwd = process.env.ADMIN_PASSWORD;
  if (!pwd) {
    throw new Error(
      "ADMIN_PASSWORD is not configured. Set it in .env.local for local dev or in your deployment environment.",
    );
  }
  return pwd;
}

export function createAdminSessionToken(): string {
  const expiresAt = Date.now() + ADMIN_SESSION_MAX_AGE_SECONDS * 1000;
  const payload = String(expiresAt);
  return `${payload}.${signAdminSessionPayload(payload)}`;
}

export function verifyAdminSessionToken(token: string | null | undefined): boolean {
  if (!token) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;

  const expiresAt = Number(payload);
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) return false;

  const expected = signAdminSessionPayload(payload);
  return timingSafeEqual(signature, expected);
}

function signAdminSessionPayload(payload: string): string {
  return crypto
    .createHmac("sha256", getAdminPassword())
    .update(payload)
    .digest("base64url");
}

function timingSafeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

export function requireAdminPassword(value: string | null): void {
  if (!value || value !== getAdminPassword()) {
    throw new Error("未授权，请检查后台密码。");
  }
}

export function requireAdminOrCronPassword(value: string | null): void {
  const adminPassword = process.env.ADMIN_PASSWORD;
  const cronSecret = process.env.CRON_SECRET;

  if (value && adminPassword && value === adminPassword) return;
  if (value && cronSecret && value === cronSecret) return;

  throw new Error("未授权，请检查后台密码或定时采集密钥。");
}
