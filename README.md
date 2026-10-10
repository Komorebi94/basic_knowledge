# 知序 · 个人技术知识库

这是一个供个人长期学习与复习的前端知识空间。规划目录包含 16 个专题的 128 个前端知识单元、40 道练习、20 个 AI 工程单元。现已补齐首版 P0：32 篇知识教程、16 篇 AI 教程、24 道完整练习、96 张回忆卡、至少 4 套任务模板和 3 个审阅案例。2026-10-09 补齐 4 篇 AI P1 教程；当前实际可读 44 篇知识、20 篇 AI，共 64 篇文章，回忆卡共 134 张。

正文、练习题面和目录均可搜索。文章提供折叠自检与关联练习；练习提供合同、骨架、三层提示、参考实现、逐步解析和行为用例。已接入隔离运行、练习草稿与通过证据、复习订阅与评分、阅读位置、收藏、补强和完整个人数据备份。实际进度见 [实现记录](docs/implementation-status.md)。

## 本地运行

需要 Node.js 20.19+ 或 22.12+。建议使用仓库内的锁文件安装依赖：

```bash
npm ci
npm run dev
```

另开一个终端运行 `npm run dev:runner`。主站打开 `http://127.0.0.1:5173`，独立运行器使用 `http://127.0.0.1:5174`；两个服务都需要运行，origin 必须不同。运行器不可用时报告错误并保留代码草稿。开发服务器支持页面深链接；正式部署时需配置未知路径回退到应用入口。

## 检查命令

```bash
npm run typecheck
npm run lint
npm run build
npm run preview
npm run build:runner
npm run verify:content
npm run verify:search
npm run verify:store
npm run verify:personal
npm run verify:runner
npm run verify:visual
npm run verify:catalog
npm run verify:p0
npm run verify:articles
npm run verify:exercises
npm run verify:p0-ui
npm run verify:personal-domain
npm run verify:learning-store
npm run verify:learning-ui
npm run verify:real-quota
npm run verify:review
npm run verify:review-ui
npm run verify:practice-domain
npm run verify:practice-runner
npm run verify:practice-ui
npm run verify:performance
npm run verify:ai-p1-ui
```

主站构建产物位于 dist/，运行器产物位于 dist-runner/。浏览器验证需要本地开发服务器，以及已安装的 Chrome；默认主站 5173、运行器 5174，可用 ZHIXU_MAIN_ORIGIN 和 ZHIXU_RUNNER_ORIGIN 指定。运行器通过 npm run dev:runner 启动。验证脚本使用临时浏览器上下文，不读取日常浏览器资料。项目没有连接模型 API。

## 当前页面

| 路径 | 当前状态 |
| --- | --- |
| / | 真实已读、独立通过、今日与本周回顾统计及继续学习入口 |
| /knowledge、/knowledge/:domain | 16 个专题、128 个单元的完整目录与学习范围 |
| /search?q=… | 搜索完整目录、64 篇正文与24道练习题面；支持内容 ID，待编写条目定位目录锚点 |
| /knowledge/:domain/:slug、/ai/:slug | 44+20 篇完整教程、折叠回忆问题、关联练习与章节深链接 |
| /practice、/ai | 40 道练习规划目录，24 道题已开放；20 篇 AI 教程全部开放 |
| /practice/:slug | 24 道完整题目、代码自动保存、隔离运行、停止、结果、提示、解析、尝试与证据历史 |
| /me | 文章与章节笔记、私人搜索、收藏、补强、学习历史及原文入口 |
| /settings | 完整学习数据备份、恢复点、时区与每日目标、字号、运行快捷键、存储与清理 |
| /review | 订阅、暂停、到期队列、回答草稿、评分、撤销及会话恢复 |
| 文章与练习详情路径 | 内容尚未发布时显示恢复入口 |

目录中的主题和题目是规划，不代表正文或运行环境已经完成。当前也不会展示虚构的学习进度。

## 代码位置

- src/app/：路由、通用布局、总览与搜索。
- src/features/knowledge/：专题元数据与知识目录。
- src/features/practice/、ai/、review/、personal/：各业务区域的页面入口。
- src/styles.css：设计 tokens 在当前界面中的基础实现。
- src/content/catalog.json：完整结构化目录；来自设计文档的已确认条目，不包含答案。
- docs/design/：完整产品规格、内容蓝图、数据与安全边界、验收标准及设计图。

后续以 [设计总览](docs/design/README.md) 为准推进。P0 内容与功能已接入并完成本机 Chrome 专项验证。真实配额拒绝已通过受控浏览器额度验证；完整浏览器矩阵、人工读屏及生产部署环境仍未验收。我的积累支持笔记自动保存、冲突比较及未保存时的切页保护。

维护目录时先更新设计文档 07、08、09 中的表格，再运行 `npm run sync:catalog`（需要 Python 3）生成结构化目录，最后运行 `npm run verify:catalog` 验证数量、唯一 ID、分类、页面和搜索定位。正文按稳定目录 ID 关联，不通过标题猜测已开放状态。

## 设计入口

[产品定位](docs/design/01-product.md) · [页面规格](docs/design/05-pages.md) · [设计图](docs/design/visuals/README.md) · [交接说明](docs/design/15-handoff.md)

当前 64 篇正文按深入教程标准编写。原 60 篇文章已验证 207 个浏览器示例及其中 9 个 TypeScript 示例的严格类型检查；新增 4 篇 AI P1 的 10 个示例另有 [执行报告](docs/verification/article-examples-report.json)。可用 `ZHIXU_ARTICLE_IDS=AI13,AI14,AI17,AI18 npm run verify:articles` 复现新增检查，不指定 ID 则检查全部作者示例。`npm run verify:exercises` 已验证 182 个行为用例、72 个可见样例，并击败 48 个典型错误实现。练习复现说明见 [harness 文档](docs/verification/exercise-harness.md)。模块示例以 ES 模块执行。闭包教程的 12 个示例另可运行 `npm run verify:closures` 验证；详细内容制作与阅读修订标准见 [D14](docs/design/15-handoff.md)。


内容发布门禁 `npm run verify:p0` 会验证 P0 数量、稳定 ID、卡片与原文锚点、AI 合同、模板/案例、公开元数据、来源 URL 与双向关联；`npm run build` 自动运行此门禁。参考用例仅执行仓库作者内容，用户输入与导入备份不会进入这些脚本。

## 个人数据与部署边界

正式部署采用 **一个 GitHub 仓库、两个 Cloudflare Pages 项目**：主站使用 `npm run build:pages` → `dist/`，运行器使用 `npm run build:runner:pages` → `dist-runner/`。两个项目连接 `Komorebi94/basic_knowledge`，分别使用独立 HTTPS origin。环境变量、首次创建步骤和验收见 [Cloudflare Pages 部署指南](docs/deployment-cloudflare-pages.md)。配置已补齐，线上项目仍需创建并验收。

新版导出使用 schema 2，覆盖笔记、草稿、阅读、收藏、补强、复习会话与事件、练习尝试与通过证据；导入仍接受 schema 1，为旧备份补空学习状态。预检后整笔事务替换，保留唯一恢复点；失败不混合新旧数据。未保存输入会阻止跨页维护，冲突需要明确选择。私人数据保存在浏览器，不自动上传。

主站与运行器分别部署 `dist/` 与 `dist-runner/`。构建主站时通过 `VITE_RUNNER_ORIGIN` 指定运行器，构建运行器时通过 `ZHIXU_PARENT_ORIGIN` 指定主站。运行器安全策略由 `runner/security.js` 定义；构建自动输出供 Cloudflare Pages 使用的 `_headers`，其他静态托管必须在服务器复现这些响应头。目标部署尚未实测。

本地预览主站默认 4173，需要为该 origin 重新构建运行器，并停止占用 5174 的开发运行器：

```bash
ZHIXU_PARENT_ORIGIN=http://127.0.0.1:4173 npm run build:runner
# 分别在两个终端启动
npm run preview
ZHIXU_PARENT_ORIGIN=http://127.0.0.1:4173 npm run preview:runner
```

性能脚本默认生产预览 5192（`npm run preview -- --port 5192`），搜索计时另需开发主站 5173。实验室性能见 [报告](docs/verification/p0-performance.json)；正文延迟包仍有构建体积提示。验收范围与限制见 [实现记录](docs/implementation-status.md)。
