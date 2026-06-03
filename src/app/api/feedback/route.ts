import { z } from "zod";
import { createOfferFeedback } from "@/lib/admin";

const reasonSchema = z.enum([
  "wrong_price",
  "item_removed",
  "stock_mismatch",
  "fraud",
  "wrong_category",
  "bad_source",
  "other",
]);

const schema = z.object({
  productId: z.string().max(200).nullable().optional(),
  productSlug: z.string().max(200).nullable().optional(),
  productName: z.string().max(200).nullable().optional(),
  offerId: z.string().max(200).nullable().optional(),
  sourceId: z.string().max(200).nullable().optional(),
  sourceName: z.string().max(300).nullable().optional(),
  sourceTitle: z.string().max(1000).nullable().optional(),
  offerUrl: z.string().url().max(2048).nullable().optional(),
  reason: reasonSchema,
  notes: z.string().trim().max(500).nullable().optional(),
  contact: z.string().trim().max(200).nullable().optional(),
  website: z.string().max(200).nullable().optional(),
});

function getClientIp(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return request.headers.get("x-real-ip");
}

function getErrorMessage(error: unknown): string {
  if (error instanceof z.ZodError) return "反馈内容格式不正确。";
  if (error instanceof Error) return error.message;
  return "反馈提交失败。";
}

function getErrorStatus(error: unknown, message: string): number {
  if (error instanceof z.ZodError) return 400;
  if (message.includes("刚刚被反馈过")) return 409;
  if (message.includes("反馈过于频繁")) return 429;
  return 500;
}

export async function POST(request: Request) {
  try {
    const payload = schema.parse(await request.json());

    if (payload.website) {
      return Response.json({ ok: true });
    }

    const result = await createOfferFeedback({
      productId: payload.productId || null,
      productSlug: payload.productSlug || null,
      productName: payload.productName || null,
      offerId: payload.offerId || null,
      sourceId: payload.sourceId || null,
      sourceName: payload.sourceName || null,
      sourceTitle: payload.sourceTitle || null,
      offerUrl: payload.offerUrl || null,
      reason: payload.reason,
      notes: payload.notes || null,
      contact: payload.contact || null,
      submitterIp: getClientIp(request),
    });

    return Response.json({ ok: true, ...result });
  } catch (error) {
    const message = getErrorMessage(error);
    return Response.json({ ok: false, message }, { status: getErrorStatus(error, message) });
  }
}
