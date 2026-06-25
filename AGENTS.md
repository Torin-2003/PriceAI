<!-- BEGIN:nextjs-agent-rules -->
# 这不是你熟悉的 Next.js

此版本有破坏性变更——API、约定和文件结构可能与你的训练数据不同。写任何代码之前，先阅读 `node_modules/next/dist/docs/` 中的相关指南。注意弃用通知。
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:priceai-deploy-rules -->
# PriceAI 生产部署默认走 Cloudflare

`priceai.cc` 与 `www.priceai.cc` 的生产入口是 Cloudflare Workers + OpenNext。默认生产发布必须使用：

```bash
npm run deploy:production
```

这个命令默认触发 `.github/workflows/deploy-cloudflare-worker.yml`，通过 GitHub secrets 部署到 Cloudflare。不要默认运行 `vercel deploy --prod --yes`；旧 Vercel 项目已删除，除非用户明确要求重建 Vercel 回滚环境或排查历史 Vercel 记录。

部署前如果只想检查当前生产目标和本机环境，运行：

```bash
npm run deploy:production -- --check
```
<!-- END:priceai-deploy-rules -->

<!-- BEGIN:priceai-db-migration-rules -->
# PriceAI 数据库迁移默认交给 Supabase GitHub Integration

生产数据库迁移由 Supabase Dashboard 的 GitHub Integration 管理：repo 为 `physics-dimension/PriceAI`，working directory 为 `.`，production branch 为 `main`。`supabase/migrations/*.sql` 合入 `main` 后，由 Supabase 集成负责应用到生产项目。

不要默认把 `supabase db push` 加回 `.github/workflows/deploy-cloudflare-worker.yml`，也不要让 Cloudflare Workers/OpenNext 发布流程依赖本机或 GitHub Actions 里的 `SUPABASE_ACCESS_TOKEN`、`SUPABASE_DB_PASSWORD` 来做生产迁移。除非用户明确要求替换 Supabase GitHub Integration，否则 Cloudflare workflow 只负责站点部署。

涉及 migration 的发布完成后，要同时确认 Supabase GitHub Integration / checks 状态，以及生产 API 的真实行为。优先验证相关业务端点，例如：

```bash
curl -I https://priceai.cc/api/explorer
curl https://priceai.cc/api/explorer
```

如果本机 `git push` 或 GitHub HTTPS 连接超时，可显式走本机代理：

```bash
HTTPS_PROXY=http://127.0.0.1:7897 HTTP_PROXY=http://127.0.0.1:7897 git push origin main
```
<!-- END:priceai-db-migration-rules -->

<!-- BEGIN:priceai-commit-rules -->
# 代码改动先单独提交

只要本仓库里改了代码，默认在继续下一步之前，先把这次改动单独整理成一个本地 commit。
<!-- END:priceai-commit-rules -->
