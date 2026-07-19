"use client";

import { AlertTriangle, CheckCircle2, Loader2, RefreshCcw, Server } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  LDXP_DOMAIN_MODES,
  type LdxpDomainMode,
  type LdxpDomainSettingsSummary,
} from "@/lib/ldxp-domain-settings-shared";

type ApiResponse = { ok?: boolean; settings?: LdxpDomainSettingsSummary; message?: string };

const modeLabels: Record<LdxpDomainMode, string> = {
  auto: "自动切换",
  www: "固定 www",
  pay: "固定 pay",
};

export function LdxpDomainSettingsPanel() {
  const [settings, setSettings] = useState<LdxpDomainSettingsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingMode, setSavingMode] = useState<LdxpDomainMode | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/ldxp-domain-settings", { cache: "no-store", credentials: "same-origin" });
      const payload = await response.json().catch(() => ({})) as ApiResponse;
      if (!response.ok || !payload.ok || !payload.settings) throw new Error(payload.message || "读取 LDXP 域名设置失败。");
      setSettings(payload.settings);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "读取 LDXP 域名设置失败。");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [load]);

  async function save(mode: LdxpDomainMode) {
    if (savingMode || mode === settings?.mode) return;
    setSavingMode(mode);
    setError(null);
    try {
      const response = await fetch("/api/admin/ldxp-domain-settings", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      const payload = await response.json().catch(() => ({})) as ApiResponse;
      if (!response.ok || !payload.ok || !payload.settings) throw new Error(payload.message || "保存 LDXP 域名设置失败。");
      setSettings(payload.settings);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "保存 LDXP 域名设置失败。");
    } finally {
      setSavingMode(null);
    }
  }

  return (
    <section className="mb-5 overflow-hidden rounded-lg border border-[#adb3b4]/25 bg-white dark:border-white/10 dark:bg-[#202829]">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#adb3b4]/20 px-4 py-3 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <Server size={16} className="text-[#5a6061] dark:text-[#b8c1c2]" />
            <h3 className="text-sm font-semibold text-[#202829] dark:text-white">链动小铺访问域名</h3>
          </div>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-[#5a6061] dark:text-[#aeb8ba]">
            自动模式仅在连接超时或 HTTP 520/522/523/524 时尝试备用域名；403 和 429 不会触发切换。
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          aria-label="刷新链动小铺域名状态"
          title="刷新域名状态"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#adb3b4]/35 text-[#5a6061] transition-colors hover:bg-[#f2f4f4] disabled:opacity-60 dark:border-white/15 dark:text-[#c8cecf] dark:hover:bg-[#2b3536]"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCcw size={14} />}
        </button>
      </div>

      <div className="grid gap-4 px-4 py-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.8fr)] lg:items-start">
        <div>
          <span className="text-xs font-medium text-[#5a6061] dark:text-[#b8c1c2]">运行模式</span>
          <div className="mt-2 inline-flex max-w-full flex-wrap gap-1 rounded-lg bg-[#f2f4f4] p-1 dark:bg-[#273132]">
            {LDXP_DOMAIN_MODES.map((mode) => {
              const selected = settings?.mode === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => void save(mode)}
                  disabled={!settings || Boolean(savingMode)}
                  aria-pressed={selected}
                  className={`inline-flex h-8 items-center justify-center rounded-md px-3 text-xs font-semibold transition-colors disabled:opacity-60 ${selected ? "bg-[#2d3435] text-white dark:bg-[#d7e1de] dark:text-[#182122]" : "text-[#5a6061] hover:bg-white dark:text-[#b8c1c2] dark:hover:bg-[#334142]"}`}
                >
                  {savingMode === mode ? <Loader2 size={13} className="mr-1.5 animate-spin" /> : null}
                  {modeLabels[mode]}
                </button>
              );
            })}
          </div>
        </div>

        <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-2 text-xs">
          <dt className="text-[#7a8384] dark:text-[#9eaaac]">当前域名</dt>
          <dd className="break-all font-mono font-semibold text-[#202829] dark:text-white">{settings?.activeHost || "读取中"}</dd>
          <dt className="text-[#7a8384] dark:text-[#9eaaac]">最近切换</dt>
          <dd className="text-[#2d3435] dark:text-[#d7e1de]">{formatDateTime(settings?.lastSwitchedAt)}</dd>
          <dt className="text-[#7a8384] dark:text-[#9eaaac]">切换原因</dt>
          <dd className="min-w-0 break-words text-[#2d3435] dark:text-[#d7e1de]">{settings?.lastSwitchReason || "尚无自动切换记录"}</dd>
        </dl>
      </div>

      {error ? (
        <div className="flex items-start gap-2 border-t border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/25 dark:text-amber-200">
          <AlertTriangle size={15} className="mt-0.5 shrink-0" />
          {error}
        </div>
      ) : settings?.configured ? (
        <div className="flex items-center gap-2 border-t border-[#adb3b4]/15 px-4 py-2.5 text-xs text-[#2f7a4b] dark:border-white/10 dark:text-[#8ad3a7]">
          <CheckCircle2 size={14} />
          配置已保存，采集节点会在下一次领取任务时生效。
        </div>
      ) : null}
    </section>
  );
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "尚未切换";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return value;
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}
