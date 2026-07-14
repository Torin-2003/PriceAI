# PriceAI Supabase 留存、清理候选与安全批次策略

生成时间：2026-07-14 18:00 GMT+8
状态：P1 rollup / retention migration 已本地实现并验证，未应用生产迁移、未执行清理
关联主规划：[基础设施容量、异常流量与成本治理规划](2026-07-14_priceai-infrastructure-capacity-traffic-and-cost-governance-plan.md)

> 本文中的 SQL 仅供审查。除只读预览查询外，删除、VACUUM 和 migration 均未执行。

## 0. 核心结论

1. Supabase 当前仍为 `Healthy`，但 Dashboard Disk 已到约 81%。当前数据库大小约 1,297 MB。
2. `api_transit_availability_samples` 总体积约 988 MB，其中新 covering index 约 280 MB。
3. covering index 已有 10,685 次扫描、读取约 10.28M tuples，实际承担核心查询，当前不应删除。
4. Availability 原始样本共有 2,580,027 条，最近 24 小时增加约 403,057 条；超过 8 天的有 436,075 条。
5. 如果采用 8 天原始留存，预计可让约 16.9% 的 availability 表与索引空间进入内部复用，粗略约 167 MB；如果采用 14 天，当前只能处理 7,574 条，几乎不能缓解磁盘压力。
6. `raw_offers` 只有约 26k live rows，却累计约 1.72M updates，dead tuples 约 13.58%。核心问题是无变化更新和写放大，不是简单删表。
7. Autovacuum 正常运行，不应执行 `VACUUM FULL`。

## 1. 当前健康与容量快照

| 指标 | 当前值 | 判断 |
| --- | ---: | --- |
| 项目状态 | `Healthy` | 不是数据库宕机 |
| CPU | 约 35% | 有余量 |
| RAM | 约 72% | 需要观察但未到危险线 |
| 连接 | 24 / 90 | 不是连接耗尽 |
| Dashboard Disk | 约 81% | 已进入容量预警区 |
| `pg_database_size` | 约 1,297 MB | 数据库对象当前量级 |
| 最近备份 | 约 2 小时前 | 执行任何清理前仍需再次确认备份状态 |

## 2. 表与索引体积

| 对象 | 类型 | Relation Size | Total Size | 判断 |
| --- | --- | ---: | ---: | --- |
| `api_transit_availability_samples` | table | 492 MB | 988 MB | 最大容量来源 |
| `api_transit_availability_samples_checked_time_idx` | index | 280 MB | 280 MB | 大，但已被大量使用 |
| `api_transit_detection_runs` | table | 75 MB | 161 MB | `raw_snapshot` / `logs` 造成单行较大 |
| `raw_offers` | table | 22 MB | 76 MB | 写放大和索引比表体更值得关注 |

## 3. 精确留存候选

### 3.1 Availability Samples

| 指标 | 当前值 |
| --- | ---: |
| 总行数 | 2,580,027 |
| 最近 24 小时 | 403,057 |
| 超过 8 天 | 436,075 |
| 超过 14 天 | 7,574 |
| 超过 30 天 | 0 |
| 最早样本 | 2026-06-23 09:23 UTC |
| 最新样本 | 2026-07-14 10:00 UTC |

留存选择影响非常大：

| 原始留存 | 当前可清理行数 | 占 availability 总行数 | 粗略内部可复用空间 | 优点 | 缺点 |
| --- | ---: | ---: | ---: | --- | --- |
| 8 天 | 436,075 | 约 16.90% | 约 167 MB | 与当前前台主要窗口一致，能明显缓解增长 | 8 天前无法逐条回放 |
| 14 天 | 7,574 | 约 0.29% | 约 3 MB | 保留更长逐条历史 | 对当前磁盘几乎没有帮助 |
| 30 天 | 0 | 0% | 0 | 最保守 | 当前不能清理任何数据 |

建议：如果业务确认前台、纠纷复核和算法调试都不需要 8 天前的逐条样本，第一版采用“原始 8 天 + 小时 rollup 90 天 + 日 rollup 365 天”。

### 3.2 Detection Runs

| 指标 | 当前值 |
| --- | ---: |
| 总行数 | 58,664 |
| 最近 24 小时 | 3,051 |
| 超过 8 天 | 31,891 |
| 超过 14 天 | 17,038 |
| 超过 30 天 | 0 |
| 最早运行 | 2026-06-15 14:43 UTC |
| 最新运行 | 2026-07-14 10:00 UTC |

建议：Detection Runs 第一版保留 30 天，因此当前暂不删除。它包含 `raw_snapshot` 和 `logs`，比 availability 更有审计和问题复盘价值。

如果后续确认 14 天已经足够，理论上可处理 17,038 条，粗略释放约 47 MB 内部可复用空间。但删除 Detection Runs 会通过外键级联删除关联 availability samples，必须在 retention 设计中统一处理，不能独立直接执行。

## 4. 表更新与 dead tuples

| 表 | 估算 live tuples | dead tuples | dead % | Inserts | Updates | Deletes | 最近 Autovacuum |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| `api_transit_availability_samples` | 约 2.58M | 9,901 | 0.38% | 约 2.62M | 83,120 | 27,136 | 2026-07-14 前仍正常运行 |
| `api_transit_detection_runs` | 约 59k | 0 | 0% | 约 57.7k | 1 | 1 | 正常 |
| `raw_offers` | 约 26.4k | 4,154 | 13.58% | 11,453 | 1,721,347 | 1 | 2026-07-14 08:28 UTC |

`pg_stat_user_tables` 是统计估算，和持续写入中的精确 `count(*)` 会有少量差异。

### 4.1 raw_offers 判断

`raw_offers` 每条 live row 平均被反复更新数十次。继续只依赖 autovacuum 能控制 dead tuples，但无法消除：

- WAL 增长。
- 索引重复更新。
- statement timeout 风险。
- Supabase Disk / IO 抖动。
- Worker 或采集任务等待时间。

P2 应改为：只有业务字段实际变化时才更新，并采用批量 upsert；单纯刷新 `updated_at` 不应触发整行和全部索引写入。

## 5. 索引审查

### 5.1 Availability covering index

| 索引 | 大小 | idx_scan | idx_tup_read | idx_tup_fetch | 结论 |
| --- | ---: | ---: | ---: | ---: | --- |
| `api_transit_availability_samples_checked_time_idx` | 280 MB | 10,685 | 10,277,108 | 8,301,080 | 保留，当前不是删除候选 |
| `api_transit_availability_samples_offer_time_idx` | 54 MB | 7,397 | 9,012,838 | 2,542,290 | 有实际使用 |
| `api_transit_availability_samples_source_time_idx` | 31 MB | 32,558 | 21,918,935 | 21,608,799 | 高频使用 |
| `api_transit_availability_samples_station_time_idx` | 28 MB | 95,327 | 2.69B | 44.96M | 核心查询索引 |

之前“新 covering index 可能可以直接删除”的假设已被实时统计否定。它虽然导致近期磁盘突然上升，但当前确实被查询使用。后续只能评估能否缩窄、改成部分索引或由 rollup 替代，不能直接 Drop。

### 5.2 raw_offers 索引候选

| 索引 | 大小 | idx_scan | 当前判断 |
| --- | ---: | ---: | --- |
| `raw_offers_verified_at_idx` | 18 MB | 1 | 审查候选，不直接删除 |
| `raw_offers_expires_at_idx` | 13 MB | 0 | 审查候选，不直接删除 |
| `raw_offers_product_public_page_idx` | 8 MB | 1 | 审查候选，可能与现有公开列表索引重叠 |
| `raw_offers_visible_product_price_idx` | 976 kB | 0 | 低收益候选 |
| `raw_offers_public_listing_idx` | 7.7 MB | 约 3.15M | 必须保留 |
| `raw_offers_public_filter_tags_idx` | 576 kB | 约 429k | 必须保留 |
| `raw_offers_source_id_idx` | 568 kB | 约 619k | 必须保留 |
| `raw_offers_hidden_idx` | 568 kB | 约 1.49M | 必须保留 |

即使前四个候选最终全部可移除，也只释放约 40 MB。索引治理有价值，但优先级低于 availability retention 和 raw_offers 写放大。

## 6. 安全清理前置条件

在执行任何删除前，必须全部满足：

1. 确认 availability 原始留存采用 8 天，而不是 14 天。
2. 小时 / 日 rollup 已建成并完成最近 8 天的回填验证。
3. 前台、综合推荐、详情页和后台没有查询 8 天前原始样本。
4. 确认最新 Supabase scheduled backup 成功。
5. 保存清理前行数、表体积、索引体积、CPU、RAM、连接和慢查询基线。
6. 停止或错开同一时间的大型采集、migration 和索引操作。
7. 先在 Preview / 临时分支数据库验证 migration 和删除批次。

## 7. 只读预览 SQL

以下 SQL 可以重复运行，不修改数据：

```sql
select
  count(*) as candidate_rows,
  min(checked_at) as oldest_checked_at,
  max(checked_at) as newest_candidate_checked_at
from public.api_transit_availability_samples
where checked_at < now() - interval '8 days';
```

按天查看候选分布：

```sql
select
  date_trunc('day', checked_at) as day,
  count(*) as rows
from public.api_transit_availability_samples
where checked_at < now() - interval '8 days'
group by 1
order by 1;
```

确认前台实际依赖窗口：

```sql
select
  min(checked_at) as oldest_in_window,
  max(checked_at) as newest_in_window,
  count(*) as rows_in_window
from public.api_transit_availability_samples
where checked_at >= now() - interval '8 days';
```

## 8. 待审查的删除批次 SQL

> 下列 SQL 是破坏性操作。本轮没有执行。只有在 retention migration、rollup 和备份验证完成后才能使用。

建议第一批从 5,000 行开始：

```sql
with batch as (
  select id
  from public.api_transit_availability_samples
  where checked_at < now() - interval '8 days'
  order by checked_at asc
  limit 5000
  for update skip locked
), deleted as (
  delete from public.api_transit_availability_samples as sample
  using batch
  where sample.id = batch.id
  returning sample.checked_at
)
select
  count(*) as deleted_rows,
  min(checked_at) as oldest_deleted,
  max(checked_at) as newest_deleted
from deleted;
```

每个批次结束后重新运行只读预览 SQL。不要在 SQL Editor 中一次性循环删除 436k 行。

## 9. 建议批次策略

| 阶段 | 批次 | 观察时间 | 继续条件 | 停止条件 |
| --- | ---: | ---: | --- | --- |
| Smoke | 5,000 | 5-10 分钟 | CPU、RAM、连接、错误无明显变化 | statement timeout、锁等待、API 错误上升 |
| Small | 10,000 × 3 | 每批 2-5 分钟 | 每批耗时稳定，WAL / IO 可接受 | 单批耗时持续增长或 autovacuum 堆积 |
| Normal | 20,000 | 每批至少 1-3 分钟 | 用户请求与采集正常 | CPU > 50%、RAM > 80%、连接 > 70 或业务 p95 翻倍 |

原则：

- 不在流量峰值和采集高峰同时执行。
- 不并行运行多个删除会话。
- 不和 migration、索引创建、备份恢复同时执行。
- 每批必须可独立停止。
- 删除总量达到目标后停止，不追求一次跑完。

## 10. 清理后的维护

清理完成并稳定观察后，可以执行普通维护：

```sql
vacuum (analyze) public.api_transit_availability_samples;
```

注意：

- 普通 `VACUUM` 主要让空间在数据库内部重新可用。
- Dashboard Disk 不一定按删除量立即下降。
- 不执行 `VACUUM FULL`，因为它会重写整表并持有强锁。
- 不执行 `REINDEX`，除非后续确认具体索引损坏或严重膨胀。

## 11. Rollback 与恢复边界

物理删除不可直接 rollback，因此安全性来自：

1. rollup 先完成。
2. scheduled backup 已确认。
3. 小批量执行。
4. 只删除明确早于 retention cutoff 的数据。
5. 每批保存行数和时间范围。
6. 一旦发现业务查询依赖旧数据，立即停止后续批次。

如果旧原始样本具有长期审计价值，可以在删除前导出到独立冷归档桶。冷归档桶可以后续评估 Infrequent Access，但必须与 OpenNext 热缓存桶分开。

## 12. P1 建议决策

### 推荐默认值

- Availability raw retention：8 天。
- Availability hourly rollup：90 天。
- Availability daily rollup：365 天。
- Detection Runs：30 天，当前不删除。
- 删除首批：5,000 行。
- 清理后：普通 `VACUUM (ANALYZE)`，不使用 Full。
- covering index：保留。

### 当前采用口径

- 设计默认采用 8 天原始留存；14 天对当前容量几乎没有缓解作用。
- 这项口径已经写入 migration 的默认参数，但 migration 默认 `dry-run=true`，不会因为应用 migration 就删除任何数据。
- 真正执行首批 5,000 行删除仍是独立的生产动作，需要在 Preview 回填、备份和只读预览全部通过后单独确认。

## 13. P1 本地实现

已新增 migration：

`supabase/migrations/20260714200000_api_transit_availability_rollups_retention.sql`

包含：

1. `api_transit_availability_hourly_rollups`：小时级成功数、样本数、延迟 / Ping 的 count、sum、min、max，默认保留 90 天。
2. `api_transit_availability_daily_rollups`：从小时汇总派生，默认保留 365 天。
3. `refresh_api_transit_availability_rollups(p_from, p_to)`：只处理完整小时，可重复 upsert，不删除原始数据。
4. `prune_api_transit_availability_retention(...)`：默认只返回候选；显式 `p_dry_run=false` 时，每次最多删除一个受限批次。
5. 删除前安全门：如果候选数据对应的小时汇总不存在、样本数不足或时间覆盖不完整，函数直接抛错并拒绝删除。

### 优点与缺点

| 改动 | 优点 | 缺点 / 代价 |
| --- | --- | --- |
| count + sum 而不是只存 avg | 日汇总可以准确从小时汇总二次聚合，不会出现“平均数的平均数”失真 | 字段略多，查询展示时要用 `sum / count` 计算平均值 |
| 小时 / 日两层表 | 近期趋势和长期趋势都能保留，行数远低于逐条样本 | 需要定时刷新；晚到数据要重复回填最近窗口 |
| 默认 dry-run | migration 应用不会误删生产数据 | 需要额外执行明确的 apply 调用，不能“一次上线自动完成” |
| 删除前覆盖校验 | 防止原始数据在未汇总时被物理删除 | 首批执行前必须先回填完整现有历史；覆盖不足会主动阻断 |
| 每批最多 5,000 行 | 降低锁、WAL、CPU 和复制延迟风险 | 清理 436k 行需要多批完成，耗时更长 |

### Preview 建议顺序

先回填当前完整可见历史。现有数据约 21 天，函数单次最大接受 31 天窗口：

```sql
select public.refresh_api_transit_availability_rollups(
  now() - interval '31 days',
  now()
);
```

再运行默认预览，不传 `p_dry_run`：

```sql
select public.prune_api_transit_availability_retention();
```

确认 hourly / daily 行数、按天样本合计和原始样本一致后，Preview 中才可以测试首批：

```sql
select public.prune_api_transit_availability_retention(
  8,
  90,
  365,
  5000,
  false
);
```

生产环境仍先运行默认预览。没有新的人工确认，不执行最后一条 `false` 调用。

### 本地验证结果

已在一次性 PostgreSQL 18 容器中完成：

- migration 从空的最小前置 schema 成功应用。
- 10 天前原始样本回填为 hourly / daily 后，默认 dry-run 正确返回 2 条候选。
- 显式 apply 只删除 2 条候选，近期样本保留，小时 / 日汇总仍保留 3 条样本统计。
- 在回填后新增一条未汇总的旧样本，apply 被 `refusing raw availability deletion` 安全门拒绝。

## 14. 当前执行结论

生产环境仍只运行了 `SELECT` 和系统统计查询，没有执行 `DELETE`、`VACUUM`、`REINDEX`、`DROP INDEX` 或 migration。Supabase 原有 SQL Editor 草稿已恢复。

下一步是提交 migration，并在 Preview / Supabase Integration 中验证 migration replay、31 天回填耗时和汇总一致性。生产应用 migration 和首批 5,000 行清理仍不在本轮自动执行范围内。
