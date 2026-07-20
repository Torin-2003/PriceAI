import { deleteSource, setSourceOffersHidden, updateSourceState, upsertSource } from "@/lib/admin";
import { logApiError, safeApiErrorMessage } from "@/lib/api-errors";
import { normalizeCollectorKind } from "@/lib/collector-registry";
import { clearPublicDataCache, markPublicApiSnapshotsDirty } from "@/lib/data";
import { requireAdminRequest } from "@/lib/env";
import { SOURCE_BUYER_FEE_PAYMENT_METHODS, type CollectorKind } from "@/lib/types";
import { z } from "zod";

const collectorKindSchema = z.custom<CollectorKind>((value) => normalizeCollectorKind(value) === value);
const buyerFeePolicySchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("automatic") }),
  z.object({
    mode: z.literal("manual"),
    rate: z.number().min(0).max(0.2),
    paymentMethod: z.enum(SOURCE_BUYER_FEE_PAYMENT_METHODS),
    note: z.string().trim().max(300).nullable().optional(),
  }),
]);

const createSchema = z.object({
  name: z.string().min(1),
  entryUrl: z.string().url(),
  baseUrl: z.string().url().nullable().optional(),
  collectionMethod: z.enum(["public_json", "browser", "http", "manual"]).default("manual"),
  collectorKind: collectorKindSchema.nullable().optional(),
  enabled: z.boolean().default(true),
  notes: z.string().nullable().optional(),
});

const patchSchema = z.object({
  id: z.string().min(1),
  enabled: z.boolean().optional(),
  collectionMethod: z.enum(["public_json", "browser", "http", "manual"]).optional(),
  collectorKind: collectorKindSchema.nullable().optional(),
  collectionGroup: z.enum(["automatic", "vip_15m"]).optional(),
  buyerFeePolicy: buyerFeePolicySchema.optional(),
  notes: z.string().nullable().optional(),
  offersHidden: z.boolean().optional(),
  offersHiddenMode: z.enum(["manual", "temporary"]).optional(),
  reason: z.string().max(500).nullable().optional(),
});

const deleteSchema = z.object({
  id: z.string().min(1),
  deleteOffers: z.boolean().default(false),
});

export async function POST(request: Request) {
  try {
    await requireAdminRequest(request);
    const payload = createSchema.parse(await request.json());
    const source = await upsertSource(payload);
    clearPublicDataCache();
    const snapshotRefreshQueued = await markPublicApiSnapshotsDirty("admin source create", {
      sourceIds: [source.id],
    });

    return Response.json({ ok: true, source, snapshotRefreshQueued });
  } catch (error) {
    logApiError("admin source create", error);
    return Response.json(
      { ok: false, message: safeApiErrorMessage(error, "保存来源失败。") },
      { status: error instanceof z.ZodError ? 400 : 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdminRequest(request);
    const payload = patchSchema.parse(await request.json());
    if (typeof payload.offersHidden === "boolean") {
      const result = await setSourceOffersHidden({
        sourceId: payload.id,
        hidden: payload.offersHidden,
        reason: payload.reason,
        mode: payload.offersHiddenMode,
      });
      clearPublicDataCache();
      const snapshotRefreshQueued = result.updatedOfferCount > 0
        ? await markPublicApiSnapshotsDirty("admin source offers hidden", { sourceIds: [payload.id] })
        : false;

      return Response.json({ ok: true, ...result, snapshotRefreshQueued });
    }

    const source = await updateSourceState({
      id: payload.id,
      enabled: payload.enabled,
      collectionMethod: payload.collectionMethod,
      collectorKind: payload.collectorKind,
      collectionGroup: payload.collectionGroup,
      buyerFeePolicy: payload.buyerFeePolicy,
      notes: payload.notes,
    });
    clearPublicDataCache();
    const snapshotRefreshQueued = await markPublicApiSnapshotsDirty("admin source update", {
      sourceIds: [source.id],
    });

    return Response.json({ ok: true, source, snapshotRefreshQueued });
  } catch (error) {
    logApiError("admin source update", error);
    return Response.json(
      { ok: false, message: safeApiErrorMessage(error, "更新来源失败。") },
      { status: error instanceof z.ZodError ? 400 : 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdminRequest(request);
    const payload = deleteSchema.parse(await request.json());
    const result = await deleteSource(payload);
    clearPublicDataCache();
    const snapshotRefreshQueued = result.deletedOfferCount > 0 || !payload.deleteOffers
      ? await markPublicApiSnapshotsDirty("admin source delete", {
          sourceIds: [payload.id],
          full: payload.deleteOffers && result.deletedOfferCount > 0,
        })
      : false;

    return Response.json({ ok: true, ...result, snapshotRefreshQueued });
  } catch (error) {
    logApiError("admin source delete", error);
    return Response.json(
      { ok: false, message: safeApiErrorMessage(error, "删除来源失败。") },
      { status: error instanceof z.ZodError ? 400 : 500 },
    );
  }
}
