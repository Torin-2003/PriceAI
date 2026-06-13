# Cloudflare 迁移执行计划

本文档用于规划 PriceAI 从 Vercel 迁移到 Cloudflare Workers / OpenNext 的执行路径。目标是先完成测试域名验证，再安排生产域名切换，避免因为账号额度、DNS、缓存或采集任务混在一起导致不可控停机。

## 迁移目标

- 主站运行时迁移到 Cloudflare Workers + OpenNext。
- 继续使用 Supabase 作为业务数据库，不在本轮迁移 D1。
- 继续使用 GitHub Actions / 云服务器执行价格采集，不把采集任务迁入 Worker 请求路径。
- 先验证 `cf.priceai.cc`，再切 `priceai.cc` / `www.priceai.cc`。
- 旧的两个无用域名不纳入迁移。
- Vercel 保留为短期回滚目标，直到 Cloudflare 生产运行稳定。

## 目标架构

| 层 | 迁移后形态 | 说明 |
|----|------------|------|
| Web / API 运行时 | Cloudflare Workers + OpenNext | 承载 Next.js 页面、公开 API、后台 API |
| 静态资源 | OpenNext assets + Cloudflare edge | 由 Worker 配置中的 `assets` 绑定服务 |
| ISR / revalidate 缓存 | R2 incremental cache | 当前 POC 绑定 `NEXT_INC_CACHE_R2_BUCKET` |
| 数据库 | Supabase Postgres | 保留现状，重点监控 egress 和 RPC 权限 |
| 采集任务 | GitHub Actions / VPS | 继续外置执行，写入 Supabase |
| Analytics | 自部署 Umami | 保持 `https://umami.dimthink.com/script.js`，不要切到默认 cloud Umami |
| 生产域名 | Cloudflare DNS / route | 测试域名稳定后再切主域名 |

## 阶段 0：POC 基线

状态：已完成。

已完成事项：

- 创建并推送 `codex/cloudflare-workers-poc` 分支。
- 加入 OpenNext / Wrangler 依赖和脚本。
- 新增 `open-next.config.ts`、`wrangler.jsonc`、`.open-next` / `.wrangler` 忽略规则。
- 本地通过 `npm run lint`、`npm run build`、`npm run build:cloudflare`。
- Wrangler 本地预览验证首页、`/api-models`、公开 API、后台页、guide 页可访问。
- 记录当前 POC 结果到 `docs/cloudflare-poc.md`。

已知风险：

- OpenNext build 会打印一组 MDX / Unified 依赖 `Failed to copy` 日志，但本地 Worker 预览未复现运行时错误。
- 本地预览未配置 Supabase secrets，所以 `/api/health` 返回 503 属预期。
- cron route 仅验证了无密钥拒绝路径，不把真实采集执行视为 Worker 兼容通过。

## 阶段 1：Cloudflare 账号与资源准备

执行前提：需要登录 Cloudflare 并购买 Workers Paid 计划。

需要准备：

1. 购买 Workers Paid 计划。
2. 确认 `priceai.cc` 的 DNS 托管在 Cloudflare，或确认切换 nameserver 的窗口。
3. 创建测试 Worker：`priceai-cloudflare-poc`。
4. 创建 R2 bucket：`priceai-cloudflare-poc-opennext-cache`。
5. 准备测试域名：`cf.priceai.cc`，先不要切 `priceai.cc`。
6. 创建 Cloudflare API Token，用于后续本地或 GitHub Actions 部署。

需要配置的 secrets：

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ADMIN_PASSWORD
ADMIN_SESSION_SECRET
CRON_SECRET
NEXT_PUBLIC_UMAMI_SCRIPT_URL
NEXT_PUBLIC_UMAMI_WEBSITE_ID
NEXT_PUBLIC_GA_MEASUREMENT_ID
```

需要配置的普通变量：

```text
CRON_PUBLIC_BASE_URL=https://cf.priceai.cc
NEXT_PUBLIC_UMAMI_ALLOWED_DOMAINS=priceai.cc,www.priceai.cc
```

备注：测试域名阶段可暂时不把 `cf.priceai.cc` 加入 Umami allowed domains，避免预览流量污染生产统计。

## 阶段 2：测试域名部署

目标：让 `cf.priceai.cc` 跑起来，并证明它可以承载真实数据路径。

建议命令：

```bash
npm run build:cloudflare
npm run deploy:cloudflare
```

验收清单：

| 类别 | 必测项 | 通过标准 |
|------|--------|----------|
| 页面 | `/`、`/platforms/chatgpt`、`/api-models`、`/guides`、产品详情页 | 200，页面样式和数据正常 |
| 公开 API | `/api/explorer`、`/api/offers?limit=80`、`/api/products/chatgpt-plus/offers?limit=80` | 200，体积维持几十 KB 级 |
| 健康检查 | `/api/health` | Supabase 配置后返回健康状态 |
| 后台 | `/admin` 登录、报价修改、提交审核、反馈查看 | 能登录，写操作成功，数据回显 |
| 提交流 | 用户提交渠道、反馈、站点反馈 | 入库成功，有基本防刷表现 |
| SEO | `/robots.txt`、`/sitemap.xml`、guide 页 canonical | 可访问，不意外指向测试域名 |
| 缓存 | Cloudflare cache header、R2 incremental cache | 静态/公开数据路径有缓存表现 |
| 日志 | Worker logs | 无持续 5xx、无缺包、无明显 runtime API 报错 |

阶段出口：

- `cf.priceai.cc` 连续跑通核心路径。
- Worker 运行时没有真实缺包错误。
- Supabase egress / 请求量没有异常抬升。
- 后台写操作和公开读缓存同时正常。

## 阶段 3：兼容性与成本加固

这一步在切生产前完成，避免把隐患带到主域名。

优先级 P0 / P1：

1. 确认 OpenNext 的 MDX / Unified copy 日志是否影响真实部署。
2. 确认 Worker bundle 上传大小、启动时间、CPU 时间和错误率。
3. 确认所有公开 API 都保留合理 `Cache-Control`。
4. 确认 Supabase 公开 RPC 权限和分页抓取风险，避免直接绕过 Cloudflare 放大 egress。
5. 确认 `/api/cron/*` 不被 Cloudflare 调度器直接触发真实采集。
6. 确认 analytics 仍使用自部署 Umami，不误切到默认 cloud Umami。

推荐观测指标：

| 指标 | 目标 |
|------|------|
| `/api/explorer` 响应体积 | tens of KB |
| `/api/offers?limit=80` 响应体积 | 约 100KB 以下 |
| Worker 5xx | 0 或仅预期鉴权拒绝 |
| Supabase egress | 不高于 Vercel 生产基线 |
| R2 incremental cache | 有增长但不失控 |
| 后台写后数据可见延迟 | 接受 120s 内 CDN / server cache 延迟 |

## 阶段 4：部署自动化

测试域名稳定后，再把手动部署变成可重复流程。

建议新增一条 GitHub Actions workflow：

- 手动触发 `workflow_dispatch`。
- 只从 Cloudflare POC 分支或指定 release 分支部署。
- 使用 GitHub secrets 保存 `CLOUDFLARE_API_TOKEN`、`CLOUDFLARE_ACCOUNT_ID`。
- 执行 `npm ci`、`npm run build:cloudflare`、`npm run deploy:cloudflare`。
- 部署后自动打公开 API smoke test。

不建议在这一阶段自动切生产域名。域名切换仍应手动执行，并保留回滚窗口。

## 阶段 5：生产切换

切换前准备：

1. Vercel 生产继续可用，作为回滚目标。
2. Cloudflare 测试域名全部验收通过。
3. GitHub Actions / VPS 采集任务仍指向当前生产域名。
4. 准备切换窗口，避免采集或后台修改高峰。
5. 记录当前 DNS / route / Vercel alias 状态。

切换动作：

1. 在 Cloudflare 给 Worker 绑定 `priceai.cc` 和 `www.priceai.cc`。
2. 把 Worker 环境变量 `CRON_PUBLIC_BASE_URL` 改为 `https://priceai.cc`。
3. 更新 GitHub Actions / VPS 的 `COLLECT_PRICES_URL` 到 Cloudflare 主域名入口。
4. 保持 `NEXT_PUBLIC_UMAMI_ALLOWED_DOMAINS=priceai.cc,www.priceai.cc`。
5. 立即执行生产 smoke test。

生产 smoke test：

```bash
curl -I https://priceai.cc
curl -sS -o /tmp/explorer.json -w '%{http_code} %{size_download} %{time_total}\n' https://priceai.cc/api/explorer
curl -sS -o /tmp/offers.json -w '%{http_code} %{size_download} %{time_total}\n' 'https://priceai.cc/api/offers?limit=80'
curl -sS -o /tmp/health.json -w '%{http_code} %{size_download} %{time_total}\n' https://priceai.cc/api/health
```

后台 smoke test：

- 登录 `/admin`。
- 查看采集日志、来源、报价、提交和反馈。
- 做一条低风险写操作，确认 Supabase 写入和前台回显。
- 触发一次采集任务到新主域名，确认 `CRON_SECRET` 鉴权和写回正常。

## 回滚方案

回滚触发条件：

- 主域名持续 5xx。
- 公开 API 数据错误或体积异常膨胀。
- 后台无法登录或写入失败。
- Supabase egress / 请求量异常上涨。
- Worker runtime 出现持续缺包或 Node API 兼容错误。

回滚动作：

1. 移除或禁用 `priceai.cc` / `www.priceai.cc` 的 Worker route。
2. 将域名指回 Vercel 当前生产部署。
3. 将 `COLLECT_PRICES_URL` 改回 Vercel 生产入口。
4. 保留 Cloudflare Worker 和 `cf.priceai.cc` 继续排障。
5. 复测首页、公开 API、后台和采集。

## 推荐执行顺序

1. 先购买 Workers Paid，并创建 R2 bucket。
2. 在本地完成 `wrangler login` 或提供 Cloudflare API Token。
3. 部署当前 POC 分支到 `cf.priceai.cc`。
4. 配置真实 Supabase / admin / analytics secrets。
5. 运行测试域名验收清单。
6. 修复发现的 Worker 兼容问题。
7. 增加手动 GitHub Actions 部署 workflow。
8. 安排主域名切换窗口。
9. 切 `priceai.cc` / `www.priceai.cc`。
10. 连续观察 24-72 小时后，再清理旧 Vercel 账号依赖。

## 当前下一步

现在最值得做的是阶段 1 和阶段 2：购买 Workers Paid，创建 R2 bucket，给 `cf.priceai.cc` 部署一个真实 Cloudflare 预览环境。只要这个环境带真实 Supabase secrets 跑通，后面的生产切换就是受控 DNS / route 操作，而不是一次性赌迁移。
