import "server-only";

import { getSupabaseServerClient } from "@/lib/supabase";
import {
  createDefaultCommunitySettingsSummary,
  normalizeCommunitySettingsSummary,
  serializeCommunitySettings,
  type CommunitySettingsSummary,
} from "@/lib/community-settings-shared";

export const COMMUNITY_SETTINGS_ID = "community";

export type CommunitySettingsInput = {
  qqGroupEnabled?: boolean | null;
  qqGroupNumber?: string | null;
  qqGroupUrl?: string | null;
  qqGroupQrCodeUrl?: string | null;
  telegramEnabled?: boolean | null;
  telegramUrl?: string | null;
};

type RuntimeSettingsRow = {
  id: string;
  settings?: unknown;
  updated_at?: string | null;
};

export async function getCommunitySettingsSummary(): Promise<CommunitySettingsSummary> {
  let row: RuntimeSettingsRow | null = null;
  try {
    row = await getCommunitySettingsRow();
  } catch (error) {
    if (isMissingCommunitySettingsColumnError(error)) {
      return getFallbackCommunitySettingsSummary("社群配置字段尚未迁移，请先应用 Supabase migration 后再保存。");
    }
    throw error;
  }

  if (!row) {
    return createDefaultCommunitySettingsSummary({
      tableReady: true,
      message: "社群入口尚未在后台保存，当前使用内置默认值。",
    });
  }

  return normalizeCommunitySettingsSummary(row.settings, {
    configured: true,
    tableReady: true,
    updatedAt: row.updated_at || null,
  });
}

export function getFallbackCommunitySettingsSummary(message = "社群配置表尚未初始化。"): CommunitySettingsSummary {
  return createDefaultCommunitySettingsSummary({
    configured: false,
    tableReady: false,
    message,
  });
}

export async function updateCommunitySettings(input: CommunitySettingsInput): Promise<CommunitySettingsSummary> {
  const supabase = getSupabaseServerClient();
  if (!supabase) throw new Error("Supabase 尚未配置，无法保存社群配置。");

  let existing: RuntimeSettingsRow | null = null;
  try {
    existing = await getCommunitySettingsRow();
  } catch (error) {
    if (isMissingCommunitySettingsColumnError(error)) {
      throw new Error("社群配置字段尚未迁移，请先应用 Supabase migration 后再保存。");
    }
    throw error;
  }

  const base = existing
    ? normalizeCommunitySettingsSummary(existing.settings, { configured: true, tableReady: true, updatedAt: existing.updated_at || null })
    : createDefaultCommunitySettingsSummary({ configured: true, tableReady: true });
  const next = normalizeCommunitySettingsSummary({
    qqGroupEnabled: typeof input.qqGroupEnabled === "boolean" ? input.qqGroupEnabled : base.qqGroupEnabled,
    qqGroupNumber: input.qqGroupNumber ?? base.qqGroupNumber,
    qqGroupUrl: input.qqGroupUrl ?? base.qqGroupUrl,
    qqGroupQrCodeUrl: input.qqGroupQrCodeUrl ?? base.qqGroupQrCodeUrl,
    telegramEnabled: typeof input.telegramEnabled === "boolean" ? input.telegramEnabled : base.telegramEnabled,
    telegramUrl: input.telegramUrl ?? base.telegramUrl,
  }, {
    configured: true,
    tableReady: true,
    updatedAt: new Date().toISOString(),
  });

  const { error } = await supabase
    .from("app_runtime_settings")
    .upsert({
      id: COMMUNITY_SETTINGS_ID,
      provider: "priceai",
      base_url: "https://priceai.cc/community",
      model: "community-settings",
      timeout_ms: 12000,
      settings: serializeCommunitySettings(next),
      updated_at: new Date().toISOString(),
    }, { onConflict: "id" });
  if (error) {
    if (isMissingCommunitySettingsColumnError(error)) {
      throw new Error("社群配置字段尚未迁移，请先应用 Supabase migration 后再保存。");
    }
    throw error;
  }

  return getCommunitySettingsSummary();
}

async function getCommunitySettingsRow(): Promise<RuntimeSettingsRow | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("app_runtime_settings")
    .select("id,settings,updated_at")
    .eq("id", COMMUNITY_SETTINGS_ID)
    .maybeSingle();
  if (error) throw error;
  return data as RuntimeSettingsRow | null;
}

function isMissingCommunitySettingsColumnError(error: unknown): boolean {
  const record = error && typeof error === "object" ? error as { code?: unknown; message?: unknown; details?: unknown } : {};
  const message = [record.message, record.details]
    .filter((value): value is string => typeof value === "string")
    .join(" ");

  return record.code === "42703" ||
    record.code === "PGRST204" ||
    Boolean(message.includes("app_runtime_settings.settings") || /settings.*does not exist/i.test(message));
}
