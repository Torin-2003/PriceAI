"use client";

import { Coffee, ExternalLink, Star, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useState } from "react";
import { trackAnalyticsEvent } from "@/lib/analytics";
import { githubStarUrl, supportPagePath } from "@/lib/support";

const STORAGE_KEY = "priceai.supportNudge.v1";
const MIN_VISIT_DAYS = 3;
const PROMPT_DELAY_MS = 20_000;
const DISMISS_DAYS = 30;
const COMPLETE_DAYS = 180;

const excludedPathPrefixes = [
  "/admin",
  "/api-transit/submit",
  "/api-transit/detector/reports",
  "/commercial",
  supportPagePath,
] as const;

type SupportNudgeState = {
  visitDays: string[];
  firstSeenAt: string;
  lastSeenAt: string;
  lastShownAt?: string;
  dismissedUntil?: string;
  completedAt?: string;
};

export function SupportNudgePrompt() {
  const pathname = usePathname();
  const titleId = useId();
  const descriptionId = useId();
  const [open, setOpen] = useState(false);

  const dismissPrompt = useCallback(() => {
    const state = readState();
    writeState({
      ...state,
      dismissedUntil: addDays(new Date(), DISMISS_DAYS).toISOString(),
    });
    setOpen(false);
    trackAnalyticsEvent("support_nudge_dismiss", {
      pathname,
      visit_days: state.visitDays.length,
    });
  }, [pathname]);

  const completePrompt = useCallback((action: string) => {
    const state = readState();
    writeState({
      ...state,
      completedAt: new Date().toISOString(),
      dismissedUntil: addDays(new Date(), COMPLETE_DAYS).toISOString(),
    });
    setOpen(false);
    trackAnalyticsEvent("support_nudge_click", {
      action,
      pathname,
      visit_days: state.visitDays.length,
    });
  }, [pathname]);

  useEffect(() => {
    if (matchesPathPrefix(pathname, excludedPathPrefixes)) return;

    const previewMode = isDevelopmentSupportNudgePreview();
    const state = previewMode ? readState() : recordVisit(readState());
    if (!previewMode) writeState(state);
    if (!previewMode && !shouldShowPrompt(state)) return;

    function showPrompt() {
      if (document.visibilityState !== "visible") return;
      if (document.querySelector('[role="dialog"]')) return;

      const latestState = readState();
      if (!previewMode && !shouldShowPrompt(latestState)) return;

      if (!previewMode) {
        writeState({
          ...latestState,
          lastShownAt: new Date().toISOString(),
        });
      }
      setOpen(true);
      trackAnalyticsEvent("support_nudge_impression", {
        pathname,
        visit_days: latestState.visitDays.length,
        preview: previewMode,
      });
    }

    const timer = window.setTimeout(showPrompt, previewMode ? 0 : PROMPT_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") dismissPrompt();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [dismissPrompt, open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[85] flex items-end justify-center bg-[var(--color-overlay)] px-3 py-4 backdrop-blur-[2px] sm:items-center sm:px-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) dismissPrompt();
      }}
    >
      <div className="w-full max-w-[560px] overflow-hidden rounded-lg bg-[var(--color-panel)] shadow-[var(--shadow-floating)] ring-1 ring-[var(--color-border-soft)]">
        <div className="flex items-start justify-between gap-4 border-b border-[var(--color-border-subtle)] px-5 py-5 sm:px-6">
          <div className="min-w-0">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-surface)] text-[var(--color-text-primary)] ring-1 ring-[var(--color-border-soft)]">
              <Coffee size={18} aria-hidden="true" />
            </div>
            <h2 id={titleId} className="mt-4 text-lg font-semibold leading-7 text-[var(--color-text-primary)]">
              PriceAI 对你有帮上忙吗？
            </h2>
            <p id={descriptionId} className="mt-2 text-sm leading-7 text-[var(--color-text-muted)]">
              看起来你已经连续几天在用。点一个 GitHub Star，或者买杯咖啡支持后续数据维护，都能帮这个项目继续把价格和风险信息整理清楚。
            </p>
          </div>
          <button
            type="button"
            onClick={dismissPrompt}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--color-text-muted)] transition hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-text-primary)]"
            aria-label="关闭支持提示，30 天内不再提示"
          >
            <X size={17} />
          </button>
        </div>

        <div className="px-5 py-4 sm:px-6">
          <div className="rounded-lg bg-[var(--color-surface)] px-4 py-3 text-sm leading-6 text-[var(--color-text-muted)] ring-1 ring-[var(--color-border-soft)]">
            支持不会影响 PriceAI 的排序、最低价、风险提示或渠道展示规则。
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-[var(--color-border-subtle)] px-5 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-6">
          <button
            type="button"
            onClick={dismissPrompt}
            className="inline-flex min-h-11 items-center justify-center rounded-full px-4 text-sm font-semibold text-[var(--color-text-muted)] transition hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-text-primary)]"
          >
            30 天内不再提示
          </button>
          <Link
            href={supportPagePath}
            onClick={() => completePrompt("support_page")}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[var(--color-panel)] px-4 text-sm font-semibold text-[var(--color-text-primary)] ring-1 ring-[var(--color-border-soft)] transition hover:bg-[var(--color-surface-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-text-primary)]"
          >
            支持维护
            <Coffee size={15} />
          </Link>
          <a
            href={githubStarUrl}
            target="_blank"
            rel="noreferrer"
            onClick={() => completePrompt("github_star")}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[var(--color-primary)] px-4 text-sm font-semibold text-[var(--color-text-on-primary)] transition hover:bg-[var(--color-primary-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-text-primary)]"
          >
            GitHub 点 Star
            <Star size={15} />
            <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </div>
  );

}

function shouldShowPrompt(state: SupportNudgeState) {
  const now = Date.now();
  if (state.visitDays.length < MIN_VISIT_DAYS) return false;
  if (state.completedAt) return false;
  if (state.dismissedUntil && Date.parse(state.dismissedUntil) > now) return false;
  if (state.lastShownAt && daysBetween(new Date(state.lastShownAt), new Date()) < DISMISS_DAYS) return false;
  return true;
}

function recordVisit(state: SupportNudgeState): SupportNudgeState {
  const now = new Date();
  const today = getShanghaiDateKey(now);
  const visitDays = Array.from(new Set([...state.visitDays, today])).slice(-20);

  return {
    ...state,
    visitDays,
    firstSeenAt: state.firstSeenAt || now.toISOString(),
    lastSeenAt: now.toISOString(),
  };
}

function readState(): SupportNudgeState {
  const fallback = initialState();

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<SupportNudgeState>;
    return {
      visitDays: Array.isArray(parsed.visitDays) ? parsed.visitDays.filter((value): value is string => typeof value === "string").slice(-20) : [],
      firstSeenAt: typeof parsed.firstSeenAt === "string" ? parsed.firstSeenAt : fallback.firstSeenAt,
      lastSeenAt: typeof parsed.lastSeenAt === "string" ? parsed.lastSeenAt : fallback.lastSeenAt,
      lastShownAt: typeof parsed.lastShownAt === "string" ? parsed.lastShownAt : undefined,
      dismissedUntil: typeof parsed.dismissedUntil === "string" ? parsed.dismissedUntil : undefined,
      completedAt: typeof parsed.completedAt === "string" ? parsed.completedAt : undefined,
    };
  } catch {
    return fallback;
  }
}

function writeState(state: SupportNudgeState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* Users with disabled storage may see the prompt again later. */
  }
}

function initialState(): SupportNudgeState {
  const now = new Date().toISOString();
  return {
    visitDays: [],
    firstSeenAt: now,
    lastSeenAt: now,
  };
}

function getShanghaiDateKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function daysBetween(start: Date, end: Date) {
  const startMs = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
  const endMs = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate());
  return Math.floor((endMs - startMs) / 86_400_000);
}

function matchesPathPrefix(pathname: string, prefixes: readonly string[]) {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function isDevelopmentSupportNudgePreview() {
  if (process.env.NODE_ENV === "production") return false;
  return new URLSearchParams(window.location.search).get("supportNudgePreview") === "1";
}
