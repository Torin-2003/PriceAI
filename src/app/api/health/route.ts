import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";
import { getSupabaseServerClient } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type HealthStatus = "ok" | "degraded" | "not_configured";

export async function GET() {
  const generatedAt = new Date().toISOString();
  const supabaseConfigured = isSupabaseConfigured();
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json(
      {
        ok: false,
        status: "not_configured" satisfies HealthStatus,
        generatedAt,
        supabaseConfigured,
        supabaseReachable: false,
        latestSuccessfulCrawlAt: null,
        latestCrawlAt: null,
        latestCrawlStatus: null,
        message: "Supabase 尚未配置。",
      },
      { status: 503 },
    );
  }

  try {
    const { error } = await supabase
      .from("sources")
      .select("id", { head: true })
      .limit(1);

    if (error) throw error;

    return NextResponse.json({
      ok: true,
      status: "ok" satisfies HealthStatus,
      generatedAt,
      supabaseConfigured,
      supabaseReachable: true,
      latestSuccessfulCrawlAt: null,
      latestCrawlAt: null,
      latestCrawlStatus: null,
      message: null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        status: "degraded" satisfies HealthStatus,
        generatedAt,
        supabaseConfigured,
        supabaseReachable: false,
        latestSuccessfulCrawlAt: null,
        latestCrawlAt: null,
        latestCrawlStatus: null,
        message: error instanceof Error ? error.message : "健康检查失败。",
      },
      { status: 503 },
    );
  }
}
