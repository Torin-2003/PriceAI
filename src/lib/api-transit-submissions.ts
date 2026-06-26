import "server-only";

import { getSupabaseServerClient } from "@/lib/supabase";
import { stableId } from "@/lib/utils";

export type TransitSubmissionType = "user" | "merchant";
export type TransitSubmissionAccessMode = "public_only" | "test_key" | "test_account";

export type CreateTransitSubmissionInput = {
  type: TransitSubmissionType;
  stationId?: string | null;
  url: string;
  name?: string | null;
  apiBaseUrl?: string | null;
  pricingUrl?: string | null;
  contact?: string | null;
  notes?: string | null;
  models?: string[];
  meta?: Record<string, unknown>;
  accessMode?: TransitSubmissionAccessMode | null;
  submitterIp?: string | null;
  rateLimitPerHour?: number;
};

const DEFAULT_TRANSIT_SUBMISSION_RATE_LIMIT_PER_HOUR = 8;

export async function createTransitSubmission(input: CreateTransitSubmissionInput) {
  const supabase = getSupabaseServerClient();
  if (!supabase) throw new Error("Supabase 尚未配置，暂时无法接收提交。");

  const submittedUrl = normalizeUrl(input.url);
  const id = stableId("api-transit-submission", input.type, submittedUrl, input.submitterIp || "", new Date().toISOString());
  const existing = await findRecentSubmission(submittedUrl, input.submitterIp);
  if (existing) return { ignored: true as const, id: existing };

  await assertSubmitterRateLimit(input.submitterIp, input.rateLimitPerHour);

  const { error } = await supabase.from("api_transit_submissions").insert({
    id,
    submission_type: input.type,
    submitted_url: submittedUrl,
    submitted_name: cleanText(input.name),
    api_base_url: cleanUrl(input.apiBaseUrl),
    pricing_url: cleanUrl(input.pricingUrl),
    contact: cleanText(input.contact),
    notes: cleanText(input.notes),
    submitted_models: input.models?.map((item) => item.trim()).filter(Boolean).slice(0, 30) || [],
    submitted_meta: buildSubmittedMeta(input),
    parse_status: "pending",
    probe_status: inferProbeStatus(input),
    review_status: "pending",
    station_id: cleanText(input.stationId),
    submitter_ip: input.submitterIp || null,
  });

  if (error) throw error;
  return { id };
}

async function findRecentSubmission(url: string, submitterIp?: string | null): Promise<string | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;

  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  let query = supabase
    .from("api_transit_submissions")
    .select("id")
    .eq("submitted_url", url)
    .gte("created_at", since)
    .limit(1);

  if (submitterIp) query = query.eq("submitter_ip", submitterIp);

  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data?.id ? String(data.id) : null;
}

async function assertSubmitterRateLimit(
  submitterIp: string | null | undefined,
  rateLimitPerHour = DEFAULT_TRANSIT_SUBMISSION_RATE_LIMIT_PER_HOUR,
): Promise<void> {
  if (!submitterIp || rateLimitPerHour <= 0) return;

  const supabase = getSupabaseServerClient();
  if (!supabase) return;

  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error } = await supabase
    .from("api_transit_submissions")
    .select("id", { count: "exact", head: true })
    .eq("submitter_ip", submitterIp)
    .gte("created_at", since);

  if (error) throw error;
  if ((count || 0) >= rateLimitPerHour) {
    throw new Error("提交过于频繁，请稍后再试。");
  }
}

function normalizeUrl(value: string): string {
  const url = new URL(value.trim());
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("链接仅支持 http 或 https。");
  }
  url.hash = "";
  return url.toString();
}

function cleanUrl(value: string | null | undefined): string | null {
  const text = cleanText(value);
  if (!text) return null;
  return normalizeUrl(text);
}

function cleanText(value: string | null | undefined): string | null {
  const text = String(value || "").trim();
  return text ? text : null;
}

function buildSubmittedMeta(input: CreateTransitSubmissionInput): Record<string, unknown> {
  const meta = { ...(input.meta || {}) };
  const accessMode = input.accessMode || stringValue(meta.accessMode) || "public_only";
  meta.accessMode = accessMode;
  if (accessMode === "test_key" || accessMode === "test_account") {
    meta.credentialStatus = "submitted";
    meta.credentialType = accessMode;
  }
  return meta;
}

function inferProbeStatus(input: CreateTransitSubmissionInput): "pending" | "public_pricing_found" | "needs_login" {
  if (input.pricingUrl || stringValue(input.meta?.monitorUrl)) return "public_pricing_found";
  if (input.accessMode === "test_account") return "needs_login";
  return "pending";
}

function stringValue(value: unknown): string | null {
  const text = typeof value === "string" ? value.trim() : "";
  return text ? text : null;
}
