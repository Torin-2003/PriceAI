import { z } from "zod";
import { logApiError, safeApiErrorMessage } from "@/lib/api-errors";
import { requireAdminOrCronRequest } from "@/lib/env";
import { recordLdxpAutomaticSwitch } from "@/lib/ldxp-domain-settings";
import { LDXP_PAY_HOST, LDXP_WWW_HOST } from "@/lib/ldxp-domain-settings-shared";

const hostSchema = z.enum([LDXP_WWW_HOST, LDXP_PAY_HOST]);
const postSchema = z.object({
  fromHost: hostSchema,
  toHost: hostSchema,
  reason: z.string().trim().min(1).max(500),
}).refine((value) => value.fromHost !== value.toHost, { message: "备用域名必须不同于当前域名。" });

export async function POST(request: Request) {
  try {
    await requireAdminOrCronRequest(request);
    const payload = postSchema.parse(await request.json());
    return Response.json({ ok: true, ...(await recordLdxpAutomaticSwitch(payload)) });
  } catch (error) {
    logApiError("collector agent ldxp domain switch", error);
    return Response.json(
      { ok: false, message: safeApiErrorMessage(error, "记录 LDXP 自动切换失败。") },
      { status: error instanceof z.ZodError ? 400 : 500 },
    );
  }
}
