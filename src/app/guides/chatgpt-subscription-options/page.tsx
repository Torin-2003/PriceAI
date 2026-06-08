import type { Metadata } from "next";
import { ArrowRight, CheckCircle2, CreditCard, ExternalLink, HelpCircle, Layers3, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { BrandIcon } from "@/components/BrandIcon";
import { GuideDocsLayout } from "@/components/GuideDocsLayout";
import { GuideReadingFooter } from "@/components/GuideReadingFooter";
import { JsonLd } from "@/components/JsonLd";

export const revalidate = 86400;

const pageUrl = "https://priceai.cc/guides/chatgpt-subscription-options";

export const metadata: Metadata = {
  title: "ChatGPT 获取方式：代充、成品号、Plus CDK 和 Team 邀请",
  description:
    "面向中文用户解释 ChatGPT 官方订阅、地区价、第三方代充、账号购买、成品号、Plus CDK、Team 邀请和 API/CDK 的区别，以及如何用 PriceAI 查询价格。",
  alternates: {
    canonical: "/guides/chatgpt-subscription-options",
  },
  openGraph: {
    title: "ChatGPT 获取方式：代充、成品号、Plus CDK 和 Team 邀请 | PriceAI",
    description: "先理解官方订阅、地区价、代充、账号购买、Plus CDK、Team 邀请和 API/CDK，再回到 PriceAI 查看有货报价。",
    url: pageUrl,
  },
};

export default function ChatGptSubscriptionOptionsGuide() {
  return (
    <>
      <JsonLd data={buildGuideJsonLd()} />
      <GuideDocsLayout currentHref="/guides/chatgpt-subscription-options">
        <article className="pb-14">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,0.78fr)_300px] lg:items-start">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#e8f3ec] px-3 py-1.5 text-xs font-semibold text-[#2f7a4b] ring-1 ring-[#45bf78]/15">
                <BrandIcon platform="ChatGPT" className="h-4 w-4" />
                新手指南
              </div>
              <h1 className="mt-5 font-serif text-4xl font-semibold leading-tight tracking-normal text-[#202829] sm:text-5xl">
                ChatGPT 有哪些获取方式？
              </h1>
              <p className="mt-5 max-w-[70ch] text-base leading-8 text-[#5a6061]">
                如果你只知道官网订阅要二十美元，但又看到很多渠道卖 Plus、Pro、Team 邀请、账号购买、成品号、土区价、Plus CDK、卡密和 API/CDK，这篇先帮你把路径拆清楚。PriceAI 不替任何渠道背书，只帮你在购买前看清价格和来源。
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/platforms/chatgpt"
                  className="inline-flex h-10 items-center gap-2 rounded-md bg-[#2d3435] px-4 text-sm font-semibold text-[#f8f8f8] transition hover:bg-[#202829]"
                >
                  查看 ChatGPT 平台价格
                  <ArrowRight size={16} />
                </Link>
                <Link
                  href="/?platform=ChatGPT&stock=available"
                  className="inline-flex h-10 items-center gap-2 rounded-md bg-[#dde4e5] px-4 text-sm font-semibold text-[#2d3435] transition hover:bg-[#d3dcdd]"
                >
                  进入比价工具
                  <ExternalLink size={15} />
                </Link>
              </div>
            </div>

            <aside className="border-l border-[#dfe4e5] pl-5">
              <p className="text-xs font-semibold text-[#7a8182]">快速结论</p>
              <p className="mt-4 text-sm leading-7 text-[#5a6061]">
                大体可以先分成三类：官方订阅、第三方渠道、API/CDK。你要的是稳定省心、低价试用，还是把模型接进 Codex、Cursor、OpenCode 这类工具，答案会不一样。
              </p>
            </aside>
          </div>

          <section className="mt-10 border-y border-[#dfe4e5] py-7">
            <div className="grid gap-6 md:grid-cols-[0.7fr_1fr] md:items-start">
              <div>
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-[#e8f3ec] text-[#2f7a4b]">
                  <ShieldAlert size={19} />
                </div>
                <h2 className="mt-4 font-serif text-3xl font-semibold leading-tight tracking-normal text-[#202829]">
                  先说结论：便宜只是一个维度。
                </h2>
              </div>
              <p className="text-sm leading-7 text-[#5a6061]">
                官网正价通常更清楚，但国内用户会遇到支付、地区、Apple ID 或外币卡问题。第三方渠道可能更便宜，也可能来自不同交付方式。购买前应该看清原始商品名、价格、库存、更新时间和售后规则，而不是只看最低价。
              </p>
            </div>
          </section>

          <section className="mt-12">
            <h2 className="font-serif text-3xl font-semibold tracking-normal text-[#202829]">常见获取路径</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {paths.map((item) => (
                <PathCard key={item.title} {...item} />
              ))}
            </div>
          </section>

          <section className="mt-12">
            <div className="border-b border-[#dfe4e5] pb-4">
              <h2 className="font-serif text-2xl font-semibold tracking-normal text-[#202829]">用 PriceAI 怎么查</h2>
            </div>
            <div className="divide-y divide-[#dfe4e5] border-b border-[#dfe4e5]">
              {steps.map((item, index) => (
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

          <section className="mt-12 grid gap-5 lg:grid-cols-[0.72fr_1fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#5a6061]">Decision</p>
              <h2 className="mt-3 font-serif text-3xl font-semibold leading-tight tracking-normal text-[#202829]">
                你可以按需求选路径。
              </h2>
              <p className="mt-4 text-sm leading-7 text-[#5a6061]">
                PriceAI 的价值是把这些路径放在一起比较。它不保证某条路径最适合你，也不替原平台承担售后。看到 ChatGPT 代充、Plus CDK、账号购买、Team 邀请这类标题时，先判断交付物是什么，再看价格。
              </p>
            </div>
            <div className="grid gap-3">
              <Recommendation title="想省心和长期使用" text="优先理解官方订阅、官方地区价和自己能否稳定支付。" />
              <Recommendation title="想便宜试用" text="可以看第三方渠道，但一定核验原始商品名、交付方式、更新时间和售后说明。" />
              <Recommendation title="想接入编程工具" text="不一定需要会员订阅，可以看 API/CDK、官方 API、公开模型路由或 Token Plan。" />
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
              <h2 className="font-serif text-2xl font-semibold tracking-normal text-[#202829]">看完路径，再看实时价格。</h2>
              <p className="mt-2 text-sm leading-6 text-[#5a6061]">如果想自己订阅，可以先看官方自助订阅指南；如果准备从第三方渠道购买，再看价格分层和卡网渠道判断清单。</p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-3">
              <Link
                href="/guides/how-to-subscribe-ai-officially"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#edf0f1] px-4 text-sm font-semibold text-[#2d3435] transition hover:bg-[#f5f7f7]"
              >
                官方自助订阅
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/guides/are-ai-subscription-card-shops-reliable"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#edf0f1] px-4 text-sm font-semibold text-[#2d3435] transition hover:bg-[#f5f7f7]"
              >
                卡网渠道靠谱吗
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/guides/why-ai-subscription-prices-differ"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#dde4e5] px-4 text-sm font-semibold text-[#2d3435] transition hover:bg-[#d3dcdd]"
              >
                了解价格分层
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/?platform=ChatGPT&stock=available"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#2d3435] px-4 text-sm font-semibold text-[#f8f8f8] transition hover:bg-[#202829]"
              >
                查看有货报价
                <ArrowRight size={16} />
              </Link>
            </div>
          </section>

          <GuideReadingFooter currentHref="/guides/chatgpt-subscription-options" />
        </article>
      </GuideDocsLayout>
    </>
  );
}

function PathCard({
  title,
  text,
  points,
  icon,
}: {
  title: string;
  text: string;
  points: string[];
  icon: React.ReactNode;
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

function Recommendation({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-md bg-[#f2f4f4] px-4 py-3">
      <h3 className="font-semibold text-[#202829]">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[#5a6061]">{text}</p>
    </div>
  );
}

const paths = [
  {
    title: "官方订阅",
    text: "直接按官方规则订阅 Plus、Pro、Team 或 Business。好处是路径清楚，问题是国内用户可能需要处理外币卡、账单地址、Apple ID 或地区限制。",
    points: ["适合长期稳定使用", "需要关注支付和地区限制", "最终价格以官方页面为准"],
    icon: <CreditCard size={17} />,
  },
  {
    title: "官方地区价",
    text: "同一个订阅在不同地区可能有不同价格。它不等于随便切区就能买，还可能涉及 Apple ID、当地支付方式和平台规则。",
    points: ["适合先了解价格差异", "需要核验地区和支付条件", "PriceAI 提供公开价格参考"],
    icon: <Layers3 size={17} />,
  },
  {
    title: "第三方代充或成品号",
    text: "渠道可能提供代充、直充、Plus CDK、卡密、自助开通、账号购买、成品号、Team 邀请等。价格可能更低，但交付方式和售后差异很大。",
    points: ["购买前看原始商品名", "只把有货价当作当前可买参考", "不把低价等同于可靠"],
    icon: <ShieldAlert size={17} />,
  },
  {
    title: "API/CDK 或模型路由",
    text: "如果你的目标是把模型接入 Codex、Cursor、OpenCode 等工具，不一定需要买 ChatGPT 会员，也可以比较 API 获取路径。",
    points: ["适合开发和自动化场景", "注意额度、限流和模型覆盖", "优先看公开文档可核验渠道"],
    icon: <HelpCircle size={17} />,
  },
];

const steps = [
  {
    title: "先选平台",
    text: "在首页选择 ChatGPT，或者直接进入 ChatGPT 平台页。这样可以避免 Gemini、Claude、Grok、邮箱等商品混进来影响判断。",
  },
  {
    title: "再选商品",
    text: "如果你确定要 Plus、Pro、Team 或普号，就看标准商品列表。如果还不确定，切到全部报价视图，先扫一遍原始商品标题，尤其留意代充、账号购买、Plus CDK、Team 邀请这类关键词。",
  },
  {
    title: "最后去原站核验",
    text: "点击商品详情后看来源、原始标题、价格、库存和更新时间。真正购买前仍要去原平台确认交付、售后和最终价格。",
  },
];

const faqs: Array<[string, string]> = [
  [
    "ChatGPT 官网订阅一定最安全吗？",
    "官网订阅路径最清楚，但仍然可能遇到支付、地区、账号风控、税费和条款变化。PriceAI 只提供价格和路径参考，不替任何方式做安全承诺。",
  ],
  [
    "第三方渠道为什么会便宜？",
    "可能来自地区价、资格权益、代订、批量号源、短期权益或其他交付方式。便宜背后的路径不同，风险和售后也不同，所以需要回到原平台核验。",
  ],
  [
    "ChatGPT Plus CDK 和卡密是什么？",
    "Plus CDK 或卡密一般是兑换码、激活码、自助开通码一类商品。它和官方账号直接订阅不一定是同一种交付方式，购买前要确认是给自己的账号开通，还是兑换某个权益，以及有效期、售后和失败处理。",
  ],
  [
    "ChatGPT Plus 账号购买和成品号有什么区别？",
    "账号购买通常指卖家直接交付一个账号；成品号通常指已经带有 Plus、Pro 或其他权益的账号。两者都要重点确认账号归属、是否能改密换绑、是否支持找回、售后多久，以及权益失效后怎么处理。",
  ],
  [
    "ChatGPT 代充、直充和自助开通怎么区分？",
    "直充通常强调给你的账号开通权益；代充通常是卖家代你完成支付或订阅流程；自助开通可能通过卡密、CDK 或自动化页面完成。最终仍要以原平台商品描述为准，不要只看标题和最低价。",
  ],
  [
    "ChatGPT Team 邀请是什么？",
    "Team 邀请一般是加入某个团队或商业权益空间，和个人 Plus、Pro 不一样。购买前要看清是团队邀请、母号拉人还是其他方式，并确认成员权限、使用期限、退出规则和售后范围。",
  ],
  [
    "Plus、Pro、Team 应该怎么选？",
    "如果只是日常使用，通常先看 Plus。如果需要更高额度或更强权益，再看 Pro。Team / Business 属于团队或商业权益，交付方式和个人 Plus 不一样。",
  ],
  [
    "我只是想在编程工具里用模型，需要买会员吗？",
    "不一定。很多编程工具依赖 API、模型路由或 Token Plan。可以先看 PriceAI 的模型 API 页面，再决定是买会员还是买 API 额度。",
  ],
];

function buildGuideJsonLd() {
  return [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "ChatGPT 获取方式：代充、成品号、Plus CDK 和 Team 邀请",
      inLanguage: "zh-CN",
      url: pageUrl,
      description: "解释 ChatGPT 官方订阅、官方地区价、第三方代充、账号购买、成品号、Plus CDK、Team 邀请和 API/CDK 的区别。",
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
        { "@type": "ListItem", position: 2, name: "指南", item: "https://priceai.cc/guides/chatgpt-subscription-options" },
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
