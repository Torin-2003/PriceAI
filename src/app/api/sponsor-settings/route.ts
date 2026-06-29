import { publicDataCacheHeaders } from "@/lib/cache-headers";
import { getSponsorSettingsSummary } from "@/lib/sponsor-settings";

export const revalidate = 300;

export async function GET() {
  const settings = await getSponsorSettingsSummary();

  return Response.json(
    { ok: true, settings },
    { headers: publicDataCacheHeaders() },
  );
}
