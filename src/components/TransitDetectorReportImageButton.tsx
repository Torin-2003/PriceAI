"use client";

import { useState } from "react";
import { Download, FileJson } from "lucide-react";
import type { DetectorReportCheck, DetectorReportMetric, DetectorReportTone } from "@/lib/transit-detector-report";

export interface TransitDetectorReportImageData {
  id: string;
  title: string;
  protocolLabel: string;
  model: string;
  modeLabel: string;
  baseUrl: string;
  apiKeyMasked: string;
  timestampLabel: string;
  scoreLabel: string;
  verdictLabel: string;
  verdictTone: DetectorReportTone;
  summary: string;
  passCount: number;
  issueCount: number;
  skippedCount: number;
  metrics: DetectorReportMetric[];
  checks: DetectorReportCheck[];
  raw: unknown;
}

interface TransitDetectorReportDownloadButtonsProps {
  report: TransitDetectorReportImageData;
}

const CANVAS_WIDTH = 1600;
const CANVAS_HEIGHT = 1000;
const COLORS = {
  ink: "#202829",
  text: "#2d3435",
  muted: "#5a6061",
  faint: "#7a8284",
  page: "#f9f9f9",
  surface: "#ffffff",
  panel: "#f2f4f4",
  line: "#dfe4e5",
  brand: "#45bf78",
  successBg: "#e8f3ec",
  successText: "#2f7a4b",
  warningBg: "#fff7e8",
  warningText: "#7a541b",
  dangerBg: "#fbe9e7",
  dangerText: "#9b3328",
  mutedBg: "#eef1f1",
} as const;

export function TransitDetectorReportDownloadButtons({ report }: TransitDetectorReportDownloadButtonsProps) {
  const [isRendering, setIsRendering] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  function handleJsonDownload() {
    const json = JSON.stringify(report.raw, null, 2);
    const blob = new Blob([json], { type: "application/json;charset=utf-8" });
    downloadBlob(blob, `priceai-transit-report-${safeFilePart(report.id)}.json`);
  }

  async function handleDownload() {
    if (isRendering) return;
    setIsRendering(true);
    setErrorMessage("");

    try {
      const blob = await renderReportImage(report);
      downloadBlob(blob, `priceai-transit-report-${safeFilePart(report.id)}.jpg`);
    } catch {
      setErrorMessage("下载失败，请稍后再试。");
    } finally {
      setIsRendering(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={handleJsonDownload}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-[#202829] ring-1 ring-[#adb3b4]/18 transition hover:bg-[#f5f7f7]"
        >
          <FileJson className="h-4 w-4" />
          JSON
        </button>
        <button
          type="button"
          onClick={handleDownload}
          disabled={isRendering}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#202829] px-4 text-sm font-semibold text-white transition hover:bg-[#2d3435] disabled:cursor-wait disabled:bg-[#adb3b4]"
        >
          <Download className="h-4 w-4" />
          {isRendering ? "生成中" : "JPG"}
        </button>
      </div>
      {errorMessage ? <span className="text-xs font-semibold text-[#9b3328]">{errorMessage}</span> : null}
    </div>
  );
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function renderReportImage(report: TransitDetectorReportImageData): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas unavailable");

  drawReport(context, report);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Image rendering failed"));
          return;
        }
        resolve(blob);
      },
      "image/jpeg",
      0.94,
    );
  });
}

function drawReport(ctx: CanvasRenderingContext2D, report: TransitDetectorReportImageData) {
  ctx.fillStyle = COLORS.page;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  drawHeader(ctx);
  drawTitleBlock(ctx, report);
  drawSummaryCard(ctx, report);
  drawTargetCard(ctx, report);
  drawChecksCard(ctx, report);
  drawMetricTiles(ctx, report.metrics);
  drawFooter(ctx, report);
}

function drawHeader(ctx: CanvasRenderingContext2D) {
  drawLogoMark(ctx, 96, 76);
  drawText(ctx, "PriceAI", 142, 86, { size: 42, weight: 800, color: COLORS.ink });
  drawText(ctx, "AI 比价雷达", 145, 117, { size: 15, weight: 700, color: COLORS.faint });
  drawPill(ctx, "priceai.cc", 1340, 69, 160, 44, COLORS.surface, COLORS.muted);
}

function drawLogoMark(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(x, y, 25, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + 18, y + 18);
  ctx.lineTo(x + 43, y + 43);
  ctx.stroke();
  ctx.strokeStyle = COLORS.brand;
  ctx.lineWidth = 7;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(x - 13, y + 5);
  ctx.lineTo(x - 3, y - 5);
  ctx.lineTo(x + 8, y + 5);
  ctx.lineTo(x + 17, y - 10);
  ctx.stroke();
  ctx.restore();
}

function drawTitleBlock(ctx: CanvasRenderingContext2D, report: TransitDetectorReportImageData) {
  drawText(ctx, "API 中转检测报告", 96, 176, { size: 48, weight: 700, color: COLORS.ink, family: "serif" });
  const chips = [report.title, report.timestampLabel, report.protocolLabel].filter(Boolean);
  let x = 96;
  for (const chip of chips) {
    const width = Math.min(260, Math.max(106, measureText(ctx, chip, 17, 700) + 34));
    drawPill(ctx, chip, x, 208, width, 36, COLORS.surface, COLORS.muted, 16);
    x += width + 12;
  }
  drawWrappedText(ctx, "报告由 PriceAI 检测服务生成，主站只展示证据链，不保存你的 API Key。结论用于辅助判断接口协议、模型能力和计费口径，不代表对商家做担保。", 96, 272, 940, {
    size: 22,
    lineHeight: 38,
    weight: 500,
    color: COLORS.muted,
    maxLines: 2,
  });
}

function drawSummaryCard(ctx: CanvasRenderingContext2D, report: TransitDetectorReportImageData) {
  drawRoundRect(ctx, 96, 336, 520, 300, 8, COLORS.surface, COLORS.line);
  drawText(ctx, "综合结论", 128, 384, { size: 21, weight: 800, color: COLORS.muted });
  drawText(ctx, report.scoreLabel, 128, 482, { size: 92, weight: 800, color: COLORS.ink });
  const tone = toneColors(report.verdictTone);
  drawPill(ctx, report.verdictLabel, 352, 426, 118, 48, tone.bg, tone.text, 20);
  drawWrappedText(ctx, report.summary, 128, 532, 440, {
    size: 20,
    lineHeight: 34,
    weight: 500,
    color: COLORS.text,
    maxLines: 2,
  });
  drawCountBox(ctx, "通过", String(report.passCount), 128, 580, 136, "success");
  drawCountBox(ctx, "需复核", String(report.issueCount), 280, 580, 136, "warning");
  drawCountBox(ctx, "未启用", String(report.skippedCount), 432, 580, 136, "muted");
}

function drawTargetCard(ctx: CanvasRenderingContext2D, report: TransitDetectorReportImageData) {
  drawRoundRect(ctx, 644, 336, 860, 300, 8, COLORS.surface, COLORS.line);
  drawText(ctx, "检测对象", 676, 384, { size: 25, weight: 800, color: COLORS.ink });
  drawInfoCell(ctx, "模型", report.model, 676, 420, 382);
  drawInfoCell(ctx, "协议", report.protocolLabel, 1090, 420, 360);
  drawInfoCell(ctx, "检测强度", report.modeLabel, 676, 514, 180);
  drawInfoCell(ctx, "接口地址", report.baseUrl, 892, 514, 558, true);
  drawInfoCell(ctx, "Key", report.apiKeyMasked, 676, 608, 248, true);
  drawInfoCell(ctx, "生成时间", report.timestampLabel, 956, 608, 260);
}

function drawChecksCard(ctx: CanvasRenderingContext2D, report: TransitDetectorReportImageData) {
  drawRoundRect(ctx, 96, 668, 872, 218, 8, COLORS.surface, COLORS.line);
  drawText(ctx, "检测项证据", 128, 716, { size: 25, weight: 800, color: COLORS.ink });
  drawText(ctx, `${report.checks.length} 个检测项`, 814, 716, { size: 18, weight: 800, color: COLORS.muted });

  const checks = report.checks.slice(0, 5);
  checks.forEach((check, index) => {
    const y = 760 + index * 34;
    const tone = toneColors(check.tone);
    ctx.fillStyle = tone.text;
    ctx.beginPath();
    ctx.arc(134, y - 6, 7, 0, Math.PI * 2);
    ctx.fill();
    drawText(ctx, check.label, 154, y, { size: 19, weight: 800, color: COLORS.ink, maxWidth: 260 });
    drawPill(ctx, check.status, 432, y - 25, 86, 28, tone.bg, tone.text, 14, 14);
    drawText(ctx, `${check.scoreLabel} · ${check.durationLabel}`, 540, y, { size: 17, weight: 700, color: COLORS.muted, maxWidth: 160 });
    drawText(ctx, check.summary, 710, y, { size: 17, weight: 500, color: COLORS.text, maxWidth: 210 });
  });
}

function drawMetricTiles(ctx: CanvasRenderingContext2D, metrics: DetectorReportMetric[]) {
  const visibleMetrics = metrics.slice(0, 6);
  const startX = 996;
  const startY = 668;
  const tileWidth = 242;
  const tileHeight = 98;
  visibleMetrics.forEach((metric, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = startX + col * (tileWidth + 24);
    const y = startY + row * (tileHeight + 12);
    const tone = metric.tone ? toneColors(metric.tone) : { bg: COLORS.surface, text: COLORS.ink };
    drawRoundRect(ctx, x, y, tileWidth, tileHeight, 8, metric.tone ? lighten(tone.bg) : COLORS.surface, COLORS.line);
    drawText(ctx, metric.label, x + 22, y + 32, { size: 17, weight: 800, color: COLORS.muted });
    drawText(ctx, metric.value, x + 22, y + 70, { size: 29, weight: 850, color: COLORS.ink, maxWidth: tileWidth - 44 });
  });
}

function drawFooter(ctx: CanvasRenderingContext2D, report: TransitDetectorReportImageData) {
  ctx.strokeStyle = COLORS.line;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(96, 928);
  ctx.lineTo(1504, 928);
  ctx.stroke();
  drawText(ctx, "PriceAI API 中转模型检测 · 仅作购买前技术参考", 96, 960, { size: 18, weight: 700, color: COLORS.muted });
  drawText(ctx, `${report.id} · ${report.apiKeyMasked}`, 1240, 960, { size: 18, weight: 700, color: COLORS.muted, maxWidth: 260 });
}

function drawInfoCell(
  ctx: CanvasRenderingContext2D,
  label: string,
  value: string,
  x: number,
  y: number,
  width: number,
  isCode = false,
) {
  drawText(ctx, label, x, y, { size: 17, weight: 800, color: COLORS.muted });
  drawText(ctx, value, x, y + 36, {
    size: 20,
    weight: 800,
    color: COLORS.ink,
    maxWidth: width,
    family: isCode ? "mono" : "sans",
  });
}

function drawCountBox(ctx: CanvasRenderingContext2D, label: string, value: string, x: number, y: number, width: number, tone: DetectorReportTone) {
  const colors = toneColors(tone);
  drawRoundRect(ctx, x, y, width, 72, 8, lighten(colors.bg), colors.bg);
  drawText(ctx, label, x + 18, y + 26, { size: 16, weight: 800, color: colors.text });
  drawText(ctx, value, x + 18, y + 58, { size: 28, weight: 850, color: COLORS.ink });
}

function drawPill(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  width: number,
  height: number,
  background: string,
  color: string,
  radius = height / 2,
  fontSize = 18,
) {
  drawRoundRect(ctx, x, y, width, height, radius, background, COLORS.line);
  drawText(ctx, text, x + width / 2, y + height / 2 + fontSize * 0.36, {
    size: fontSize,
    weight: 800,
    color,
    align: "center",
    maxWidth: width - 24,
  });
}

function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fill: string,
  stroke?: string,
) {
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.restore();
}

function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  width: number,
  options: TextOptions & { lineHeight: number; maxLines: number },
) {
  const lines = wrapText(ctx, text, width, options.size, options.weight ?? 500, options.family ?? "sans", options.maxLines);
  lines.forEach((line, index) => {
    drawText(ctx, line, x, y + index * options.lineHeight, options);
  });
}

interface TextOptions {
  size: number;
  weight?: number;
  color: string;
  align?: CanvasTextAlign;
  maxWidth?: number;
  family?: "sans" | "serif" | "mono";
}

function drawText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, options: TextOptions) {
  ctx.save();
  ctx.font = font(options.size, options.weight ?? 500, options.family ?? "sans");
  ctx.fillStyle = options.color;
  ctx.textAlign = options.align ?? "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(text, x, y, options.maxWidth);
  ctx.restore();
}

function measureText(ctx: CanvasRenderingContext2D, text: string, size: number, weight: number) {
  ctx.save();
  ctx.font = font(size, weight, "sans");
  const width = ctx.measureText(text).width;
  ctx.restore();
  return width;
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  size: number,
  weight: number,
  family: TextOptions["family"],
  maxLines: number,
) {
  ctx.save();
  ctx.font = font(size, weight, family ?? "sans");
  const source = text.replace(/\s+/g, " ").trim();
  const lines: string[] = [];
  let line = "";

  for (const char of Array.from(source)) {
    const nextLine = `${line}${char}`;
    if (ctx.measureText(nextLine).width <= maxWidth || !line) {
      line = nextLine;
      continue;
    }
    lines.push(line.trim());
    line = char.trimStart();
    if (lines.length === maxLines) break;
  }

  if (line && lines.length < maxLines) lines.push(line.trim());
  if (lines.length === maxLines && source.length > lines.join("").length) {
    lines[maxLines - 1] = `${lines[maxLines - 1].replace(/[。；，、,.!?！？\s]+$/, "")}...`;
  }

  ctx.restore();
  return lines;
}

function font(size: number, weight: number, family: TextOptions["family"]) {
  if (family === "serif") return `${weight} ${size}px "Noto Serif SC", "Songti SC", "STSong", Georgia, serif`;
  if (family === "mono") return `${weight} ${size}px "SFMono-Regular", Consolas, "Liberation Mono", monospace`;
  return `${weight} ${size}px Manrope, -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", Arial, sans-serif`;
}

function toneColors(tone: DetectorReportTone) {
  if (tone === "success") return { bg: COLORS.successBg, text: COLORS.successText };
  if (tone === "danger") return { bg: COLORS.dangerBg, text: COLORS.dangerText };
  if (tone === "warning") return { bg: COLORS.warningBg, text: COLORS.warningText };
  return { bg: COLORS.mutedBg, text: COLORS.muted };
}

function lighten(color: string) {
  if (color === COLORS.successBg) return "#f4fbf7";
  if (color === COLORS.warningBg) return "#fffaf0";
  if (color === COLORS.dangerBg) return "#fff4f2";
  return "#f7f8f8";
}

function safeFilePart(value: string) {
  return value.replace(/[^a-z0-9_-]+/gi, "-").replace(/^-+|-+$/g, "") || "report";
}
