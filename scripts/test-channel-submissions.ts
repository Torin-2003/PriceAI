import assert from "node:assert/strict";
import {
  buildSubmissionPriceEvidence,
  channelSubmissionKey,
  classifySubmission,
  normalizeSubmissionUrl,
  type SubmissionPriceBenchmark,
} from "../src/lib/submission-review";

assert.equal(normalizeSubmissionUrl("HTTPS://WWW.CATFK.COM/shop/HLDragon/#fragment"), "https://catfk.com/shop/HLDragon");
assert.equal(channelSubmissionKey("https://catfk.com/shop/HLDragon/"), "catfk.com/shop/hldragon");
assert.equal(channelSubmissionKey("http://www.catfk.com/shop/hldragon"), "catfk.com/shop/hldragon");
assert.equal(channelSubmissionKey("https://example.com/CaseSensitive?q=1#x"), "example.com/CaseSensitive?q=1");

const duplicate = classifySubmission({ duplicateName: "主记录" });
assert.equal(duplicate.kind, "duplicate");

const queued = classifySubmission({
  suggestedCollector: "shopApi",
  probe: { status: "queued", offerCount: 0, offers: [] },
});
assert.equal(queued.kind, "environment_issue");

const benchmarks = new Map<string, SubmissionPriceBenchmark>([
  ["chatgpt-plus", { productId: "chatgpt-plus", offerCount: 30, minPrice: 100, top5Price: 120 }],
]);
const strongProbe = {
  status: "success" as const,
  offerCount: 8,
  offers: Array.from({ length: 8 }, (_, index) => ({
    sourceTitle: `ChatGPT Plus 独立账号 ${index + 1}`,
    price: index === 0 ? 99 : 115 + index,
    currency: "CNY",
    status: "available" as const,
    url: `https://example.com/item/${index + 1}`,
  })),
};
const strongEvidence = buildSubmissionPriceEvidence(strongProbe, benchmarks);
assert.equal(strongEvidence?.lowestHitCount, 1);
assert.equal(classifySubmission({ probe: strongProbe, priceEvidence: strongEvidence }).kind, "priority_approve");

const expensiveProbe = {
  status: "success" as const,
  offerCount: 3,
  offers: Array.from({ length: 3 }, (_, index) => ({
    sourceTitle: `ChatGPT Plus 高价账号 ${index + 1}`,
    price: 200 + index,
    currency: "CNY",
    status: "available" as const,
    url: `https://example.com/high/${index + 1}`,
  })),
};
const expensiveEvidence = buildSubmissionPriceEvidence(expensiveProbe, benchmarks);
assert.equal(expensiveEvidence?.highGapCount, 3);
assert.equal(classifySubmission({ probe: expensiveProbe, priceEvidence: expensiveEvidence }).kind, "low_quality");

console.log("channel submission review tests passed");
