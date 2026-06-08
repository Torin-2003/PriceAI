import type { Metadata } from "next";
import { ArrowRight, BookOpenText, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { GuideDocsLayout } from "@/components/GuideDocsLayout";
import { GuidesDirectory } from "@/components/GuidesDirectory";
import { JsonLd } from "@/components/JsonLd";
import {
  getGuideCategory,
  getGuidePathStepEntry,
  guideEntries,
  guideReadingPaths,
} from "@/lib/guides";

export const revalidate = 86400;

const pageUrl = "https://priceai.cc/guides";

export const metadata: Metadata = {
  title: "AI 订阅快速入门：价格、官方订阅、支付方式和渠道判断",
  description:
    "PriceAI AI 订阅快速入门，先理解价格分层、官方订阅、支付方式和第三方渠道判断，再按需查看全部指南索引。",
  alternates: {
    canonical: "/guides",
  },
  openGraph: {
    title: "AI 订阅快速入门：价格、官方订阅、支付方式和渠道判断 | PriceAI",
    description: "从价格来源、官方订阅、支付方式和第三方渠道判断开始，快速理解 AI 订阅购买前要看什么。",
    url: pageUrl,
  },
};

const quickStartSteps = [
  {
    title: "先搞懂价格为什么差很多",
    text: "官网正价、官方地区价、代充价、成品号和卡密不是同一种东西。先看懂价格来源，再比较最低价。",
    href: "/guides/why-ai-subscription-prices-differ",
  },
  {
    title: "再判断自己能不能走官方路径",
    text: "如果你想自己订阅，先看官网、App Store、Google Play、支付卡和礼品卡这些基础条件。",
    href: "/guides/how-to-subscribe-ai-officially",
  },
  {
    title: "最后回到 PriceAI 看当前有货报价",
    text: "如果准备看第三方渠道，重点核验来源、原始标题、库存、更新时间、售后和投诉入口。",
    href: "/?stock=available",
  },
];

const commonEntrances = [
  { label: "卡网渠道靠谱吗", href: "/guides/are-ai-subscription-card-shops-reliable" },
  { label: "ChatGPT 获取方式", href: "/guides/chatgpt-subscription-options" },
  { label: "Apple ID 订阅 AI", href: "/guides/apple-id-ai-subscription" },
  { label: "Google Play 订阅 AI", href: "/guides/google-play-ai-subscription" },
  { label: "订阅 AI 需要什么支付卡", href: "/guides/visa-card-for-ai-subscription" },
  { label: "AI 订阅礼品卡限制", href: "/guides/ai-subscription-gift-card" },
];

export default function GuidesIndexPage() {
  return (
    <>
      <JsonLd data={buildGuidesJsonLd()} />
      <GuideDocsLayout currentHref="/guides">
        <article className="pb-14 text-[#2d3435]">
          <section className="border-b border-[#dfe4e5] pb-8">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#2f7a4b]">
              <BookOpenText size={15} />
              快速入门
            </div>
            <h1 className="mt-4 font-serif text-4xl font-semibold leading-tight tracking-normal text-[#202829] sm:text-5xl">
              AI 订阅怎么选，先看这三步。
            </h1>
            <p className="mt-5 max-w-[72ch] text-base leading-8 text-[#5a6061]">
              如果你刚接触 AI 订阅渠道，不需要先打开所有文章。先理解价格来源，再判断官方路径是否适合你，最后回到 PriceAI 查看当前有货报价和来源。
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="#quick-start"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#2d3435] px-4 text-sm font-semibold text-[#f8f8f8] transition hover:bg-[#202829]"
              >
                开始快速入门
                <ArrowRight size={15} />
              </a>
              <a
                href="#all-guides"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#edf0f1] px-4 text-sm font-semibold text-[#2d3435] transition hover:bg-[#dde4e5]"
              >
                全部指南索引
                <ArrowRight size={15} />
              </a>
              <Link
                href="/?stock=available"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md text-sm font-semibold text-[#2d3435] transition hover:bg-[#edf0f1]"
              >
                回到比价工具
                <ArrowRight size={15} />
              </Link>
            </div>
          </section>

          <section id="quick-start" className="mt-10 border-b border-[#dfe4e5] pb-10">
            <p className="text-xs font-semibold text-[#7a8182]">新手路径</p>
            <h2 className="mt-3 font-serif text-3xl font-semibold tracking-normal text-[#202829]">快速入门</h2>
            <div className="mt-6 divide-y divide-[#dfe4e5] border-y border-[#dfe4e5]">
              {quickStartSteps.map((step, index) => (
                <Link
                  key={step.href}
                  href={step.href}
                  className="group grid gap-3 py-5 transition hover:bg-[#edf0f1]/60 sm:grid-cols-[36px_minmax(0,1fr)_auto] sm:px-2"
                >
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#edf0f1] text-sm font-bold text-[#5a6061] group-hover:bg-[#dde4e5]">
                    {index + 1}
                  </span>
                  <span className="min-w-0">
                    <span className="block font-semibold text-[#202829]">{step.title}</span>
                    <span className="mt-1 block text-sm leading-6 text-[#5a6061]">{step.text}</span>
                  </span>
                  <span className="hidden items-center text-sm font-semibold text-[#2d3435] sm:inline-flex">
                    查看
                    <ArrowRight size={15} className="ml-1 transition group-hover:translate-x-0.5" />
                  </span>
                </Link>
              ))}
            </div>
          </section>

          <section id="reading-paths" className="mt-10 border-b border-[#dfe4e5] pb-10">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold text-[#7a8182]">按问题阅读</p>
                <h2 className="mt-3 font-serif text-3xl font-semibold tracking-normal text-[#202829]">常用路径</h2>
                <p className="mt-2 max-w-[72ch] text-sm leading-7 text-[#5a6061]">
                  如果你已经知道自己要解决哪类问题，可以按路径继续读。
                </p>
              </div>
              <a
                href="#all-guides"
                className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md bg-[#edf0f1] px-4 text-sm font-semibold text-[#2d3435] transition hover:bg-[#dde4e5]"
              >
                直接看全部目录
                <ArrowRight size={15} />
              </a>
            </div>

            <div className="mt-6 divide-y divide-[#dfe4e5] border-y border-[#dfe4e5]">
              {guideReadingPaths.map((path) => (
                <div key={path.id} className="grid gap-4 py-5 lg:grid-cols-[220px_minmax(0,1fr)]">
                  <div>
                    <p className="text-xs font-semibold text-[#2f7a4b]">{path.audience}</p>
                    <h3 className="mt-2 font-semibold text-[#202829]">{path.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[#5a6061]">{path.description}</p>
                  </div>
                  <ol className="space-y-2">
                    {path.steps.map((step, index) => {
                      const guide = getGuidePathStepEntry(step);

                      return (
                        <li key={step.href}>
                          <Link
                            href={step.href}
                            className="group grid gap-3 rounded-md px-2 py-2 transition hover:bg-[#edf0f1] sm:grid-cols-[28px_minmax(0,1fr)]"
                          >
                            <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#edf0f1] text-xs font-bold text-[#5a6061] group-hover:bg-[#dde4e5]">
                              {index + 1}
                            </span>
                            <span className="min-w-0">
                              <span className="block text-sm font-semibold text-[#202829]">{guide?.title ?? step.label}</span>
                              <span className="mt-1 block text-xs leading-5 text-[#5a6061]">{step.description}</span>
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-10 border-b border-[#dfe4e5] pb-10">
            <p className="text-xs font-semibold text-[#7a8182]">常见入口</p>
            <h2 className="mt-3 font-serif text-3xl font-semibold tracking-normal text-[#202829]">直接看具体问题</h2>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {commonEntrances.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex items-center justify-between gap-3 rounded-md py-3 text-sm font-semibold text-[#202829] transition hover:bg-[#edf0f1] sm:px-3"
                >
                  <span className="inline-flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-[#2f7a4b]" />
                    {item.label}
                  </span>
                  <ArrowRight size={15} className="text-[#7a8182] transition group-hover:translate-x-0.5 group-hover:text-[#2d3435]" />
                </Link>
              ))}
            </div>
          </section>

          <GuidesDirectory />
        </article>
      </GuideDocsLayout>
    </>
  );
}

function buildGuidesJsonLd() {
  return [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "AI 订阅快速入门",
      inLanguage: "zh-CN",
      url: pageUrl,
      description: "PriceAI AI 订阅快速入门，先理解价格、官方订阅、支付方式和第三方渠道判断。",
      isPartOf: {
        "@type": "WebSite",
        name: "PriceAI",
        url: "https://priceai.cc",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "PriceAI", item: "https://priceai.cc" },
        { "@type": "ListItem", position: 2, name: "快速入门", item: pageUrl },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "PriceAI 指南列表",
      itemListElement: guideEntries.map((guide, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: guide.title,
        description: `${getGuideCategory(guide.categoryId)?.label ?? "指南"}：${guide.description}`,
        url: `https://priceai.cc${guide.href}`,
      })),
    },
  ];
}
