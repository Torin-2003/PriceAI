"use client";

import { ArrowUpDown, ExternalLink, Info, Search, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import {
  apiCompatibilityOptions,
  apiModelFxSummary,
  apiModelOffers,
  apiModelUpdatedAt,
  apiProviderTypeDescriptions,
  apiProviderTypeLabels,
  formatApiPrice,
  formatUsdAmount,
  type ApiCurrency,
  type ApiModelOffer,
  type ApiProviderType,
} from "@/lib/api-models";

const typeFilters = ["all", "official", "router", "free", "subscription"] as const;
type TypeFilter = (typeof typeFilters)[number];
type CompatibilityFilter = (typeof apiCompatibilityOptions)[number];

const typeFilterLabels: Record<TypeFilter, string> = {
  all: "全部类型",
  official: apiProviderTypeLabels.official,
  router: apiProviderTypeLabels.router,
  free: apiProviderTypeLabels.free,
  subscription: apiProviderTypeLabels.subscription,
};

export function ApiModelsExplorer() {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [compatibilityFilter, setCompatibilityFilter] = useState<CompatibilityFilter>("全部");
  const [currency, setCurrency] = useState<ApiCurrency>("CNY");

  const normalizedQuery = query.trim().toLowerCase();
  const rows = apiModelOffers.filter((offer) => {
    const haystack = [
      offer.modelName,
      offer.modelFamily,
      offer.providerName,
      offer.billingMode,
      offer.freeOrPlan,
      offer.limitations,
      ...offer.compatibility,
      ...offer.suitableTools,
    ]
      .join(" ")
      .toLowerCase();

    if (normalizedQuery && !haystack.includes(normalizedQuery)) return false;
    if (typeFilter !== "all" && offer.providerType !== typeFilter) return false;
    if (compatibilityFilter !== "全部" && !offer.compatibility.includes(compatibilityFilter)) return false;
    return true;
  });

  const providerCount = new Set(apiModelOffers.map((offer) => offer.providerName)).size;
  const freeCount = apiModelOffers.filter((offer) => offer.providerType === "free" || offer.compatibility.includes("免费/测试")).length;
  const officialCount = apiModelOffers.filter((offer) => offer.providerType === "official").length;

  return (
    <main className="mx-auto max-w-[1500px] px-5 py-6 sm:px-8 md:py-10 lg:py-12">
      <div className="mb-8 grid gap-5 lg:grid-cols-[minmax(0,1fr)_390px] lg:items-end">
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-normal text-[#202829] md:text-4xl">
            API 模型雷达
          </h1>
          <p className="mt-3 max-w-[75ch] text-sm leading-7 text-[#5a6061]">
            整理官方 API、公开模型路由、免费测试入口和订阅型 API 套餐，先帮你判断某个模型能从哪里调用、限制是什么、是否适合接到 Codex、Cursor、OpenCode 或自建工具里。
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-[0.72rem] font-medium text-[#5a6061]">
            <span>人工维护样本：{apiModelUpdatedAt}</span>
            <span className="h-1 w-1 rounded-full bg-[#adb3b4]" />
            <span>默认币种：人民币</span>
            <span className="h-1 w-1 rounded-full bg-[#adb3b4]" />
            <span>汇率日期：{apiModelFxSummary.date}</span>
          </div>
        </div>

        <div className="rounded-lg bg-[#eef3f8] p-4 text-sm leading-6 text-[#47657a] ring-1 ring-[#cfdae4]">
          <div className="flex items-start gap-2">
            <Info size={17} className="mt-0.5 shrink-0" />
            <p>
              P0 只收官方或公开文档可验证渠道。不收灰色中转。免费入口必须同时看限流、排队、模型上下线和用途边界。
            </p>
          </div>
        </div>
      </div>

      <section className="mb-6 grid gap-3 md:grid-cols-4">
        <Metric label="模型渠道组合" value={`${apiModelOffers.length}`} helper="模型 + 渠道口径" />
        <Metric label="来源渠道" value={`${providerCount}`} helper="官方、路由、免费、套餐" />
        <Metric label="官方 API" value={`${officialCount}`} helper="用于价格基准" />
        <Metric label="免费/测试" value={`${freeCount}`} helper="需关注限制" />
      </section>

      <section className="mb-6 space-y-3 rounded-lg bg-[#edf0f1] p-3 ring-1 ring-[#adb3b4]/15">
        <div className="grid gap-3 lg:grid-cols-[minmax(280px,1fr)_auto] lg:items-center">
          <label className="flex h-12 min-w-0 items-center gap-2 rounded-full bg-white px-4 shadow-[0_16px_45px_rgba(45,52,53,0.04)] ring-1 ring-[#adb3b4]/15">
            <Search size={16} className="shrink-0 text-[#5a6061]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索 DeepSeek、Qwen、Kimi、GLM、OpenRouter..."
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#9aa2a3]"
            />
          </label>

          <div className="inline-flex h-12 rounded-full bg-white p-1 shadow-[0_12px_36px_rgba(45,52,53,0.04)] ring-1 ring-[#adb3b4]/15">
            {(["CNY", "USD"] as ApiCurrency[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCurrency(item)}
                className={`h-10 rounded-full px-4 text-sm font-semibold transition ${
                  currency === item ? "bg-[#2d3435] text-[#f8f8f8]" : "text-[#5a6061] hover:bg-[#edf0f1] hover:text-[#202829]"
                }`}
              >
                {item === "CNY" ? "人民币" : "美元"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {typeFilters.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTypeFilter(item)}
              aria-label={`类型筛选：${typeFilterLabels[item]}`}
              className={`inline-flex h-10 shrink-0 items-center rounded-full px-4 text-sm font-semibold transition ${
                typeFilter === item
                  ? "bg-[#2d3435] text-[#f8f8f8] shadow-[0_10px_30px_rgba(45,52,53,0.10)]"
                  : "bg-white text-[#5a6061] ring-1 ring-[#adb3b4]/15 hover:bg-[#f7f9f9] hover:text-[#202829]"
              }`}
            >
              {typeFilterLabels[item]}
            </button>
          ))}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {apiCompatibilityOptions.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCompatibilityFilter(item)}
              aria-label={`兼容性筛选：${item}`}
              className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold transition ${
                compatibilityFilter === item
                  ? "bg-[#dde4e5] text-[#202829]"
                  : "bg-white text-[#5a6061] ring-1 ring-[#adb3b4]/15 hover:bg-[#f7f9f9] hover:text-[#202829]"
              }`}
            >
              <SlidersHorizontal size={13} />
              {item}
            </button>
          ))}
        </div>
      </section>

      <section className="mb-5 grid gap-3 lg:grid-cols-[1fr_1fr_1fr]">
        {(["official", "router", "free"] as ApiProviderType[]).map((type) => (
          <div key={type} className="rounded-lg bg-white p-4 text-sm leading-6 text-[#5a6061] ring-1 ring-[#adb3b4]/15">
            <p className="font-semibold text-[#202829]">{apiProviderTypeLabels[type]}</p>
            <p className="mt-1">{apiProviderTypeDescriptions[type]}</p>
          </div>
        ))}
      </section>

      <section className="overflow-hidden rounded-lg bg-white shadow-[0_20px_55px_rgba(45,52,53,0.045)] ring-1 ring-[#adb3b4]/15">
        <div className="flex items-center justify-between gap-3 border-b border-[#edf0f1] px-5 py-4">
          <div>
            <p className="text-sm font-bold text-[#202829]">模型渠道列表</p>
            <p className="mt-1 text-xs text-[#5a6061]">
              当前显示 {rows.length} 条，价格以来源页面为准，未确认数字不会补估算。
            </p>
          </div>
          <div className="hidden items-center gap-1.5 rounded-full bg-[#edf0f1] px-3 py-1.5 text-xs font-semibold text-[#5a6061] sm:inline-flex">
            <ArrowUpDown size={13} />
            表格优先
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1520px] w-full border-collapse text-left text-sm">
            <thead className="bg-[#f2f4f4] text-[0.68rem] font-semibold text-[#5a6061]">
              <tr>
                <TableHead>模型</TableHead>
                <TableHead>渠道</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>输入价</TableHead>
                <TableHead>输出价</TableHead>
                <TableHead>缓存价/说明</TableHead>
                <TableHead>免费/套餐额度</TableHead>
                <TableHead>限制</TableHead>
                <TableHead>兼容性</TableHead>
                <TableHead>适合工具</TableHead>
                <TableHead>来源</TableHead>
                <TableHead>更新时间</TableHead>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edf0f1]">
              {rows.map((offer) => (
                <ApiOfferRow key={offer.id} offer={offer} currency={currency} />
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {!rows.length ? (
        <div className="mt-4 rounded-lg bg-white px-6 py-12 text-center text-sm text-[#5a6061] shadow-[0_20px_60px_rgba(45,52,53,0.05)] ring-1 ring-[#adb3b4]/15">
          当前筛选没有匹配的 API 模型渠道。
        </div>
      ) : null}

      <section className="mt-6 rounded-lg bg-[#fff7e8] p-5 text-sm leading-7 text-[#7a541b] ring-1 ring-[#efdfbd]">
        <p className="font-semibold text-[#7a541b]">套餐折算提示</p>
        <p className="mt-1">
          例如 OpenCode Go 在规划文档中记录为首月 {formatUsdAmount(5, currency)}，后续 {formatUsdAmount(10, currency)}
          /月。订阅套餐不能只看月费，还要看短周期限制、可用模型和额度消耗规则。
        </p>
      </section>

      <p className="mt-8 text-xs leading-6 text-[#5a6061]">
        免责声明：PriceAI 只整理公开文档和公开页面中的 API 渠道信息，不售卖 API，不承诺可用性，不替任何渠道提供 SLA。免费和低价渠道可能存在限流、排队、模型下线、地区限制或条款变化。
      </p>
    </main>
  );
}

function ApiOfferRow({ offer, currency }: { offer: ApiModelOffer; currency: ApiCurrency }) {
  const sourceHref = offer.pricingUrl ?? offer.providerUrl;

  return (
    <tr className="align-top transition hover:bg-[#f7f9f9]">
      <td className="px-5 py-4">
        <p className="max-w-[220px] font-semibold leading-6 text-[#202829]">{offer.modelName}</p>
        <p className="mt-1 text-xs font-medium text-[#5a6061]">{offer.modelFamily}</p>
      </td>
      <td className="px-5 py-4">
        <a
          href={offer.providerUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex max-w-[190px] items-center gap-1.5 font-semibold leading-6 text-[#202829] transition hover:text-[#2f7a4b]"
        >
          {offer.providerName}
          <ExternalLink size={13} className="shrink-0" />
        </a>
        <p className="mt-1 text-xs text-[#5a6061]">{offer.billingMode}</p>
      </td>
      <td className="px-5 py-4">
        <TypeChip type={offer.providerType} />
      </td>
      <td className="px-5 py-4">
        <PriceText value={formatApiPrice(offer.inputPrice, currency)} />
      </td>
      <td className="px-5 py-4">
        <PriceText value={formatApiPrice(offer.outputPrice, currency)} />
      </td>
      <td className="px-5 py-4">
        <p className="max-w-[190px] text-sm font-semibold leading-6 text-[#202829]">
          {offer.cachePrice ? formatApiPrice(offer.cachePrice, currency) : "待确认"}
        </p>
      </td>
      <td className="px-5 py-4">
        <p className="max-w-[230px] text-sm leading-6 text-[#2d3435]">{offer.freeOrPlan}</p>
        {offer.notes ? <p className="mt-1 max-w-[230px] text-xs leading-5 text-[#5a6061]">{offer.notes}</p> : null}
      </td>
      <td className="px-5 py-4">
        <p className="max-w-[250px] text-sm leading-6 text-[#5a6061]">{offer.limitations}</p>
      </td>
      <td className="px-5 py-4">
        <div className="flex max-w-[230px] flex-wrap gap-1.5">
          {offer.compatibility.map((item) => (
            <span key={item} className="rounded-full bg-[#edf0f1] px-2.5 py-1 text-[0.68rem] font-semibold text-[#5a6061]">
              {item}
            </span>
          ))}
        </div>
      </td>
      <td className="px-5 py-4">
        <p className="max-w-[190px] text-sm leading-6 text-[#5a6061]">{offer.suitableTools.join("、")}</p>
      </td>
      <td className="px-5 py-4">
        <a
          href={sourceHref}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full bg-[#e4e9ea] px-3 text-xs font-semibold text-[#2d3435] transition hover:bg-[#dde4e5]"
        >
          {offer.sourceLabel}
          <ExternalLink size={13} />
        </a>
      </td>
      <td className="px-5 py-4 text-xs font-medium text-[#5a6061]">{offer.updatedAt}</td>
    </tr>
  );
}

function Metric({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="rounded-lg bg-white px-5 py-4 shadow-[0_14px_40px_rgba(45,52,53,0.04)] ring-1 ring-[#adb3b4]/15">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[#5a6061]">{label}</p>
      <p className="mt-2 truncate text-2xl font-bold text-[#202829]">{value}</p>
      <p className="mt-1 truncate text-xs text-[#5a6061]">{helper}</p>
    </div>
  );
}

function TypeChip({ type }: { type: ApiProviderType }) {
  const classNameByType: Record<ApiProviderType, string> = {
    official: "bg-[#e8f3ec] text-[#2f7a4b]",
    router: "bg-[#eef3f8] text-[#47657a]",
    free: "bg-[#fff7e8] text-[#7a541b]",
    subscription: "bg-[#e4e9ea] text-[#2d3435]",
  };

  return (
    <span className={`inline-flex h-8 items-center whitespace-nowrap rounded-full px-3 text-xs font-semibold ${classNameByType[type]}`}>
      {apiProviderTypeLabels[type]}
    </span>
  );
}

function PriceText({ value }: { value: string }) {
  return <p className="max-w-[190px] font-semibold leading-6 text-[#202829]">{value}</p>;
}

function TableHead({ children }: { children: React.ReactNode }) {
  return <th className="px-5 py-3 font-semibold">{children}</th>;
}
