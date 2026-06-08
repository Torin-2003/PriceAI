import type { ReactNode } from "react";
import { ArrowRight, CheckCircle2, ExternalLink, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { GuideDocsLayout } from "@/components/GuideDocsLayout";
import { GuideReadingFooter } from "@/components/GuideReadingFooter";
import { JsonLd } from "@/components/JsonLd";

export type GuideReference = {
  title: string;
  text: string;
  href: string;
};

export type GuideCardItem = {
  title: string;
  text: string;
  points?: string[];
  icon?: ReactNode;
};

export type GuideLink = {
  href: string;
  label: string;
  variant?: "primary" | "secondary" | "light";
};

export type SeoGuidePageProps = {
  currentHref: string;
  eyebrow: string;
  icon?: ReactNode;
  title: string;
  intro: string;
  quickAnswer: string;
  primaryCta: GuideLink;
  secondaryCta?: GuideLink;
  conclusionTitle: string;
  conclusionText: string;
  sections: Array<{
    eyebrow?: string;
    title: string;
    text?: string;
    items: GuideCardItem[];
    variant?: "cards" | "steps" | "checklist";
  }>;
  priceAiHelps: string[];
  references: GuideReference[];
  faqs: Array<[string, string]>;
  finalTitle: string;
  finalText: string;
  finalLinks: GuideLink[];
  jsonLd: unknown;
};

export function SeoGuidePage({
  currentHref,
  eyebrow,
  icon,
  title,
  intro,
  quickAnswer,
  primaryCta,
  secondaryCta,
  conclusionTitle,
  conclusionText,
  sections,
  priceAiHelps,
  references,
  faqs,
  finalTitle,
  finalText,
  finalLinks,
  jsonLd,
}: SeoGuidePageProps) {
  return (
    <>
      <JsonLd data={jsonLd} />
      <GuideDocsLayout currentHref={currentHref}>
        <article className="pb-14">
          <section className="grid gap-8 lg:grid-cols-[minmax(0,0.78fr)_310px] lg:items-start">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#e8f3ec] px-3 py-1.5 text-xs font-semibold text-[#2f7a4b] ring-1 ring-[#45bf78]/15">
                {icon}
                {eyebrow}
              </div>
              <h1 className="mt-5 font-serif text-4xl font-semibold leading-tight tracking-normal text-[#202829] sm:text-5xl">
                {title}
              </h1>
              <p className="mt-5 max-w-[72ch] text-base leading-8 text-[#5a6061]">{intro}</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <GuideButton link={primaryCta} />
                {secondaryCta ? <GuideButton link={secondaryCta} /> : null}
              </div>
            </div>

            <aside className="border-l border-[#dfe4e5] pl-5">
              <p className="text-xs font-semibold text-[#7a8182]">快速结论</p>
              <p className="mt-4 text-sm leading-7 text-[#5a6061]">{quickAnswer}</p>
            </aside>
          </section>

          <section className="mt-10 border-y border-[#dfe4e5] py-7">
            <div className="grid gap-6 md:grid-cols-[0.72fr_1fr] md:items-start">
              <div>
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-[#e8f3ec] text-[#2f7a4b]">
                  <ShieldAlert size={19} />
                </div>
                <h2 className="mt-4 font-serif text-3xl font-semibold leading-tight tracking-normal text-[#202829]">
                  {conclusionTitle}
                </h2>
              </div>
              <p className="text-sm leading-7 text-[#5a6061]">{conclusionText}</p>
            </div>
          </section>

          {sections.map((section) => (
            <GuideSection key={section.title} section={section} />
          ))}

          <section className="mt-12 border-y border-[#dfe4e5] py-8">
            <div className="grid gap-6 md:grid-cols-[0.68fr_1fr] md:items-start">
              <div>
                <p className="text-xs font-semibold text-[#7a8182]">PriceAI</p>
                <h2 className="mt-3 font-serif text-3xl font-semibold leading-tight tracking-normal text-[#202829]">
                  PriceAI 能帮你判断什么？
                </h2>
                <p className="mt-4 text-sm leading-7 text-[#5a6061]">
                  PriceAI 不代收款、不卖订阅、不保证某个地区、卡或支付方式长期可用。它更适合作为购买前的价格、路径和风险参考。
                </p>
              </div>
              <div className="divide-y divide-[#dfe4e5] border-y border-[#dfe4e5]">
                {priceAiHelps.map((text) => (
                  <div key={text} className="flex gap-2 py-3 text-sm leading-6 text-[#5a6061]">
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
              这些链接适合在动手购买前核对原始规则。地区、付款、余额和订阅限制可能变化，最终以官方页面和实际支付页提示为准。
            </p>
            <div className="mt-6 divide-y divide-[#dfe4e5] border-y border-[#dfe4e5]">
              {references.map((item) => (
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
              <h2 className="font-serif text-2xl font-semibold tracking-normal text-[#202829]">{finalTitle}</h2>
              <p className="mt-2 text-sm leading-6 text-[#5a6061]">{finalText}</p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-3">
              {finalLinks.map((link) => (
                <GuideButton key={link.href} link={link} />
              ))}
            </div>
          </section>

          <GuideReadingFooter currentHref={currentHref} />
        </article>
      </GuideDocsLayout>
    </>
  );
}

function GuideSection({ section }: { section: SeoGuidePageProps["sections"][number] }) {
  if (section.variant === "steps") {
    return (
      <section className="mt-12">
        <SectionIntro section={section} boxed />
        <div className="divide-y divide-[#dfe4e5] border-b border-[#dfe4e5]">
          {section.items.map((item, index) => (
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
    );
  }

  return (
    <section className="mt-12">
      <SectionIntro section={section} />
      <div className={`mt-6 grid gap-4 ${section.variant === "checklist" ? "md:grid-cols-2" : "md:grid-cols-3"}`}>
        {section.items.map((item) => (
          <GuideCard key={item.title} item={item} compact={section.variant === "checklist"} />
        ))}
      </div>
    </section>
  );
}

function SectionIntro({ section, boxed = false }: { section: SeoGuidePageProps["sections"][number]; boxed?: boolean }) {
  return (
    <div className={boxed ? "border-b border-[#dfe4e5] pb-4" : undefined}>
      {section.eyebrow ? <p className="text-xs font-semibold text-[#7a8182]">{section.eyebrow}</p> : null}
      <h2 className={`${section.eyebrow ? "mt-3 " : ""}font-serif text-3xl font-semibold tracking-normal text-[#202829]`}>{section.title}</h2>
      {section.text ? <p className="mt-3 max-w-[78ch] text-sm leading-7 text-[#5a6061]">{section.text}</p> : null}
    </div>
  );
}

function GuideCard({ item, compact }: { item: GuideCardItem; compact?: boolean }) {
  return (
    <div className="rounded-md bg-[#f2f4f4] p-4">
      {item.icon ? (
        <div className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-[#e8f3ec] text-[#2f7a4b]">{item.icon}</div>
      ) : null}
      <h3 className={item.icon ? "mt-3 font-semibold text-[#202829]" : "font-semibold text-[#202829]"}>{item.title}</h3>
      <p className="mt-2 text-sm leading-7 text-[#5a6061]">{item.text}</p>
      {item.points?.length ? (
        <ul className={`${compact ? "mt-3" : "mt-4"} space-y-2 text-sm text-[#5a6061]`}>
          {item.points.map((point) => (
            <li key={point} className="flex gap-2">
              <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-[#2f7a4b]" />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function GuideButton({ link }: { link: GuideLink }) {
  const className =
    link.variant === "primary"
      ? "bg-[#2d3435] text-[#f8f8f8] transition hover:bg-[#202829]"
      : link.variant === "secondary"
        ? "bg-[#dde4e5] text-[#2d3435] transition hover:bg-[#d3dcdd]"
        : "bg-white text-[#2d3435] transition hover:bg-[#f5f7f7]";

  return (
    <Link href={link.href} className={`inline-flex h-10 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold ${className}`}>
      {link.label}
      <ArrowRight size={16} />
    </Link>
  );
}
