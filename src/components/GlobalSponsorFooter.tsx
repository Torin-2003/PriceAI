"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { SponsoredPlacementPreview } from "@/components/SponsoredPlacementPreview";
import type { SponsorSettingsSummary } from "@/lib/sponsor-settings-shared";

const excludedPathPrefixes = [
  "/admin",
  "/commercial",
  "/api-transit/submit",
  "/api-transit/detector/reports",
] as const;

export function GlobalSponsorFooter() {
  const pathname = usePathname();
  const [sponsorSettings, setSponsorSettings] = useState<SponsorSettingsSummary | null>(null);

  const shouldHide = excludedPathPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

  useEffect(() => {
    if (shouldHide) return;

    let cancelled = false;
    fetch("/api/sponsor-settings")
      .then((response) => response.json())
      .then((payload) => {
        if (!cancelled && payload?.ok) setSponsorSettings(payload.settings as SponsorSettingsSummary);
      })
      .catch(() => {
        if (!cancelled) setSponsorSettings(null);
      });

    return () => {
      cancelled = true;
    };
  }, [shouldHide]);

  if (shouldHide) return null;

  return (
    <SponsoredPlacementPreview
      kind="listFooter"
      settings={sponsorSettings}
      className="mx-auto w-full max-w-5xl px-5 pb-8 sm:px-8"
    />
  );
}
