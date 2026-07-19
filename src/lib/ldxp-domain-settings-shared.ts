export const LDXP_WWW_HOST = "www.ldxp.cn";
export const LDXP_PAY_HOST = "pay.ldxp.cn";
export const LDXP_DOMAIN_MODES = ["auto", "www", "pay"] as const;
export const LDXP_AUTO_SWITCH_COOLDOWN_MS = 30 * 60 * 1000;

export type LdxpDomainMode = (typeof LDXP_DOMAIN_MODES)[number];
export type LdxpDomainHost = typeof LDXP_WWW_HOST | typeof LDXP_PAY_HOST;

export type LdxpDomainSettingsSummary = {
  configured: boolean;
  tableReady: boolean;
  mode: LdxpDomainMode;
  activeHost: LdxpDomainHost;
  lastSwitchedAt: string | null;
  lastSwitchReason: string | null;
  updatedAt: string | null;
  message: string | null;
};

export const DEFAULT_LDXP_DOMAIN_SETTINGS: LdxpDomainSettingsSummary = {
  configured: false,
  tableReady: true,
  mode: "auto",
  activeHost: LDXP_WWW_HOST,
  lastSwitchedAt: null,
  lastSwitchReason: null,
  updatedAt: null,
  message: null,
};

export function normalizeLdxpDomainSettings(
  value: unknown,
  meta: Partial<Pick<LdxpDomainSettingsSummary, "configured" | "tableReady" | "updatedAt" | "message">> = {},
): LdxpDomainSettingsSummary {
  const record = isRecord(value) ? value : {};
  const mode = isLdxpDomainMode(record.mode) ? record.mode : DEFAULT_LDXP_DOMAIN_SETTINGS.mode;
  const requestedHost = isLdxpDomainHost(record.activeHost) ? record.activeHost : DEFAULT_LDXP_DOMAIN_SETTINGS.activeHost;
  const activeHost = mode === "www" ? LDXP_WWW_HOST : mode === "pay" ? LDXP_PAY_HOST : requestedHost;

  return {
    ...DEFAULT_LDXP_DOMAIN_SETTINGS,
    ...meta,
    mode,
    activeHost,
    lastSwitchedAt: nullableText(record.lastSwitchedAt),
    lastSwitchReason: nullableText(record.lastSwitchReason),
  };
}

export function serializeLdxpDomainSettings(settings: LdxpDomainSettingsSummary) {
  return {
    mode: settings.mode,
    activeHost: settings.activeHost,
    lastSwitchedAt: settings.lastSwitchedAt,
    lastSwitchReason: settings.lastSwitchReason,
  };
}

export function isLdxpDomainMode(value: unknown): value is LdxpDomainMode {
  return typeof value === "string" && (LDXP_DOMAIN_MODES as readonly string[]).includes(value);
}

export function isLdxpDomainHost(value: unknown): value is LdxpDomainHost {
  return value === LDXP_WWW_HOST || value === LDXP_PAY_HOST;
}

export function isLdxpHost(value: string | null | undefined): boolean {
  const host = normalizedHost(value);
  return host === LDXP_WWW_HOST || host === LDXP_PAY_HOST || host === "ldxp.cn";
}

export function alternateLdxpHost(host: LdxpDomainHost): LdxpDomainHost {
  return host === LDXP_WWW_HOST ? LDXP_PAY_HOST : LDXP_WWW_HOST;
}

export function rewriteLdxpUrlHost(
  value: string | null | undefined,
  host: LdxpDomainHost = LDXP_WWW_HOST,
): string | null {
  const raw = String(value || "").trim();
  if (!raw) return null;

  try {
    const url = new URL(raw);
    if (!isLdxpHost(url.hostname)) return raw;
    url.hostname = host;
    url.protocol = "https:";
    url.port = "";
    return url.toString();
  } catch {
    return raw;
  }
}

export function isLdxpFailoverErrorMessage(value: unknown): boolean {
  const message = String(value || "");
  if (/returned HTTP (?:520|522|523|524)\b/i.test(message)) return true;
  return /(?:ETIMEDOUT|UND_ERR_CONNECT_TIMEOUT|UND_ERR_HEADERS_TIMEOUT|UND_ERR_BODY_TIMEOUT|AbortError|Connect Timeout|headers timeout|body timeout|fetch failed|DNS|ENOTFOUND|EAI_AGAIN|ECONNREFUSED|ECONNRESET|TLS|socket hang up)/i.test(message);
}

function normalizedHost(value: string | null | undefined): string {
  const raw = String(value || "").trim();
  if (!raw) return "";
  try {
    return new URL(raw.includes("://") ? raw : `https://${raw}`).hostname.toLowerCase();
  } catch {
    return raw.toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  }
}

function nullableText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  return text ? text.slice(0, 500) : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
