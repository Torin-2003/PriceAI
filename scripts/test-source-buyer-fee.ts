import assert from "node:assert/strict";

import {
  sourceBuyerFeeNote,
  sourceBuyerFeePaymentMethodLabel,
  updateSourceBuyerFeeNote,
} from "../src/lib/source-buyer-fee";

assert.equal(sourceBuyerFeePaymentMethodLabel("alipay"), "支付宝");
assert.equal(sourceBuyerFeePaymentMethodLabel("unknown"), "其他");

const notes = updateSourceBuyerFeeNote("由采集器维护。\n后台手续费备注：旧证据", "支付页人工核验");
assert.equal(notes, "由采集器维护。\n后台手续费备注：支付页人工核验");
assert.equal(sourceBuyerFeeNote(notes), "支付页人工核验");
assert.equal(updateSourceBuyerFeeNote(notes, null), "由采集器维护。");

const formattedNotes = "  保留前导空格\n\n后台手续费备注：旧证据\n尾部备注  ";
assert.equal(
  updateSourceBuyerFeeNote(formattedNotes, "新证据"),
  "  保留前导空格\n\n尾部备注  \n后台手续费备注：新证据",
);
assert.equal(
  updateSourceBuyerFeeNote(formattedNotes, null),
  "  保留前导空格\n\n尾部备注  ",
);

console.log("source buyer fee tests passed");
