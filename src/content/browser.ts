import type { Article } from './types'
import { createReviewBody } from './review-body'

export const browserArticles: Article[] = [
    {
        slug: 'from-url-to-page',
        module: 'browser',
        title: '从输入 URL 到页面呈现',
        summary: '一次导航要经过解析地址、建连、拿文档、解析资源和渲染。',
        depth: 'core',
        heat: 5,
        year: 2026,
        tags: ['导航', 'HTTP', '加载'],
        overview:
            '浏览器把地址栏里的字符串变成屏幕上的页面：解析 URL、查 DNS、建 TCP/TLS、发 HTTP、收 HTML，再按文档里的引用继续拉 CSS/JS/图片，边解析边构建渲染树。',
        body: createReviewBody(
            `## 主路径

以打开 \`https://app.example.com/q/js\` 为例，不要把它理解成“发一个 GET”。

1. **解析 URL**：协议 \`https\`、主机 \`app.example.com\`、路径 \`/q/js\`。地址栏里的相对路径要叠在当前文档基地址上。
2. **导航缓存**：文档本身有没有还能用的副本。命中强缓存就少一次建连。
3. **DNS**：主机换成 IP。浏览器缓存 → 系统缓存 → 递归解析。CDN 可能返回离用户近的地址。
4. **建连**：TCP 三次握手；HTTPS 再做 TLS（证书链、域名、有效期、会话密钥）。HTTP/2、HTTP/3 会在同一条连接上复用后续请求。
5. **发请求**：方法、路径、\`Cookie\`、协商头（\`If-None-Match\`）。301/302 会再走一轮，Cookie 域可能变。
6. **收 HTML**：状态码决定展示、重定向还是错误页。HTML 是后续资源的目录，不是整页的全部工作。
7. **流式解析**：解析器遇到 \`<link>\`、\`<script>\`、\`<img>\` 再发请求。预加载扫描器也会提前发现部分资源。
8. **渲染**：DOM + CSSOM → 渲染树 → 布局 → 绘制 → 合成。

## 谁挡住首屏

CSS 默认会挡住首次绘制，避免无样式闪烁。没有 \`async\` / \`defer\` 的脚本会暂停 HTML 解析：下载和执行都插在解析中间。

\`defer\`：并行下载，等文档解析完按声明顺序执行，会赶在 \`DOMContentLoaded\` 前。  
\`async\`：谁先下完谁先执行，顺序不保证，可能打断解析。  
\`type="module"\` 默认 defer 语义。

白屏还可能来自重定向链、慢 DNS、证书失败、HTML 很晚才到，或主线程被一长大脚本占满、有 DOM 也画不出来。

## 和 SPA 的差别

第一次进入仍走完整文档导航。之后点 \`<Link>\` 通常只改 history、拉 JS chunk 和接口，不再要整份 HTML。刷新、从外部打开深层地址、跨站跳过来，仍是完整导航，所以服务端要对 \`/q/js\` 回同一张入口 HTML。

排查慢时按瀑布分段：DNS、连接、TTFB、内容下载、脚本求值、首帧。不要把所有慢都说成“接口慢”。`,
            `从输入 URL 到上屏，按导航、网络、解析、渲染四层讲。浏览器解析地址并查缓存，DNS 换 IP，建立 TCP 或 QUIC 并完成 TLS，再发 HTTP；HTML 流式解析时继续发现 CSS、脚本和图片。同步脚本卡住解析，defer 保序并等文档结束，async 谁先到谁先跑。CSS 影响首次绘制。SPA 只有首次走完整文档导航，应用内路由通常只改历史和局部内容；刷新深层地址仍要服务端回入口 HTML。`,
            [
                {
                    question: 'DNS 一定会打到公网吗？',
                    direction: '不一定。浏览器、操作系统、路由器和递归解析器都可能命中缓存。',
                },
                {
                    question: 'defer 和 async 差在哪？',
                    direction:
                        'defer 等解析结束按文档顺序执行；async 下载完就执行，顺序不定，还可能打断解析。',
                },
                {
                    question: 'DOMContentLoaded 和 load 等什么？',
                    direction:
                        '前者等文档解析和 defer / module 脚本；后者还等图片、样式表等依赖资源。',
                },
                {
                    question: 'HTTPS 为什么更慢一点？',
                    direction:
                        '多了证书校验和密钥协商。连接复用、会话恢复、HTTP/3 能把后续请求的成本摊薄。',
                },
                {
                    question: '白屏怎么分段？',
                    direction:
                        '看瀑布里 HTML 何时到达、CSS/JS 是否阻塞、主线程有没有长任务，以及控制台有没有解析期异常。',
                },
            ],
        ),
        pitfalls: [
            '把「打开一个网址」理解成只发一个 HTTP 请求。',
            '把 defer 和 async 当成一回事：defer 保顺序并等文档解析完，async 谁先下完谁先跑。',
            '忽略 301/302，排查时只看最终 URL，漏掉中间跳转和 Cookie 域。',
        ],
    },
    {
        slug: 'render-pipeline',
        module: 'browser',
        title: '渲染管线：回流与重绘',
        summary: 'DOM 和样式合成渲染树，几何变化会回流，外观变化会重绘。',
        depth: 'core',
        heat: 5,
        year: 2026,
        tags: ['渲染', '回流', '重绘'],
        overview:
            '浏览器把 DOM 和 CSSOM 合成渲染树，计算每个盒的几何（layout/reflow），再填充像素（paint），最后由合成线程把图层贴到屏幕上。改不同属性，代价差一个数量级。',
        body: createReviewBody(
            `## 一帧里发生什么

主线程大致是：跑 JavaScript → 算样式 → 布局 → 绘制 → 把图层交给合成线程。合成线程可以单独做 \`transform\` / \`opacity\` 的贴图，不一定再回主线程。

- **DOM**：HTML 解析出的树
- **CSSOM**：样式规则树
- **渲染树**：可见盒，不含 \`display: none\`（\`visibility: hidden\` 仍占布局）
- **布局 / 回流**：算位置和尺寸
- **绘制 / 重绘**：画背景、边框、文字
- **合成**：图层上屏

改 \`width\`、\`height\`、\`margin\`、\`font-size\`、\`display\` 通常回流。改 \`color\`、\`background\`、\`box-shadow\` 通常重绘。改 \`transform\`、\`opacity\` 常常只走合成。

## 强制同步布局

浏览器会把样式写入攒到一帧里再算。你如果写完立刻读几何，它必须马上算完才能给你准数：

\`\`\`js
for (const node of nodes) {
  node.style.width = '200px'
  total += node.offsetHeight
}
\`\`\`

每次读 \`offsetHeight\` / \`getBoundingClientRect()\` / \`scrollTop\` 都可能强制布局。正确做法是先读完再写，或一次改 class。

## 怎么少做

批量改 DOM：\`DocumentFragment\`、离线节点、一次切 class。动画优先合成属性。滚动和输入回调里不要同步量尺寸，用 \`requestAnimationFrame\` 对齐帧。

\`will-change: transform\` 只是提示“这个元素马上要动”，图层占显存。只在动画临近时加，结束后去掉。\`transform\` 也不是保证：有些滤镜、固定定位祖先会逼它回主线程，以 Performance 面板的 Layout / Paint / Composite 为准。`,
            `一帧通常是 JavaScript、样式、布局、绘制、合成。改几何会回流，改颜色阴影会重绘，transform 和 opacity 常只走合成。最常见的坑是布局抖动：刚写样式就读 offsetHeight，浏览器被迫同步算完，再在循环里重复。优化是少做、读写分开、动画走合成属性，并用性能面板确认真正贵的是哪一段，而不是给所有元素加 will-change。`,
            [
                {
                    question: '回流一定整页重算吗？',
                    direction:
                        '不一定。影响范围看包含关系和浏览器优化，根节点或影响很多子树的变化传得更远。',
                },
                {
                    question: '读 offsetHeight 为什么慢？',
                    direction: '前面如果有未提交的样式写入，必须先做完样式和布局才能返回准确值。',
                },
                {
                    question: 'transform 为什么更顺？',
                    direction: '已绘制的图层可以在合成线程上平移缩放，少占主线程。',
                },
                {
                    question: 'visibility:hidden 和 display:none 差在哪？',
                    direction: '前者还占布局；后者离开渲染树。藏巨大列表却用透明，布局成本还在。',
                },
                {
                    question: '怎么确认动画掉帧？',
                    direction:
                        'Performance 里看帧时长、长任务，以及 Layout、Paint、Composite 占比。',
                },
            ],
        ),
        pitfalls: [
            '在循环里交错读取 offsetWidth 和设置 style，强制同步布局。',
            '用 display:none 当「不占布局」没问题，却用 visibility 或透明去藏一个巨大子树，布局成本还在。',
            '给所有动画元素加 will-change，图层过多，内存上涨。',
        ],
    },
    {
        slug: 'event-model',
        module: 'browser',
        title: '事件：捕获、冒泡与委托',
        summary: '事件沿树下行再上行。委托把监听放在祖先上，靠 target 区分来源。',
        depth: 'core',
        heat: 5,
        year: 2026,
        tags: ['事件', '冒泡', '委托'],
        overview:
            '一次点击会先从窗口走到目标（捕获），在目标触发，再从目标走回窗口（冒泡）。`addEventListener` 的第三个参数（或 `{ capture: true }`）决定听哪一段。',
        body: createReviewBody(
            `## 三个阶段

点列表里的按钮，路径是：

1. **捕获**：\`window → document → html → body → ul → li → button\`
2. **目标**：在 \`button\` 上
3. **冒泡**：\`button → li → ul → ... → window\`

\`addEventListener(type, fn)\` 默认听冒泡。第三个参数 \`true\` 或 \`{ capture: true }\` 听捕获。同一节点上先捕获后冒泡。

\`event.target\` 是真正被点的节点（可能是按钮里的图标或文本）。\`event.currentTarget\` 是正在执行这个监听的节点。委托时两者经常不是同一个。

## 三种“停”

- \`stopPropagation()\`：后面的节点收不到，捕获和冒泡都停
- \`stopImmediatePropagation()\`：同一节点上还没跑的监听也不跑
- \`preventDefault()\`：取消默认动作（跳转、提交、勾选），**不**停冒泡

\`return false\` 只在老的 \`onclick="..."\` 里约等于又停冒泡又取消默认。在 \`addEventListener\` 里它什么也不做。

在捕获阶段对 \`document\` \`stopPropagation\`，里面的按钮永远收不到点击——这是常见事故。

## 事件委托

1000 行列表不要绑 1000 个 click。听稳定祖先：

\`\`\`js
ul.addEventListener('click', (event) => {
  const row = event.target.closest('li')
  if (!row || !ul.contains(row)) return
  select(row.dataset.id)
})
\`\`\`

必须用 \`closest\`，不能只看 \`target\`：用户点到的可能是 \`span\`、图标或文本节点。后插入的行也会冒泡上来。

\`focus\` 不冒泡，要用 \`focusin\`。滚动监听常加 \`{ passive: true }\`，等于承诺不 \`preventDefault\`，浏览器才能放心异步滚。Shadow DOM 会改写 \`target\`，完整路径看 \`composedPath()\`。

卸载时用同一个函数引用 \`removeEventListener\`，或创建时传入 \`AbortSignal\`：

\`\`\`js
const ac = new AbortController()
el.addEventListener('click', onClick, { signal: ac.signal })
ac.abort()
\`\`\``,
            `DOM 事件先沿捕获下到目标，再沿冒泡回去。target 是最初那一下点到的节点，currentTarget 是当前监听所在的节点。委托就是把监听放在稳定祖先上，用冒泡和 closest 找到行，后加的节点也有效。stopPropagation 停传播，stopImmediatePropagation 连同节点后续监听一起停，preventDefault 只取消默认行为。捕获阶段乱停传播会让子树收不到事件。`,
            [
                {
                    question: '委托为什么能管后加的节点？',
                    direction: '监听在一直存在的祖先上，新节点的事件冒泡时仍会经过它。',
                },
                {
                    question: 'target 和 currentTarget 何时相同？',
                    direction: '监听就绑在实际目标上时相同；委托场景通常不同。',
                },
                {
                    question: 'passive 是干什么的？',
                    direction:
                        '声明不会 preventDefault，滚动可以不等人听完。需要拦住默认滚动时不能用。',
                },
                {
                    question: '为什么委托里不能只看 target.tagName？',
                    direction: '点到的经常是子元素或文本节点，要用 closest 找到业务行。',
                },
                {
                    question: '怎样一次清掉一批监听？',
                    direction: '创建时共用一个 AbortSignal，卸载时 abort。',
                },
            ],
        ),
        pitfalls: [
            '在捕获阶段 stopPropagation，里面的按钮永远收不到点击。',
            '委托时用 target 而不是 closest，点到图标或文字节点就对不上选择器。',
            '给 document 绑大量监听却从不移除，页面切走后仍在触发。',
        ],
    },
    {
        slug: 'same-origin-cors',
        module: 'browser',
        title: '同源策略与 CORS',
        summary: '协议、主机、端口都相同才算同源。跨源读响应要靠服务端明确放行。',
        depth: 'core',
        heat: 5,
        year: 2026,
        tags: ['同源', 'CORS', '安全'],
        overview:
            '同源策略限制不同源之间读 DOM、读 Cookie、读 AJAX 响应。服务端可以用 CORS 头声明「允许哪个源来读」。它防的是浏览器里的页面，不是服务器之间的调用。',
        body: createReviewBody(
            `## 什么算同源

源 = 协议 + 主机 + 端口。\`https://a.example.com\` 默认端口 443，和 \`http://a.example.com\`、\`https://b.example.com\`、\`https://a.example.com:444\` 都不同源。

不同源的页面默认：

- 不能读对方 DOM
- 不能随便读对方 Cookie（Cookie 还有 Domain / Path / SameSite）
- \`fetch\` **可以发出去**，但脚本读不了响应，除非 CORS 放行

\`<img>\`、\`<script>\`、CSS 仍能跨源加载。这是“嵌入/发送”和“用 JS 读内容”的区别。所以验证码图能显示，但你 \`fetch\` 同一地址可能读不到像素数据。

## 浏览器怎么放行

服务端在响应里声明：

- \`Access-Control-Allow-Origin\`：精确 Origin，或 \`*\`
- 带 Cookie / 前端 \`credentials: 'include'\` 时，还必须 \`Access-Control-Allow-Credentials: true\`，且 Origin **不能是 \`*\`**

简单请求（常见 \`GET\`/\`POST\` + 简单头 + 简单 Content-Type）可能不预检，请求已经到服务器；头不对时只是前端读不了。自定义头、\`PUT\`/\`DELETE\`、\`application/json\` 通常先发 **OPTIONS 预检**。预检失败则真正的请求不会发出。

预检还要 \`Allow-Methods\`、\`Allow-Headers\`。只配了 Origin、漏了 \`Content-Type\`，开发者工具里仍是 CORS 红字。

## 它防谁

CORS 是浏览器执行的读响应协议。curl、服务器、爬虫不受限。服务端允许某个 Origin，仍要鉴权：CORS 不是登录。

\`mode: 'no-cors'\` 不是绕过，它得到不可读的不透明响应。开发用同源代理，生产用网关或按白名单回 Origin。`,
            `同源看协议、主机、端口。同源策略挡住的是页面脚本去读别人的 DOM、存储和 AJAX 响应，不是挡住请求离开电脑。CORS 是服务端用响应头做受控放行；非简单请求先 OPTIONS。带凭证时必须回精确 Origin 加 Allow-Credentials，不能用星号。请求到了后端、前端仍报 CORS，通常是浏览器不让读。CORS 不是鉴权，也防不住服务器之间的调用。`,
            [
                {
                    question: '后端日志有请求，前端为什么还报 CORS？',
                    direction: '简单请求可能已经发出；浏览器拦的是脚本读响应，不是拦到达。',
                },
                {
                    question: '什么会预检？',
                    direction:
                        '非简单方法、自定义头，或 Content-Type 不是简单表单那几种，通常先 OPTIONS。',
                },
                {
                    question: '凭证请求为什么不能 Allow-Origin: *？',
                    direction: '浏览器要求服务端点名允许哪个前端，避免带身份的响应泄漏给任意站点。',
                },
                {
                    question: '开发代理为什么能消掉跨源？',
                    direction:
                        '浏览器只看到同一源；代理在服务器侧转发，服务器调用不受同源策略限制。',
                },
                {
                    question: 'CORS 能当 CSRF 防线吗？',
                    direction: '不能单独靠它。表单等简单请求仍可能发出并造成写操作。',
                },
            ],
        ),
        pitfalls: [
            '以为服务端已经处理了请求，前端报 CORS 就只是「后端没干活」。往往是浏览器拦住了读取。',
            '带 Cookie 的跨源请求用 Allow-Origin: *，浏览器会拒绝。',
            '只配了 Origin，漏了预检需要的 Allow-Headers / Allow-Methods。',
        ],
    },
    {
        slug: 'http-cache',
        module: 'browser',
        title: 'HTTP 缓存',
        summary: '新鲜期内直接用本地副本；过期后用 ETag / Last-Modified 做协商。',
        depth: 'core',
        heat: 5,
        year: 2026,
        tags: ['缓存', 'Cache-Control', 'ETag'],
        overview:
            '浏览器按响应头决定能不能复用上次的文件。强缓存命中时连请求都没有（或只有从磁盘/内存取）；协商缓存会发条件请求，304 则正文不用再传。',
        body: createReviewBody(
            `## 先问能不能存、新不新

浏览器拿到响应后：

1. 能不能存？（\`no-store\` 直接不存）
2. 还新鲜吗？（\`max-age\` / \`s-maxage\`，或旧的 \`Expires\`，同时存在时通常听 max-age）
3. 新鲜：内存或磁盘直接用，**不访问源站**
4. 过期：带 \`If-None-Match\` / \`If-Modified-Since\` 问一声。没变回 304，变了回 200 和新正文

\`no-cache\` 不是“别缓存”，是“可以存，每次用之前必须再验证”。\`no-store\` 才是别存。\`immutable\` 表示这份 URL 的内容不会变，适合带哈希的文件。

## 两类资源两套策略

\`app.9f3a2.js\` 这种内容哈希文件：\`Cache-Control: public, max-age=31536000, immutable\`。内容变了文件名就变，旧 URL 可以长缓存。

\`index.html\` 或没有哈希的入口：**不能**一年强缓存。用户会一直拿旧 HTML 去点已经下线的 \`app.oldhash.js\`。入口用很短的 max-age，或只走协商。

发布顺序一般是先上传新哈希文件，再切换 HTML。回滚也必须成套。

## 个性化与 Vary

缓存键至少是 URL + 方法。\`Vary: Accept-Language\` 表示语言不同要存多份。登录后的接口标 \`private\` 或 \`no-store\`，别让共享 CDN 存一份用户 A 的账单给用户 B。

只写 \`Vary: Cookie\` 会产生大量变体，也替代不了 private。\`stale-while-revalidate\` 允许先把旧的给用户、后台再更新，适合能容忍短暂过期的数据。

Service Worker 是另一层可编程缓存，和 HTTP 缓存可能叠在一起，排障时两层都要看。`,
            `HTTP 缓存先判断能不能存、还新不新。max-age 新鲜期内直接用本地副本；过期后用 ETag 或 Last-Modified 协商，没变回 304。带哈希的 JS/CSS 可以长缓存，HTML 入口必须能马上更新。no-store 是不存，no-cache 是存了但每次先验证。带用户身份的响应不能进共享缓存，Vary 用来区分不同表示。`,
            [
                {
                    question: '强缓存命中还打源站吗？',
                    direction: '通常不打。响应来自内存、磁盘或中间缓存。',
                },
                {
                    question: 'ETag 和 Last-Modified 怎么选？',
                    direction:
                        'ETag 按内容版本更准；Last-Modified 简单但受时间精度影响。可以一起发。',
                },
                {
                    question: 'HTML 为什么不能缓存一年？',
                    direction: '旧入口会继续引用已下线的哈希文件，发版后用户更新不了甚至白屏。',
                },
                {
                    question: 'no-cache 和 no-store 差一个词？',
                    direction: '前者允许存放但复用前要验证；后者连存都不许。',
                },
                {
                    question: 'Service Worker 会不会绕过这套头？',
                    direction: '它可以自己决定策略。和 HTTP 缓存是两层，可能同时生效。',
                },
            ],
        ),
        pitfalls: [
            'HTML 也用一年缓存，发版后用户还在跑旧入口。',
            'Vary 漏了 Cookie 或 Authorization，缓存串用户。',
            '把 no-cache 当成不缓存，实际上仍可能存放，只是每次要验证。',
        ],
    },
    {
        slug: 'cookie-storage',
        module: 'browser',
        title: 'Cookie 与 Web Storage',
        summary: 'Cookie 会随请求走；localStorage / sessionStorage 只在页面脚本里读写。',
        depth: 'core',
        heat: 4,
        year: 2026,
        tags: ['Cookie', 'localStorage', 'sessionStorage'],
        overview:
            'Cookie 是浏览器按域自动带给服务器的小段数据。Web Storage（`localStorage` / `sessionStorage`）只存在浏览器里，默认不会跟 HTTP 走。用途不同，不要互换。',
        body: createReviewBody(
            `## Cookie：浏览器自动捎上的小纸条

符合规则的请求会带上它，所以要小，不要塞 token 大包。服务端用 \`Set-Cookie\` 下发，前端 \`document.cookie\` 只能碰到没打 \`HttpOnly\` 的。

关键属性：

- \`Domain\` / \`Path\`：哪些 URL 带它。设太宽会带到无关子路径或子域
- \`Secure\`：只在 HTTPS 发
- \`HttpOnly\`：脚本读不到，XSS 不好直接偷会话值
- \`SameSite=Strict|Lax|None\`：跨站请求带不带。\`None\` 必须配 \`Secure\`

不设 \`Max-Age\` / \`Expires\` 的是会话 Cookie，关浏览器后通常清掉（“继续浏览”可能例外）。

同站 ≠ 同源。\`a.example.com\` 和 \`b.example.com\` 常常同站不同源，SameSite 管的是同站。

## Web Storage：只活在页面里

\`localStorage\`：同源、长期、多标签共享。  
\`sessionStorage\`：按标签页会话隔离。复制标签页时，有的浏览器会把当时的副本一起带过去，不要假设一定是空的。

都是同步字符串 API，主线程 \`JSON.parse\` 几 MB 会卡。XSS 能跑脚本就能读，**不能当登录凭证**。

## 怎么选

| 数据 | 放哪 |
|---|---|
| 会话标识 | \`HttpOnly\` + \`Secure\` + 合适 SameSite 的 Cookie |
| 主题、草稿 | \`localStorage\`，或大数据用 IndexedDB |
| 本标签页向导进度 | \`sessionStorage\` |
| 离线文档、Blob | IndexedDB |

客户端存储都能被用户改。价格、权限、身份以服务端为准。隐私模式和清站点数据会让本地东西消失，重要数据要能从服务器恢复。`,
            `Cookie 由浏览器按 Domain、Path、Secure、SameSite 自动随请求带走，适合服务端会话；会话标识应 HttpOnly、Secure，并设好 SameSite。localStorage 同源长期共享，sessionStorage 按标签页隔离，二者都是同步 API、能被脚本读，不能放可被 XSS 偷走的长期凭证。大量结构化数据用 IndexedDB。任何前端存储都不可信，也不能假设一直还在。`,
            [
                {
                    question: 'HttpOnly 能根治 XSS 吗？',
                    direction: '不能。脚本读不到 Cookie 值，但仍能以用户身份调站内接口。',
                },
                {
                    question: 'SameSite 的站和源是一回事吗？',
                    direction: '不是。同站通常更宽，子域可以同站不同源。',
                },
                {
                    question: 'localStorage 为什么会卡？',
                    direction: '同步读写，序列化大 JSON 占主线程。',
                },
                {
                    question: '复制标签页后 sessionStorage 为什么有数据？',
                    direction: '部分浏览器用当时的会话存储初始化新标签，不是空白一份。',
                },
                {
                    question: 'IndexedDB 会跟请求走吗？',
                    direction: '不会。它只在页面里，适合离线记录和 Blob，不是 Cookie 替代品。',
                },
            ],
        ),
        pitfalls: [
            '把 token 放进 localStorage，XSS 一条就能被偷走。',
            'Cookie 不设 Path/Domain，意外带到一堆无关子路径。',
            '假定 sessionStorage 在「复制标签页」后仍是空的——有的浏览器会复制会话存储。',
        ],
    },
    {
        slug: 'xss-csrf',
        module: 'browser',
        title: 'XSS 与 CSRF',
        summary: 'XSS 是把脚本注入到页面里跑；CSRF 是借用用户已有的登录态发请求。',
        depth: 'core',
        heat: 5,
        year: 2026,
        tags: ['XSS', 'CSRF', '安全'],
        overview:
            'XSS 让攻击者的 JS 跑在你的源下，能读页面、调接口、偷非 HttpOnly 的数据。CSRF 不需要注入脚本：用户已登录时，攻击站点诱使浏览器对目标站发出带 Cookie 的请求。',
        body: createReviewBody(
            `## XSS：别人的脚本跑在你的源里

根因是把不可信字符串当 HTML / JS 执行。\`innerHTML = nickName\`、不转义的模板、有漏洞的 Markdown 都是入口。

- **存储型**：脏评论入库，谁打开谁中
- **反射型**：脏参数出现在 URL，响应里原样映出来
- **DOM 型**：不经服务端，前端把 \`location.hash\` 写进 DOM

防御按输出上下文编码：HTML 文本、属性、URL、JS 字符串规则不同。默认 \`textContent\` 或框架的安全插值。富文本用成熟白名单消毒器，并禁 \`javascript:\` 协议。

\`dangerouslySetInnerHTML\`、Vue \`v-html\` 等于自己关掉转义。框架“自动转义”挡不住这些 API，也挡不住 \`<a href="javascript:..."\`。

CSP、Trusted Types、HttpOnly 是纵深，不是替代编码。HttpOnly 让脚本偷不到 Cookie 值，但脚本已经在你的源里，照样能转账。

## CSRF：借你的登录态发一枪

攻击页不需要注入你的 JS。用户已登录银行站时，攻击页放：

\`\`\`html
<form action="https://bank.example/transfer" method="POST">
  <input name="to" value="attacker" />
</form>
\`\`\`

浏览器按规则带上银行 Cookie，转账就发生了。攻击者甚至不需要读响应。

所以：

- 改状态不要用 GET
- 不要只靠 Cookie：加 CSRF token，或让写操作带自定义头（跨源会预检）
- Cookie 设 SameSite（Lax/Strict），减少跨站携带
- 服务端再查 Origin / Fetch Metadata
- 转账、改密再验一次密码

CORS 挡不住这种简单表单。HTTPS 只保护传输。SameSite 有同站子域和导航例外，不能当唯一防线。若凭证只活在脚本设置的 \`Authorization\` 里、浏览器不会自动带，传统 CSRF 面小很多，但仍要防 XSS 把这张票偷走。`,
            `XSS 是不可信内容以本站脚本身份执行，第一道防线是按输出上下文编码，默认走安全文本插值；富文本要白名单消毒。CSP、Trusted Types、HttpOnly 只能降低爆炸半径。CSRF 是借浏览器自动带的会话凭证发写操作，要用 CSRF token 或非简单请求、校验 Origin，并给 Cookie 合适的 SameSite。HTTPS 和 CORS 都不单独解决这两类问题。改状态不要放在 GET 上。`,
            [
                {
                    question: '框架自动转义了还会 XSS 吗？',
                    direction: '会。innerHTML、URL 协议、第三方组件、绕过转义的 API 仍是洞。',
                },
                {
                    question: 'HttpOnly 为什么只是缓解？',
                    direction: '偷不到 Cookie 字符串，但脚本还能操作页面、用当前身份发请求。',
                },
                {
                    question: '只用 Authorization 头还要防 CSRF 吗？',
                    direction:
                        '浏览器不会自动带时，传统表单 CSRF 难打成；还要防 XSS 和错误的跨源配置。',
                },
                {
                    question: 'SameSite=Lax 够不够？',
                    direction: '不够当唯一防线。同站子域、部分导航和老客户端都有空子。',
                },
                {
                    question: 'CSP nonce 管什么？',
                    direction: '只允许带服务端 nonce 的脚本执行，给漏掉的注入加一道执行门槛。',
                },
            ],
        ),
        pitfalls: [
            '用 innerHTML 拼接昵称、评论、错误信息。',
            '只给 GET 做了 CSRF 防护，状态变更却放在 GET 上。',
            '以为上了 HTTPS 就同时解决了 XSS 和 CSRF。',
        ],
    },
]
