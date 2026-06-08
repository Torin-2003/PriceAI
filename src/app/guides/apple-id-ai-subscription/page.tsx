import type { Metadata } from "next";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BadgeDollarSign,
  CheckCircle2,
  ExternalLink,
  Gift,
  Landmark,
  ReceiptText,
  RotateCcw,
  ShieldAlert,
  Smartphone,
  Wallet,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { GuideDocsLayout } from "@/components/GuideDocsLayout";
import { GuideReadingFooter } from "@/components/GuideReadingFooter";
import { JsonLd } from "@/components/JsonLd";

export const revalidate = 86400;

const pageUrl = "https://priceai.cc/guides/apple-id-ai-subscription";

export const metadata: Metadata = {
  title: "Apple ID 订阅 AI：地区价、礼品卡和 App Store 内购怎么理解",
  description:
    "解释 Apple ID（Apple 账户）地区、App Store 内购、AI 订阅地区价、Apple 礼品卡、账户余额、付款方式、税费、汇率和常见失败风险。",
  alternates: {
    canonical: "/guides/apple-id-ai-subscription",
  },
  openGraph: {
    title: "Apple ID 订阅 AI：地区价、礼品卡和 App Store 内购怎么理解 | PriceAI",
    description: "理解 Apple ID 地区、App Store 订阅、礼品卡、余额、付款方式和地区价，再决定是否自己走 Apple 路径订阅 AI 服务。",
    url: pageUrl,
  },
};

export default function AppleIdAiSubscriptionGuide() {
  return (
    <>
      <JsonLd data={buildGuideJsonLd()} />
      <GuideDocsLayout currentHref="/guides/apple-id-ai-subscription">
        <article className="pb-14">
          <section className="grid gap-8 lg:grid-cols-[minmax(0,0.78fr)_310px] lg:items-start">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#e8f3ec] px-3 py-1.5 text-xs font-semibold text-[#2f7a4b] ring-1 ring-[#45bf78]/15">
                <Image src="/brand-icons/apple.png" alt="" aria-hidden="true" width={18} height={18} className="h-4 w-4 object-contain" />
                Apple ID 专题
              </div>
              <h1 className="mt-5 font-serif text-4xl font-semibold leading-tight tracking-normal text-[#202829] sm:text-5xl">
                Apple ID 订阅 AI 怎么理解？
              </h1>
              <p className="mt-5 max-w-[72ch] text-base leading-8 text-[#5a6061]">
                你在社区里看到的“土区 Apple ID”“美区礼品卡”“App Store 地区价”，本质上都和 Apple 账户地区、App Store 内购、付款方式、账户余额、税费和汇率有关。它可能是官方路径的一部分，但不是随便换个地区就一定能稳定订阅。
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/official-prices"
                  className="inline-flex h-10 items-center gap-2 rounded-md bg-[#2d3435] px-4 text-sm font-semibold text-[#f8f8f8] transition hover:bg-[#202829]"
                >
                  查看官方地区价
                  <ArrowRight size={16} />
                </Link>
                <Link
                  href="/guides/how-to-subscribe-ai-officially"
                  className="inline-flex h-10 items-center gap-2 rounded-md bg-[#dde4e5] px-4 text-sm font-semibold text-[#2d3435] transition hover:bg-[#d3dcdd]"
                >
                  官方自助订阅总览
                  <ExternalLink size={15} />
                </Link>
              </div>
            </div>

            <aside className="border-l border-[#dfe4e5] pl-5">
              <p className="text-xs font-semibold text-[#7a8182]">快速结论</p>
              <p className="mt-4 text-sm leading-7 text-[#5a6061]">
                Apple ID 不是“低价魔法”。它只是 App Store 内购的账户和地区入口。真正要判断的是：目标 AI App 是否支持内购、该地区是否可买、你是否有可用付款方式或余额，以及后续续费能不能稳定。
              </p>
            </aside>
          </section>

          <section className="mt-10 border-y border-[#dfe4e5] py-7">
            <div className="grid gap-6 md:grid-cols-[0.72fr_1fr] md:items-start">
              <div>
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-[#e8f3ec] text-[#2f7a4b]">
                  <ShieldAlert size={19} />
                </div>
                <h2 className="mt-4 font-serif text-3xl font-semibold leading-tight tracking-normal text-[#202829]">
                  先说结论：Apple ID 地区价要按总成本看。
                </h2>
              </div>
              <p className="text-sm leading-7 text-[#5a6061]">
                App Store 标价只是第一层。你还要看 Apple 账户地区、付款方式、礼品卡溢价、账户余额限制、税费、汇率、订阅管理入口和失败退款成本。PriceAI 只解释这些关系，不提供绕过地区或风控的方法。
              </p>
            </div>
          </section>

          <section className="mt-12">
            <h2 className="font-serif text-3xl font-semibold tracking-normal text-[#202829]">先分清这四个概念</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {coreConcepts.map((item) => (
                <InfoCard key={item.title} {...item} />
              ))}
            </div>
          </section>

          <section className="mt-12">
            <div className="border-b border-[#dfe4e5] pb-4">
              <h2 className="font-serif text-2xl font-semibold tracking-normal text-[#202829]">购买前按这个顺序检查</h2>
              <p className="mt-2 text-sm leading-6 text-[#5a6061]">
                这是一份判断清单，不是“照做即可”的教程。每一步都应该回到 Apple 和目标 AI App 的实际提示核验。
              </p>
            </div>
            <div className="divide-y divide-[#dfe4e5] border-b border-[#dfe4e5]">
              {checkSteps.map((item, index) => (
                <div key={item.title} className="grid gap-3 py-5 sm:grid-cols-[44px_1fr]">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#edf0f1] text-sm font-bold text-[#202829]">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="font-semibold text-[#202829]">{item.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-[#5a6061]">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-12 grid gap-5 lg:grid-cols-[0.68fr_1fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#5a6061]">Cost model</p>
              <h2 className="mt-3 font-serif text-3xl font-semibold leading-tight tracking-normal text-[#202829]">
                Apple 路径的真实成本，不只看标价。
              </h2>
              <p className="mt-4 text-sm leading-7 text-[#5a6061]">
                低价地区如果需要额外购买礼品卡、承担汇率差或处理失败退款，最终未必比代订或其他官方路径更划算。
              </p>
            </div>
            <div className="grid gap-3">
              {costParts.map((item) => (
                <CostCard key={item.title} {...item} />
              ))}
            </div>
          </section>

          <section className="mt-12">
            <h2 className="font-serif text-3xl font-semibold tracking-normal text-[#202829]">常见失败原因</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {failureReasons.map((item) => (
                <WarningCard key={item.title} {...item} />
              ))}
            </div>
          </section>

          <section className="mt-12 border-y border-[#dfe4e5] py-8">
            <div className="grid gap-6 md:grid-cols-[0.68fr_1fr] md:items-start">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#5a6061]">PriceAI</p>
                <h2 className="mt-3 font-serif text-3xl font-semibold leading-tight tracking-normal text-[#202829]">
                  PriceAI 能帮你判断什么？
                </h2>
                <p className="mt-4 text-sm leading-7 text-[#5a6061]">
                  Apple 路径适不适合你，关键看价格差、支付门槛和可维护性。PriceAI 负责把价格和路径讲清楚，不替任何账号、礼品卡或代订服务背书。
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {priceAiHelps.map((text) => (
                  <div key={text} className="flex gap-2 rounded-lg bg-[#f2f4f4] px-4 py-3 text-sm leading-6 text-[#5a6061]">
                    <CheckCircle2 size={16} className="mt-1 shrink-0 text-[#2f7a4b]" />
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="mt-12">
            <h2 className="font-serif text-3xl font-semibold tracking-normal text-[#202829]">延伸阅读与官方参考</h2>
            <p className="mt-3 max-w-[78ch] text-sm leading-7 text-[#5a6061]">
              这些链接适合在购买礼品卡、调整账户地区或尝试 App Store 内购前核对原始规则。账户地区、余额、税费和订阅限制最终以 Apple 官方页面和实际支付页提示为准。
            </p>
            <div className="mt-6 divide-y divide-[#dfe4e5] border-y border-[#dfe4e5]">
              {officialReferences.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-start justify-between gap-4 py-4 text-sm leading-6 text-[#5a6061] transition hover:text-[#202829]"
                >
                  <span>
                    <span className="block font-semibold text-[#202829]">{item.title}</span>
                    <span className="mt-1 block">{item.text}</span>
                  </span>
                  <ExternalLink size={16} className="mt-1 shrink-0 text-[#2f7a4b]" />
                </a>
              ))}
            </div>
          </section>

          <section className="mt-12">
            <h2 className="font-serif text-3xl font-semibold tracking-normal text-[#202829]">常见问题</h2>
            <div className="mt-6 divide-y divide-[#dfe4e5] border-y border-[#dfe4e5]">
              {faqs.map(([question, answer]) => (
                <div key={question} className="py-5">
                  <h3 className="font-semibold text-[#202829]">{question}</h3>
                  <p className="mt-2 text-sm leading-7 text-[#5a6061]">{answer}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-12 flex flex-col gap-4 border-t border-[#dfe4e5] pt-8 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-serif text-2xl font-semibold tracking-normal text-[#202829]">先看 Apple 路径，再决定是否需要渠道。</h2>
              <p className="mt-2 text-sm leading-6 text-[#5a6061]">
                如果 Apple 路径的总成本和维护成本能接受，可以继续看官方地区价；如果不适合，也可以对比 Google Play、支付卡和礼品卡路径。
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-3">
              <Link
                href="/official-prices"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#edf0f1] px-4 text-sm font-semibold text-[#2d3435] transition hover:bg-[#f5f7f7]"
              >
                官方地区价
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/guides/google-play-ai-subscription"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#edf0f1] px-4 text-sm font-semibold text-[#2d3435] transition hover:bg-[#f5f7f7]"
              >
                Google Play
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/guides/visa-card-for-ai-subscription"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#edf0f1] px-4 text-sm font-semibold text-[#2d3435] transition hover:bg-[#f5f7f7]"
              >
                支付卡指南
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/guides/how-to-subscribe-ai-officially"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#dde4e5] px-4 text-sm font-semibold text-[#2d3435] transition hover:bg-[#d3dcdd]"
              >
                官方自助订阅
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/?stock=available"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#2d3435] px-4 text-sm font-semibold text-[#f8f8f8] transition hover:bg-[#202829]"
              >
                查看有货报价
                <ArrowRight size={16} />
              </Link>
            </div>
          </section>

          <GuideReadingFooter currentHref="/guides/apple-id-ai-subscription" />
        </article>
      </GuideDocsLayout>
    </>
  );
}

function InfoCard({
  title,
  text,
  points,
  icon,
}: {
  title: string;
  text: string;
  points: string[];
  icon: ReactNode;
}) {
  return (
    <div className="rounded-md bg-[#f2f4f4] p-4">
      <div className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-[#e8f3ec] text-[#2f7a4b]">{icon}</div>
      <h3 className="mt-3 font-semibold text-[#202829]">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-[#5a6061]">{text}</p>
      <ul className="mt-4 space-y-2 text-sm text-[#5a6061]">
        {points.map((point) => (
          <li key={point} className="flex gap-2">
            <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-[#2f7a4b]" />
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CostCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-md bg-[#f2f4f4] px-4 py-3">
      <h3 className="font-semibold text-[#202829]">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[#5a6061]">{text}</p>
    </div>
  );
}

function WarningCard({
  title,
  text,
  icon,
}: {
  title: string;
  text: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-md bg-[#f2f4f4] p-4">
      <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#fff3d8] text-[#986400]">{icon}</div>
      <h3 className="mt-3 font-semibold text-[#202829]">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-[#5a6061]">{text}</p>
    </div>
  );
}

const coreConcepts = [
  {
    title: "Apple 账户地区",
    text: "Apple 账户地区会影响 App Store 可见内容、可用付款方式、账户余额、礼品卡和订阅入口。地区不是单独的价格开关。",
    points: ["影响 App Store 内购", "影响付款方式", "变更地区前要处理余额和订阅"],
    icon: <Landmark size={17} />,
  },
  {
    title: "App Store 内购",
    text: "如果 AI App 支持 iOS 内购买，付款、续费和部分订阅管理通常走 Apple 账户体系，而不是产品官网账单体系。",
    points: ["订阅入口可能在 App 内", "取消和续费通常在 Apple 管理", "权益仍由目标 AI 服务提供"],
    icon: <Smartphone size={17} />,
  },
  {
    title: "Apple 礼品卡和余额",
    text: "礼品卡或账户余额可能用于 App Store 购买和部分订阅，但它通常和国家/地区绑定，也可能需要配合有效付款方式。",
    points: ["不是所有购买都可用余额", "礼品卡通常有地区限制", "余额不足或不适用会导致失败"],
    icon: <Gift size={17} />,
  },
  {
    title: "官方地区价",
    text: "App Store 上同一 AI 订阅在不同地区可能显示不同标价。它可以作为官方价格参考，但不代表每个人都能直接稳定开通。",
    points: ["价格基准来自公开页面", "实付还要看税费和汇率", "开通条件以官方提示为准"],
    icon: <BadgeDollarSign size={17} />,
  },
];

const checkSteps = [
  {
    title: "确认目标 AI App 是否支持 App Store 内购",
    text: "不是所有套餐都能通过 iOS App 购买。有些套餐只在官网或企业入口开通，有些移动端只支持部分个人套餐。",
  },
  {
    title: "确认 Apple 账户地区和付款方式",
    text: "Apple 官方说明中，国家或地区会影响付款方式和可用内容。变更地区前还可能需要处理账户余额、订阅、预购和租借等事项。",
  },
  {
    title: "确认礼品卡或余额是否能覆盖订阅",
    text: "礼品卡看起来像解决支付门槛，但它有地区绑定、余额不足、不可用于某些购买或仍需有效付款方式等限制。",
  },
  {
    title: "确认税费、汇率和充值损耗",
    text: "App Store 标价不一定等于最终人民币成本。礼品卡溢价、汇率、税费和失败退款时间都会改变真实成本。",
  },
  {
    title: "确认后续续费和售后入口",
    text: "如果订阅是通过 Apple 处理，取消、续费和部分退款入口通常在 Apple 账户侧。产品官网和 Apple 支持的责任边界要分清楚。",
  },
];

const costParts = [
  {
    title: "订阅标价",
    text: "先看 App Store 公开标价或 PriceAI 官方地区价页面。它是价格锚点，但不是完整成本。",
  },
  {
    title: "付款工具成本",
    text: "礼品卡、虚拟卡、外币卡或代充服务都可能带来额外溢价、手续费、充值损耗或失败处理成本。",
  },
  {
    title: "税费和汇率",
    text: "不同地区的税费和平台结算币种不同；人民币估算价一般不包含银行手续费、卡组织汇率和礼品卡溢价。",
  },
  {
    title: "维护成本",
    text: "低价路径如果每月都要处理充值、余额、账号地区、付款失败或退款，长期体验可能不如价格看起来那么便宜。",
  },
];

const failureReasons = [
  {
    title: "Apple 账户地区不匹配",
    text: "账号地区、礼品卡地区、付款方式地区或 App 可用地区不一致时，购买、续费或兑换都可能失败。",
    icon: <AlertTriangle size={17} />,
  },
  {
    title: "账户余额或礼品卡不适用",
    text: "余额不足、礼品卡地区不对、余额无法覆盖订阅，或者某些购买需要保留有效付款方式，都可能让订单卡住。",
    icon: <Wallet size={17} />,
  },
  {
    title: "已有订阅或余额影响切区",
    text: "Apple 官方说明中，变更国家或地区前通常要处理订阅、账户余额、预购、租借等事项；切区不是随时随地无成本操作。",
    icon: <RotateCcw size={17} />,
  },
  {
    title: "付款和退款入口分裂",
    text: "通过 App Store 订阅后，账单管理通常在 Apple；产品权益又在 AI 服务方。遇到问题时要分清该找 Apple 还是产品方。",
    icon: <ReceiptText size={17} />,
  },
];

const priceAiHelps = [
  "查看 ChatGPT、Claude、Gemini、Grok 等 AI 订阅的 App Store 官方地区价参考。",
  "解释 Apple ID 地区、礼品卡、余额、外币卡和税费之间的关系。",
  "把地区价和第三方渠道价分开看，避免把不同路径混成同一种价格。",
  "提醒用户最终可购买性、税费、退款和售后仍以 Apple 与产品方规则为准。",
  "如果 Apple 路径不适合，可以回到比价工具查看当前有货第三方报价。",
  "不推荐具体 Apple ID、礼品卡商家、虚拟卡或代订服务，不做背书。",
];

const officialReferences = [
  {
    title: "Apple：更改 Apple 账户国家或地区",
    text: "了解变更国家/地区前的余额、订阅和付款方式要求。",
    href: "https://support.apple.com/en-us/118283",
  },
  {
    title: "Apple：可用于 Apple 账户的付款方式",
    text: "按国家或地区确认 App Store 和订阅支持的付款方式。",
    href: "https://support.apple.com/en-us/111741",
  },
  {
    title: "Apple：兑换 Apple 礼品卡",
    text: "了解 Apple 礼品卡、App Store 礼品卡和账户余额的兑换入口。",
    href: "https://support.apple.com/en-us/118242",
  },
  {
    title: "Apple：哪些购买可使用 Apple 账户余额",
    text: "确认账户余额可以购买哪些内容，以及哪些场景可能需要其他付款方式。",
    href: "https://support.apple.com/en-us/118243",
  },
  {
    title: "Apple：取消 Apple 订阅",
    text: "了解通过 Apple 账户管理和取消订阅的官方入口。",
    href: "https://support.apple.com/en-us/118428",
  },
  {
    title: "Apple：查看 Apple 账户余额",
    text: "确认余额状态，避免因为余额和地区问题影响购买判断。",
    href: "https://support.apple.com/en-us/HT202359",
  },
];

const faqs: Array<[string, string]> = [
  [
    "Apple ID 地区价是不是官方价格？",
    "如果价格来自 App Store 公开页面或 App 内购买入口，它可以理解为官方价格体系的一部分。但官方地区价不等于所有用户都能直接开通，支付方式、账户地区、税费和产品可用性仍要单独核验。",
  ],
  [
    "是不是注册一个低价区 Apple ID 就能便宜订阅？",
    "不能这样理解。Apple 账户地区会影响付款方式、账户余额、礼品卡和订阅规则。PriceAI 不提供绕过地区、风控或身份限制的方法，也不承诺某地区长期可用。",
  ],
  [
    "Apple 礼品卡可以直接订阅 ChatGPT、Claude 或 Gemini 吗？",
    "要看目标 App 是否支持 App Store 内购，以及该地区账户余额是否能用于这类订阅。礼品卡通常有地区绑定，并且某些购买可能仍要求有效付款方式。",
  ],
  [
    "Apple ID 订阅和官网订阅有什么区别？",
    "Apple ID 订阅通常由 Apple 处理付款、续费、取消和部分退款入口；官网订阅通常由产品方处理账单。权益可能类似，但账单管理和售后入口不同。",
  ],
  [
    "为什么 PriceAI 的人民币估算价和实付不一样？",
    "人民币估算价通常只按公开标价和汇率估算，不包含税费、银行手续费、礼品卡溢价、充值损耗、失败退款时间和平台规则变化。",
  ],
  [
    "如果 Apple 路径失败，应该怎么办？",
    "先回到 Apple 和目标 AI App 的提示核验：账户地区、付款方式、余额、已有订阅、App 是否支持内购。不要把失败简单归因于某张卡或某个地区。",
  ],
  [
    "PriceAI 会推荐 Apple ID 或礼品卡卖家吗？",
    "不会。PriceAI 只提供价格、路径和风险解释，不销售 Apple ID、礼品卡或代订服务，也不对任何卖家背书。",
  ],
  [
    "什么时候适合走第三方代订？",
    "当你无法稳定处理 Apple 账户地区、付款方式、礼品卡和续费，且能接受服务费和渠道风险时，可以再看代订或第三方渠道。但购买前仍要核验原始商品、售后和投诉路径。",
  ],
];

function buildGuideJsonLd() {
  return [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "Apple ID 订阅 AI：地区价、礼品卡和 App Store 内购怎么理解？",
      inLanguage: "zh-CN",
      url: pageUrl,
      description: "解释 Apple ID 地区、App Store 内购、AI 订阅地区价、Apple 礼品卡、账户余额、付款方式、税费、汇率和常见失败风险。",
      author: {
        "@type": "Organization",
        name: "PriceAI",
      },
      publisher: {
        "@type": "Organization",
        name: "PriceAI",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "PriceAI", item: "https://priceai.cc" },
        { "@type": "ListItem", position: 2, name: "指南", item: pageUrl },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map(([question, answer]) => ({
        "@type": "Question",
        name: question,
        acceptedAnswer: {
          "@type": "Answer",
          text: answer,
        },
      })),
    },
  ];
}
