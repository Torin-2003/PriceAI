"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Info } from "lucide-react";
import { AppLogo } from "@/components/AppLogo";
import { FeedbackLink, GitHubLink } from "@/components/FeedbackLink";

const navItems = [
  { href: "/", label: "卡网渠道", match: (pathname: string) => pathname === "/" || pathname.startsWith("/products") },
  { href: "/official-prices", label: "官方订阅", match: (pathname: string) => pathname.startsWith("/official-prices") },
  { href: "/api-models", label: "模型 API", match: (pathname: string) => pathname.startsWith("/api-models") },
];

export function SiteHeader({
  maxWidthClassName = "max-w-[1500px]",
  logoCompact = false,
}: {
  maxWidthClassName?: string;
  logoCompact?: boolean;
}) {
  const pathname = usePathname();
  const aboutActive = pathname.startsWith("/about");

  return (
    <header>
      <div className={`relative mx-auto flex ${maxWidthClassName} items-center justify-between gap-4 px-5 py-4 sm:px-8`}>
        <Link href="/" aria-label="PriceAI 首页" className="relative z-10 shrink-0">
          <AppLogo compact={logoCompact} />
        </Link>

        <nav className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center rounded-full bg-[#e4e9ea] p-1 text-sm font-semibold text-[#5a6061] xl:flex">
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

        <div className="relative z-10 flex min-w-0 items-center justify-end gap-2 sm:gap-3">
          <Link
            href="/about"
            className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-full px-3.5 text-sm font-semibold shadow-[0_10px_30px_rgba(45,52,53,0.06)] ring-1 ring-[#adb3b4]/25 transition hover:-translate-y-0.5 ${
              aboutActive
                ? "bg-[#2d3435] text-[#f8f8f8]"
                : "bg-white text-[#2d3435] hover:bg-[#f5f7f7] hover:text-[#202829]"
            }`}
            aria-current={aboutActive ? "page" : undefined}
          >
            <Info size={16} />
            <span className="hidden sm:inline">关于</span>
          </Link>
          <FeedbackLink compact />
          <GitHubLink compact />
        </div>
      </div>

      <div className="border-t border-[#dfe4e5] px-5 pb-3 sm:px-8 xl:hidden">
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
