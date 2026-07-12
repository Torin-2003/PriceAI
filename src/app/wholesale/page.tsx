import type { Metadata } from "next";
import {
  ArrowRight,
  ClipboardList,
  Database,
  Handshake,
  PackageCheck,
  ShieldAlert,
  Store,
  Workflow,
} from "lucide-react";
import { JsonLd } from "@/components/JsonLd";
import { SiteHeader } from "@/components/SiteHeader";
import { WholesaleIntakeForm } from "@/components/WholesaleIntakeForm";

export const metadata: Metadata = {
  title: "批发专区",
  description:
    "PriceAI 批发专区用于收集 API 中转、卡网订阅渠道和其他源头的买方需求与源头供给线索。当前阶段只做线索入池和人工核验，不做资金托管或成交担保。",
  alternates: { canonical: "/wholesale" },
  openGraph: {
    title: "批发专区 | PriceAI",
    description:
      "收集一级代理、企业采购和源头供给方的批发线索，先人工核验，后续再逐步迭代撮合能力。",
  },
};

export const revalidate = 3600;

const DIRECTIONS = [
  {
    title: "API 中转批发",
    description: "适合中转站额度、模型通道、企业接口、团队用量等批量需求或供给。",
    icon: Workflow,
  },
  {
    title: "卡网/订阅渠道批发",
    description: "适合账号、订阅、兑换码、渠道货源等需要验真和售后边界的线索。",
    icon: Store,
  },
  {
    title: "其他源头",
    description: "暂时无法归类，但能说明来源、证明方式和交易边界的供需线索。",
    icon: PackageCheck,
  },
];

const PROCESS = [
  { title: "填写线索", description: "买方写需求，源头写供给。", icon: ClipboardList },
  { title: "后台入池", description: "统一进入后台线索池，不直接公开。", icon: Database },
  { title: "人工核验", description: "优先看证明、测试方式和风险边界。", icon: ShieldAlert },
  { title: "再决定撮合", description: "积累足够样本后，再做规则化迭代。", icon: Handshake },
];

export default function WholesalePage() {
  return (
    <div className="min-h-screen bg-[#f9f9f9] text-[#202829]">
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "批发专区",
            description:
              "PriceAI 批发专区收集 API 中转、卡网订阅渠道和其他源头的买方需求与源头供给线索。",
            url: "https://priceai.cc/wholesale",
            isPartOf: {
              "@type": "WebSite",
              name: "PriceAI",
              url: "https://priceai.cc",
            },
          },
        ]}
      />

      <div className="sticky top-0 z-40 bg-[#f9f9f9]/95 shadow-[0_10px_24px_rgba(45,52,53,0.035)] backdrop-blur-[18px]">
        <SiteHeader activeSection="wholesale" />
      </div>

      <main className="mx-auto max-w-[1180px] px-5 py-8 pb-20 sm:px-6">
        <section className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <div className="min-w-0">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
              <Database className="h-3.5 w-3.5" aria-hidden="true" />
              独立入口，先收线索
            </div>
            <h1 className="font-serif text-3xl font-semibold tracking-normal text-[#202829] md:text-5xl">
              批发专区
            </h1>
            <p className="mt-4 max-w-[760px] text-base leading-8 text-[#5a6061]">
              这里先做一个轻量入口：一级代理、企业和其他买方可以提交批量需求；中转站、卡网商家和其他源头可以提交供给和证明。
              PriceAI 先把信息沉淀到后台，等样本足够后，再判断要不要做更完整的撮合、审核和交易规则。
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {DIRECTIONS.map((direction) => {
                const Icon = direction.icon;
                return (
                  <article
                    className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                    key={direction.title}
                  >
                    <Icon className="h-5 w-5 text-emerald-700" aria-hidden="true" />
                    <h2 className="mt-3 text-sm font-semibold text-slate-950">
                      {direction.title}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {direction.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>

          <aside className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
            <div className="flex items-center gap-2 font-semibold">
              <ShieldAlert className="h-4 w-4" aria-hidden="true" />
              当前边界
            </div>
            <ul className="mt-3 space-y-2">
              <li>只做信息收集和后台记录。</li>
              <li>不展示为公开卖场，不承诺成交。</li>
              <li>不做资金托管，也不替任何一方担保。</li>
              <li>优先沉淀源头证明、测试方式和风险边界。</li>
            </ul>
          </aside>
        </section>

        <section className="mt-8 border-y border-slate-200 py-5">
          <h2 className="text-sm font-semibold uppercase tracking-normal text-slate-500">
            处理流程
          </h2>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            {PROCESS.map((item, index) => {
              const Icon = item.icon;
              return (
                <article
                  className="flex min-h-24 gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                  key={item.title}
                >
                  <Icon className="mt-0.5 h-5 w-5 shrink-0 text-slate-800" aria-hidden="true" />
                  <div>
                    <h3 className="text-sm font-semibold text-slate-950">{item.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p>
                    {index < PROCESS.length - 1 ? (
                      <ArrowRight
                        className="mt-3 hidden h-4 w-4 text-slate-400 md:block"
                        aria-hidden="true"
                      />
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <WholesaleIntakeForm />
          <div className="space-y-4">
            <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-950">为什么不拆两个入口</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                中转站和卡网商家本质都是“源头供给”或“批量需求”的不同方向。先用一个入口统一收集，再用方向字段区分，后续要拆分市场或审核规则也更稳。
              </p>
            </article>
            <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-950">什么信息最有用</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                对买方来说，是采购量、预算、可接受来源和测试要求。对源头来说，是供给范围、起批门槛、价格方式、证明材料和售后边界。
              </p>
            </article>
          </div>
        </section>
      </main>
    </div>
  );
}
