# PriceAI Cloudflare 过去 24 小时流量与成本归因基线

生成时间：2026-07-14 17:30 GMT+8
状态：P0 只读基线已完成
数据窗口：滚动过去 24 小时
关联主规划：[基础设施容量、异常流量与成本治理规划](2026-07-14_priceai-infrastructure-capacity-traffic-and-cost-governance-plan.md)

> 本报告来自 Cloudflare Zone Analytics、Security Analytics、Workers Metrics、Workers Observability、R2 Metrics 和 Billing 的只读查询。Workers Observability 明确提示大数据量结果可能经过采样或不完整，因此路径、ASN 和 User-Agent 表适合做相对排序与治理决策，不应替代最终账单。

## 0. 核心结论

1. 过去 24 小时请求约 5.08M，Cloudflare 只缓解约 11.57k，约占 0.23%。现有 Rate Limiting 的表达式实际上覆盖几乎所有非 `/_next/` 路径，但阈值较宽、Block 仅 10 秒，因此最终缓解比例仍很小。
2. 最大单 IP 约 67.85k，只占总量约 1.34%。问题不是单个 IP，而是数据中心 ASN、自动化浏览器和页面预取形成的分布式流量。
3. Worker 调用约 4M，没有 CPU 超限、OOM 或未捕获异常；但 Observability 中约有 72k 条应用级 error 日志，抽样日志反复出现 OpenNext 页面重新验证失败。
4. 最耗 CPU 的路径是 `/api-transit`、首页、`/api/sponsor-assets`、`/channels`、`/official-prices`；其中 `/api/products/chatgpt-team-business/offers` 单次平均 CPU 约 72.58 ms，是明显的高成本接口。
5. OpenNext R2 cache 过去 24 小时约 2.49M Class B，反馈证据桶仅约 1.11k Class B。R2 成本问题几乎全部来自增量缓存。
6. R2 默认 Storage Class 为 Standard，当前选择正确。治理重点应是降低无效请求、提高边缘命中和减少直接读 R2，而不是切换 Infrequent Access。

## 1. 24 小时总体流量

| 指标 | 当前值 | 判断 |
| --- | ---: | --- |
| Zone 请求总数 | 约 5.08M | 明显偏高 |
| 由 Cloudflare 提供服务 | 约 5.07M | 绝大多数请求经过 Cloudflare |
| 由源服务器提供服务 | 约 2.75k | 不是传统源站回源模型，主要由 Worker 承接 |
| 已缓解 / 阻止 | 约 11.57k | 约 0.23%，覆盖率很低 |
| Cache None | 约 3.85M | 约 75.8% |
| Cache HIT | 约 1.23M | 约 24.2% |
| Cache MISS | 约 2.56k | 占比很小 |
| GET | 约 4.92M | 主体流量 |
| POST | 约 152.94k | 需要继续按接口归因 |
| HEAD | 约 15.04k | 占比低 |

### 1.1 国家 / 地区

| 排名 | 国家 / 地区 | 请求量 |
| ---: | --- | ---: |
| 1 | United States | 约 1.41M |
| 2 | Japan | 约 1.17M |
| 3 | China | 约 975.88k |
| 4 | Singapore | 约 602.08k |
| 5 | Hong Kong | 约 461.87k |

### 1.2 设备、系统和浏览器

| 维度 | Top 1 | Top 2 | Top 3 |
| --- | --- | --- | --- |
| 设备 | Desktop 4.32M | Mobile 754.06k | Tablet 8.61k |
| 操作系统 | Windows 3.02M | MacOSX 984.85k | 未知 / 其他 490.47k |
| 浏览器 | Chrome 2.73M | Edge 1.19M | 未知 / 其他 488.27k |
| HTTP 版本 | HTTP/2 3.94M | HTTP/3 1.08M | HTTP/1.1 69.57k |

桌面端、Windows、Chrome / Edge 的集中度与普通 PriceAI 真实用户构成不完全匹配，更符合自动化浏览器集群或批量预取的特征。

## 2. Top IP

| 排名 | 源 IP | 24h 请求量 | 占总量 |
| ---: | --- | ---: | ---: |
| 1 | `67.159.48.150` | 约 67.85k | 约 1.34% |
| 2 | `203.10.97.121` | 约 23.01k | 约 0.45% |
| 3 | `203.10.99.34` | 约 22.57k | 约 0.44% |
| 4 | `103.62.49.138` | 约 21.09k | 约 0.42% |
| 5 | `208.87.242.109` | 约 19.88k | 约 0.39% |

结论：不建议把治理策略建立在单 IP Block 上。即使封禁 Top 5 IP，也不足以改变总体请求量，而且容易触发来源换 IP。

### 2.1 当前生产规则盘点

| 规则 | 当前配置 | 主要问题 | 本轮处理 |
| --- | --- | --- | --- |
| Custom Rule | Block `67.159.48.149` | 当前 Top IP 已变成 `67.159.48.150`，说明来源可漂移；单 IP Block 不能解决分布式抓取 | 暂不新增单 IP；后续移除前先观察旧 IP 是否仍有流量 |
| Rate Limiting | `not starts_with(http.request.uri.path, "/_next/")`；每 IP 200 requests / 10 秒；Block 10 秒 | 名称与实际范围不一致，几乎覆盖全部业务路径；无法区分昂贵 API、普通页面和 RSC 预取 | 当前不保存修改；先形成按成本路径收窄的替换草案 |

当前 Free 计划的 Rate Limiting 配额为 `1 / 1`。因此不能在保留现有全站规则的同时再新增多条路径规则；正式调整时需要把唯一规则改造成“昂贵 API 优先”的组合表达式，而不是继续叠加。

Cloudflare Free 的 Custom Rules 没有真正的 Log-only action。第一步应在 Security Analytics 用候选表达式做只读过滤观察；确认命中对象和误伤后，再创建 Managed Challenge，而不是把 `Skip` 误当成日志模式。

## 3. ASN / 网络组织归因

下表按 Observability 中的 Worker CPU 总量排序。相同 ASN 可能因 Cloudflare 的组织标签不同拆成多行。

| ASN | 网络组织 | CPU 总量 | 请求数 | 平均 CPU / 请求 |
| ---: | --- | ---: | ---: | ---: |
| AS30058 | FDCservers.net | 2,445,430 ms | 119,350 | 20.49 ms |
| AS134972 | KIDC LIMITED | 2,242,140 ms | 143,520 | 15.62 ms |
| AS16509 | Amazon Data Services Japan | 1,897,230 ms | 120,950 | 15.69 ms |
| AS9808 | China Mobile Communications Corporation | 1,700,070 ms | 91,480 | 18.58 ms |
| AS16509 | Amazon.com, Inc. | 1,553,720 ms | 88,900 | 17.48 ms |
| AS16509 | Amazon Data Services Singapore | 1,498,890 ms | 66,500 | 22.54 ms |
| AS137409 | GSL Networks Pty LTD - Tokyo | 1,387,880 ms | 92,850 | 14.95 ms |
| AS3462 | Chunghwa Telecom Data Communication Business Group | 1,352,590 ms | 60,000 | 22.54 ms |
| AS137409 | Streamline Servers Ltd - Tokyo | 1,279,680 ms | 76,300 | 16.77 ms |
| AS46997 | Black Mesa Corporation | 1,189,640 ms | 78,510 | 15.15 ms |

其中 FDCservers、KIDC、AWS、GSL、Streamline 等数据中心网络适合作为“高频 + 路径 + 请求特征”组合条件，但不能仅因 ASN 是数据中心就直接封禁。

## 4. Worker 路径与 CPU 归因

| 排名 | Trigger | CPU 总量 | 请求数 | 平均 CPU / 请求 | 判断 |
| ---: | --- | ---: | ---: | ---: | --- |
| 1 | `GET /api-transit` | 6,472,980 ms | 209,330 | 30.92 ms | 高流量、高总成本 |
| 2 | `GET /` | 5,901,060 ms | 392,890 | 15.02 ms | 请求量最大，包含首页 RSC 预取 |
| 3 | `GET /api/sponsor-assets` | 5,114,720 ms | 190,130 | 26.90 ms | 静态素材经 Worker / R2 转发，优先缓存候选 |
| 4 | `GET /channels` | 4,585,430 ms | 221,990 | 20.66 ms | 高频列表页，预取候选 |
| 5 | `GET /official-prices` | 4,338,480 ms | 199,820 | 21.71 ms | 高频公共页面 |
| 6 | `GET /official-api` | 3,506,510 ms | 201,110 | 17.44 ms | 高频公共页面 |
| 7 | `GET /wholesale` | 2,401,910 ms | 211,030 | 11.38 ms | 请求量高，单次相对轻 |
| 8 | `GET /guides/chatgpt-subscription-options` | 2,188,790 ms | 149,940 | 14.60 ms | 指南页不应产生如此高动态调用 |
| 9 | `GET /api/products/chatgpt-team-business/offers` | 1,713,570 ms | 23,610 | 72.58 ms | 高成本 API，优先优化 |
| 10 | `GET /products/chatgpt-team-business` | 1,633,620 ms | 91,770 | 17.80 ms | 高频商品详情页 |

Top 10 路径约占 Observability 请求的 48%，约占 Worker CPU 总量的 52%。这意味着先处理少数路径即可获得明显收益，不需要一开始做全站激进限制。

### 4.1 日志中的 RSC / 预取证据

实时日志连续出现：

- `GET /?_rsc=...`
- `GET /channels?_rsc=...`
- `GET /official-prices?_rsc=...`
- `GET /official-api?_rsc=...`
- 多个 `/products/*?_rsc=...`
- 多个 `/api-transit/*?_rsc=...`

抽样请求同时带有：

- `next-router-prefetch: 1`
- `next-router-segment-prefetch: /_tree`
- `rsc: 1`

这说明相当一部分动态请求由 Next.js Router Prefetch 触发，并不等于用户真的点击进入了这些页面。

## 5. User-Agent 归因

下表按 CPU 总量排序：

| User-Agent 摘要 | CPU 总量 | 请求数 | 平均 CPU / 请求 |
| --- | ---: | ---: | ---: |
| Windows Chrome 150 | 18,257,290 ms | 1,024,830 | 17.81 ms |
| Windows Edge 150 | 13,150,920 ms | 750,640 | 17.52 ms |
| macOS Chrome 150 | 5,821,320 ms | 325,050 | 17.91 ms |
| macOS Chrome 149 | 4,749,740 ms | 269,080 | 17.65 ms |
| Windows Chrome 149 | 3,544,500 ms | 197,140 | 17.98 ms |
| Windows Edge 149 | 1,000,900 ms | 55,120 | 18.16 ms |
| Windows Firefox 152 | 897,730 ms | 46,550 | 19.29 ms |
| Android Chrome 150 | 858,260 ms | 49,440 | 17.36 ms |
| macOS Edge 150 | 782,400 ms | 42,980 | 18.20 ms |
| `AIPro-PriceAI-Sync/1.0` | 738,670 ms | 5,310 | 139.11 ms |

`AIPro-PriceAI-Sync/1.0` 请求数不高，但单次 CPU 显著高于普通浏览器。实施规则前必须先确认它是否属于 PriceAI 自有同步任务；如果是，应使用显式身份或白名单，而不是误拦截。

## 6. Host 与子请求

### 6.1 入口 Host

| Host | CPU 总量 | 请求数 | 平均 CPU / 请求 |
| --- | ---: | ---: | ---: |
| `priceai.cc` | 72,200,420 ms | 3,926,150 | 18.39 ms |
| `www.priceai.cc` | 33,800 ms | 2,140 | 15.79 ms |

绝大多数请求直接进入 apex 域名，`www` 不是主要成本来源。

### 6.2 Worker 子请求

| 目标 Host | 状态 | 请求量 | 平均持续时间 |
| --- | --- | ---: | ---: |
| `bpminnefpoyxwhelheed.supabase.co` | 2xx 659k / 4xx 19 / 5xx 91 | 约 659k | 195.2 ms |
| `cca.maya.today` | 4xx 725 | 725 | 20.2 ms |
| `detector.priceai.cc` | 2xx 14 | 14 | 95.1 ms |
| `catfk.com` | 2xx 18 | 18 | 1.18 s |

Supabase 子请求占绝对主体。降低 Worker 动态调用和提高公共响应缓存，会同步降低 Supabase 压力。

## 7. Worker 健康与应用错误

| 指标 | 过去 24 小时 |
| --- | ---: |
| Worker 调用 | 约 4M |
| 子请求 | 约 667k |
| CPU P50 | 8.74 ms |
| CPU P90 | 35.85 ms |
| CPU P99 | 237.63 ms |
| Wall Time P50 | 201.84 ms |
| Wall Time P99 | 1.83 s |
| Request Duration P50 | 196.33 ms |
| Request Duration P99 | 1.35 s |
| Memory P50 | 80.41 MB |
| Memory P99 | 139.63 MB |
| Client disconnect | 约 63.44k |
| CPU 超限 | 0 |
| OOM | 0 |
| 未捕获异常 | 0 |

Workers Observability 同期约有：

- Success events：约 3.94M。
- Error-level events：约 72k。

抽样错误重复出现：

```text
Failed to revalidate stale page /products/... FatalError: Dummy queue is not implemented
```

判断：这是应用 / OpenNext cache revalidation 日志，不是 Cloudflare Worker 运行时崩溃。它会放大 Observability 成本，也可能意味着部分 stale 页面无法正常后台刷新，应列为 P1 独立修复项。

代码核查确认：`open-next.config.ts` 只配置了 R2 incremental cache，没有配置 revalidation queue；OpenNext 1.19.11 在 queue 缺省时使用 `dummy`，与线上 `Dummy queue is not implemented` 完全吻合。

生产修复选择 Durable Object Queue，而不是 Memory Queue：

| 方案 | 优点 | 缺点 | 结论 |
| --- | --- | --- | --- |
| Memory Queue | 改动小，可复用现有 `WORKER_SELF_REFERENCE` | 只在单 isolate 内去重，实例重启或跨区域时不可靠；OpenNext 官方只建议低流量 staging 使用 | 不用于生产 |
| Durable Object Queue | 生产级去重、重试和状态持久化；符合 OpenNext 小型生产站点推荐 | 新增 DO binding 和 migration，会产生少量 DO 请求与存储成本 | P1 采用 |
| `queue: "direct"` | 配置最少 | 缺少可靠排队和去重，不适合作为生产长期方案 | 不采用 |

## 8. R2 归因

### 8.1 OpenNext incremental cache

| 指标 | 过去 24 小时 |
| --- | ---: |
| 当前桶大小 | 约 13.07 GB |
| 平均存储 | 约 12.31 GB |
| Class A | 约 41.84k |
| Class B | 约 2.49M |
| 请求分布 | 约 4.22M |
| Standard | 12.28 GB |
| Infrequent Access | 0 B |

区域分布：APAC 44%、WNAM 33%、ENAM 15%、WEUR 7%、EEUR 1%。

### 8.2 Feedback evidence bucket

| 指标 | 过去 24 小时 |
| --- | ---: |
| 平均存储 | 约 69.03 MB |
| Class A | 48 |
| Class B | 约 1.11k |

结论：R2 成本几乎全部来自 OpenNext cache。反馈证据桶不需要当前优先优化。

## 9. Billing 快照

当前账期核查时：

| 项目 | 已观察费用 |
| --- | ---: |
| Workers CPU | $9.12 |
| Workers Standard Requests | $4.50 |
| R2 Class B | $2.16 |
| 总费用 | $15.78 |
| 预计周期费用 | $29.59 |

Observability events 当前账期已约 28.12M，控制台提示 20M events / month 以上可能进入新计费或采样逻辑。在没有降低日志量之前，不应贸然接受新的超额计费选项。

## 10. P1 候选动作与顺序

### 10.1 可以先设计、不立即生效

1. 针对数据中心 ASN + 高频速率 + `_rsc` / prefetch 特征设计 Log-only 规则。
2. 为 `/api/products/*/offers`、`/api/offers`、`/api-transit` 设置独立成本阈值，不做全站统一限流。
3. 将 `/api/sponsor-assets` 作为第一批缓存白名单候选，减少 Worker 和 R2 读取。
4. 对首页、`/channels`、`/official-prices`、`/official-api`、指南页和长商品列表收敛 prefetch。
5. 修复 `Dummy queue is not implemented` 的 OpenNext stale revalidation 错误。
6. 普通 2xx 日志先降到 10% 采样，错误、安全事件和高 CPU 请求尽量全量。

### 10.2 已完成的 P1 实施设计

#### A. Cloudflare 规则草案

1. 先在 Security Analytics 观察以下组合条件，不保存生产规则：
   - 非 Verified Bot。
   - `GET` / `HEAD`。
   - 请求包含 `_rsc`，或带 `next-router-prefetch: 1`。
   - 同时来自高频数据中心 ASN，或在短时间内对多个页面路径高频遍历。
2. 若观察 24-48 小时后仍以自动化抓取为主，再创建 Managed Challenge；不按国家整体处理，也不只依赖 User-Agent。
3. 唯一 Rate Limiting 规则后续收窄到高成本接口集合：`/api/products/*/offers`、`/api/offers`、`/api-transit`。在确认自有同步任务身份和正常峰值前，不先写死激进阈值。
4. `AIPro-PriceAI-Sync/1.0` 如确认为自有任务，应改用服务身份或稳定白名单条件；仅按 UA 放行可被伪造，只能作为临时过渡。

#### B. Next.js prefetch 收敛清单

Next.js 16.2.9 官方文档确认 `<Link>` 进入 viewport 会自动 prefetch；长列表建议使用 `prefetch={false}`，需要兼顾体验时可改为 hover / focus 后再 prefetch。

第一批应用侧改动：

| 位置 | 策略 | 优点 | 缺点 |
| --- | --- | --- | --- |
| `SiteHeader` 四个主模块导航 | 从 viewport 自动预取改为 hover / focus 意图预取 | 每个页面不再自动请求全部主模块；桌面用户悬停后仍可预热 | 触屏直接点击时不再提前预热 |
| 商品、官方订阅、官方 API 大列表 | 行内和卡片详情链接 `prefetch={false}` | 避免一屏几十个详情页同时产生 RSC 请求 | 首次点击详情需要真实请求 |
| API 中转列表 | 保留现有 hover / focus `router.prefetch()`，同时关闭 Link viewport 自动预取 | 只预热用户明确指向的站点 | 快速键盘跳转时可能多一次等待 |
| 指南目录、侧边栏和相关阅读长列表 | `prefetch={false}` | 避免静态指南被批量预取；指南本身点击频率较低 | 指南切换不再全部瞬时 |

保留高意图单一 CTA 的默认 prefetch，不做全站统一关闭。

#### C. `/api/sponsor-assets` 判断

代码已使用 Cloudflare Cache API，并设置一天 `s-maxage` 与七天 `stale-while-revalidate`。因此继续重复增加 Worker 内部缓存代码的边际收益有限：即使 Cache API HIT，请求仍会先进入 Worker。

后续真正降低 Worker 调用有两个方向：

1. Cloudflare Cache Rule 让公开资产响应在 Worker 外层直接命中，但必须验证 query key、404、内容更新和 purge。
2. 将公开赞助图迁到独立公共资源域名 / bucket，私有反馈证据继续留在受控路由。

第一轮不改资产存储结构，先完成 queue 和 prefetch，观察 `/api/sponsor-assets` CPU 与 Cache API HIT 变化。

### 10.3 当前不建议

1. 不按国家整体封禁。
2. 不只封禁 Top IP。
3. 不直接 Block 数据中心 ASN。
4. 不开启全站 Under Attack Mode。
5. 不清空 OpenNext R2 cache。
6. 不把 OpenNext cache 切换到 Infrequent Access。

## 11. P1 验证指标

| 指标 | 当前基线 | 第一轮目标 |
| --- | ---: | ---: |
| Worker 请求 | 约 4M / 24h | 下降 25%-40% |
| Supabase 子请求 | 约 659k / 24h | 下降 25%-40% |
| R2 Class B | 约 2.49M / 24h | 下降 30%-50% |
| Error-level Observability events | 约 72k / 24h | 修复 revalidation 后显著下降 |
| Cache None | 约 3.85M | 按公共页面类型下降 |
| 关键用户行为 | 待与 Umami 对齐 | 登录、购买跳转和搜索不下降超过 3% |

## 12. P1 设计结论

P0 已完成，P1 设计已收敛；控制台核查仍未保存 Cloudflare 配置。第一批代码实施顺序为：

1. 配置 OpenNext Durable Object Queue，修复 stale revalidation error。
2. 收敛主导航和长列表 viewport prefetch。
3. 本地构建与 Cloudflare 配置校验通过后，单独提交。
4. 部署后观察 24 小时，再决定是否调整唯一 Rate Limiting 规则和 Managed Challenge。

生产 Cloudflare 规则仍保持不变；在应用侧数据出来前，不进入生产拦截。
