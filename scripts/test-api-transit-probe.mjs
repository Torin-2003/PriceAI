#!/usr/bin/env node

import assert from "node:assert/strict";
import { __test } from "./probe-api-transit.mjs";

assert.equal(__test.normalizeFamily("google/gemini-3.5-flash"), "gemini");
assert.equal(__test.normalizeFamily("zhipu/glm-5.2"), "glm");
assert.equal(__test.normalizeFamily("deepseek-v4-pro"), "deepseek");

assert.deepEqual(__test.keywordsForStandardModel("Gemini 3.1 Pro"), ["gemini", "pro", "3.1"]);
assert.deepEqual(__test.keywordsForStandardModel("DeepSeek V4 Flash"), ["deepseek", "flash", "4"]);

const geminiTargets = __test.selectProbeTargets({
  profileFamily: "gemini",
  configuredTargets: [],
  offerModels: [],
  availableModels: ["google/gemini-3.1-pro-preview", "google/gemini-3.5-flash"],
  targetLimit: 4,
});
assert.deepEqual(
  geminiTargets.map((target) => [target.family, target.standardModel, target.modelId]),
  [
    ["gemini", "Gemini 3.5 Flash", "google/gemini-3.5-flash"],
    ["gemini", "Gemini 3.1 Pro", "google/gemini-3.1-pro-preview"],
  ],
);

const deepseekTargets = __test.selectProbeTargets({
  profileFamily: "deepseek",
  configuredTargets: [],
  offerModels: [],
  availableModels: ["deepseek/deepseek-v4-pro"],
  targetLimit: 4,
});
assert.deepEqual(
  deepseekTargets.map((target) => [target.family, target.standardModel, target.modelId]),
  [
    ["deepseek", "DeepSeek V4 Pro", "deepseek/deepseek-v4-pro"],
    ["deepseek", "DeepSeek V4 Flash", null],
  ],
);

const profiles = [
  { stationId: "published-with-key", profileId: "published-with-key-gpt" },
  { stationId: "pending-with-key", profileId: "pending-with-key-claude" },
  { stationId: "public-pricing-only", profileId: "public-pricing-only" },
];
assert.deepEqual(
  __test.filterProfilesByRunnableStationIds(profiles, new Set(["published-with-key", "pending-with-key"])),
  profiles.slice(0, 2),
);
assert.equal(__test.shouldRestrictToRunnableStations({ post: true }), true);
assert.equal(__test.shouldRestrictToRunnableStations({ post: true, station: "pending-with-key" }), false);
assert.equal(__test.shouldRestrictToRunnableStations({ post: true, dryRun: true }), false);

assert.deepEqual(__test.completionBody({ protocol: "anthropic_compatible" }, "claude-opus-4-8"), {
  model: "claude-opus-4-8",
  max_tokens: 1,
  messages: [{ role: "user", content: "ping" }],
});
assert.deepEqual(__test.completionBody({ protocol: "openai_compatible" }, "gpt-5.5"), {
  model: "gpt-5.5",
  messages: [{ role: "user", content: "ping" }],
  max_tokens: 1,
  stream: false,
});

console.log("api transit probe target test passed");
