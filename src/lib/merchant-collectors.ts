import type { MerchantCollectorFilter, MerchantCollectorGroup, Source } from "@/lib/types";

export const MERCHANT_COLLECTOR_GROUPS: MerchantCollectorGroup[] = ["shopApi", "dujiao", "kami", "other"];
export const MERCHANT_COLLECTOR_FILTERS: MerchantCollectorFilter[] = ["all", ...MERCHANT_COLLECTOR_GROUPS];

export type MerchantSourcePlatformId =
  | "liandongShop"
  | "yunmaoConsignment"
  | "qxvx"
  | "shopApiHosted"
  | "dujiao"
  | "kami"
  | "other";

export type MerchantSourcePlatform = {
  id: MerchantSourcePlatformId;
  label: string;
  shortLabel: string;
  exitLabel: string;
  hasPlatformAftersalesMechanism: boolean;
};

export function merchantCollectorGroup(kind: Source["collectorKind"] | null | undefined): MerchantCollectorGroup {
  if (kind === "shopApi") return "shopApi";
  if (kind === "dujiao") return "dujiao";
  if (kind === "kami") return "kami";
  return "other";
}

export function merchantCollectorLabel(group: MerchantCollectorFilter): string {
  if (group === "all") return "全部来源";
  if (group === "shopApi") return "托管发卡平台";
  if (group === "dujiao") return "独角数卡";
  if (group === "kami") return "异次元";
  return "自研";
}

export function merchantSourcePlatform(input: {
  collectorKind?: Source["collectorKind"] | null;
  collectorGroup?: MerchantCollectorGroup | null;
  sourceId?: string | null;
  sourceName?: string | null;
  sourceStoreName?: string | null;
  url?: string | null;
  entryUrl?: string | null;
  host?: string | null;
}): MerchantSourcePlatform {
  const collectorGroup = input.collectorGroup || merchantCollectorGroup(input.collectorKind);
  const host = firstNormalizedHost([input.host, input.entryUrl, input.url]);
  if (host === "catfk.com") {
    return {
      id: "yunmaoConsignment",
      label: "云猫寄售",
      shortLabel: "云猫",
      exitLabel: "云猫寄售",
      hasPlatformAftersalesMechanism: true,
    };
  }
  if (host === "pay.qxvx.cn") {
    return {
      id: "qxvx",
      label: "QXVX",
      shortLabel: "QXVX",
      exitLabel: "QXVX",
      hasPlatformAftersalesMechanism: true,
    };
  }
  if (host === "pay.ldxp.cn" || host === "ldxp.cn") {
    return {
      id: "liandongShop",
      label: "链动小铺",
      shortLabel: "链动",
      exitLabel: "链动小铺",
      hasPlatformAftersalesMechanism: true,
    };
  }

  const text = [
    input.sourceId,
    input.sourceName,
    input.sourceStoreName,
    input.entryUrl,
    input.url,
  ].join(" ").toLowerCase();
  if (/catfk(?:\.com|-)|云猫|yunmao/.test(text)) {
    return {
      id: "yunmaoConsignment",
      label: "云猫寄售",
      shortLabel: "云猫",
      exitLabel: "云猫寄售",
      hasPlatformAftersalesMechanism: true,
    };
  }
  if (/pay\.qxvx\.cn|qxvx/.test(text)) {
    return {
      id: "qxvx",
      label: "QXVX",
      shortLabel: "QXVX",
      exitLabel: "QXVX",
      hasPlatformAftersalesMechanism: true,
    };
  }
  if (/pay\.ldxp\.cn|ldxp|链动|鏈動|liandong/.test(text)) {
    return {
      id: "liandongShop",
      label: "链动小铺",
      shortLabel: "链动",
      exitLabel: "链动小铺",
      hasPlatformAftersalesMechanism: true,
    };
  }

  if (collectorGroup !== "shopApi") {
    return platformForCollectorGroup(collectorGroup);
  }

  return {
    id: "shopApiHosted",
    label: "托管发卡平台",
    shortLabel: "托管发卡",
    exitLabel: "托管发卡平台",
    hasPlatformAftersalesMechanism: true,
  };
}

export function parseMerchantCollectorFilter(value: string | null | undefined): MerchantCollectorFilter {
  const normalized = String(value || "").trim();
  return MERCHANT_COLLECTOR_FILTERS.includes(normalized as MerchantCollectorFilter)
    ? normalized as MerchantCollectorFilter
    : "all";
}

function platformForCollectorGroup(group: MerchantCollectorGroup): MerchantSourcePlatform {
  if (group === "dujiao") {
    return {
      id: "dujiao",
      label: "独角数卡",
      shortLabel: "独角",
      exitLabel: "原店铺",
      hasPlatformAftersalesMechanism: false,
    };
  }
  if (group === "kami") {
    return {
      id: "kami",
      label: "异次元",
      shortLabel: "异次元",
      exitLabel: "原店铺",
      hasPlatformAftersalesMechanism: false,
    };
  }
  return {
    id: "other",
    label: "自研",
    shortLabel: "自研",
    exitLabel: "原店铺",
    hasPlatformAftersalesMechanism: false,
  };
}

function firstNormalizedHost(values: Array<string | null | undefined>): string {
  for (const value of values) {
    const host = normalizeHost(value);
    if (host) return host;
  }
  return "";
}

function normalizeHost(value: string | null | undefined): string {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return "";
  try {
    return new URL(raw.includes("://") ? raw : `https://${raw}`).hostname.replace(/^www\./, "");
  } catch {
    return raw.replace(/^https?:\/\//, "").split("/")[0].replace(/^www\./, "");
  }
}
