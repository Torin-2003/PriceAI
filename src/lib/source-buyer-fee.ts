import {
  SOURCE_BUYER_FEE_PAYMENT_METHODS,
  type SourceBuyerFeePaymentMethod,
} from "./types";

const SOURCE_BUYER_FEE_NOTE_PREFIX = "后台手续费备注：";

export const sourceBuyerFeePaymentMethodOptions: ReadonlyArray<{
  value: SourceBuyerFeePaymentMethod;
  label: string;
}> = [
  { value: "alipay", label: "支付宝" },
  { value: "wechat", label: "微信支付" },
  { value: "usdt", label: "USDT" },
  { value: "balance", label: "站内余额" },
  { value: "other", label: "其他" },
];

export function isSourceBuyerFeePaymentMethod(value: unknown): value is SourceBuyerFeePaymentMethod {
  return SOURCE_BUYER_FEE_PAYMENT_METHODS.includes(value as SourceBuyerFeePaymentMethod);
}

export function sourceBuyerFeePaymentMethodLabel(value: string | null | undefined): string {
  return sourceBuyerFeePaymentMethodOptions.find((option) => option.value === value)?.label || "其他";
}

export function sourceBuyerFeeNote(notes: string | null | undefined): string {
  if (!notes) return "";
  const line = notes
    .split(/\r?\n/)
    .map((item) => item.trim())
    .find((item) => item.startsWith(SOURCE_BUYER_FEE_NOTE_PREFIX));
  return line?.slice(SOURCE_BUYER_FEE_NOTE_PREFIX.length).trim() || "";
}

export function updateSourceBuyerFeeNote(
  notes: string | null | undefined,
  note: string | null | undefined,
): string | null {
  const original = String(notes || "");
  const newline = original.includes("\r\n") ? "\r\n" : "\n";
  const kept = original
    .split(/\r?\n/)
    .filter((line) => !line.trimStart().startsWith(SOURCE_BUYER_FEE_NOTE_PREFIX));
  const preservedNotes = kept.join(newline);
  const normalizedNote = String(note || "").trim();
  if (normalizedNote) {
    const feeNote = `${SOURCE_BUYER_FEE_NOTE_PREFIX}${normalizedNote}`;
    return preservedNotes ? `${preservedNotes}${newline}${feeNote}` : feeNote;
  }
  return preservedNotes.trim() ? preservedNotes : null;
}
