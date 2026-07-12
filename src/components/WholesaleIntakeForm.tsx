"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  Building2,
  CheckCircle2,
  CircleDollarSign,
  FileCheck2,
  Loader2,
  PackageSearch,
  Send,
  ServerCog,
  Store,
} from "lucide-react";

type WholesaleRole = "buyer" | "seller";
type WholesaleDirection = "api_transit" | "subscription_channel" | "other";

type FormState = {
  role: WholesaleRole;
  direction: WholesaleDirection;
  title: string;
  contact: string;
  identityType: string;
  target: string;
  volume: string;
  budget: string;
  acceptableSources: string;
  sourceDescription: string;
  minimumOrder: string;
  pricing: string;
  testRequirement: string;
  afterSales: string;
  evidenceSummary: string;
  proofUrl: string;
  notes: string;
  website: string;
};

type SubmitState =
  | { type: "success"; message: string }
  | { type: "error"; message: string }
  | null;

const ROLE_OPTIONS: Array<{
  value: WholesaleRole;
  label: string;
  description: string;
  icon: typeof PackageSearch;
}> = [
  {
    value: "buyer",
    label: "我是买方",
    description: "一级代理、企业采购或稳定需求方",
    icon: PackageSearch,
  },
  {
    value: "seller",
    label: "我是源头",
    description: "中转站、卡网商家或其他可验证供给方",
    icon: Store,
  },
];

const DIRECTION_OPTIONS: Array<{
  value: WholesaleDirection;
  label: string;
  description: string;
  icon: typeof ServerCog;
}> = [
  {
    value: "api_transit",
    label: "API 中转批发",
    description: "站点额度、模型通道、企业接口",
    icon: ServerCog,
  },
  {
    value: "subscription_channel",
    label: "卡网/订阅渠道",
    description: "成品账号、订阅、兑换码或渠道货源",
    icon: CircleDollarSign,
  },
  {
    value: "other",
    label: "其他源头",
    description: "暂不归类但能提供证明的供需线索",
    icon: FileCheck2,
  },
];

const BUYER_IDENTITY_OPTIONS = ["一级代理", "二级代理", "企业采购", "团队采购", "其他需求方"];
const SELLER_IDENTITY_OPTIONS = ["中转站", "卡网商家", "订阅渠道", "账号/额度源头", "其他供给方"];

const INITIAL_FORM: FormState = {
  role: "buyer",
  direction: "api_transit",
  title: "",
  contact: "",
  identityType: "",
  target: "",
  volume: "",
  budget: "",
  acceptableSources: "",
  sourceDescription: "",
  minimumOrder: "",
  pricing: "",
  testRequirement: "",
  afterSales: "",
  evidenceSummary: "",
  proofUrl: "",
  notes: "",
  website: "",
};

export function WholesaleIntakeForm() {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [submitState, setSubmitState] = useState<SubmitState>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isBuyer = form.role === "buyer";
  const identityOptions = isBuyer ? BUYER_IDENTITY_OPTIONS : SELLER_IDENTITY_OPTIONS;
  const copy = useMemo(
    () =>
      isBuyer
        ? {
            title: "需求标题",
            titlePlaceholder: "例如：企业 API 中转月付采购",
            target: "采购需求",
            targetPlaceholder: "写清楚想要的模型、账号类型、额度、地区或使用场景",
            volume: "预计月量/批量",
            volumePlaceholder: "例如：月消耗 2 万美元、每月 200 个订阅号",
            budget: "预算/结算偏好",
            budgetPlaceholder: "例如：按月结算、可预付、希望阶梯价",
            evidence: "需求真实性说明",
            evidencePlaceholder: "例如：企业主体、历史采购量、可接受的验真方式",
            proof: "业务证明链接（可选）",
          }
        : {
            title: "供给标题",
            titlePlaceholder: "例如：OpenAI 中转站稳定批发线",
            target: "可供给内容",
            targetPlaceholder: "写清楚可供给的产品、模型、订阅、额度或资源范围",
            volume: "稳定供给量",
            volumePlaceholder: "例如：每日可开 100 个账号、接口稳定承载 200 QPS",
            budget: "批发价格/结算方式",
            budgetPlaceholder: "例如：按量折扣、周结、月结、最低充值",
            evidence: "源头证明说明",
            evidencePlaceholder: "例如：后台截图、历史订单、可测试额度、渠道授权信息",
            proof: "源头/业务证明链接（可选）",
          },
    [isBuyer],
  );

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitState(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/wholesale-submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await response.json().catch(() => null)) as {
        ok?: boolean;
        message?: string;
      } | null;

      if (!response.ok || !data?.ok) {
        throw new Error(data?.message || "提交失败，请稍后再试。");
      }

      setSubmitState({
        type: "success",
        message: "已收到，我们会先把线索进入后台池，后续人工核验后再决定是否撮合。",
      });
      setForm((current) => ({
        ...INITIAL_FORM,
        role: current.role,
        direction: current.direction,
      }));
    } catch (error) {
      setSubmitState({
        type: "error",
        message: error instanceof Error ? error.message : "提交失败，请稍后再试。",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
      onSubmit={handleSubmit}
    >
      <div className="flex flex-col gap-2 border-b border-slate-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">提交批发线索</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            先收集需求和源头，不做公开展示、不承诺担保，后台人工判断。
          </p>
        </div>
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">
          <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
          MVP 线索池
        </span>
      </div>

      <div className="mt-5 space-y-5">
        <fieldset>
          <legend className="text-sm font-semibold text-slate-900">你的角色</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {ROLE_OPTIONS.map((option) => {
              const Icon = option.icon;
              const active = form.role === option.value;
              return (
                <button
                  aria-pressed={active}
                  className={`flex min-h-20 items-start gap-3 rounded-lg border p-3 text-left transition ${
                    active
                      ? "border-slate-950 bg-slate-950 text-white"
                      : "border-slate-200 bg-white text-slate-900 hover:border-slate-400"
                  }`}
                  key={option.value}
                  type="button"
                  onClick={() => updateField("role", option.value)}
                >
                  <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                  <span>
                    <span className="block text-sm font-semibold">{option.label}</span>
                    <span
                      className={`mt-1 block text-xs leading-5 ${
                        active ? "text-slate-200" : "text-slate-500"
                      }`}
                    >
                      {option.description}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-sm font-semibold text-slate-900">批发方向</legend>
          <div className="mt-2 grid gap-2 lg:grid-cols-3">
            {DIRECTION_OPTIONS.map((option) => {
              const Icon = option.icon;
              const active = form.direction === option.value;
              return (
                <button
                  aria-pressed={active}
                  className={`flex min-h-24 items-start gap-3 rounded-lg border p-3 text-left transition ${
                    active
                      ? "border-emerald-700 bg-emerald-50 text-emerald-950"
                      : "border-slate-200 bg-white text-slate-900 hover:border-slate-400"
                  }`}
                  key={option.value}
                  type="button"
                  onClick={() => updateField("direction", option.value)}
                >
                  <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                  <span>
                    <span className="block text-sm font-semibold">{option.label}</span>
                    <span className="mt-1 block text-xs leading-5 text-slate-600">
                      {option.description}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label={copy.title}
            name="title"
            onChange={(value) => updateField("title", value)}
            placeholder={copy.titlePlaceholder}
            required
            value={form.title}
          />
          <SelectField
            label={isBuyer ? "买方身份" : "供给方身份"}
            name="identityType"
            onChange={(value) => updateField("identityType", value)}
            options={identityOptions}
            value={form.identityType}
          />
        </div>

        <TextareaField
          label={copy.target}
          name="target"
          onChange={(value) => updateField("target", value)}
          placeholder={copy.targetPlaceholder}
          required
          rows={4}
          value={form.target}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label={copy.volume}
            name="volume"
            onChange={(value) => updateField("volume", value)}
            placeholder={copy.volumePlaceholder}
            value={form.volume}
          />
          <TextField
            label={copy.budget}
            name={isBuyer ? "budget" : "pricing"}
            onChange={(value) =>
              isBuyer ? updateField("budget", value) : updateField("pricing", value)
            }
            placeholder={copy.budgetPlaceholder}
            value={isBuyer ? form.budget : form.pricing}
          />
        </div>

        {isBuyer ? (
          <TextareaField
            label="可接受的来源类型"
            name="acceptableSources"
            onChange={(value) => updateField("acceptableSources", value)}
            placeholder="例如：只接受可测试中转站；可接受卡网订阅；不接受来路不明账号"
            rows={3}
            value={form.acceptableSources}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <TextareaField
              label="源头说明"
              name="sourceDescription"
              onChange={(value) => updateField("sourceDescription", value)}
              placeholder="说明资源来源、稳定性、交付方式和可验证范围"
              rows={4}
              value={form.sourceDescription}
            />
            <TextField
              label="起批门槛"
              name="minimumOrder"
              onChange={(value) => updateField("minimumOrder", value)}
              placeholder="例如：100 个起、500 美元起、月付起"
              value={form.minimumOrder}
            />
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="测试/验真方式"
            name="testRequirement"
            onChange={(value) => updateField("testRequirement", value)}
            placeholder={isBuyer ? "例如：需要 1 天测试额度" : "例如：可提供小额测试或后台截图"}
            value={form.testRequirement}
          />
          <TextField
            label="售后/风险边界"
            name="afterSales"
            onChange={(value) => updateField("afterSales", value)}
            placeholder={isBuyer ? "例如：希望坏号可补" : "例如：售后 24 小时内补发，不兜底封号"}
            value={form.afterSales}
          />
        </div>

        <TextareaField
          label={copy.evidence}
          name="evidenceSummary"
          onChange={(value) => updateField("evidenceSummary", value)}
          placeholder={copy.evidencePlaceholder}
          rows={3}
          value={form.evidenceSummary}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label={copy.proof}
            name="proofUrl"
            onChange={(value) => updateField("proofUrl", value)}
            placeholder="https://..."
            type="url"
            value={form.proofUrl}
          />
          <TextField
            label="联系方式"
            name="contact"
            onChange={(value) => updateField("contact", value)}
            placeholder="微信、Telegram、邮箱或企业微信"
            required
            value={form.contact}
          />
        </div>

        <TextareaField
          label="补充说明"
          name="notes"
          onChange={(value) => updateField("notes", value)}
          placeholder="任何需要人工判断的信息都可以补充在这里"
          rows={3}
          value={form.notes}
        />

        <input
          autoComplete="off"
          className="hidden"
          name="website"
          tabIndex={-1}
          value={form.website}
          onChange={(event) => updateField("website", event.target.value)}
        />

        {submitState ? (
          <div
            className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${
              submitState.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-rose-200 bg-rose-50 text-rose-900"
            }`}
            role="status"
          >
            {submitState.type === "success" ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            ) : (
              <FileCheck2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            )}
            <span>{submitState.message}</span>
          </div>
        ) : null}

        <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-5 text-slate-500">
            提交后进入后台线索池。PriceAI 目前只做信息收集和人工核验，不做资金托管或成交担保。
          </p>
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="h-4 w-4" aria-hidden="true" />
            )}
            {isSubmitting ? "提交中" : "提交线索"}
          </button>
        </div>
      </div>
    </form>
  );
}

function TextField({
  label,
  name,
  onChange,
  placeholder,
  required,
  type = "text",
  value,
}: {
  label: string;
  name: keyof FormState;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
  value: string;
}) {
  return (
    <label className="block text-sm font-medium text-slate-900">
      {label}
      {required ? <span className="ml-1 text-rose-600">*</span> : null}
      <input
        className="mt-1 block min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
        name={name}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        type={type}
        value={value}
      />
    </label>
  );
}

function SelectField({
  label,
  name,
  onChange,
  options,
  value,
}: {
  label: string;
  name: keyof FormState;
  onChange: (value: string) => void;
  options: string[];
  value: string;
}) {
  return (
    <label className="block text-sm font-medium text-slate-900">
      {label}
      <select
        className="mt-1 block min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
        name={name}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        <option value="">请选择</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextareaField({
  label,
  name,
  onChange,
  placeholder,
  required,
  rows = 3,
  value,
}: {
  label: string;
  name: keyof FormState;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  rows?: number;
  value: string;
}) {
  return (
    <label className="block text-sm font-medium text-slate-900">
      {label}
      {required ? <span className="ml-1 text-rose-600">*</span> : null}
      <textarea
        className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm leading-6 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
        name={name}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        rows={rows}
        value={value}
      />
    </label>
  );
}
