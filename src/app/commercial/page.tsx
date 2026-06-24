import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, CircleDollarSign, FileText, Megaphone, ShieldCheck } from "lucide-react";
import { JsonLd } from "@/components/JsonLd";
import { SiteHeader } from "@/components/SiteHeader";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "商务合作与广告投放",
  description: "PriceAI 商务合作说明：广告位、赞助展示、AFF 合作、商家入驻资料要求和商业披露原则。",
  alternates: {
    canonical: "/commercial",
  },
  openGraph: {
    title: "PriceAI 商务合作与广告投放",
    description: "了解 PriceAI 可合作位置、资料要求、披露方式和不影响客观排序的合作原则。",
    url: "https://priceai.cc/commercial",
    siteName: "PriceAI",
  },
};

const slots = [
  {
    title: "首页顶部横幅",
    fit: "云服务器、监控、开发者工具、域名、支付、算力、API 周边服务",
    note: "不承接卡网订阅或中转站排名型推广，避免用户误以为是购买建议。",
  },
  {
    title: "首页生态合作位",
    fit: "AI 周边服务、开发者基础设施、工具类品牌、长期合作公告",
    note: "用于轻曝光和品牌说明，不进入四个核心模块的排序逻辑。",
  },
  {
    title: "中转 API 频道赞助位",
    fit: "API Gateway、中转站、模型路由平台、公开可核验的优惠码",
    note: "必须标注赞助关系；价格、倍率、可用性和风险提示仍按 PriceAI 规则展示。",
  },
  {
    title: "API 模型雷达合作位",
    fit: "模型 API、Token Plan、开发者工具、统一接口、模型路由相关服务",
    note: "更适合开发者向产品，要求提供清晰官网、定价页或公开说明。",
  },
];

const cooperationModes = [
  ["赞助展示", "按月或按周期展示，前台明确标注“赞助 / 广告”，适合没有 AFF 或价格不占优势的商家。"],
  ["AFF / 返佣", "如果商家已有 AFF，可优先走返佣链接；前台会披露 AFF，不作为排序加权的唯一依据。"],
  ["优惠码合作", "固定优惠码建议使用 PressAI，优惠形式由商家自定，可以是赠金、充值折扣或首充优惠。"],
  ["入驻与数据对接", "中转站可提交公开价格、模型分组、充值倍率、监测页和测试 Key，供 PriceAI 核验后收录。"],
];

const requirements = [
  "官网地址、产品介绍、适合投放的页面位置和希望展示的周期。",
  "公司或个人主体、是否能开发票、合同抬头与付款方式。",
  "若涉及中转 API，需提供公开价格页、模型分组倍率、充值倍率、模型基准价、上游来源说明和可用性监测页。",
  "若涉及 AFF 或优惠码，需说明跳转链接、返佣规则、优惠码政策、数据后台或可核验的注册充值统计方式。",
  "广告素材需提供短标题、30 到 80 字说明、落地页、披露语，以及必要的 Logo 或品牌图。",
];

const boundaries = [
  "商业合作不能购买自然排名，不能覆盖价格、可用性、用户反馈和风险提示。",
  "详情页和指南页默认不放广告位，避免影响用户判断和内容可信度。",
  "涉及中转站时，赞助展示不等于 PriceAI 担保，用户仍需小额试用并回原站核验。",
  "不接受误导性文案、夸大稳定性、隐藏上游来源或与公开页面不一致的价格宣传。",
];

export default function CommercialPage() {
  return (
    <div className="min-h-screen bg-[var(--color-page)] text-[var(--color-text-body)]">
      <JsonLd data={buildCommercialJsonLd()} />
      <div className="sticky top-0 z-40 bg-[var(--color-page-translucent)] shadow-[var(--shadow-control)] backdrop-blur-xl">
        <SiteHeader />
      </div>

      <main>
        <section className="border-b border-[var(--color-border)]">
          <div className="mx-auto max-w-[1500px] border-x border-[var(--color-border-soft)] px-5 py-12 sm:px-8 md:py-16">
            <div className="mx-auto max-w-4xl text-center">
              <p className="text-sm font-semibold text-[var(--color-success-text)]">商务合作</p>
              <h1 className="mt-5 text-balance font-serif text-[2.18rem] font-semibold leading-tight tracking-normal text-[var(--color-text-primary)] sm:text-5xl md:text-6xl">
                广告可以做，但必须和客观比较分开。
              </h1>
              <p className="mx-auto mt-5 max-w-[72ch] text-pretty text-base leading-8 text-[var(--color-text-muted)]">
                PriceAI 接受赞助展示、AFF、优惠码和商家入驻合作。所有商业关系都会明确标识，不购买自然排序，不替任何商家担保。
              </p>
              <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                <a
                  href="https://t.me/dimthink"
                  target="_blank"
                  rel="nofollow noopener noreferrer"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[var(--color-primary)] px-6 text-sm font-semibold text-[var(--color-text-on-primary)] transition hover:bg-[var(--color-primary-hover)]"
                >
                  联系 Telegram @dimthink
                  <ArrowRight size={16} />
                </a>
                <Link
                  href="/api-transit/submit"
                  className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--color-panel)] px-6 text-sm font-semibold text-[var(--color-text-primary)] ring-1 ring-[var(--color-border-soft)] transition hover:bg-[var(--color-surface-hover)]"
                >
                  提交中转站资料
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section id="slots" className="border-b border-[var(--color-border)] bg-[var(--color-panel)]">
          <div className="mx-auto max-w-[1500px] border-x border-[var(--color-border-soft)] px-5 py-12 sm:px-8 md:py-14">
            <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.7fr_1fr] lg:items-start">
              <div>
                <p className="text-sm font-semibold text-[var(--color-success-text)]">可合作位置</p>
                <h2 className="mt-3 text-balance font-serif text-3xl font-semibold tracking-normal text-[var(--color-text-primary)] sm:text-4xl">
                  不同页面承接不同类型的广告。
                </h2>
                <p className="mt-4 text-sm leading-7 text-[var(--color-text-muted)]">
                  越靠近价格和详情判断的位置，披露要求越高。指南页和详情页默认不放广告。
                </p>
              </div>
              <div className="divide-y divide-[var(--color-border-subtle)] overflow-hidden rounded-lg bg-[var(--color-surface)] ring-1 ring-[var(--color-border-soft)]">
                {slots.map((slot) => (
                  <article key={slot.title} className="grid gap-3 px-5 py-5 md:grid-cols-[190px_minmax(0,1fr)] md:gap-6">
                    <h3 className="flex items-center gap-2 text-base font-semibold text-[var(--color-text-primary)]">
                      <Megaphone size={17} />
                      {slot.title}
                    </h3>
                    <div className="min-w-0">
                      <p className="text-sm leading-7 text-[var(--color-text-body)]">{slot.fit}</p>
                      <p className="mt-1 text-sm leading-7 text-[var(--color-text-muted)]">{slot.note}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-[var(--color-border)]">
          <div className="mx-auto max-w-[1500px] border-x border-[var(--color-border-soft)] px-5 py-12 sm:px-8 md:py-14">
            <div className="mx-auto max-w-4xl text-center">
              <p className="text-sm font-semibold text-[var(--color-success-text)]">合作方式</p>
              <h2 className="mt-3 text-balance font-serif text-3xl font-semibold tracking-normal text-[var(--color-text-primary)] sm:text-4xl">
                可以赞助，也可以返佣，但都要讲清楚。
              </h2>
            </div>
            <div className="mx-auto mt-8 grid max-w-6xl gap-3 md:grid-cols-2">
              {cooperationModes.map(([title, body]) => (
                <article key={title} className="rounded-lg bg-[var(--color-panel)] p-5 ring-1 ring-[var(--color-border-soft)]">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-surface)] text-[var(--color-text-primary)] ring-1 ring-[var(--color-border-soft)]">
                    <CircleDollarSign size={18} />
                  </span>
                  <h3 className="mt-4 text-base font-semibold text-[var(--color-text-primary)]">{title}</h3>
                  <p className="mt-2 text-sm leading-7 text-[var(--color-text-muted)]">{body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="rules" className="border-b border-[var(--color-border)] bg-[var(--color-panel)]">
          <div className="mx-auto grid max-w-[1500px] gap-8 border-x border-[var(--color-border-soft)] px-5 py-12 sm:px-8 md:py-14 lg:grid-cols-2">
            <section className="rounded-lg bg-[var(--color-surface)] p-5 ring-1 ring-[var(--color-border-soft)]">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-[var(--color-text-primary)]">
                <FileText size={18} />
                需要提供的信息
              </h2>
              <div className="mt-5 divide-y divide-[var(--color-border-subtle)]">
                {requirements.map((item) => (
                  <p key={item} className="py-3 text-sm leading-7 text-[var(--color-text-muted)]">
                    {item}
                  </p>
                ))}
              </div>
            </section>

            <section className="rounded-lg bg-[var(--color-surface)] p-5 ring-1 ring-[var(--color-border-soft)]">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-[var(--color-text-primary)]">
                <ShieldCheck size={18} />
                披露与边界
              </h2>
              <div className="mt-5 divide-y divide-[var(--color-border-subtle)]">
                {boundaries.map((item) => (
                  <p key={item} className="py-3 text-sm leading-7 text-[var(--color-text-muted)]">
                    {item}
                  </p>
                ))}
              </div>
            </section>
          </div>
        </section>

        <section className="border-b border-[var(--color-border)]">
          <div className="mx-auto max-w-[1500px] border-x border-[var(--color-border-soft)] px-5 py-12 sm:px-8 md:py-14">
            <div className="mx-auto flex max-w-5xl flex-col gap-4 rounded-lg bg-[var(--color-panel)] p-5 ring-1 ring-[var(--color-border-soft)] md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <h2 className="flex items-center gap-2 text-base font-semibold text-[var(--color-text-primary)]">
                  <BadgeCheck size={18} />
                  商家联系前建议先准备资料
                </h2>
                <p className="mt-2 text-sm leading-7 text-[var(--color-text-muted)]">
                  如果是中转站，请优先准备公开价格页、监测页、分组倍率、充值倍率、优惠码政策和测试 Key。这样更容易判断适合走收录、AFF 还是赞助展示。
                </p>
              </div>
              <a
                href="https://t.me/dimthink"
                target="_blank"
                rel="nofollow noopener noreferrer"
                className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-[var(--color-primary)] px-5 text-sm font-semibold text-[var(--color-text-on-primary)] transition hover:bg-[var(--color-primary-hover)]"
              >
                发资料沟通
                <ArrowRight size={16} />
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function buildCommercialJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "PriceAI 商务合作与广告投放",
    url: "https://priceai.cc/commercial",
    inLanguage: "zh-CN",
    description: "说明 PriceAI 的广告位、赞助展示、AFF 合作、商家入驻资料要求和商业披露原则。",
    isPartOf: {
      "@type": "WebSite",
      name: "PriceAI",
      url: "https://priceai.cc",
    },
  };
}
