# API 中转模型页检测与倍率 UI 打磨

## Goal

把 API 中转模型页的展开报价表改成更适合单屏扫描的高密度表格：不产生横向滚动，把综合倍率、模型倍率、充值倍率和缓存率收进同一个“倍率 / 缓存”列里，同时保留模型检测入口。分级模型检测只进入规划文档，本任务不实现调度、持久化或检测算法。

## What I Already Know

- 用户不希望模型页横向滚动或过度压缩，优先在同一屏内读完整行。
- 当前模型页已从独立列改成 `倍率 / 缓存`、`输入 / 输出`、`可用性`、`模型检测`、`渠道 / 时间` 的紧凑结构。
- 用户认为模型倍率、充值倍率可以合并展示，但当前纯文字行视觉不够明确，希望加底色或更稳定的层次。
- 缓存率和 Token 样本量不是倍率，不适合作为同权重的“模型/充值”并列项；更适合在同一列中分成独立缓存行。
- Token 样本量应使用 `M` / `B` 这样的 million / billion 单位。
- 站点页已加入模型检测摘要列；本任务只打磨展示，不新增检测数据来源。

## Requirements

- 模型页展开表格不能依赖桌面横向滚动。
- “倍率 / 缓存”列要在一个单元格内展示：
  - 综合倍率作为主值。
  - 模型倍率与充值倍率作为两个小数据块，并用不同但克制的底色区分。
  - 缓存率单独成行展示，附带 `M` / `B` token 样本量。
- 模型检测列只展示公开报告状态或待检测状态，不伪造通过结论。
- 站点页已有模型检测列保持一致，不在本任务里扩大交互。
- 分级检测、用户报告复用、定期深度检测等进入规划文档，不进入本次代码实现。

## Acceptance Criteria

- [ ] `/api-transit` 的模型 tab 展开报价表在桌面视口下不出现业务表格横向滚动。
- [ ] 模型倍率和充值倍率在同一单元格内拥有清晰的底色区分。
- [ ] 缓存率与 token 样本量在视觉上与倍率分开，但仍在同一列内。
- [ ] Token 样本量使用 `M tokens` / `B tokens` / `K tokens` 或 `0 tokens` 格式。
- [ ] 模型检测规划文档已加入 `docs/planning` 待处理队列。
- [ ] `npm run lint`、`npm run check:performance`、`npm run build` 通过。
- [ ] 本地预览可打开并完成目视检查。

## Out Of Scope

- 不新增模型检测任务队列、cron、Supabase 表或 migration。
- 不接入用户检测报告复用。
- 不修改 detector service。
- 不调整综合排序、商业排序、赞助排序逻辑。

## Technical Notes

- 主要 UI 文件：`src/components/TransitModelExplorer.tsx`、`src/components/TransitStationExplorer.tsx`。
- 领域辅助函数在 `src/lib/api-transit.ts`，类型在 `src/data/api-transit/types.ts`。
- 本地现状调研摘要见 `research/current-state.md`。
