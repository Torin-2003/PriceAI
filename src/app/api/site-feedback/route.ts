import { z } from "zod";
import { createSiteFeedback } from "@/lib/admin";

const typeSchema = z.enum(["feature", "data", "ux", "channel", "bug", "other"]);

const schema = z.object({
  type: typeSchema,
  message: z.string().trim().min(3).max(1000),
  contact: z.string().trim().max(200).nullable().optional(),
  pageUrl: z.string().url().max(2048).nullable().optional(),
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
  if (message.includes("刚刚提交过")) return 409;
  if (message.includes("反馈过于频繁")) return 429;
  return 500;
}

export async function POST(request: Request) {
  try {
    const payload = schema.parse(await request.json());

    if (payload.website) {
      return Response.json({ ok: true });
    }

    const result = await createSiteFeedback({
      type: payload.type,
      message: payload.message,
      contact: payload.contact || null,
      pageUrl: payload.pageUrl || null,
      submitterIp: getClientIp(request),
    });

    return Response.json({ ok: true, ...result });
  } catch (error) {
    const message = getErrorMessage(error);
    return Response.json({ ok: false, message }, { status: getErrorStatus(error, message) });
  }
}
