import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTransitStationBySlug } from "@/lib/api-transit-db";
import { SiteHeader } from "@/components/SiteHeader";
import TransitStationDetail, {
  TransitStationPricingPanels,
} from "@/components/TransitStationDetail";
import { JsonLd } from "@/components/JsonLd";

// Admin-published transit stations can appear after a slug was visited as a draft.
// Render details at request time so stale cached 404s cannot hide newly published stations.
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const dynamicParams = true;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const station = await getTransitStationBySlug(slug);
  if (!station) return { title: "未找到" };

  return {
    title: `${station.name} — API 中转站详情`,
    description: station.summary.slice(0, 160),
    alternates: { canonical: `/api-transit/${slug}` },
    openGraph: {
      title: `${station.name} — API 中转站详情 | PriceAI`,
      description: station.summary.slice(0, 160),
    },
  };
}

export default async function ApiTransitDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const station = await getTransitStationBySlug(slug, { includeHistory: true });

  if (!station) notFound();

  return (
    <div className="min-h-screen bg-[#f9f9f9] text-[#2d3435]">
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: `${station.name} — API 中转站详情`,
            description: station.summary.slice(0, 160),
            url: `https://priceai.cc/api-transit/${slug}`,
            isPartOf: {
              "@type": "WebSite",
              name: "PriceAI",
              url: "https://priceai.cc",
            },
          },
        ]}
      />

      <div className="sticky top-0 z-40 border-b border-[#dfe4e5] bg-[#f9f9f9]/95 backdrop-blur-[18px]">
        <SiteHeader activeSection="transit" />
      </div>

      <main className="mx-auto max-w-[1500px] px-4 py-6 pb-20 sm:px-5 sm:py-7">
        <TransitStationDetail station={station}>
          <TransitStationPricingPanels station={station} />
        </TransitStationDetail>
      </main>
    </div>
  );
}
