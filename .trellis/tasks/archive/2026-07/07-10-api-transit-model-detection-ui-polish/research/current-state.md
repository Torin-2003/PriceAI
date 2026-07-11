# 当前现状调研摘要

## 主站现状

- `api-transit` 已有 typed data、站点/模型报价、可用性样本、公开快照与前台站点/模型页。
- `TransitModelExplorer` 是模型 tab 的核心展示组件，当前用户反馈集中在展开表格的横向宽度和“倍率 / 缓存”单元格层次。
- `TransitStationExplorer` 已有站点列表与模型检测列，适合作为模型页检测列的视觉口径参考。
- `src/lib/api-transit.ts` 已集中承载倍率、缓存率、Token 样本量和检测摘要格式化逻辑，应继续复用，不在组件里重新写单位规则。

## Detector Service 现状

- 邻近仓库 `priceai-detector-service` 已提供独立 FastAPI 检测服务。
- 已有入口包括 `POST /api/detect/claude`、`/openai-chat`、`/openai-responses`、`/gemini`，以及 `GET /api/status/{job_id}`、`GET /api/result/{job_id}.json`、`/r/{job_id}`。
- 报告以 job 结果文件形式保存，包含 protocol、base_url、target_model、mode、score、verdict、results 等字段。
- detector service 的 leaderboard 按 base_url 域名聚合公开报告，但当前没有 PriceAI 站点、分组、标准模型的结构化 rollup。

## 后续规划方向

- 分级检测建议拆成 L0 可用性探针、L1 快速真实性检查、L2 标准定时报告、L3 深度/长上下文低频检测、L4 人工复核。
- 报告复用建议按 `station_id + base_url/host + standard_model + group_name + protocol + detector_version/mode` 建立等价键。
- 报告来源建议分为 `PriceAI 实测`、`用户公开报告`、`商家提交` 三类，并在前台展示来源，不混成一个可信度。
- 前台公开页应优先读 rollup 摘要，不直接扫描 detector job 文件。
