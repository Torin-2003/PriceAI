"use client";

import { type FormEvent, type ReactNode, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Fingerprint,
  KeyRound,
  Link2,
  Network,
  ShieldAlert,
  SlidersHorizontal,
} from "lucide-react";

type DetectorProtocol = "openai" | "claude" | "gemini";
type DetectorMode = "quick" | "standard" | "deep";
type UpstreamType =
  | "unknown"
  | "official_api"
  | "official_cloud"
  | "subscription_pool"
  | "kiro_claude_code"
  | "reverse_client"
  | "mixed_pool";

type StatusTone = "pending" | "ready" | "muted" | "warn";
type TaskStatus = "idle" | "submitting" | "running" | "done" | "error";

interface DetectorStatusPayload {
  job_id?: string;
  status?: "queued" | "running" | "done" | "error";
  status_url?: string;
  result_url?: string;
  image_url?: string;
  json_url?: string;
  error?: string;
  detail?: string;
}

interface DetectorClientProps {
  serviceUrl?: string;
}

const protocolOptions: Array<{ value: DetectorProtocol; label: string; hint: string }> = [
  { value: "openai", label: "OpenAI 兼容", hint: "适合大多数 OpenAI 格式的中转接口" },
  { value: "claude", label: "Claude", hint: "适合 Anthropic / Claude 格式接口" },
  { value: "gemini", label: "Gemini", hint: "适合 Google Gemini 兼容接口" },
];

const modeOptions: Array<{ value: DetectorMode; label: string; hint: string }> = [
  { value: "quick", label: "快速", hint: "核验协议、模型名和基础响应" },
  { value: "standard", label: "标准", hint: "加入能力指纹和计费口径检查" },
  { value: "deep", label: "深度", hint: "增加多轮、长上下文和稳定性采样" },
];

const upstreamOptions: Array<{ value: UpstreamType; label: string; detail: string }> = [
  { value: "unknown", label: "暂不确定", detail: "先按未知来源处理，结论会更保守。" },
  { value: "official_api", label: "官方 API 转发", detail: "重点核验模型能力、Token 用量和响应特征。" },
  { value: "official_cloud", label: "Bedrock / Vertex 等官方云", detail: "区分云厂商网关特征，不简单判定为假模型。" },
  { value: "subscription_pool", label: "订阅账号池", detail: "关注上下文限制、并发限制和账号池波动。" },
  { value: "kiro_claude_code", label: "Kiro / Claude Code 账号转 API", detail: "关注账号通道限额、封禁和上下文差异。" },
  { value: "reverse_client", label: "客户端逆向", detail: "风险最高，需要加强异常、限流和稳定性检测。" },
  { value: "mixed_pool", label: "混合线路", detail: "需要多次采样，不同请求可能命中不同上游。" },
];

const modelPlaceholders: Record<DetectorProtocol, string> = {
  openai: "输入要检测的模型名，例如 gpt-4o",
  claude: "输入要检测的模型名，例如 claude-sonnet-4",
  gemini: "输入要检测的模型名，例如 gemini-2.5-pro",
};

export function TransitDetectorClient({ serviceUrl = "" }: DetectorClientProps) {
  const runIdRef = useRef(0);
  const [protocol, setProtocol] = useState<DetectorProtocol>("openai");
  const [mode, setMode] = useState<DetectorMode>("standard");
  const [upstream, setUpstream] = useState<UpstreamType>("unknown");
  const [baseUrl, setBaseUrl] = useState("");
  const [model, setModel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [longContext, setLongContext] = useState(false);
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);
  const [taskStatus, setTaskStatus] = useState<TaskStatus>("idle");
  const [taskMessage, setTaskMessage] = useState("填写参数后开始检测，结果会在这里更新。");
  const [jobId, setJobId] = useState("");
  const [resultUrl, setResultUrl] = useState("");

  const normalizedServiceUrl = serviceUrl.trim().replace(/\/$/, "");
  const serviceConnected = Boolean(normalizedServiceUrl);
  const canSubmit = serviceConnected && Boolean(baseUrl.trim() && apiKey.trim() && model.trim());

  const selectedProtocol = protocolOptions.find((item) => item.value === protocol) ?? protocolOptions[0];
  const selectedMode = modeOptions.find((item) => item.value === mode) ?? modeOptions[1];
  const selectedUpstream = upstreamOptions.find((item) => item.value === upstream) ?? upstreamOptions[0];

  const scopeRows = useMemo(
    () => [
      {
        label: "协议类型",
        value: selectedProtocol.label,
        detail: selectedProtocol.hint,
      },
      {
        label: "模型名",
        value: model.trim() || "未填写",
        detail: "检测会以这个模型名向中转接口发起请求。",
      },
      {
        label: "线路类型",
        value: selectedUpstream.label,
        detail: selectedUpstream.detail,
      },
      {
        label: "检测强度",
        value: selectedMode.label,
        detail: selectedMode.hint,
      },
      {
        label: "长上下文",
        value: longContext && protocol !== "gemini" ? "开启" : "关闭",
        detail: longContext && protocol !== "gemini" ? "会消耗更多额度，用于确认上下文上限。" : "默认先做低消耗检测。",
      },
    ],
    [longContext, model, protocol, selectedMode, selectedProtocol, selectedUpstream],
  );

  function handleProtocolChange(nextProtocol: DetectorProtocol) {
    setProtocol(nextProtocol);
    if (nextProtocol === "gemini") {
      setLongContext(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextRunId = runIdRef.current + 1;
    runIdRef.current = nextRunId;
    setSubmittedAt(new Date().toLocaleString("zh-CN", { hour12: false }));
    setResultUrl("");
    setJobId("");

    if (!normalizedServiceUrl) {
      setTaskStatus("error");
      setTaskMessage("检测服务未连接，暂时不能提交任务。");
      return;
    }

    setTaskStatus("submitting");
    setTaskMessage("正在提交检测任务。");

    try {
      const payload = new FormData();
      payload.set("base_url", baseUrl.trim());
      payload.set("api_key", apiKey.trim());
      payload.set("model", model.trim());
      payload.set("mode", mode === "deep" ? "full" : mode);
      if (protocol !== "gemini") {
        payload.set("include_long_context", longContext ? "true" : "false");
        payload.set("include_long_context_extreme", "false");
      }

      const response = await fetch(`${normalizedServiceUrl}/api/detect/${protocol}`, {
        method: "POST",
        body: payload,
      });
      const data = (await response.json().catch(() => ({}))) as DetectorStatusPayload;
      if (!response.ok) {
        throw new Error(data.detail || data.error || "检测后端拒绝了这次请求。");
      }
      if (!data.job_id || !data.status_url) {
        throw new Error("检测后端没有返回任务编号。");
      }
      if (runIdRef.current !== nextRunId) return;

      setJobId(data.job_id);
      setTaskStatus("running");
      setTaskMessage("检测任务已创建，正在等待报告返回。");
      await pollDetectorJob(data.status_url, nextRunId);
    } catch (error) {
      if (runIdRef.current !== nextRunId) return;
      setTaskStatus("error");
      setTaskMessage(error instanceof Error ? error.message : "检测提交失败，请稍后再试。");
    }
  }

  async function pollDetectorJob(statusUrl: string, runId: number) {
    const statusEndpoint = statusUrl.startsWith("http") ? statusUrl : `${normalizedServiceUrl}${statusUrl}`;

    for (let attempt = 0; attempt < 90; attempt += 1) {
      await sleep(attempt < 3 ? 1000 : 2500);
      if (runIdRef.current !== runId) return;

      const response = await fetch(statusEndpoint, { cache: "no-store" });
      const data = (await response.json().catch(() => ({}))) as DetectorStatusPayload;
      if (!response.ok) {
        throw new Error(data.detail || data.error || "读取检测状态失败。");
      }

      if (data.status === "done") {
        const nextResultUrl = data.result_url
          ? data.result_url.startsWith("http")
            ? data.result_url
            : `${normalizedServiceUrl}${data.result_url}`
          : "";
        if (runIdRef.current !== runId) return;
        setTaskStatus("done");
        setTaskMessage("检测完成，报告已经返回。");
        setResultUrl(nextResultUrl);
        return;
      }

      if (data.status === "error") {
        throw new Error(data.error || "检测任务失败。");
      }

      if (runIdRef.current === runId) {
        setTaskStatus(data.status === "queued" ? "submitting" : "running");
        setTaskMessage(data.status === "queued" ? "任务排队中。" : "检测运行中，通常需要 30 到 90 秒。");
      }
    }

    throw new Error("检测等待超时，稍后可用任务编号查询报告。");
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,0.68fr)_minmax(360px,0.32fr)]">
      <section className="rounded-lg bg-white ring-1 ring-[#adb3b4]/15">
        <div className="border-b border-[#edf0f1] px-5 py-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[#202829]">检测任务</h2>
              <p className="mt-1 text-sm leading-6 text-[#5a6061]">建议使用低余额、可撤销的临时 Key。检测完成后可打开独立报告查看详细证据。</p>
            </div>
            <StatusPill tone={serviceConnected ? "ready" : "warn"}>
              {serviceConnected ? "检测服务已连接" : "检测服务未连接"}
            </StatusPill>
          </div>
        </div>

        <form className="space-y-5 px-5 py-5" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm font-semibold text-[#202829]">接口协议</label>
            <div className="grid gap-2 md:grid-cols-3">
              {protocolOptions.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => handleProtocolChange(item.value)}
                  className={`min-h-20 rounded-lg border px-3 py-3 text-left transition ${
                    protocol === item.value
                      ? "border-[#45bf78]/60 bg-[#edf8f1] text-[#202829]"
                      : "border-[#dfe4e5] bg-[#f9f9f9] text-[#5a6061] hover:border-[#adb3b4]"
                  }`}
                >
                  <span className="block text-sm font-semibold">{item.label}</span>
                  <span className="mt-1 block text-xs leading-5">{item.hint}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(220px,0.45fr)]">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-[#202829]">Base URL</span>
              <input
                value={baseUrl}
                onChange={(event) => setBaseUrl(event.target.value)}
                placeholder="输入中转站接口地址"
                className="h-11 w-full rounded-lg border border-[#dfe4e5] bg-white px-3 text-sm text-[#202829] outline-none transition placeholder:text-[#7a8284] focus:border-[#45bf78]"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-[#202829]">模型名</span>
              <input
                value={model}
                onChange={(event) => setModel(event.target.value)}
                placeholder={modelPlaceholders[protocol]}
                className="h-11 w-full rounded-lg border border-[#dfe4e5] bg-white px-3 text-sm text-[#202829] outline-none transition placeholder:text-[#7a8284] focus:border-[#45bf78]"
              />
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(220px,0.45fr)]">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-[#202829]">检测 Key</span>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5a6061]" />
                <input
                  value={apiKey}
                  onChange={(event) => setApiKey(event.target.value)}
                  type="password"
                  autoComplete="off"
                  placeholder="粘贴临时 Key"
                  className="h-11 w-full rounded-lg border border-[#dfe4e5] bg-white pl-9 pr-3 text-sm text-[#202829] outline-none transition placeholder:text-[#7a8284] focus:border-[#45bf78]"
                />
              </div>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-[#202829]">线路类型</span>
              <select
                value={upstream}
                onChange={(event) => setUpstream(event.target.value as UpstreamType)}
                className="h-11 w-full rounded-lg border border-[#dfe4e5] bg-white px-3 text-sm font-medium text-[#202829] outline-none transition focus:border-[#45bf78]"
              >
                {upstreamOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-[#202829]">检测强度</label>
            <div className="grid gap-2 md:grid-cols-3">
              {modeOptions.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setMode(item.value)}
                  className={`rounded-lg border px-3 py-3 text-left transition ${
                    mode === item.value
                      ? "border-[#45bf78]/60 bg-[#edf8f1] text-[#202829]"
                      : "border-[#dfe4e5] bg-[#f9f9f9] text-[#5a6061] hover:border-[#adb3b4]"
                  }`}
                >
                  <span className="block text-sm font-semibold">{item.label}</span>
                  <span className="mt-1 block text-xs leading-5">{item.hint}</span>
                </button>
              ))}
            </div>
          </div>

          <label
            className={`flex min-h-14 items-center justify-between gap-3 rounded-lg border border-[#dfe4e5] bg-[#f9f9f9] px-3 py-3 text-sm text-[#202829] ${
              protocol === "gemini" ? "opacity-65" : "cursor-pointer"
            }`}
          >
            <span className="min-w-0">
              <span className="block font-semibold">长上下文测试</span>
              <span className="mt-0.5 block text-xs leading-5 text-[#5a6061]">
                {protocol === "gemini" ? "Gemini 线路暂不启用这一项。" : "会消耗更多额度，仅在需要确认上下文上限时开启。"}
              </span>
            </span>
            <input
              type="checkbox"
              checked={longContext}
              disabled={protocol === "gemini"}
              onChange={(event) => setLongContext(event.target.checked)}
              className="h-4 w-4 shrink-0 accent-[#45bf78]"
            />
          </label>

          <div className="flex flex-col gap-3 border-t border-[#edf0f1] pt-4 md:flex-row md:items-center md:justify-between">
            <p className="max-w-[620px] text-xs leading-5 text-[#5a6061]">
              PriceAI 主站只负责发起任务和展示报告入口。Key 会随请求提交给独立检测服务，不会写入 PriceAI 数据库。
            </p>
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#202829] px-5 text-sm font-semibold text-white transition hover:bg-[#2d3435] disabled:cursor-not-allowed disabled:bg-[#adb3b4]"
              disabled={!canSubmit || taskStatus === "submitting" || taskStatus === "running"}
            >
              <SlidersHorizontal className="h-4 w-4" />
              {submitLabel(taskStatus, serviceConnected)}
            </button>
          </div>
        </form>
      </section>

      <aside className="space-y-5">
        <section className="rounded-lg bg-white ring-1 ring-[#adb3b4]/15">
          <div className="border-b border-[#edf0f1] px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-[#202829]">检测结果</h2>
                <p className="mt-1 text-sm leading-6 text-[#5a6061]">报告返回后，这里会保留任务状态和报告入口。</p>
              </div>
              <StatusPill tone={taskTone(taskStatus)}>{statusLabel(taskStatus)}</StatusPill>
            </div>
          </div>

          <div className="px-5 py-4">
            <div className="rounded-lg bg-[#f9f9f9] px-3 py-3 text-sm leading-6 text-[#5a6061] ring-1 ring-[#adb3b4]/12">
              <div className="flex items-start gap-2">
                {taskStatus === "error" ? (
                  <AlertCircle className="mt-1 h-4 w-4 shrink-0 text-[#9b3328]" />
                ) : taskStatus === "done" ? (
                  <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[#278a57]" />
                ) : (
                  <Clock3 className="mt-1 h-4 w-4 shrink-0 text-[#5a6061]" />
                )}
                <div className="min-w-0">
                  <p className="font-medium text-[#202829]">{taskMessage}</p>
                  {submittedAt ? <p className="mt-1 text-xs text-[#5a6061]">提交时间：{submittedAt}</p> : null}
                  {jobId ? <p className="mt-1 break-all text-xs text-[#5a6061]">任务编号：{jobId}</p> : null}
                  {resultUrl ? (
                    <a
                      href={resultUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex font-semibold text-[#278a57] hover:text-[#202829]"
                    >
                      打开检测报告
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-[#edf0f1]">
            {scopeRows.map((row) => (
              <div key={row.label} className="grid grid-cols-[84px_minmax(0,1fr)] gap-3 border-b border-[#edf0f1] px-5 py-3 last:border-b-0">
                <span className="text-xs font-semibold text-[#5a6061]">{row.label}</span>
                <div className="min-w-0">
                  <p className="break-words text-sm font-semibold text-[#202829]">{row.value}</p>
                  <p className="mt-0.5 text-xs leading-5 text-[#5a6061]">{row.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg bg-white p-5 ring-1 ring-[#adb3b4]/15">
          <h2 className="text-base font-semibold text-[#202829]">检测口径</h2>
          <div className="mt-4 space-y-3">
            <PrincipleItem icon={<Fingerprint className="h-4 w-4" />} title="能力指纹" text="用能力边界和协议细节判断是否只是套壳。" />
            <PrincipleItem icon={<Link2 className="h-4 w-4" />} title="同题基线" text="把官方或可信线路作为参照，不只看一次回答像不像。" />
            <PrincipleItem icon={<ShieldAlert className="h-4 w-4" />} title="来源风险" text="官方 API、云厂商、账号池、逆向线路会分开标注。" />
            <PrincipleItem icon={<Network className="h-4 w-4" />} title="多次采样" text="混合池和账号池需要重复请求，单次结果不能直接下结论。" />
          </div>
        </section>
      </aside>
    </div>
  );
}

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function StatusPill({ tone, children }: { tone: StatusTone; children: string }) {
  const className =
    tone === "ready"
      ? "bg-[#edf8f1] text-[#278a57] ring-[#45bf78]/20"
      : tone === "warn"
        ? "bg-[#fff6e8] text-[#8a4c00] ring-[#e7b65d]/30"
        : tone === "muted"
          ? "bg-[#f2f4f4] text-[#5a6061] ring-[#dfe4e5]"
          : "bg-[#eef3f4] text-[#41666b] ring-[#c9d8da]";

  return (
    <span className={`inline-flex h-7 shrink-0 items-center rounded-full px-2.5 text-xs font-semibold ring-1 ${className}`}>
      {children}
    </span>
  );
}

function taskTone(status: TaskStatus): StatusTone {
  if (status === "done") return "ready";
  if (status === "error") return "warn";
  if (status === "idle") return "muted";
  return "pending";
}

function statusLabel(status: TaskStatus) {
  if (status === "submitting") return "提交中";
  if (status === "running") return "检测中";
  if (status === "done") return "已完成";
  if (status === "error") return "失败";
  return "未开始";
}

function submitLabel(status: TaskStatus, serviceConnected: boolean) {
  if (!serviceConnected) return "检测服务未连接";
  if (status === "submitting") return "提交中";
  if (status === "running") return "检测中";
  if (status === "done") return "重新检测";
  return "开始检测";
}

function PrincipleItem({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 text-[#45bf78]">{icon}</div>
      <div>
        <p className="text-sm font-semibold text-[#202829]">{title}</p>
        <p className="mt-0.5 text-xs leading-5 text-[#5a6061]">{text}</p>
      </div>
    </div>
  );
}
