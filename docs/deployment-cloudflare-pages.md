# 一个仓库部署两个 Cloudflare Pages 项目

主站和练习运行器共用 GitHub 仓库 `Komorebi94/basic_knowledge`，分别构建到 `dist/` 与 `dist-runner/`。两个 Pages 项目使用不同 origin，保留现有文章地址、章节锚点和本地数据，不需要 GitHub Actions、后端或数据库。

## 当前生产地址

- 主站：<https://zhixu-komorebi94.pages.dev>
- 运行器：<https://zhixu-komorebi94-runner.pages.dev>
- 两个项目均连接仓库的 `master` 分支，推送后自动构建部署。

2026-10-10 已用本机 Chrome 的临时上下文验收生产 origin：文章深链接与刷新、练习参考实现和错误实现、运行器 CSP、跨源隔离、网络阻断、超时和主动停止。未验证完整浏览器矩阵、人工读屏、用户真实私人数据迁移，以及成对 origin 的预览部署。原始 JSON 记录未纳入仓库。

## 创建项目

在 Cloudflare 控制台进入 Workers & Pages，创建 **Pages** 项目并连接 GitHub 仓库。允许 Cloudflare 访问该仓库，用同一仓库创建两个项目：

| 设置 | 主站 | 运行器 |
| --- | --- | --- |
| 仓库 | `Komorebi94/basic_knowledge` | 同左 |
| 生产分支 | `master` | `master` |
| 项目根目录 | 仓库根目录 | 仓库根目录，不能填 `runner` |
| 框架预设 | None（自定义构建） | None（自定义构建） |
| 构建命令 | `npm run build:pages` | `npm run build:runner:pages` |
| 输出目录 | `dist` | `dist-runner` |
| 环境变量 `NODE_VERSION` | `22.22.3` | `22.22.3` |

Pages 安装仓库依赖后执行构建命令；保留 `package-lock.json`。两个构建都先执行类型检查和 lint，主站还执行内容发布门禁。项目名称由你选择，使用控制台实际分配的域名。

## 配置两个地址

**两个 Pages 项目都添加以下环境变量**，值保持一致：

| 环境变量 | 值 |
| --- | --- |
| `ZHIXU_PARENT_ORIGIN` | 主站的实际 HTTPS origin |
| `VITE_RUNNER_ORIGIN` | 运行器的实际 HTTPS origin |

当前分别填 `https://zhixu-komorebi94.pages.dev` 和 `https://zhixu-komorebi94-runner.pages.dev`。首次创建其他项目时，以其实际分配域名为准。

仅填写协议、域名和必要的端口，不填写子路径、查询或章节片段。两者必须不同；同一个域名下的 `/runner/` 不满足隔离条件。构建脚本拒绝缺失地址、HTTP、本机地址、同源地址和含凭据的地址。

首次创建时先确定两个项目名称；如果首轮因未填写地址而失败，填入两个实际域名后重新部署两个项目。更换域名时同步更新两个项目的变量，并重新构建两个项目；不要继续使用旧产物。

主站通过 `VITE_RUNNER_ORIGIN` 加载 iframe，运行器通过 `ZHIXU_PARENT_ORIGIN` 验证消息来源并设置 `frame-ancestors`。运行器只信任一个精确主站 origin，不使用 `*.pages.dev` 通配符。

生产环境和 Preview 环境分开配置。Preview 主站域名与生产域名不同，不能直接使用只允许生产主站的运行器；若需要预览版练习，必须配置稳定且配对的主站/运行器 origin，并单独构建。未配对的预览页面可以阅读，练习运行失败时会保留草稿。

## 路由与响应头

主站保留 `createBrowserRouter` 和根路径部署。`dist/` 不生成顶层 `404.html`，使用 Pages 默认 SPA 回退；直接打开或刷新 `/knowledge/javascript/closures#closure` 仍加载应用。不存在的业务路径由应用显示恢复入口。不要给主站增加顶层 `404.html` 或全路径重定向。

主站的 `public/_headers` 随构建复制，禁止被其他站点嵌入，并配置 `nosniff` 和 Referrer Policy；缓存使用 Pages 默认行为，入口更新后重新验证。

运行器构建自动生成 `dist-runner/_headers`，复用开发服务器安全策略：

- `/` 和 `/index.html`：只允许本站脚本与 Worker，禁止网络，仅指定主站可以嵌入。
- 实际生成的 `assets/worker-*.js`：允许动态求值，禁止网络、外部脚本及嵌套 Worker。
- 通用响应头：`nosniff`、`no-referrer`、`no-cache` 和 `noindex`。不设置会阻止主站嵌入的 `X-Frame-Options: DENY`。

文档和 Worker 的 CSP 规则互不重叠，避免 Pages 合并两个 CSP 导致 Worker 无法执行。运行器生成静态 `404.html`，陌生地址不会回退成缺少 CSP 的运行页面。`_headers` 必须发布到对应输出目录，不能只上传 HTML/JS。保持静态 Pages 部署，不引入 Pages Functions；Functions 不自动继承这些响应头。

## 本地验证

```bash
npm ci
npm run typecheck
npm run lint
npm run build
npm run build:runner
npm run verify:pages
npm run verify:pages:browser
```

浏览器验证需要 Chrome，以及空闲的 `127.0.0.1:5173` 和 `5174`。脚本使用临时浏览器上下文和本地静态服务器，读取产物的 `_headers`；检查文章直接访问、刷新、章节链接、运行器 404、跨源 DOM/数据库隔离、正常运行、网络阻断、超时和停止。该检查模拟 Pages 静态托管，不替代 Cloudflare 边缘服务器实测。

验证正式构建入口时，先用实际域名设置 `ZHIXU_PARENT_ORIGIN` 和 `VITE_RUNNER_ORIGIN`，再执行 `npm run build:pages` 和 `npm run build:runner:pages`。正式产物配置线上地址，不能当作上述 localhost 浏览器验证产物。

## 发布后验收

1. 两个项目连接同一仓库，生产部署指向同一提交；推送代码后分别检查构建结果，两个发布不是原子操作。
2. 直接打开闭包文章并刷新，确认返回 200、正文正确、章节锚点有效。
3. 在 Network 检查运行器根文档与实际 Worker 文件的 CSP；只有 Worker 的 `script-src` 包含 `unsafe-eval`，两者都有 `connect-src 'none'`。
4. 正确练习通过，错误代码报告失败，死循环可超时，运行可停止，主站仍可操作。运行器不可用时保留草稿。
5. 可以用实际地址运行隔离检查：

```bash
ZHIXU_MAIN_ORIGIN=https://zhixu-komorebi94.pages.dev \
ZHIXU_RUNNER_ORIGIN=https://zhixu-komorebi94-runner.pages.dev \
npm run verify:runner
```

6. 在 localhost 导出个人数据，再在正式主站的设置页导入并验证笔记、草稿与复习记录。不同 origin 不自动共享 IndexedDB；换域名同样需要备份迁移。

当前是公开静态托管，公共文章和题目可被访问，笔记仍只保存在各自浏览器。运行器用于本人学习，不是接受敌对提交的公共沙箱。

维护构建命令、origin、路由或安全策略时，同步更新本文和 Pages 配置，重新执行部署验收。

## 官方参考

- [Git integration](https://developers.cloudflare.com/pages/configuration/git-integration/)
- [Build configuration](https://developers.cloudflare.com/pages/configuration/build-configuration/)
- [Serving Pages：SPA 行为与缓存](https://developers.cloudflare.com/pages/configuration/serving-pages/)
- [Headers：规则重叠与静态响应头](https://developers.cloudflare.com/pages/configuration/headers/)
