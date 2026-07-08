import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Coffee, ExternalLink, HeartHandshake, ShieldCheck, Star, Wallet } from "lucide-react";
import { JsonLd } from "@/components/JsonLd";
import { SiteHeader } from "@/components/SiteHeader";
import { afdianSupportUrl, githubRepoUrl, githubStarUrl, kofiSupportUrl, paypalSupportUrl, supportContactUrl } from "@/lib/support";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "支持 PriceAI",
  description: "如果 PriceAI 对你有帮助，可以通过 GitHub Star、爱发电、Ko-fi / PayPal 或反馈线索支持项目继续维护。",
  alternates: {
    canonical: "/support",
  },
  openGraph: {
    title: "支持 PriceAI",
    description: "支持 PriceAI 继续维护 AI 订阅、官方 API 和中转 API 的公开价格信息。",
    url: "https://priceai.cc/support",
    siteName: "PriceAI",
  },
};

const impactItems = [
  ["数据维护", "继续补充卡网订阅、官方订阅、官方 API 和中转 API 的价格、来源与更新时间。"],
  ["采集修复", "处理渠道页面变化、解析失败、库存误判和用户反馈里的数据问题。"],
  ["公开说明", "整理购买指南、风险边界、商业披露和可复查的数据口径。"],
];

const boundaries = [
  "支持项目不会影响 PriceAI 的客观排序、最低价计算、风险提示或渠道展示规则。",
  "广告、赞助、AFF 或商务合作会单独标识，不会伪装成自然推荐。",
  "如果你只是发现价格错误、缺货或风险线索，直接提交反馈或开 Issue 就已经很有帮助。",
];

export default function SupportPage() {
  const supportCards = [
    {
      title: "GitHub Star",
      label: "最轻量",
      body: "如果这个项目帮你少踩了一次坑，点一个 Star 就能帮助更多人发现 PriceAI。",
      actionLabel: "去 GitHub 点 Star",
      href: githubRepoUrl,
      icon: Star,
      active: true,
      rel: "noreferrer",
    },
    {
      title: "爱发电",
      label: "中文优先",
      body: "适合国内用户用微信、支付宝支持维护。账号开通后，这里会直接跳到 PriceAI 的爱发电页面。",
      actionLabel: afdianSupportUrl ? "打开爱发电" : "爱发电入口开通中",
      href: afdianSupportUrl,
      icon: Wallet,
      active: Boolean(afdianSupportUrl),
      rel: "nofollow noopener noreferrer",
    },
    {
      title: "Ko-fi / PayPal",
      label: "国际备选",
      body: "适合海外用户通过 Ko-fi 支持；当前优先接 PayPal，暂不把 Stripe 作为默认收款路径。",
      actionLabel: kofiSupportUrl || paypalSupportUrl ? "打开国际支持入口" : "国际入口开通中",
      href: kofiSupportUrl || paypalSupportUrl,
      icon: Coffee,
      active: Boolean(kofiSupportUrl || paypalSupportUrl),
      rel: "nofollow noopener noreferrer",
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-page)] text-[var(--color-text-body)]">
      <JsonLd data={buildSupportJsonLd()} />
      <div className="sticky top-0 z-40 bg-[var(--color-page-translucent)] shadow-[var(--shadow-control)] backdrop-blur-xl">
        <SiteHeader />
      </div>

      <main>
        <section className="border-b border-[var(--color-border)]">
          <div className="mx-auto max-w-[1500px] border-x border-[var(--color-border-soft)] px-5 py-12 sm:px-8 md:py-16">
            <div className="mx-auto max-w-4xl text-center">
              <p className="text-sm font-semibold text-[var(--color-success-text)]">支持 PriceAI</p>
              <h1 className="mt-5 text-balance font-serif text-[2.18rem] font-semibold leading-tight tracking-normal text-[var(--color-text-primary)] sm:text-5xl md:text-6xl">
                如果 PriceAI 对你有帮助，可以支持它继续维护。
              </h1>
              <p className="mx-auto mt-5 max-w-[72ch] text-pretty text-base leading-8 text-[var(--color-text-muted)]">
                PriceAI 会继续整理 AI 订阅、官方 API 和中转 API 的公开价格、风险边界和资料入口。支持可以很轻：点一个 Star、补一条线索，或者买杯咖啡。
              </p>
              <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                <a
                  href={githubStarUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[var(--color-primary)] px-6 text-sm font-semibold text-[var(--color-text-on-primary)] transition hover:bg-[var(--color-primary-hover)]"
                >
                  GitHub 点 Star
                  <Star size={16} />
                </a>
                <Link
                  href="#ways"
                  className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--color-panel)] px-6 text-sm font-semibold text-[var(--color-text-primary)] ring-1 ring-[var(--color-border-soft)] transition hover:bg-[var(--color-surface-hover)]"
                >
                  查看支持方式
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section id="ways" className="border-b border-[var(--color-border)] bg-[var(--color-panel)]">
          <div className="mx-auto max-w-[1500px] border-x border-[var(--color-border-soft)] px-5 py-12 sm:px-8 md:py-14">
            <div className="mx-auto max-w-6xl">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-[var(--color-success-text)]">支持方式</p>
                  <h2 className="mt-3 max-w-3xl text-balance font-serif text-3xl font-semibold tracking-normal text-[var(--color-text-primary)] sm:text-4xl">
                    先保留低门槛入口。
                  </h2>
                </div>
                <p className="max-w-[48ch] text-sm leading-7 text-[var(--color-text-muted)]">
                  国内优先走爱发电；海外用户可用 Ko-fi + PayPal。Stripe 这类门槛更高的收款方式暂不作为默认方案。
                </p>
              </div>

              <div className="mt-8 grid gap-3 lg:grid-cols-3">
                {supportCards.map((card) => {
                  const Icon = card.icon;
                  const content = (
                    <>
                      <div className="flex items-start justify-between gap-3">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-surface)] text-[var(--color-text-primary)] ring-1 ring-[var(--color-border-soft)]">
                          <Icon size={18} />
                        </span>
                        <span className="rounded-full bg-[var(--color-success-bg)] px-3 py-1 text-xs font-semibold text-[var(--color-success-text)]">
                          {card.label}
                        </span>
                      </div>
                      <h3 className="mt-5 text-lg font-semibold text-[var(--color-text-primary)]">{card.title}</h3>
                      <p className="mt-2 min-h-[5.25rem] text-sm leading-7 text-[var(--color-text-muted)]">{card.body}</p>
                      <span
                        className={`mt-5 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold transition ${
                          card.active
                            ? "bg-[var(--color-primary)] text-[var(--color-text-on-primary)] hover:bg-[var(--color-primary-hover)]"
                            : "bg-[var(--color-surface)] text-[var(--color-text-muted)] ring-1 ring-[var(--color-border-soft)]"
                        }`}
                      >
                        {card.actionLabel}
                        {card.active ? <ExternalLink size={15} /> : null}
                      </span>
                    </>
                  );

                  return card.href ? (
                    <a
                      key={card.title}
                      href={card.href}
                      target="_blank"
                      rel={card.rel}
                      className="rounded-lg bg-[var(--color-surface-raised)] p-5 ring-1 ring-[var(--color-border-soft)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-control)]"
                    >
                      {content}
                    </a>
                  ) : (
                    <article key={card.title} className="rounded-lg bg-[var(--color-surface-raised)] p-5 ring-1 ring-[var(--color-border-soft)]">
                      {content}
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-[var(--color-border)]">
          <div className="mx-auto max-w-[1500px] border-x border-[var(--color-border-soft)] px-5 py-12 sm:px-8 md:py-14">
            <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.7fr_1fr] lg:items-start">
              <div>
                <p className="text-sm font-semibold text-[var(--color-success-text)]">支持会用在哪里</p>
                <h2 className="mt-3 text-balance font-serif text-3xl font-semibold tracking-normal text-[var(--color-text-primary)] sm:text-4xl">
                  继续把购买前的信息整理清楚。
                </h2>
                <p className="mt-4 text-sm leading-7 text-[var(--color-text-muted)]">
                  这不是会员付费墙，也不是排序权益。支持费用会优先用于维护公开数据、修复采集器和补充风险说明。
                </p>
              </div>
              <div className="divide-y divide-[var(--color-border-subtle)] overflow-hidden rounded-lg bg-[var(--color-panel)] ring-1 ring-[var(--color-border-soft)]">
                {impactItems.map(([title, body]) => (
                  <article key={title} className="grid gap-2 px-5 py-5 sm:grid-cols-[160px_minmax(0,1fr)] sm:gap-6">
                    <h3 className="text-base font-semibold text-[var(--color-text-primary)]">{title}</h3>
                    <p className="text-sm leading-7 text-[var(--color-text-muted)]">{body}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-[var(--color-border)] bg-[var(--color-panel)]">
          <div className="mx-auto max-w-[1500px] border-x border-[var(--color-border-soft)] px-5 py-12 sm:px-8 md:py-14">
            <div className="mx-auto max-w-5xl rounded-lg bg-[var(--color-surface)] p-5 ring-1 ring-[var(--color-border-soft)]">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-[var(--color-text-primary)]">
                <ShieldCheck size={18} />
                支持与商业边界
              </h2>
              <div className="mt-5 divide-y divide-[var(--color-border-subtle)]">
                {boundaries.map((item) => (
                  <p key={item} className="py-3 text-sm leading-7 text-[var(--color-text-muted)]">
                    {item}
                  </p>
                ))}
              </div>
            </div>

            <div className="mx-auto mt-8 flex max-w-5xl flex-col items-center gap-3 rounded-lg bg-[var(--color-surface)] p-5 text-center ring-1 ring-[var(--color-border-soft)] sm:flex-row sm:justify-between sm:text-left">
              <div>
                <h3 className="flex items-center justify-center gap-2 text-base font-semibold text-[var(--color-text-primary)] sm:justify-start">
                  <HeartHandshake size={18} />
                  账号入口还没显示？
                </h3>
                <p className="mt-1 text-sm leading-6 text-[var(--color-text-muted)]">
                  你也可以先在 Telegram 联系，或去 GitHub 提交 Issue / PR。
                </p>
              </div>
              <a
                href={supportContactUrl}
                target="_blank"
                rel="nofollow noopener noreferrer"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[var(--color-primary)] px-5 text-sm font-semibold text-[var(--color-text-on-primary)] transition hover:bg-[var(--color-primary-hover)]"
              >
                联系维护者
                <ArrowRight size={16} />
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function buildSupportJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "支持 PriceAI",
    url: "https://priceai.cc/support",
    inLanguage: "zh-CN",
    description: "说明如何通过 GitHub Star、中文打赏入口和国际打赏入口支持 PriceAI。",
    isPartOf: {
      "@type": "WebSite",
      name: "PriceAI",
      url: "https://priceai.cc",
    },
  };
}
