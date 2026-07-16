#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import { dirname } from "node:path";

const DEFAULT_INPUT = "docs/planning/archive/pending/data-collection/2026-07-16_yunmao-source-square-links.json";
const DEFAULT_OUTPUT_JSON =
  "docs/planning/archive/pending/data-collection/2026-07-16_yunmao-candidate-quality-probe.json";
const DEFAULT_OUTPUT_MD =
  "docs/planning/archive/pending/data-collection/2026-07-16_yunmao-candidate-quality-probe.md";
const DEFAULT_DELAY_MS = 10_000;
const DEFAULT_REQUEST_DELAY_MS = 800;
const DEFAULT_TIMEOUT_MS = 20_000;
const DEFAULT_PAGE_LIMIT = 2;
const DEFAULT_CATEGORY_LIMIT = 8;
const DEFAULT_PAGE_SIZE = 100;

const PLATFORM_PATTERNS = [
  ["ChatGPT", /\bchat\s*gpt\b|\bchatgpt\b|\bgpt[-\s]?(?:4|5|plus|pro|team|账号|会员|订阅|共享)?|openai|oai/i],
  ["Claude", /\bclaude\b|anthropic|克劳德/i],
  ["Gemini", /\bgemini\b|google\s*ai|谷歌ai|谷歌.*(?:会员|账号|订阅)/i],
  ["Cursor", /\bcursor\b|光标(?:编辑器)?/i],
  ["Perplexity", /\bperplexity\b|perplexity\s*pro|秘塔搜索|秘塔/i],
  ["Poe", /\bpoe\b|poe\s*(?:pro|会员|账号)/i],
  ["Midjourney", /\bmidjourney\b|\bmj\b|mid\s*journey/i],
  ["Suno", /\bsuno\b|suno\s*(?:pro|会员)/i],
  ["Runway", /\brunway\b|runway\s*(?:ml|会员)/i],
  ["Sora", /\bsora\b/i],
  ["Grok", /\bgrok\b|grok\s*(?:会员|账号)/i],
  ["Copilot", /\bcopilot\b|github\s*copilot|微软.*copilot/i],
  ["DeepSeek", /\bdeepseek\b|deep\s*seek|深度求索/i],
  ["Kimi", /\bkimi\b|月之暗面/i],
  ["Doubao", /豆包|doubao/i],
  ["Tongyi", /通义|千问|qwen/i],
  ["Wenxin", /文心|ernie/i],
  ["Canva", /\bcanva\b|可画/i],
  ["Notion", /\bnotion\b/i],
  ["AI API", /\bapi\b|中转|转发|key|token|令牌|额度|余额|充值|模型/i],
  ["AI Tool", /\bai\b|人工智能|绘画|画图|写作|论文|翻译|降重|数字人|配音|视频生成/i],
];

const NON_AI_PATTERNS = [
  /王者荣耀|和平精英|原神|崩坏|steam|游戏|手游|点券|皮肤/i,
  /影视|网盘|迅雷|音乐|视频会员|爱奇艺|腾讯视频|优酷|网易云|酷狗/i,
  /话费|流量|外卖|美团|饿了么|京东|淘宝|拼多多|会员卡/i,
  /vpn|机场|节点|代理|流量包|梯子/i,
];

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) continue;
    const rawKey = arg.slice(2);
    const eqIndex = rawKey.indexOf("=");
    if (eqIndex >= 0) {
      args[rawKey.slice(0, eqIndex)] = rawKey.slice(eqIndex + 1);
      continue;
    }
    const next = argv[index + 1];
    if (next && !next.startsWith("--")) {
      args[rawKey] = next;
      index += 1;
    } else {
      args[rawKey] = true;
    }
  }
  return args;
}

function numberOption(args, key, fallback, { min = 0, max = Number.POSITIVE_INFINITY } = {}) {
  const value = Number(args[key]);
  if (!Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(Math.trunc(value), max));
}

function text(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function numberOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function normalizeHost(value) {
  try {
    return new URL(value).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

function shopTokenFromUrl(value) {
  try {
    const url = new URL(value);
    return decodeURIComponent(url.pathname.match(/^\/shop\/([^/?#]+)/i)?.[1] || "");
  } catch {
    return "";
  }
}

function deriveBaseUrl(sourceUrl) {
  try {
    const url = new URL(sourceUrl);
    return `${url.protocol}//${url.host}`;
  } catch {
    return "https://catfk.com";
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function postJson(url, body, referer, options) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        accept: "application/json, text/plain, */*",
        "content-type": "application/json",
        origin: new URL(url).origin,
        referer,
        "user-agent": "PriceAI-Yunmao-Candidate-Probe/1.0 (+https://priceai.cc)",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const rawText = await response.text();
    if (!response.ok) {
      const error = new Error(`${url} returned HTTP ${response.status}`);
      error.status = response.status;
      error.body = rawText.slice(0, 500);
      throw error;
    }
    if (isChallengeBody(rawText)) {
      const error = new Error("waf-or-challenge response");
      error.status = response.status;
      error.body = rawText.slice(0, 500);
      throw error;
    }
    try {
      return JSON.parse(rawText);
    } catch {
      const error = new Error("response is not JSON");
      error.status = response.status;
      error.body = rawText.slice(0, 500);
      throw error;
    }
  } finally {
    clearTimeout(timer);
  }
}

function isChallengeBody(value) {
  return /acw_tc|cdn_sec_tc|captcha|verify|challenge|waf|安全验证|访问验证|人机验证/i.test(String(value || ""));
}

function challengeReason(error) {
  const body = String(error?.body || "");
  const message = String(error?.message || "");
  if (error?.status === 403 || isChallengeBody(body) || /waf-or-challenge|challenge/i.test(message)) {
    return "waf-or-challenge";
  }
  if (error?.name === "AbortError") return "timeout";
  return "request-failed";
}

function findPlatforms(value) {
  const source = String(value || "");
  const platforms = [];
  for (const [label, pattern] of PLATFORM_PATTERNS) {
    if (pattern.test(source)) platforms.push(label);
  }
  return platforms;
}

function aiSignalScore(value) {
  return findPlatforms(value).length;
}

function nonAiSignalScore(value) {
  const source = String(value || "");
  return NON_AI_PATTERNS.reduce((count, pattern) => count + (pattern.test(source) ? 1 : 0), 0);
}

function isAvailableItem(item) {
  if (item.rawStatus !== null && item.rawStatus !== 1) return false;
  if (item.stockCount !== null && item.stockCount <= 0) return false;
  return true;
}

async function probeCandidate(row, options) {
  const sourceUrl = text(row.sourceUrl);
  const baseUrl = deriveBaseUrl(sourceUrl);
  const token = text(row.shopToken) || shopTokenFromUrl(sourceUrl);
  const result = {
    sourceId: text(row.sourceId),
    sourceName: text(row.sourceName) || token || sourceUrl,
    sourceUrl,
    shopToken: token,
    agentKey: text(row.agentKey),
    sourceSquareGoodsCount: numberOrNull(row.goodsCount),
    description: text(row.description),
    baseUrl,
    host: normalizeHost(baseUrl),
    status: "unknown",
    quality: "unknown",
    score: 0,
    reason: "",
    storeName: null,
    shopClosed: false,
    reportedGoodsCount: 0,
    categoryCount: 0,
    sampledItemCount: 0,
    availableItemCount: 0,
    aiOfferCount: 0,
    availableAiOfferCount: 0,
    aiCoverage: 0,
    platforms: [],
    categories: [],
    sampleAiOffers: [],
    sampleOffers: [],
    failures: [],
    ms: 0,
  };

  const startedAt = Date.now();
  if (!token) {
    return {
      ...result,
      status: "failed",
      quality: "unknown",
      reason: "缺少 shop token，无法试探。",
      ms: Date.now() - startedAt,
    };
  }

  try {
    const shopInfo = await postJson(`${baseUrl}/shopApi/Shop/info`, { token, category_key: "" }, `${baseUrl}/shop/${token}`, options);
    if (shopInfo.code !== 1 || !shopInfo.data) throw new Error(`Shop info unavailable: code=${shopInfo.code ?? "unknown"}`);
    const shopData = shopInfo.data;
    result.storeName = text(shopData.nickname || result.sourceName);
    result.shopClosed = Number(shopData.custom_status) === 0 || Number(shopData.status) === 0;
    await delay(options.requestDelayMs);

    const categoryPayload = await postJson(
      `${baseUrl}/shopApi/Shop/categoryList`,
      { token, goods_type: "card", category_key: "" },
      shopData.link || `${baseUrl}/shop/${token}`,
      options,
    );
    const categoryRows = Array.isArray(categoryPayload.data) ? categoryPayload.data : [];
    const categories = categoryRows
      .map((category) => ({
        id: Number(category.id),
        name: text(category.name),
        goodsCount: numberOrNull(category.goods_count) || 0,
      }))
      .filter((category) => Number.isFinite(category.id));
    result.categories = categories;
    result.categoryCount = categories.filter((category) => category.id !== 0).length;
    result.reportedGoodsCount = categories
      .filter((category) => category.id !== 0)
      .reduce((sum, category) => sum + category.goodsCount, 0);

    const positiveCategories = categories.filter((category) => category.id !== 0 && category.goodsCount > 0);
    const selectedCategories = (positiveCategories.length ? positiveCategories : categories.filter((category) => category.id === 0))
      .sort((left, right) => {
        const aiDelta = aiSignalScore(right.name) - aiSignalScore(left.name);
        return aiDelta || right.goodsCount - left.goodsCount;
      })
      .slice(0, options.categoryLimit);

    const items = [];
    for (const category of selectedCategories) {
      for (let page = 1; page <= options.pageLimit; page += 1) {
        await delay(options.requestDelayMs);
        const listPayload = await postJson(
          `${baseUrl}/shopApi/Shop/goodsList`,
          {
            token,
            keywords: "",
            category_id: category.id,
            goods_type: "card",
            current: page,
            pageSize: options.pageSize,
          },
          shopData.link || `${baseUrl}/shop/${token}`,
          options,
        );
        if (listPayload.code !== 1 || !Array.isArray(listPayload.data?.list)) {
          result.failures.push(`分类 ${category.name || category.id} 第 ${page} 页读取失败。`);
          break;
        }
        const pageItems = listPayload.data.list;
        for (const item of pageItems) {
          const title = text(item.name);
          if (!title) continue;
          const price = numberOrNull(item.price ?? item.real_price);
          const stockCount = numberOrNull(item.extend?.stock_count);
          const rawStatus = numberOrNull(item.status);
          const categoryName = text(item.category?.name || category.name);
          const url = text(item.link || (item.goods_key ? `${baseUrl}/item/${encodeURIComponent(item.goods_key)}` : sourceUrl));
          const itemPlatforms = findPlatforms(`${title} ${categoryName}`);
          const offer = {
            title,
            price,
            stockCount,
            rawStatus,
            status: isAvailableItem({ stockCount, rawStatus }) ? "available" : "out_of_stock",
            categoryName,
            url,
            platforms: itemPlatforms,
            aiSignal: itemPlatforms.length,
            nonAiSignal: nonAiSignalScore(`${title} ${categoryName}`),
          };
          items.push(offer);
        }
        if (pageItems.length < options.pageSize) break;
      }
    }

    const aiText = [
      result.sourceName,
      result.storeName,
      result.description,
      ...categories.map((category) => category.name),
      ...items.map((item) => item.title),
    ].join(" ");
    const platforms = [...new Set(findPlatforms(aiText))].sort();
    const aiItems = items.filter((item) => item.aiSignal > 0);
    const availableItems = items.filter(isAvailableItem);
    const availableAiItems = aiItems.filter(isAvailableItem);
    const nonAiItems = items.filter((item) => item.nonAiSignal > 0 && item.aiSignal === 0);

    result.status = "success";
    result.sampledItemCount = items.length;
    result.availableItemCount = availableItems.length;
    result.aiOfferCount = aiItems.length;
    result.availableAiOfferCount = availableAiItems.length;
    result.aiCoverage = items.length ? Number((aiItems.length / items.length).toFixed(3)) : 0;
    result.platforms = platforms;
    result.sampleAiOffers = availableAiItems
      .concat(aiItems.filter((item) => !isAvailableItem(item)))
      .slice(0, options.sampleLimit)
      .map(compactOffer);
    result.sampleOffers = items.slice(0, options.sampleLimit).map(compactOffer);

    const sourceNameAi = aiSignalScore(`${result.sourceName} ${result.description}`);
    const categoryAi = categories.filter((category) => aiSignalScore(category.name) > 0).length;
    const nonAiCoverage = items.length ? nonAiItems.length / items.length : 0;
    let score = 0;
    score += 15;
    score += result.shopClosed ? -25 : 5;
    score += result.reportedGoodsCount > 0 || result.sourceSquareGoodsCount > 0 ? 8 : 0;
    score += items.length > 0 ? 10 : -10;
    score += Math.min(30, aiItems.length * 4);
    score += Math.min(20, availableAiItems.length * 5);
    score += Math.min(20, platforms.length * 4);
    score += Math.min(10, sourceNameAi * 5);
    score += Math.min(10, categoryAi * 4);
    score += result.aiCoverage >= 0.5 ? 10 : result.aiCoverage >= 0.25 ? 5 : 0;
    if (nonAiCoverage > 0.7 && aiItems.length < 2) score -= 20;
    if (result.failures.length) score -= Math.min(10, result.failures.length * 2);
    result.score = Math.max(0, Math.min(100, Math.round(score)));
    result.quality = qualityFor(result);
    result.reason = reasonFor(result);
  } catch (error) {
    const reason = challengeReason(error);
    result.status = reason;
    result.quality = "unknown";
    result.reason =
      reason === "waf-or-challenge"
        ? "节点遇到风控/验证响应，本次不判定店铺质量。"
        : reason === "timeout"
          ? "请求超时，本次不判定店铺质量。"
          : `试探失败：${text(error.message) || "未知错误"}`;
    result.failures.push(result.reason);
  }

  result.ms = Date.now() - startedAt;
  return result;
}

function compactOffer(item) {
  return {
    title: item.title,
    price: item.price,
    status: item.status,
    stockCount: item.stockCount,
    categoryName: item.categoryName,
    platforms: item.platforms,
    url: item.url,
  };
}

function qualityFor(result) {
  if (result.status !== "success") return "unknown";
  if (result.shopClosed) return "reject";
  if (result.score >= 70 && result.availableAiOfferCount >= 3) return "recommended";
  if (result.score >= 55 && result.availableAiOfferCount >= 2 && result.platforms.length >= 1) return "recommended";
  if (result.score >= 35 && result.aiOfferCount >= 1) return "watch";
  return "reject";
}

function reasonFor(result) {
  if (result.status !== "success") return result.reason || "本次未成功试探。";
  if (result.shopClosed) return "店铺当前不可购买或关闭。";
  if (result.quality === "recommended") {
    return `AI 商品信号较强：${result.availableAiOfferCount} 个可售 AI 相关商品，覆盖 ${result.platforms.length} 类平台。`;
  }
  if (result.quality === "watch") {
    return `有 AI 商品信号，但样本较少或覆盖一般：${result.aiOfferCount} 个相关商品。`;
  }
  if (!result.sampledItemCount) return "未读取到商品。";
  return "AI 相关商品信号弱，暂不优先收录。";
}

function reportSummary(results) {
  return {
    total: results.length,
    success: results.filter((row) => row.status === "success").length,
    recommended: results.filter((row) => row.quality === "recommended").length,
    watch: results.filter((row) => row.quality === "watch").length,
    reject: results.filter((row) => row.quality === "reject").length,
    unknown: results.filter((row) => row.quality === "unknown").length,
    wafOrChallenge: results.filter((row) => row.status === "waf-or-challenge").length,
  };
}

function sortRanked(results) {
  return [...results].sort((left, right) => {
    const qualityRank = { recommended: 3, watch: 2, reject: 1, unknown: 0 };
    return (
      (qualityRank[right.quality] || 0) - (qualityRank[left.quality] || 0) ||
      right.score - left.score ||
      right.availableAiOfferCount - left.availableAiOfferCount ||
      right.aiOfferCount - left.aiOfferCount
    );
  });
}

function buildReport({ inputSummary, options, results, completed }) {
  return {
    summary: {
      generatedAt: new Date().toISOString(),
      completed,
      inputSummary,
      probeNode: {
        hostname: os.hostname(),
        platform: os.platform(),
        release: os.release(),
      },
      options: {
        delayMs: options.delayMs,
        requestDelayMs: options.requestDelayMs,
        timeoutMs: options.timeoutMs,
        pageLimit: options.pageLimit,
        categoryLimit: options.categoryLimit,
        pageSize: options.pageSize,
      },
      counts: reportSummary(results),
    },
    rows: sortRanked(results),
  };
}

function mdEscape(value) {
  return text(value).replace(/\|/g, "\\|");
}

function offerSummary(offers) {
  return offers
    .slice(0, 3)
    .map((offer) => `${offer.title}${offer.price !== null ? ` (${offer.price})` : ""}`)
    .join("; ");
}

function tableRows(rows) {
  return rows
    .map((row, index) =>
      [
        index + 1,
        mdEscape(row.sourceName || row.storeName || row.shopToken),
        row.score,
        row.availableAiOfferCount,
        row.aiOfferCount,
        mdEscape(row.platforms.join(", ")),
        mdEscape(row.reason),
        mdEscape(offerSummary(row.sampleAiOffers)),
        row.sourceUrl,
      ].join(" | "),
    )
    .map((line) => `| ${line} |`);
}

function buildMarkdown(report) {
  const { summary, rows } = report;
  const recommended = rows.filter((row) => row.quality === "recommended");
  const watch = rows.filter((row) => row.quality === "watch");
  const rejected = rows.filter((row) => row.quality === "reject");
  const unknown = rows.filter((row) => row.quality === "unknown");
  const header = "| # | 店铺 | 分数 | 可售 AI 商品 | AI 商品 | 平台信号 | 判断 | 样例商品 | 链接 |\n| --- | --- | ---: | ---: | ---: | --- | --- | --- | --- |";
  const lines = [
    "# 云猫寄售候选店铺质量试探",
    "",
    `- 生成时间：${summary.generatedAt}`,
    `- 运行节点：${summary.probeNode.hostname}`,
    `- 候选总数：${summary.counts.total}`,
    `- 成功试探：${summary.counts.success}`,
    `- 优先推荐：${summary.counts.recommended}`,
    `- 观察候选：${summary.counts.watch}`,
    `- 暂不建议：${summary.counts.reject}`,
    `- 不可判断：${summary.counts.unknown}`,
    `- 节奏：店铺间隔 ${summary.options.delayMs}ms，单店请求间隔 ${summary.options.requestDelayMs}ms`,
    "",
    "## 优先推荐",
    "",
    recommended.length ? header : "暂无。",
    ...tableRows(recommended),
    "",
    "## 观察候选",
    "",
    watch.length ? header : "暂无。",
    ...tableRows(watch),
    "",
    "## 暂不建议",
    "",
    rejected.length ? header : "暂无。",
    ...tableRows(rejected.slice(0, 30)),
    rejected.length > 30 ? `\n还有 ${rejected.length - 30} 条暂不建议，详见 JSON。` : "",
    "",
    "## 不可判断",
    "",
    unknown.length ? header : "暂无。",
    ...tableRows(unknown),
    "",
    "## 口径",
    "",
    "- `优先推荐`：公开接口可访问，有多个可售 AI 相关商品，且平台/品类信号较清晰。",
    "- `观察候选`：存在 AI 商品信号，但样本数量、可售状态或覆盖度不足，需要人工复看。",
    "- `暂不建议`：可访问但 AI 商品信号弱，或商品更偏游戏/影视/流量等非 PriceAI 主线。",
    "- `不可判断`：请求失败、超时或遇到风控；这类结果不等于店铺无效。",
    "",
  ];
  return lines.filter((line) => line !== "").join("\n");
}

async function writeJson(path, value) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
}

async function writeMarkdown(path, value) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, value);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const options = {
    input: String(args.input || DEFAULT_INPUT),
    outputJson: String(args["output-json"] || DEFAULT_OUTPUT_JSON),
    outputMd: String(args["output-md"] || DEFAULT_OUTPUT_MD),
    limit: numberOption(args, "limit", 0, { min: 0, max: 10_000 }),
    delayMs: numberOption(args, "delay-ms", DEFAULT_DELAY_MS, { min: 0, max: 120_000 }),
    requestDelayMs: numberOption(args, "request-delay-ms", DEFAULT_REQUEST_DELAY_MS, { min: 0, max: 30_000 }),
    timeoutMs: numberOption(args, "timeout-ms", DEFAULT_TIMEOUT_MS, { min: 1_000, max: 120_000 }),
    pageLimit: numberOption(args, "page-limit", DEFAULT_PAGE_LIMIT, { min: 1, max: 10 }),
    categoryLimit: numberOption(args, "category-limit", DEFAULT_CATEGORY_LIMIT, { min: 1, max: 50 }),
    pageSize: numberOption(args, "page-size", DEFAULT_PAGE_SIZE, { min: 10, max: 100 }),
    sampleLimit: numberOption(args, "sample-limit", 12, { min: 1, max: 50 }),
    includeExisting: Boolean(args["include-existing"]),
  };
  const input = JSON.parse(await readFile(options.input, "utf8"));
  const inputRows = Array.isArray(input.rows) ? input.rows : Array.isArray(input) ? input : [];
  const candidates = inputRows.filter((row) => options.includeExisting || row.compareStatus === "new_candidate");
  const selected = options.limit > 0 ? candidates.slice(0, options.limit) : candidates;
  const results = [];
  const inputSummary = input.summary || {};

  for (let index = 0; index < selected.length; index += 1) {
    const row = selected[index];
    const label = text(row.sourceName || row.shopToken || row.sourceUrl);
    console.log(`[${index + 1}/${selected.length}] ${label}`);
    const result = await probeCandidate(row, options);
    results.push(result);
    console.log(
      `  -> ${result.status} ${result.quality} score=${result.score} ai=${result.availableAiOfferCount}/${result.aiOfferCount} ${result.reason}`,
    );
    await writeJson(options.outputJson, buildReport({ inputSummary, options, results, completed: false }));
    if (index < selected.length - 1 && options.delayMs > 0) await delay(options.delayMs);
  }

  const report = buildReport({ inputSummary, options, results, completed: true });
  await writeJson(options.outputJson, report);
  await writeMarkdown(options.outputMd, buildMarkdown(report));
  console.log("\nSummary");
  console.table(report.summary.counts);
  console.log(`JSON: ${options.outputJson}`);
  console.log(`Markdown: ${options.outputMd}`);
}

main().catch((error) => {
  console.error(error?.stack || error?.message || String(error));
  process.exit(1);
});
