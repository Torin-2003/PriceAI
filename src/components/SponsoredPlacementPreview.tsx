import type { ReactNode } from "react";
import { ArrowRight, BadgeCheck, BarChart3, ExternalLink, Megaphone } from "lucide-react";

type SponsoredPlacementKind =
  | "home"
  | "apiTransit"
  | "apiTransitModels"
  | "apiModels"
  | "transitDetail"
  | "guides";

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
  home: {
    label: "首页合作位",
    title: "AI Gateway 合作展示",
    body: "适合 OneHop 这类多模型路由平台做品牌露出，引导开发者进入中转 API 或 API 模型频道继续比较。",
    primary: "查看合作站点",
    secondary: "不影响模块排序",
    metric: "首页轻曝光",
  },
  apiTransit: {
    label: "中转 API 频道赞助",
    title: "OneHop AI Gateway",
    body: "统一 API 接入多家模型，适合开发者和团队用户作为备用路由。该位置展示品牌与优惠，不参与价格排序。",
    primary: "访问 OneHop",
    secondary: "赞助展示",
    metric: "频道主位",
  },
  apiTransitModels: {
    label: "模型对比页轻赞助",
    title: "按模型查看 OneHop 覆盖情况",
    body: "适合强调模型覆盖、协议兼容和稳定性数据，承接正在按 Claude / GPT 模型做横向比较的用户。",
    primary: "查看模型覆盖",
    secondary: "价格以原站为准",
    metric: "模型页",
  },
  apiModels: {
    label: "API 模型雷达合作位",
    title: "OneHop 多模型路由入口",
    body: "面向正在比较官方 API、Token Plan 与路由平台的用户，突出统一接口、多协议和可用性数据。",
    primary: "了解 API Gateway",
    secondary: "开发者入口",
    metric: "API 模型页",
  },
  transitDetail: {
    label: "详情页合作模块",
    title: "OneHop 合作资料位",
    body: "用于展示商家资料、协议支持、监测入口、优惠码和赞助披露。风险提示、价格表和用户反馈仍保持独立展示。",
    primary: "查看资料",
    secondary: "合作不等于担保",
    metric: "详情承接",
  },
  guides: {
    label: "指南页内容赞助",
    title: "由 OneHop 支持的 API Gateway 说明位",
    body: "适合放在中转 API、官方 API 与多模型路由相关指南底部，作为阅读后的轻量延伸入口。",
    primary: "查看赞助方",
    secondary: "内容结论独立",
    metric: "内容赞助",
  },
};

export function SponsoredPlacementPreview({ kind, className = "" }: SponsoredPlacementPreviewProps) {
  if (!showSponsorPreview) return null;

  const copy = placementCopy[kind];
  const compact = kind === "transitDetail" || kind === "guides";

  return (
    <section
      aria-label={`${copy.label}占位`}
      className={`rounded-lg border border-dashed border-[#9facad] bg-white p-4 text-[#2d3435] shadow-[0_12px_30px_rgba(45,52,53,0.035)] ${className}`}
    >
      <div className={`grid gap-4 ${compact ? "" : "lg:grid-cols-[minmax(0,1fr)_260px] lg:items-center"}`}>
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
          <h2 className={`${compact ? "mt-3 text-base" : "mt-3 text-lg md:text-xl"} font-extrabold leading-tight text-[#202829]`}>
            {copy.title}
          </h2>
          <p className="mt-2 max-w-[76ch] text-sm leading-7 text-[#5a6061]">{copy.body}</p>
        </div>

        <div className="min-w-0 rounded-lg bg-[#f7f9f9] p-3 ring-1 ring-[#adb3b4]/15">
          <div className="grid grid-cols-2 gap-2">
            <PreviewMetric icon={<BadgeCheck className="h-4 w-4" />} label="披露" value={copy.secondary} />
            <PreviewMetric icon={<BarChart3 className="h-4 w-4" />} label="位置" value={copy.metric} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#2d3435] px-3 text-xs font-bold text-[#f8f8f8]">
              {copy.primary}
              <ExternalLink className="h-3.5 w-3.5" />
            </span>
            <span className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#dde4e5] px-3 text-xs font-bold text-[#2d3435]">
              方案说明
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </div>
      </div>
      <p className="mt-3 border-t border-[#dfe4e5] pt-3 text-xs leading-5 text-[#5a6061]">
        展示文案示例：该位置为赞助合作展示，不影响 PriceAI 的价格口径、风险提示和客观排序。
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
