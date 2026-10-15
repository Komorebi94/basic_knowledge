# 知序 · 个人技术知识库

这是一个供个人长期学习与复习的前端知识空间。规划目录包含 16 个专题的 128 个前端知识单元、40 道练习、20 个 AI 工程单元。现已补齐首版 P0：32 篇知识教程、16 篇 AI 教程、24 道完整练习、96 张回忆卡、至少 4 套任务模板和 3 个审阅案例。2026-10-09 补齐 4 篇 AI P1 教程；2026-10-12 补齐 K04、K03、K05、K06、K07 各 6 篇扩展教程；2026-10-13 按目录顺序补齐 K08-03—K08-08，并为 K08-01/02 补上真实 Vue 示例验证；K08 全部 8 篇已开放。同日补齐 K09-03—K09-08，K09 全部 8 篇已开放。同日补齐 K10-03—K10-08，K10 全部 8 篇已开放。同日补齐 K11-03—K11-08，K11 全部 8 篇已开放。同日补齐 K12-03—K12-08，K12 全部 8 篇已开放。同日补齐 K13-03—K13-08，K13 全部 8 篇已开放。2026-10-14 补齐 K14-03—K14-08，K14 全部 8 篇已开放。同日补齐 K15-03—K15-08，K15 全部 8 篇已开放。同日补齐 K16-03—K16-08，K16 全部 8 篇已开放。当前实际可读 128 篇知识、20 篇 AI，共 148 篇文章，回忆卡共 386 张。2026-10-14 补齐 E25–E40，40 道练习全部开放。

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
npm run verify:runner
npm run verify:visual
npm run verify:catalog
npm run verify:p0
npm run verify:articles
npm run verify:exercises
npm run verify:p0-ui
npm run verify:personal-domain
npm run verify:learning-store
npm run verify:real-quota
npm run verify:review
npm run verify:practice-domain
npm run verify:practice-runner
npm run verify:practice-ui
npm run verify:performance
npm run verify:ai-p1-ui
npm run verify:k04
npm run verify:k04-ui
npm run verify:k03-types
npm run verify:k03-ui
npm run verify:k05
npm run verify:k05-ui
npm run verify:k06
npm run verify:k06-ui
npm run verify:k07
npm run verify:k07-ui
npm run verify:k08-03
npm run verify:k08-04
npm run verify:k08-05
npm run verify:k08-06
npm run verify:k08-07
npm run verify:k08-08
npm run verify:k08
npm run verify:k08-ui
npm run verify:k09
npm run verify:k09-ui
npm run verify:k10
npm run verify:k10-ui
npm run verify:k11
npm run verify:k11-ui
npm run verify:k12
npm run verify:k12-ui
npm run verify:k13
npm run verify:k13-ui
npm run verify:k14
npm run verify:k14-ui
npm run verify:k15
npm run verify:k15-ui
npm run verify:k16
npm run verify:k16-ui
```

主站构建产物位于 dist/，运行器产物位于 dist-runner/。浏览器验证需要本地开发服务器，以及已安装的 Chrome；默认主站 5173、运行器 5174，可用 ZHIXU_MAIN_ORIGIN 和 ZHIXU_RUNNER_ORIGIN 指定。运行器通过 npm run dev:runner 启动。验证脚本使用临时浏览器上下文，不读取日常浏览器资料。`verify:k04` 自行启动独立临时 origin，运行 18 个新增作者示例及 Service Worker 离线/更新实验，不需要主站；`verify:k04-ui` 检查主站 K04 目录与六篇新增教程。`verify:k03-types` 验证编译反例和独立临时包的 Bundler/NodeNext 消费，`verify:k03-ui` 检查 K03 阅读合同。`verify:k05` 在独立 Chrome 空白页核对六篇新增教程的作者示例，`verify:k05-ui` 检查 K05 目录与阅读合同。`verify:k06`、`verify:k07` 同样在空白页核对各自六篇新增教程；`verify:k06-ui`、`verify:k07-ui` 检查网络与 React 目录及阅读合同。`verify:k08-03` 在临时独立 HTTP 页面使用 Vue 3.5.43 验证 6 个真实运行时示例，`verify:k08-04` 验证 8 个生命周期与组合式函数示例，覆盖提前卸载、请求清理和作用域停止；`verify:k08-05` 实际编译固定作者模板并验证 7 个更新示例；`verify:k08-06` 以 Vue Router 4.6.4 内存历史验证 7 个路由、表单和共享状态示例；`verify:k08-07` 验证 3 个 Node SSR 示例与 5 个浏览器水合/恢复示例；`verify:k08-08` 验证 7 个性能诊断与固定高度窗口示例；`verify:k08` 一次核对全部 8 篇的 51 个作者示例（48 浏览器、3 Node），`verify:k08-ui` 检查完整八节目录、全部正文和 22 张卡片的搜索/锚点/多尺寸阅读。Vue 与 Vue Router 仅作开发验证依赖，不进入主站执行环境。`verify:k09` 核对全部八篇的 30 个示例（24 Node、6 浏览器），涵盖真实构建、TypeScript 转换与语义检查、包入口、HTTP 响应和源码映射；发布模型不连接真实 CI/CD。`verify:k09-ui` 检查全部八篇及 22 张卡片。复现见 [K09 harness](docs/verification/tooling-harness.md)。`verify:k10` 核对 K10 全部八篇的作者示例，其中 DOMParser 与节点计数在空白页执行，K10-06 用已安装 Rolldown 比较固定模块；其余时间为明确教学模型，不测量真实用户体验。`verify:k10-ui` 检查全部八篇及 22 张卡片。`verify:k11` 核对 K11 全部八篇的作者示例：CSP 来源、安装条目、日志替换、跳转用途、源与 sandbox、威胁门禁都在空白页执行，使用固定输入，不发送外部请求，也不是完整的浏览器安全策略实现。`verify:k11-ui` 检查全部八篇及 22 张卡片。`verify:k12` 核对 K12 全部八篇的作者示例：替身分类、虚拟时钟、控件查询、数据隔离、属性与变异、门禁记录都在空白页执行；K12-05 使用空白页里的真实元素。这些模型不是测试框架、浏览器事件循环或持续集成。`verify:k12-ui` 检查全部八篇及 22 张卡片。`verify:k13` 核对 K13 全部八篇的作者示例：表单世代、菜单与授权、按钮契约、放置边界、配置回退和容量分档都在空白页执行，使用固定输入。阈值、角色和租户表是教学模型，不是生产配置、访问控制或容量评估。`verify:k13-ui` 检查全部八篇及 22 张卡片。`verify:k14` 核对 K14 全部八篇的作者示例：有限队列、聚合与整形、分段输出、缓存键、运行时能力表和请求记录都在空白页执行，使用固定输入。它们不是 Node 流、真实 BFF、服务端渲染、CDN 或追踪系统。`verify:k14-ui` 检查全部八篇及 22 张卡片。`verify:k15` 核对 K15 全部八篇的作者示例：错误恢复、保存步骤、目标尺寸、对比比值、控件键表和发布门禁都在空白页执行，使用固定输入。它们不是读屏、设备测量、对比度扫描器或 WCAG 符合性结论。`verify:k15-ui` 检查全部八篇及 22 张卡片。`verify:k16` 核对 K16 全部八篇的作者示例：树遍历、有序查找、窗口、栈、状态转移和列表窗口都在空白页执行，使用固定输入。它们不是包安装器、排行榜、编辑器历史、虚拟列表或渲染耗时。`verify:k16-ui` 检查全部八篇及 22 张卡片。项目没有连接模型 API。

## 当前页面

| 路径 | 当前状态 |
| --- | --- |
| / | 重定向到知识地图 |
| /knowledge、/knowledge/:domain | 16 个专题、128 个单元的完整目录与学习范围 |
| /search?q=… | 搜索完整目录、148 篇正文与 40 道练习题面；支持内容 ID |
| /knowledge/:domain/:slug、/ai/:slug | 128+20 篇完整教程、折叠回忆问题、关联练习与章节深链接 |
| /practice、/ai | 40 道练习全部开放；20 篇 AI 教程全部开放 |
| /practice/:slug | 40 道完整题目、代码自动保存、隔离运行、停止、结果、提示、解析、尝试与证据历史 |
| 文章与练习详情路径 | 内容尚未发布时显示恢复入口 |

目录中的知识和练习均已发布。未知地址仍显示恢复入口。当前不会展示虚构的学习进度。

## 代码位置

- src/app/：路由、顶栏布局与搜索。
- src/features/knowledge/：专题元数据与知识目录。
- src/features/practice/：练习目录与工作台。
- src/features/ai/：AI 工程目录。
- src/features/personal/：读取已保存的学习偏好，供顶栏正文字号使用。
- src/styles.css：设计 tokens 在当前界面中的基础实现。
- src/content/catalog.json：完整结构化目录；来自设计文档的已确认条目，不包含答案。
- docs/design/：完整产品规格、内容蓝图、数据与安全边界、验收标准及设计图。

后续以 [设计总览](docs/design/README.md) 为准推进。P0 内容与功能已接入并完成本机 Chrome 专项验证。真实配额拒绝已通过受控浏览器额度验证；Cloudflare Pages 生产部署已在 2026-10-10 用本机 Chrome 做过专项验收，完整浏览器矩阵及人工读屏仍未验收。总览、侧栏、复习计划、我的积累和设置页已移出产品。

维护目录时先更新设计文档 07、08、09 中的表格，再运行 `npm run sync:catalog`（需要 Python 3）生成结构化目录，最后运行 `npm run verify:catalog` 验证数量、唯一 ID、分类、页面和搜索定位。正文按稳定目录 ID 关联，不通过标题猜测已开放状态。

## 设计入口

[产品定位](docs/design/01-product.md) · [页面规格](docs/design/05-pages.md) · [设计图](docs/design/visuals/README.md) · [交接说明](docs/design/15-handoff.md)

当前 148 篇正文按深入教程标准编写。原 60 篇文章已验证 207 个浏览器示例及其中 9 个 TypeScript 示例的严格类型检查；2026-10-12 又为 AI04、AI06、AI16、AI20 追加 4 个示例并通过定向检查。4 篇 AI P1 现有 11 个示例。可用 `ZHIXU_ARTICLE_IDS=AI13,AI14,AI17,AI18 npm run verify:articles` 复现新增检查，不指定 ID 则检查全部作者示例。`npm run verify:exercises` 已验证 182 个行为用例、72 个可见样例，并击败 48 个典型错误实现。练习复现说明见 [harness 文档](docs/verification/exercise-harness.md)。验证命令写出的 JSON 与截图只留在本机，不纳入仓库。模块示例以 ES 模块执行。闭包教程的 12 个示例另可运行 `npm run verify:closures` 验证；详细内容制作与阅读修订标准见 [D14](docs/design/15-handoff.md)。


内容发布门禁 `npm run verify:p0` 会验证 P0 数量、稳定 ID、卡片与原文锚点、AI 合同、模板/案例、公开元数据、来源 URL 与双向关联；`npm run build` 自动运行此门禁。参考用例仅执行仓库作者内容，用户输入与导入备份不会进入这些脚本。

## 个人数据与部署边界

正式部署采用 **一个 GitHub 仓库、两个 Cloudflare Pages 项目**：主站使用 `npm run build:pages` → `dist/`，运行器使用 `npm run build:runner:pages` → `dist-runner/`。两个项目连接 `Komorebi94/basic_knowledge` 的 `master` 分支，分别使用独立 HTTPS origin。主站地址为 <https://zhixu-komorebi94.pages.dev>，运行器为 <https://zhixu-komorebi94-runner.pages.dev>。环境变量、创建步骤和验收见 [Cloudflare Pages 部署指南](docs/deployment-cloudflare-pages.md)。

新版导出使用 schema 2，覆盖笔记、草稿、阅读、收藏、补强、复习会话与事件、练习尝试与通过证据；导入仍接受 schema 1，为旧备份补空学习状态。预检后整笔事务替换，保留唯一恢复点；失败不混合新旧数据。未保存输入会阻止跨页维护，冲突需要明确选择。私人数据保存在浏览器，不自动上传。

主站与运行器分别部署 `dist/` 与 `dist-runner/`。构建主站时通过 `VITE_RUNNER_ORIGIN` 指定运行器，构建运行器时通过 `ZHIXU_PARENT_ORIGIN` 指定主站。运行器安全策略由 `runner/security.js` 定义；构建自动输出供 Cloudflare Pages 使用的 `_headers`，其他静态托管必须在服务器复现这些响应头。

本地预览主站默认 4173，需要为该 origin 重新构建运行器，并停止占用 5174 的开发运行器：

```bash
ZHIXU_PARENT_ORIGIN=http://127.0.0.1:4173 npm run build:runner
# 分别在两个终端启动
npm run preview
ZHIXU_PARENT_ORIGIN=http://127.0.0.1:4173 npm run preview:runner
```

性能脚本默认生产预览 5192（`npm run preview -- --port 5192`），搜索计时另需开发主站 5173。实验室性能的测量条件与结论见 [实现记录](docs/implementation-status.md)。正文按文章拆开加载，搜索索引在搜索时单独请求。
