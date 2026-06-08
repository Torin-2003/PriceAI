import type { Metadata } from "next";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Gift,
  Globe2,
  HelpCircle,
  Landmark,
  Layers3,
  ShieldAlert,
  Smartphone,
} from "lucide-react";
import Link from "next/link";
import { GuideDocsLayout } from "@/components/GuideDocsLayout";
import { GuideReadingFooter } from "@/components/GuideReadingFooter";
import { JsonLd } from "@/components/JsonLd";

export const revalidate = 86400;

const pageUrl = "https://priceai.cc/guides/how-to-subscribe-ai-officially";

export const metadata: Metadata = {
  title: "如何自己完成 AI 官方订阅",
  description:
    "解释官网订阅、App Store、Google Play、Apple ID 地区、支付卡、礼品卡、地区价、税费和失败风险，帮助中文用户判断是否适合自己走官方路径订阅 AI 服务。",
  alternates: {
    canonical: "/guides/how-to-subscribe-ai-officially",
  },
  openGraph: {
    title: "如何自己完成 AI 官方订阅 | PriceAI",
    description: "先理解官网订阅、App Store、Google Play、支付方式和地区价，再决定自己订阅、找代订，还是回到 PriceAI 看渠道报价。",
    url: pageUrl,
  },
};

export default function HowToSubscribeAiOfficiallyGuide() {
  return (
    <>
      <JsonLd data={buildGuideJsonLd()} />
      <GuideDocsLayout currentHref="/guides/how-to-subscribe-ai-officially">
        <article className="pb-14">
          <section className="grid gap-8 lg:grid-cols-[minmax(0,0.78fr)_310px] lg:items-start">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#e8f3ec] px-3 py-1.5 text-xs font-semibold text-[#2f7a4b] ring-1 ring-[#45bf78]/15">
                <Landmark size={15} />
                官方自助订阅指南
              </div>
              <h1 className="mt-5 font-serif text-4xl font-semibold leading-tight tracking-normal text-[#202829] sm:text-5xl">
                如何自己完成 AI 官方订阅？
              </h1>
              <p className="mt-5 max-w-[72ch] text-base leading-8 text-[#5a6061]">
                如果你不想一上来就买第三方渠道，可以先理解官网订阅、App Store、Google Play、Apple ID 地区、Google Play 地区、外币卡、礼品卡和地区价之间的关系。官方路径规则更清楚，但不一定对中文用户最省事。
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
                  href="/guides/why-ai-subscription-prices-differ"
                  className="inline-flex h-10 items-center gap-2 rounded-md bg-[#dde4e5] px-4 text-sm font-semibold text-[#2d3435] transition hover:bg-[#d3dcdd]"
                >
                  先理解价格分层
                  <ExternalLink size={15} />
                </Link>
              </div>
            </div>

            <aside className="border-l border-[#dfe4e5] pl-5">
              <p className="text-xs font-semibold text-[#7a8182]">快速结论</p>
              <p className="mt-4 text-sm leading-7 text-[#5a6061]">
                官方订阅不是只有“官网付 20 美元”一种方式。你还会遇到 App Store、Google Play、地区价、税费、汇率、支付卡和礼品卡。先判断自己能不能稳定支付，再决定是否需要代订或第三方渠道。
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
                  先说结论：官方路径更清楚，但不一定更简单。
                </h2>
              </div>
              <p className="text-sm leading-7 text-[#5a6061]">
                官网、App Store 和 Google Play 都可能成为官方订阅入口。问题在于：你所在地区、账号地区、支付方式、礼品卡余额、税费和汇率可能不一致。PriceAI 不教绕过平台规则，只帮你把这些变量拆开，让你知道自己适不适合走官方自助路径。
              </p>
            </div>
          </section>

          <section className="mt-12">
            <h2 className="font-serif text-3xl font-semibold tracking-normal text-[#202829]">三种常见官方入口</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {officialEntrances.map((item) => (
                <GuideCard key={item.title} {...item} />
              ))}
            </div>
          </section>

          <section className="mt-12 grid gap-5 lg:grid-cols-[0.68fr_1fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#5a6061]">Preparation</p>
              <h2 className="mt-3 font-serif text-3xl font-semibold leading-tight tracking-normal text-[#202829]">
                自己订阅前，先准备这些信息。
              </h2>
              <p className="mt-4 text-sm leading-7 text-[#5a6061]">
                很多订阅失败不是产品本身不能买，而是账号地区、支付方式、账单地址、商店余额或订阅入口之间没有对齐。
              </p>
            </div>
            <div className="grid gap-3">
              {preparations.map((item) => (
                <ChecklistItem key={item.title} title={item.title} text={item.text} />
              ))}
            </div>
          </section>

          <section className="mt-12">
            <div className="border-b border-[#dfe4e5] pb-4">
              <h2 className="font-serif text-2xl font-semibold tracking-normal text-[#202829]">你可以按这个顺序判断</h2>
              <p className="mt-2 text-sm leading-6 text-[#5a6061]">
                这不是“保证成功”的教程，而是一个判断框架。每一步都应以产品官网、Apple、Google 或原平台提示为准。
              </p>
            </div>
            <div className="divide-y divide-[#dfe4e5] border-b border-[#dfe4e5]">
              {decisionSteps.map((item, index) => (
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

          <section className="mt-12">
            <h2 className="font-serif text-3xl font-semibold tracking-normal text-[#202829]">常见失败原因</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {failureReasons.map((item) => (
                <ReasonCard key={item.title} {...item} />
              ))}
            </div>
          </section>

          <section className="mt-12 border-y border-[#dfe4e5] py-8">
            <div className="grid gap-6 md:grid-cols-[0.68fr_1fr] md:items-start">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#5a6061]">PriceAI</p>
                <h2 className="mt-3 font-serif text-3xl font-semibold leading-tight tracking-normal text-[#202829]">
                  PriceAI 能帮你看什么？
                </h2>
                <p className="mt-4 text-sm leading-7 text-[#5a6061]">
                  PriceAI 不代收款、不卖订阅、不保证某个地区或支付方式长期可用。它更适合作为你购买前的价格和路径参考。
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
              这些链接适合在动手订阅前核对原始规则。不同入口的地区、付款、退款和订阅管理方式可能变化，最终以官方页面和实际支付页提示为准。
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
              <h2 className="font-serif text-2xl font-semibold tracking-normal text-[#202829]">判断完官方路径，再看具体价格。</h2>
              <p className="mt-2 text-sm leading-6 text-[#5a6061]">
                如果自己支付不顺，先按 Apple ID、Google Play、支付卡、礼品卡和地区价风险逐项排查；如果准备找渠道，再回到比价工具核验当前有货报价。
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-3">
              <Link
                href="/guides/apple-id-ai-subscription"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#edf0f1] px-4 text-sm font-semibold text-[#2d3435] transition hover:bg-[#f5f7f7]"
              >
                Apple ID 路径
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
                href="/guides/ai-subscription-gift-card"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#edf0f1] px-4 text-sm font-semibold text-[#2d3435] transition hover:bg-[#f5f7f7]"
              >
                礼品卡指南
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/guides/ai-subscription-region-price-risks"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#dde4e5] px-4 text-sm font-semibold text-[#2d3435] transition hover:bg-[#d3dcdd]"
              >
                地区价风险
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

          <GuideReadingFooter currentHref="/guides/how-to-subscribe-ai-officially" />
        </article>
      </GuideDocsLayout>
    </>
  );
}

function GuideCard({
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

function ChecklistItem({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-md bg-[#f2f4f4] px-4 py-3">
      <h3 className="font-semibold text-[#202829]">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[#5a6061]">{text}</p>
    </div>
  );
}

function ReasonCard({
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

const officialEntrances = [
  {
    title: "官网订阅",
    text: "从产品官网直接升级 Plus、Pro、Team、Business 或其他套餐。路径最直观，但常见门槛是外币卡、账单地区、可用国家和税费。",
    points: ["适合长期稳定使用", "账单和取消通常在官网处理", "最终价格以官网页面为准"],
    icon: <Globe2 size={17} />,
  },
  {
    title: "App Store 订阅",
    text: "从 iOS App 内购买，由 Apple 处理付款、订阅和退款入口。它会受到 Apple ID 地区、可用付款方式、礼品卡余额和 App 内购状态影响。",
    points: ["适合苹果设备用户", "订阅通常在 Apple 账户管理", "地区和余额限制要提前确认"],
    icon: <Smartphone size={17} />,
  },
  {
    title: "Google Play 订阅",
    text: "从 Android App 内购买，由 Google Play 处理付款和订阅入口。它会受到 Google Play 国家/地区、付款资料、当地可用性和订阅迁移限制影响。",
    points: ["适合安卓设备用户", "订阅通常在 Google Play 管理", "国家/地区变更限制较多"],
    icon: <CreditCard size={17} />,
  },
];

const preparations = [
  {
    title: "确认订阅入口",
    text: "同一个产品可能同时支持官网、iOS App 和 Android App。入口不同，付款方、发票、取消订阅、退款和支持路径也可能不同。",
  },
  {
    title: "确认账号和商店地区",
    text: "Apple ID 和 Google Play 的地区会影响可见内容、付款方式、礼品卡余额和订阅可用性。不要只看某地区标价，还要看自己能否合规支付。",
  },
  {
    title: "确认支付方式",
    text: "Visa、Mastercard、当地银行卡、Apple 账户余额、Google Play 余额、礼品卡或虚拟卡都可能出现，但每个国家/地区支持的方式不一样。",
  },
  {
    title: "确认真实成本",
    text: "地区价不只等于页面标价，还可能包含税费、汇率、卡费、充值损耗、失败退款时间和后续维护成本。",
  },
];

const decisionSteps = [
  {
    title: "先看你要买哪个产品和套餐",
    text: "ChatGPT Plus、Claude Pro、Gemini Pro、Grok、Team 或 Business 的订阅入口和可用地区不完全一样。先确定目标套餐，再看它支持哪些官方入口。",
  },
  {
    title: "再判断官网能不能直接完成付款",
    text: "如果官网支持你的账号地区和支付方式，通常这是最清楚的路径。失败时先看官网提示，不要急着把问题归因于卡或地区。",
  },
  {
    title: "如果走 App Store 或 Google Play，先核对商店地区",
    text: "App 内订阅通常跟 Apple 或 Google 的账户体系绑定。账号地区、付款方式、礼品卡余额和已有订阅都会影响是否能购买或迁移。",
  },
  {
    title: "再把地区价和服务成本一起算",
    text: "如果某地区标价更低，也要把支付工具成本、汇率、税费、失败处理和后续续费成本加进去。低价不一定代表总成本最低。",
  },
  {
    title: "最后决定自己订阅还是找代订",
    text: "如果你能接受官方自助的准备成本，可以自己走官方路径。如果支付和地区条件太麻烦，再考虑代订、第三方渠道或暂时使用 API 路径。",
  },
];

const failureReasons = [
  {
    title: "地区或付款资料不匹配",
    text: "Apple 和 Google 都会把国家/地区、付款方式、账户余额和订阅可用性绑定到自己的规则里。地区不一致时，购买、切区或续订都可能失败。",
    icon: <AlertTriangle size={17} />,
  },
  {
    title: "当前入口不支持目标套餐",
    text: "有些套餐只在官网升级，有些移动端入口会有内购状态、地区或激活延迟。订阅失败时要回到官方帮助中心确认可用入口。",
    icon: <HelpCircle size={17} />,
  },
  {
    title: "礼品卡和余额存在地区限制",
    text: "Apple 或 Google 的余额通常和国家/地区绑定。礼品卡适合解决部分支付问题，但不等于一定能用于所有 AI 订阅或所有地区。",
    icon: <Gift size={17} />,
  },
  {
    title: "标价和实付价格不一致",
    text: "页面标价、税费、汇率、银行手续费、平台结算币种和账单时间都会影响最终付款金额。比价时要把这些都算进真实成本。",
    icon: <Layers3 size={17} />,
  },
];

const priceAiHelps = [
  "查看官方地区价，先知道同一套餐在不同地区的大致价格差。",
  "解释官网价、地区价、代充价、成品号价为什么不是同一种价格。",
  "如果官方自助太麻烦，可以回到第三方渠道页查看当前有货报价。",
  "在商品详情里查看来源、原始标题、库存、更新时间和反馈入口。",
  "通过指南理解 Apple ID、Google Play、外币卡和礼品卡的关系。",
  "提醒用户最终价格、付款、退款和售后仍以原平台规则为准。",
];

const officialReferences = [
  {
    title: "Apple：更改 Apple 账户国家或地区",
    text: "了解余额、订阅、付款方式和地区变更限制。",
    href: "https://support.apple.com/en-us/118283",
  },
  {
    title: "Apple：可用于 Apple 账户的付款方式",
    text: "按国家或地区确认 App Store 和订阅支持的付款方式。",
    href: "https://support.apple.com/en-us/111741",
  },
  {
    title: "Google Play：更改 Google Play 国家/地区",
    text: "了解 Google Play 地区、付款资料、余额和订阅限制。",
    href: "https://support.google.com/googleplay/answer/7431675?hl=en",
  },
  {
    title: "Google Play：接受的付款方式",
    text: "按地区确认 Google Play 支持的付款方式。",
    href: "https://support.google.com/googleplay/answer/2651410?hl=en",
  },
  {
    title: "OpenAI：ChatGPT iOS App 付费订阅",
    text: "了解 ChatGPT 官网升级和 iOS App 内购买入口差异。",
    href: "https://help.openai.com/en/articles/7905739-chatgpt-ios-app-plus-subscription",
  },
  {
    title: "OpenAI：取消 ChatGPT 订阅",
    text: "确认官网、App Store 或 Play Store 订阅的取消路径。",
    href: "https://help.openai.com/en/articles/7232927-how-do-i-cancel-my-chatgpt-plus-subscription",
  },
];

const faqs: Array<[string, string]> = [
  [
    "AI 官方订阅一定比第三方渠道靠谱吗？",
    "官方订阅的规则、账单和权益通常更清楚，但仍可能遇到地区、支付、税费、风控和退款问题。第三方渠道的问题则更多在交付方式、售后和来源透明度。两者不是简单的绝对安全和绝对不安全。",
  ],
  [
    "App Store 地区价是不是切区就能买？",
    "不是。Apple 账户地区会涉及余额、订阅、家庭共享、付款方式和内容可用性。官方文档也要求在变更地区前处理余额和订阅，并可能要求新地区的有效付款方式。",
  ],
  [
    "Google Play 地区价是不是改地区就能用？",
    "也不是。Google Play 国家/地区和付款资料、所在位置、余额、订阅和家庭组都有关系，并且地区变更存在等待和限制。实际能否订阅要以 Google Play 和产品 App 的提示为准。",
  ],
  [
    "没有外币卡怎么办？",
    "可以先判断产品是否支持 App Store、Google Play、当地付款方式或礼品卡余额。若仍无法稳定支付，再考虑代订或第三方渠道，但要把服务费、失败处理和售后一起纳入成本。",
  ],
  [
    "礼品卡适合订阅 AI 服务吗？",
    "礼品卡可能解决某些地区的余额支付问题，但它通常有地区绑定和使用限制。购买前要确认礼品卡地区、账户地区、订阅类型和余额能否用于目标 App 或服务。",
  ],
  [
    "官网订阅和 App Store 订阅有什么区别？",
    "主要区别在付款方和管理入口。官网订阅通常由产品方处理账单；App Store 订阅通常由 Apple 处理付款、订阅和部分退款入口。取消、发票、续费和支持路径可能不同。",
  ],
  [
    "为什么官方地区价和实际支付金额不一样？",
    "因为标价之外还可能有税费、汇率、银行手续费、平台结算币种和账单时间差。用地区价做参考时，最好把这些看作总成本的一部分。",
  ],
  [
    "PriceAI 是否推荐具体卡、账号或商家？",
    "不推荐。PriceAI 只整理价格、来源、库存、更新时间和指南信息，不销售订阅，不处理付款，也不对具体卡、账号或商家做背书。",
  ],
];

function buildGuideJsonLd() {
  return [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "如何自己完成 AI 官方订阅？",
      inLanguage: "zh-CN",
      url: pageUrl,
      description: "解释官网订阅、App Store、Google Play、Apple ID 地区、支付卡、礼品卡、地区价、税费和失败风险。",
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
