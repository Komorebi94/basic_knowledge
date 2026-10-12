import type { Article } from "../articles";

export const sameOriginCorsArticle: Article = {
  "id": "K06-05",
  "kind": "knowledge",
  "domainSlug": "networking",
  "slug": "same-origin-cors",
  "title": "同源策略与 CORS",
  "summary": "区分预检、凭据和响应头暴露，说明 CORS 只决定浏览器脚本能否读取响应，不代替服务端权限。",
  "aliases": ["CORS", "preflight", "Same-Origin Policy", "Access-Control-Allow-Origin", "同源策略"],
  "tags": ["网络", "浏览器", "同源策略与 CORS"],
  "estimatedMinutes": 23,
  "verifiedAt": "2026-10-12",
  "sections": [
    {
      "id": "problem",
      "title": "curl 能看到 JSON，页面里的 fetch 为什么读不到？",
      "paragraphs": [
        "接口在另一台主机上返回 200 和订单 JSON。命令行客户端能打印正文，页面脚本却在读取响应时失败。请求其实已经到达服务器，同源策略限制的是浏览器把跨源响应交给脚本的方式。CORS 头是服务器对浏览器的放行说明，不是一道只在浏览器里存在的防火墙。",
        "前置是 K06-02 的响应分层。本文用 URL 源、预检条件和放行判断三组纯函数复现规范里的决策点。它们覆盖方法、Content-Type、额外请求头、Allow-Origin 与凭据的组合，不模拟浏览器的网络栈。"
      ]
    },
    {
      "id": "origin",
      "title": "同源看方案、主机和端口，路径不参与",
      "paragraphs": [
        "https://app.example:443/orders 和 https://app.example/account 同源。改成 http、改端口或改主机名就不同源。子域也是不同源。页面脚本读取跨源响应之前，浏览器要看到允许该源的 CORS 头。",
        "同源策略还限制 Cookie、存储和 DOM 的互相访问。一个接口“不发送 CORS 头”不会阻止浏览器发出简单请求，只是脚本不能读取该响应。不要用 CORS 隐藏一个仍然会被请求打到的管理接口；权限必须在服务端按身份和操作判断。"
      ],
      "examples": [
        {
          "language": "javascript",
          "code": "const page = new URL('https://app.example/orders');\nconst same = new URL('https://app.example:443/account');\nconst api = new URL('https://api.example/orders');\nconst insecure = new URL('http://app.example/orders');\nconsole.log([page.origin === same.origin, page.origin === api.origin, page.origin === insecure.origin].join(','));",
          "expectedOutput": ["true,false,false"],
          "explanation": [
            "默认 443 与 https 页面同源。api 主机和 http 方案都是另一个源。",
            "origin 字符串不包含路径。同一源下的 /orders 与 /account 仍要靠服务端路由和登录态区分权限。"
          ]
        }
      ]
    },
    {
      "id": "preflight",
      "title": "非简单方法、JSON 正文和自定义头会先发预检",
      "paragraphs": [
        "GET、HEAD 和 POST，再配上一组安全名单里的头，并且 Content-Type 只是表单或 text/plain 时，浏览器可以不先问询就发送请求。application/json、PUT、DELETE 以及 Authorization 这类名单外的头，会先发送 OPTIONS 预检。预检问的是“这个源能否用这种方法、这些头调用”，通过后才发送真正的请求。",
        "预检失败时，业务请求不会发出，服务端日志里可能只有 OPTIONS。排查要同时看 Allow-Methods、Allow-Headers 和允许的源。预检缓存可以减少重复 OPTIONS，但缓存不能让一次错误的允许头一直被当成授权。"
      ],
      "examples": [
        {
          "language": "javascript",
          "code": "function needsPreflight(method, contentType, headerNames) {\n  const methodOk = ['GET', 'HEAD', 'POST'].includes(method);\n  const typeOk = contentType === '' || ['application/x-www-form-urlencoded', 'multipart/form-data', 'text/plain'].includes(contentType);\n  const safelisted = new Set(['accept', 'accept-language', 'content-language', 'content-type']);\n  const extra = headerNames.some(name => !safelisted.has(name.toLowerCase()));\n  return String(!(methodOk && typeOk && !extra));\n}\nconsole.log(needsPreflight('GET', '', ['accept']));\nconsole.log(needsPreflight('POST', 'application/json', ['content-type']));\nconsole.log(needsPreflight('POST', 'text/plain', ['authorization']));\nconsole.log(needsPreflight('PUT', 'text/plain', ['content-type']));",
          "expectedOutput": ["false", "true", "true", "true"],
          "explanation": [
            "GET 加 accept 不需要预检。JSON 的 Content-Type、Authorization 头和 PUT 方法各自都会需要预检。",
            "函数按 Fetch 的安全名单判断方法、类型和头名称。它没有覆盖所有带额外参数的头，也没有发送 OPTIONS。"
          ]
        }
      ]
    },
    {
      "id": "expose",
      "title": "星号不能和凭据一起放行，自定义响应头默认不可见",
      "paragraphs": [
        "Access-Control-Allow-Origin 为 * 时，不带凭据的脚本可以读取响应。带凭据时，* 不能使用，必须回写具体源，并加上 Allow-Credentials。把凭据和星号同时配上，浏览器会阻止脚本读取。允许的源还要和请求的 Origin 一致，反射任意 Origin 等于放弃源限制。",
        "脚本默认可读的响应头包括 Cache-Control、Content-Language、Content-Length、Content-Type、Expires、Last-Modified 和 Pragma。请求 id、分页总量等自定义头要列在 Access-Control-Expose-Headers 里，否则响应正文可见，该头仍不可见。暴露头不等于允许调用方做某项业务操作。"
      ],
      "examples": [
        {
          "language": "javascript",
          "code": "function readDecision(acao, credentials, origin) {\n  if (credentials && acao === '*') return 'blocked';\n  if (acao === '*' || acao === origin) return 'readable';\n  return 'blocked';\n}\nfunction headerVisible(name, exposed) {\n  const simple = ['cache-control', 'content-language', 'content-length', 'content-type', 'expires', 'last-modified', 'pragma'];\n  if (simple.includes(name.toLowerCase())) return 'visible';\n  return exposed.map(item => item.toLowerCase()).includes(name.toLowerCase()) ? 'visible' : 'hidden';\n}\nconsole.log([readDecision('*', false, 'https://app.example'), readDecision('*', true, 'https://app.example'), readDecision('https://app.example', true, 'https://app.example')].join(','));\nconsole.log([headerVisible('content-type', []), headerVisible('x-request-id', []), headerVisible('x-request-id', ['X-Request-Id'])].join(','));",
          "expectedOutput": ["readable,blocked,readable", "visible,hidden,visible"],
          "explanation": [
            "星号可以放行不带凭据的读取，和凭据一起则阻止。回写具体源并允许凭据时，脚本可以读取。Content-Type 默认可见；X-Request-Id 只有出现在暴露名单中才可见。",
            "判断是浏览器是否把结果交给脚本。被阻止的响应对应的服务器处理可能已经发生，所以写接口和删除接口不能靠 CORS 失败来回滚。"
          ]
        }
      ]
    },
    {
      "id": "mistakes",
      "title": "用 CORS 星号代替身份验证",
      "paragraphs": [
        "错误配置是 Allow-Origin 反射请求里的任意 Origin，再允许凭据。任何网站上的脚本都能带着用户 Cookie 读取响应。应列出可信源，并在服务端继续检查会话和操作权限。",
        "另一个错误是只在 GET 上配置 CORS，页面改成 JSON POST 后预检失败，于是关掉所有预检。预检是浏览器在问允许的方法和头。应返回准确的允许列表，而不是把接口改回表单编码来躲避检查。"
      ]
    },
    {
      "id": "boundaries",
      "title": "CORS 不约束非浏览器客户端",
      "paragraphs": [
        "第一条边界是调用方。curl、服务端任务和原生应用不执行这套浏览器检查。任何只靠 CORS 保护的数据，对非浏览器客户端都是公开的。",
        "第二条边界是私有网络和重定向。浏览器对从公网页面访问私有地址、以及跨源重定向，还有额外限制。本文的三组判断没有覆盖这些策略，遇到内网设备或登录重定向时要对照当前浏览器的网络日志。"
      ]
    },
    {
      "id": "practice",
      "title": "判断这次调用会不会预检、脚本能不能读",
      "paragraphs": [
        "预测 POST application/json 是否预检，以及 Allow-Origin 为星号且携带 Cookie 时脚本能否读取。再预测没有暴露名单时，X-Request-Id 是否可见。",
        "把一次失败分成“请求未发出”“服务器已处理但脚本被阻止”“脚本可读但业务状态不是 2xx”。E36、E37 尚未制作，现有 E11 至 E13 不验证 CORS 头。"
      ]
    }
  ],
  "sources": [
    { "title": "Fetch：CORS 协议", "url": "https://fetch.spec.whatwg.org/#http-cors-protocol" },
    { "title": "HTML：源", "url": "https://html.spec.whatwg.org/multipage/browsers.html#origin" }
  ]
};
