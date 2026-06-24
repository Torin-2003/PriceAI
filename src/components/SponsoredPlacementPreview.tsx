import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, BadgeCheck, BarChart3, ExternalLink, Megaphone } from "lucide-react";

type SponsoredPlacementKind =
  | "topBanner"
  | "home"
  | "apiTransit"
  | "apiTransitModels"
  | "apiModels";

type SponsoredPlacementPreviewProps = {
  kind: SponsoredPlacementKind;
  className?: string;
};

const showSponsorPreview = process.env.NEXT_PUBLIC_PRICEAI_SHOW_SPONSOR_PREVIEW === "1";

const placementCopy: Record<
  SponsoredPlacementKind,
  {
    label: string;
    title: string;
    body: string;
    primary: string;
    secondary: string;
    metric: string;
  }
> = {
  topBanner: {
    label: "顶部横幅占位",
    title: "AI 周边赞助展示",
    body: "适合云服务器、开发者工具、监控、域名、支付、算力等 AI 周边服务；不放卡网订阅或中转站排名型推广。",
    primary: "查看投放要求",
    secondary: "AI 周边",
    metric: "顶部横幅",
  },
  home: {
    label: "首页合作位占位",
    title: "PriceAI 生态合作展示",
    body: "适合 AI 周边服务、开发者基础设施或工具类品牌做轻曝光；不参与四个模块的客观排序。",
    primary: "查看合作方式",
    secondary: "明确标识",
    metric: "首页模块下方",
  },
  apiTransit: {
    label: "中转 API 频道赞助位",
    title: "API Gateway / 中转站赞助展示",
    body: "适合 OneHop 这类 API Gateway 或中转站展示品牌、优惠码和资料入口；价格、稳定性和准入规则仍独立展示。",
    primary: "查看该位置要求",
    secondary: "赞助展示",
    metric: "频道主位",
  },
  apiTransitModels: {
    label: "模型对比页赞助位",
    title: "按模型承接 API Gateway 合作",
    body: "适合强调模型覆盖、协议兼容、公开价格和监测能力，承接正在按 Claude / GPT 模型横向比较的用户。",
    primary: "查看投放说明",
    secondary: "价格以原站为准",
    metric: "模型页",
  },
  apiModels: {
    label: "API 模型雷达合作位",
    title: "模型 API 与开发者工具赞助",
    body: "面向正在比较官方 API、Token Plan、模型路由和开发工具的用户，适合展示 API 周边服务与可核验资料。",
    primary: "查看合作入口",
    secondary: "开发者入口",
    metric: "API 模型页",
  },
};

export function SponsoredPlacementPreview({ kind, className = "" }: SponsoredPlacementPreviewProps) {
  if (!showSponsorPreview) return null;

  const copy = placementCopy[kind];

  if (kind === "topBanner") {
    return (
      <section
        aria-label={`${copy.label}占位`}
        className={`rounded-lg border border-dashed border-[#9facad] bg-white px-4 py-3 text-[#2d3435] shadow-[0_8px_18px_rgba(45,52,53,0.025)] ${className}`}
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fff7e8] px-2.5 py-1 text-[11px] font-extrabold text-[#7a541b]">
                <Megaphone className="h-3.5 w-3.5" />
                {copy.label}
              </span>
              <span className="inline-flex rounded-full bg-[#eef3f8] px-2.5 py-1 text-[11px] font-bold text-[#47657a]">
                本地占位
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-[#5a6061]">
              <span className="font-extrabold text-[#202829]">{copy.title}</span>
              <span className="mx-2 text-[#9facad]">/</span>
              {copy.body}
            </p>
          </div>
          <Link
            href="/commercial#slots"
            className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-full bg-[#2d3435] px-4 text-xs font-bold text-[#f8f8f8] transition hover:bg-[#1f2526]"
          >
            {copy.primary}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section
      aria-label={`${copy.label}占位`}
      className={`rounded-lg border border-dashed border-[#9facad] bg-white p-4 text-[#2d3435] shadow-[0_12px_30px_rgba(45,52,53,0.035)] ${className}`}
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fff7e8] px-2.5 py-1 text-[11px] font-extrabold text-[#7a541b]">
              <Megaphone className="h-3.5 w-3.5" />
              {copy.label}
            </span>
            <span className="inline-flex rounded-full bg-[#eef3f8] px-2.5 py-1 text-[11px] font-bold text-[#47657a]">
              本地占位
            </span>
          </div>
          <h2 className="mt-3 text-lg font-extrabold leading-tight text-[#202829] md:text-xl">{copy.title}</h2>
          <p className="mt-2 max-w-[76ch] text-sm leading-7 text-[#5a6061]">{copy.body}</p>
        </div>

        <div className="min-w-0 rounded-lg bg-[#f7f9f9] p-3 ring-1 ring-[#adb3b4]/15">
          <div className="grid grid-cols-2 gap-2">
            <PreviewMetric icon={<BadgeCheck className="h-4 w-4" />} label="披露" value={copy.secondary} />
            <PreviewMetric icon={<BarChart3 className="h-4 w-4" />} label="位置" value={copy.metric} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/commercial#slots"
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#2d3435] px-3 text-xs font-bold text-[#f8f8f8] transition hover:bg-[#1f2526]"
            >
              {copy.primary}
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/commercial#rules"
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#dde4e5] px-3 text-xs font-bold text-[#2d3435] transition hover:bg-[#cfd8d9]"
            >
              方案说明
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
      <p className="mt-3 border-t border-[#dfe4e5] pt-3 text-xs leading-5 text-[#5a6061]">
        展示文案示例：该位置为赞助合作展示，不影响 PriceAI 的价格口径、风险提示、用户反馈和客观排序。
      </p>
    </section>
  );
}

function PreviewMetric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-md bg-white p-2 ring-1 ring-[#adb3b4]/15">
      <div className="flex items-center gap-1.5 text-[#5a6061]">
        {icon}
        <span className="text-[11px] font-bold">{label}</span>
      </div>
      <p className="mt-1 truncate text-xs font-extrabold text-[#202829]">{value}</p>
    </div>
  );
}
