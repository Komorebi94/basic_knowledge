import type { Article } from "../articles";

export const navigationRecoveryArticle: Article = {
  "id": "K04-06",
  "kind": "knowledge",
  "domainSlug": "browser",
  "slug": "navigation-history-recovery",
  "title": "导航、历史与恢复",
  "summary": "从列表返回位置丢失出发，区分 URL、History 状态和页面快照，建立可校验的路由、滚动恢复与未保存保护。",
  "aliases": [
    "History API",
    "pushState",
    "popstate",
    "bfcache",
    "pageshow",
    "scroll restoration",
    "导航恢复"
  ],
  "tags": [
    "浏览器",
    "Web 平台",
    "导航、历史与恢复"
  ],
  "estimatedMinutes": 25,
  "verifiedAt": "2026-10-12",
  "sections": [
    {
      "id": "problem",
      "title": "从详情返回列表，为什么筛选和滚动都重置了？",
      "paragraphs": [
        "用户筛选订单并滚到中间，打开详情后按后退，看到的是初始列表。另一种情况更隐蔽：返回时浏览器直接恢复页面快照，但应用又执行一次初始化，把已经恢复的输入清掉。两种现象看似都叫“后退”，其实可能走了不同生命周期。",
        "前置是 K02-05 的过期结果与 K04-04 的保存边界。先区分三个载体：URL 承担可分享和刷新重建的状态，history.state 承担当前历史条目的辅助状态，持久化草稿承担当页面真的销毁后仍需要恢复的数据。本文示例运行在独立 HTTP 页面，结束后恢复当前条目；不在学习站控制台执行，以免修改阅读历史。"
      ]
    },
    {
      "id": "url",
      "title": "URL 是输入边界，不是可信路由对象",
      "paragraphs": [
        "筛选条件若希望分享或刷新恢复，应进入 URL，并由解析器收窄为已知参数。URLSearchParams 处理编码，不校验业务值。页码需要检查整数、范围和默认值；重复参数采用明确策略；未知值不能直接变成数据库查询或菜单权限。",
        "下面把 page 定义为 1—100 的正整数，把 tab 定义为 all/open。错误的数值和超范围输入回到默认值，使用 get 意味着重复参数取第一个；如果业务要求禁止重复，应另用 getAll 校验。输出能推导出入口解析如何决定界面。"
      ],
      "examples": [
        {
          "language": "module",
          "code": "function parseRoute(url) {\n  const query = new URL(url).searchParams;\n  const raw = query.get('page') ?? '1';\n  const value = /^\\d+$/.test(raw) ? Number(raw) : NaN;\n  const page = Number.isSafeInteger(value) && value >= 1 && value <= 100 ? value : 1;\n  const tab = query.get('tab') === 'open' ? 'open' : 'all';\n  return { page, tab };\n}\nconsole.log(JSON.stringify(parseRoute('https://example.test/list?page=3&tab=open')));\nconsole.log(JSON.stringify(parseRoute('https://example.test/list?page=-2&tab=admin')));\nconsole.log(JSON.stringify(parseRoute('https://example.test/list?page=1e3')));",
          "expectedOutput": [
            "{\"page\":3,\"tab\":\"open\"}",
            "{\"page\":1,\"tab\":\"all\"}",
            "{\"page\":1,\"tab\":\"all\"}"
          ],
          "explanation": [
            "3 与 open 都通过边界校验。-2 不符合十进制正整数合同，admin 不在标签集合中；1e3 虽可被 Number 转换，却不符合 URL 的页码格式，都回到 1/all。",
            "example.test 只是离线解析用的 URL，没有发起网络请求。解析得到 all/open 也不赋予访问权限；服务端仍必须检查请求者身份与资源授权。"
          ]
        }
      ]
    },
    {
      "id": "history",
      "title": "改变条目不等于发起文档导航",
      "paragraphs": [
        "pushState 添加历史条目，replaceState 修改当前条目，两者可更新同源 URL 与可结构化克隆的 state，不会像 location 导航那样加载新文档，也不会自动发出 popstate。用户在条目间后退或前进时，popstate 才成为同文档路由恢复的重要输入。应用自己的 pushState 后仍要显式渲染或交给路由库处理。",
        "下面仅使用 replaceState，不额外污染历史栈。原生 API 会复制 state；之后改变原对象不会偷偷改掉历史条目。函数不可结构化克隆，写入失败必须处理，不把事件函数或完整组件实例放进 history.state。"
      ],
      "examples": [
        {
          "language": "module",
          "code": "const previousState = history.state;\nconst previousUrl = location.href;\nlet count = 0;\nconst onPop = () => { count += 1; };\nwindow.addEventListener('popstate', onPop);\ntry {\n  const state = { version: 1, row: 'row-7' };\n  history.replaceState(state, '', '?lesson=k04');\n  state.row = 'changed';\n  console.log(history.state.row, count);\n  try { history.replaceState({ callback() {} }, '', location.href); }\n  catch (error) { console.log(error.name); }\n} finally {\n  history.replaceState(previousState, '', previousUrl);\n  window.removeEventListener('popstate', onPop);\n}",
          "expectedOutput": [
            "row-7 0",
            "DataCloneError"
          ],
          "explanation": [
            "历史条目得到 state 的克隆，所以输出 row-7。replaceState 没有派发 popstate，计数为 0；函数不能结构化克隆，第二次写入抛 DataCloneError，原条目没有被这个失败请求替换。",
            "URL 必须满足当前文档的安全约束，不能用此 API 把页面改成任意跨源地址。state 应小且有版本，浏览器还可能对频繁调用或保存大小施加限制，不把它当无限草稿库。"
          ]
        }
      ]
    },
    {
      "id": "scroll",
      "title": "滚动恢复先选择所有者，再等待布局条件",
      "paragraphs": [
        "history.scrollRestoration=auto 允许浏览器恢复相应滚动位置；选择 manual 则应用承担恢复责任。不能浏览器先恢复一遍、路由库再清零、组件又写一次 scrollTo。先指定唯一所有者，再区分新导航、历史返回和章节锚点；显式章节链接通常应优先于旧阅读位置。",
        "恢复前需要内容布局已足够稳定。若列表还没有加载，直接 scrollTo(0, 1800) 可能被短页面夹到顶部。等待所需数据和容器出现，必要时以稳定条目 ID 与偏移定位，再考虑字体和图片造成的后续变化。下面是恢复目标的纯函数，只处理决策，不假装跑了一次真实历史返回。"
      ],
      "examples": [
        {
          "language": "module",
          "code": "function recoveryTarget({ hash, savedY, navigation }) {\n  if (hash) return { kind: 'anchor', id: hash.slice(1) };\n  if (navigation === 'back' && Number.isFinite(savedY) && savedY >= 0) {\n    return { kind: 'position', y: savedY };\n  }\n  return { kind: 'position', y: 0 };\n}\nconsole.log(JSON.stringify(recoveryTarget({ hash: '#cache', savedY: 900, navigation: 'back' })));\nconsole.log(JSON.stringify(recoveryTarget({ hash: '', savedY: 900, navigation: 'back' })));\nconsole.log(JSON.stringify(recoveryTarget({ hash: '', savedY: -10, navigation: 'back' })));",
          "expectedOutput": [
            "{\"kind\":\"anchor\",\"id\":\"cache\"}",
            "{\"kind\":\"position\",\"y\":900}",
            "{\"kind\":\"position\",\"y\":0}"
          ],
          "explanation": [
            "优先分支使章节锚点胜过旧的 900；没有锚点且确属返回才用合法保存位置；负数不是可恢复证据，回到顶部。",
            "hash 在真正查询 DOM 前还需要安全解码并检查节点存在；不存在时给出恢复入口。此例只验证决策顺序，真实滚动必须在内容加载后用浏览器核对。"
          ]
        }
      ]
    },
    {
      "id": "bfcache",
      "title": "页面快照恢复不是一次全新的启动",
      "paragraphs": [
        "bfcache 保存可恢复的页面状态，包括文档和部分执行状态，使后退或前进能较快恢复。它不是 HTTP 响应缓存，更不是 Service Worker Cache Storage。是否使用快照由浏览器和页面条件决定，不能仅因为打开过页面就保证命中。",
        "pageshow 在页面展示时发生，event.persisted 可以识别从相应快照恢复的情况。pagehide 的 persisted=true 表示页面可能被保留，不承诺以后一定恢复。快照期间计时器和异步工作可能暂停；返回时应检查数据有效期、权限和在途操作身份，不按冻结前的“5 秒后刷新”推断现实已经过去的时间。",
        "错误实现是在每次 pageshow 都清空表单并重新拉取，然后用迟到响应覆盖恢复的输入。修复是将首次初始化和恢复检查区分：保留用户输入，只有过期且允许替换的数据才刷新，请求仍使用当前身份校验。还要覆盖不命中快照、完整重载的路径，不能让功能正确性依赖缓存命中。"
      ]
    },
    {
      "id": "unsaved",
      "title": "离开保护是最后一道提示，自动保存才是主路径",
      "paragraphs": [
        "站内导航可以使用路由库的阻止机制，先尝试提交草稿；提交失败则保留页面与文字，让用户复制或明确放弃。不要直接用 pushState 伪造多余历史条目“锁住后退”，它会破坏浏览器导航预期，也无法可靠阻止关窗口。",
        "硬刷新或关闭时，beforeunload 只在当前确有未保存修改时注册，保存完成后移除。浏览器是否展示提示受用户激活与环境限制，提示文字也由浏览器决定；移动端进程被系统终止时可能没有机会触发。不能在这个事件里等一次网络请求来保证保存。",
        "visibilitychange 到 hidden 是触发尽早保存的机会，pagehide 可补充生命周期处理，但都不能成为必达信号。草稿应在编辑期间定期且可靠地保存，失败保持 dirty 状态；连接、观察器和后台任务的清理要能在返回后重新建立，并避免双重订阅。"
      ]
    },
    {
      "id": "diagnosis",
      "title": "按三条路径验收恢复，而不是只按一次后退",
      "paragraphs": [
        "为同一列表保留三组实验：站内列表→详情→后退；直接刷新带筛选参数的列表；离开文档后返回并记录 pageshow.persisted。每组都核对筛选、输入、焦点、滚动与旧请求。快照是否命中作为观察结果记录，不为了让测试通过就假造 persisted=true。",
        "第一条边界是权限和服务端状态变化：历史条目保存了路径，不保证返回时仍能访问资源。第二条边界是布局变化：固定像素位置可能落在不同条目，虚拟列表更适合稳定条目与偏移。URL 不适合放敏感正文、token 或大对象，因为历史、日志和分享可能暴露它们。",
        "取舍上，小型站点可采用浏览器默认滚动恢复；复杂路由再统一接管，并遵守既有路由库合同。本文不新增路由系统，也不实现离开保护功能。自行给 URL 解析实验增加重复 page 参数，选择拒绝或取首值策略，并写出对应预期。"
      ]
    }
  ],
  "sources": [
    {
      "title": "HTML Standard：History API",
      "url": "https://html.spec.whatwg.org/multipage/nav-history-apis.html"
    },
    {
      "title": "MDN：pageshow 与页面恢复",
      "url": "https://developer.mozilla.org/en-US/docs/Web/API/Window/pageshow_event"
    },
    {
      "title": "MDN：beforeunload 的限制",
      "url": "https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeunload_event"
    }
  ]
};
