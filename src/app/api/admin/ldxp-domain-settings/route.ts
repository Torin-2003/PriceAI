import { z } from "zod";
import { logApiError, safeApiErrorMessage } from "@/lib/api-errors";
import { requireAdminRequest } from "@/lib/env";
import { getLdxpDomainSettings, updateLdxpDomainMode } from "@/lib/ldxp-domain-settings";
import { LDXP_DOMAIN_MODES } from "@/lib/ldxp-domain-settings-shared";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  mode: z.enum(LDXP_DOMAIN_MODES),
});

export async function GET(request: Request) {
  try {
    await requireAdminRequest(request);
    return Response.json({ ok: true, settings: await getLdxpDomainSettings() }, { headers: noStoreHeaders });
  } catch (error) {
    logApiError("admin ldxp domain settings get", error);
    return Response.json({ ok: false, message: safeApiErrorMessage(error, "读取 LDXP 域名设置失败。") }, { status: 500, headers: noStoreHeaders });
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdminRequest(request);
    const payload = patchSchema.parse(await request.json());
    return Response.json({ ok: true, settings: await updateLdxpDomainMode(payload.mode) }, { headers: noStoreHeaders });
  } catch (error) {
    logApiError("admin ldxp domain settings update", error);
    return Response.json(
      { ok: false, message: safeApiErrorMessage(error, "保存 LDXP 域名设置失败。") },
      { status: error instanceof z.ZodError ? 400 : 500, headers: noStoreHeaders },
    );
  }
}

const noStoreHeaders = { "Cache-Control": "private, no-store, max-age=0" };
