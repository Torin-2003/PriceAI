import { NextResponse } from "next/server";
import { priceDataCacheHeaders } from "@/lib/cache-headers";
import { listPublicMerchants } from "@/lib/data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const result = await listPublicMerchants();

  return NextResponse.json(result, {
    headers: priceDataCacheHeaders(),
  });
}
