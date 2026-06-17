import { revalidatePath } from "next/cache";
import probeProfiles from "../../../../../config/api-transit-probes.json";
import { probeApiTransitStations } from "../../../../../scripts/probe-api-transit.mjs";
import { getAdminPasswordFromRequest } from "@/lib/admin";
import { logApiError, safeApiErrorMessage } from "@/lib/api-errors";
import { clearTransitStationsCache } from "@/lib/api-transit-db";
import { requireAdminOrCronPassword } from "@/lib/env";
import { getRuntimeEnv } from "@/lib/runtime-env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: Request) {
  return runApiTransitProbe(request);
}

export async function POST(request: Request) {
  return runApiTransitProbe(request);
}

async function runApiTransitProbe(request: Request) {
  const authError = authorizeCronRequest(request);
  if (authError) return authError;

  const startedAt = new Date().toISOString();
  const url = new URL(request.url);
  const station =
    url.searchParams.get("station") ||
    url.searchParams.get("stationId") ||
    url.searchParams.get("source") ||
    undefined;

  try {
    const result = await probeApiTransitStations({
      profiles: probeProfiles,
      station,
      post: true,
      dbCredentials: true,
      targetLimit: url.searchParams.get("targetLimit") || undefined,
      skipCompletions: url.searchParams.get("skipCompletions") || undefined,
      timeoutMs: url.searchParams.get("timeoutMs") || undefined,
    });

    if (result.runs.length || result.rollups.length) {
      clearTransitStationsCache();
      revalidatePath("/admin");
      revalidatePath("/admin/api-transit");
      revalidatePath("/api-transit");
      revalidatePath("/api-transit/models");
      revalidatePath("/api-transit/[slug]", "page");
      revalidatePath("/sitemap.xml");
    }

    return Response.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    logApiError("cron api transit probe", error);
    return Response.json(
      {
        ok: false,
        startedAt,
        finishedAt: new Date().toISOString(),
        message: safeApiErrorMessage(error, "API 中转可用性监测失败。"),
      },
      { status: 500 },
    );
  }
}

function authorizeCronRequest(request: Request) {
  if (!getRuntimeEnv("CRON_SECRET") && process.env.NODE_ENV === "production") {
    return Response.json(
      { ok: false, message: "CRON_SECRET 未配置，已拒绝执行 API 中转可用性监测。" },
      { status: 500 },
    );
  }

  try {
    requireAdminOrCronPassword(getAdminPasswordFromRequest(request));
    return null;
  } catch {
    return Response.json({ ok: false, message: "无权执行 API 中转可用性监测。" }, { status: 401 });
  }
}
