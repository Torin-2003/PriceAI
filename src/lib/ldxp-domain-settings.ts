import "server-only";

import {
  DEFAULT_LDXP_DOMAIN_SETTINGS,
  LDXP_AUTO_SWITCH_COOLDOWN_MS,
  LDXP_PAY_HOST,
  LDXP_WWW_HOST,
  normalizeLdxpDomainSettings,
  serializeLdxpDomainSettings,
  type LdxpDomainHost,
  type LdxpDomainMode,
  type LdxpDomainSettingsSummary,
} from "@/lib/ldxp-domain-settings-shared";
import { getSupabaseServerClient } from "@/lib/supabase";

export const LDXP_DOMAIN_SETTINGS_ID = "ldxp-domain";

type RuntimeSettingsRow = {
  settings?: unknown;
  updated_at?: string | null;
};

export async function getLdxpDomainSettings(): Promise<LdxpDomainSettingsSummary> {
  const row = await getSettingsRow();
  if (!row) {
    return {
      ...DEFAULT_LDXP_DOMAIN_SETTINGS,
      message: "尚未保存配置，当前使用内置默认值 www.ldxp.cn。",
    };
  }
  return normalizeLdxpDomainSettings(row.settings, {
    configured: true,
    tableReady: true,
    updatedAt: row.updated_at || null,
  });
}

export async function updateLdxpDomainMode(mode: LdxpDomainMode): Promise<LdxpDomainSettingsSummary> {
  const current = await getLdxpDomainSettings();
  const now = new Date().toISOString();
  const activeHost = mode === "www" ? LDXP_WWW_HOST : mode === "pay" ? LDXP_PAY_HOST : current.activeHost;
  return saveSettings({
    ...current,
    configured: true,
    mode,
    activeHost,
    lastSwitchedAt: activeHost !== current.activeHost ? now : current.lastSwitchedAt,
    lastSwitchReason: mode === "auto"
      ? "管理员启用自动切换。"
      : `管理员固定使用 ${activeHost}。`,
    updatedAt: now,
    message: null,
  });
}

export async function recordLdxpAutomaticSwitch(input: {
  fromHost: LdxpDomainHost;
  toHost: LdxpDomainHost;
  reason: string;
}): Promise<{ changed: boolean; settings: LdxpDomainSettingsSummary; cooldown: boolean }> {
  const current = await getLdxpDomainSettings();
  if (current.mode !== "auto" || current.activeHost !== input.fromHost || input.fromHost === input.toHost) {
    return { changed: false, settings: current, cooldown: false };
  }

  const switchedAt = current.lastSwitchedAt ? new Date(current.lastSwitchedAt).getTime() : 0;
  if (switchedAt && Date.now() - switchedAt < LDXP_AUTO_SWITCH_COOLDOWN_MS) {
    return { changed: false, settings: current, cooldown: true };
  }

  const now = new Date().toISOString();
  const settings = await saveSettings({
    ...current,
    configured: true,
    activeHost: input.toHost,
    lastSwitchedAt: now,
    lastSwitchReason: input.reason.slice(0, 500),
    updatedAt: now,
    message: null,
  });
  return { changed: true, settings, cooldown: false };
}

async function saveSettings(settings: LdxpDomainSettingsSummary): Promise<LdxpDomainSettingsSummary> {
  const supabase = getSupabaseServerClient();
  if (!supabase) throw new Error("Supabase 尚未配置，无法保存 LDXP 域名设置。");

  const { error } = await supabase.from("app_runtime_settings").upsert({
    id: LDXP_DOMAIN_SETTINGS_ID,
    provider: "priceai",
    base_url: `https://${settings.activeHost}`,
    model: "ldxp-domain-settings",
    timeout_ms: 20_000,
    settings: serializeLdxpDomainSettings(settings),
    updated_at: settings.updatedAt || new Date().toISOString(),
  }, { onConflict: "id" });
  if (error) throw error;
  return getLdxpDomainSettings();
}

async function getSettingsRow(): Promise<RuntimeSettingsRow | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("app_runtime_settings")
    .select("settings,updated_at")
    .eq("id", LDXP_DOMAIN_SETTINGS_ID)
    .maybeSingle();
  if (error) throw error;
  return data as RuntimeSettingsRow | null;
}
