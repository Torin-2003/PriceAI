"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { AppLogo } from "@/components/AppLogo";
import { FeedbackLink, GitHubLink } from "@/components/FeedbackLink";

type HeaderMetric = {
  label: string;
  value: string;
  icon?: ReactNode;
};

const navItems = [
  { href: "/", label: "订阅比价", match: (pathname: string) => pathname === "/" || pathname.startsWith("/products") },
  { href: "/official-prices", label: "官方地区价", match: (pathname: string) => pathname.startsWith("/official-prices") },
  { href: "/api-models", label: "API 模型", match: (pathname: string) => pathname.startsWith("/api-models") },
  { href: "/about", label: "关于", match: (pathname: string) => pathname.startsWith("/about") },
];

export function SiteHeader({
  metrics = [],
  maxWidthClassName = "max-w-[1500px]",
  logoCompact = false,
}: {
  metrics?: HeaderMetric[];
  maxWidthClassName?: string;
  logoCompact?: boolean;
}) {
  const pathname = usePathname();

  return (
    <header>
      <div className={`mx-auto flex ${maxWidthClassName} items-center justify-between gap-4 px-5 py-4 sm:px-8`}>
        <Link href="/" aria-label="PriceAI 首页" className="shrink-0">
          <AppLogo compact={logoCompact} />
        </Link>

        <nav className="hidden shrink-0 items-center rounded-full bg-[#e4e9ea] p-1 text-sm font-semibold text-[#5a6061] lg:flex">
          {navItems.map((item) => {
            const active = item.match(pathname);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex h-9 items-center whitespace-nowrap rounded-full px-4 transition ${
                  active
                    ? "bg-[#2d3435] text-[#f8f8f8] shadow-[0_10px_30px_rgba(45,52,53,0.10)]"
                    : "hover:bg-[#edf0f1] hover:text-[#202829]"
                }`}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex min-w-0 items-center justify-end gap-2 sm:gap-3">
          {metrics.length ? (
            <div className="hidden items-center gap-3 xl:flex">
              {metrics.map((metric) => (
                <HeaderMetric key={metric.label} label={metric.label} value={metric.value} icon={metric.icon} />
              ))}
            </div>
          ) : null}
          <FeedbackLink compact />
          <GitHubLink compact />
        </div>
      </div>

      <div className="border-t border-[#dfe4e5] px-5 pb-3 sm:px-8 lg:hidden">
        <nav className={`mx-auto flex ${maxWidthClassName} gap-2 overflow-x-auto pt-3 text-sm font-semibold text-[#5a6061]`}>
          {navItems.map((item) => {
            const active = item.match(pathname);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex h-10 shrink-0 items-center rounded-full px-4 transition ${
                  active
                    ? "bg-[#2d3435] text-[#f8f8f8]"
                    : "bg-[#e4e9ea] hover:bg-[#dde4e5] hover:text-[#202829]"
                }`}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

function HeaderMetric({ label, value, icon }: HeaderMetric) {
  return (
    <div className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-3.5 text-sm font-semibold text-[#2d3435] shadow-[0_10px_30px_rgba(45,52,53,0.04)] ring-1 ring-[#adb3b4]/15">
      {icon ? <span className="text-[#5a6061]">{icon}</span> : null}
      <span className="text-[#5a6061]">{label}</span>
      <span className="text-[#202829]">{value}</span>
    </div>
  );
}
