import type { Article } from "../articles";

export const apiContractsEvolutionArticle: Article = {
  "id": "K06-08",
  "kind": "knowledge",
  "domainSlug": "networking",
  "slug": "api-contracts-evolution",
  "title": "接口契约与演进",
  "summary": "用未知字段、可空值和游标分页区分兼容变更，并把时间写成带时区的字符串而不是本地格式。",
  "aliases": ["API evolution", "pagination", "nullable", "RFC 3339", "兼容变更", "契约"],
  "tags": ["网络", "接口", "接口契约与演进"],
  "estimatedMinutes": 22,
  "verifiedAt": "2026-10-12",
  "sections": [
    {
      "id": "problem",
      "title": "只加了一个字段，为什么旧客户端开始失败？",
      "paragraphs": [
        "服务端给订单多返回了 warehouse 字段，旧页面把未知字段当成契约破坏并拒绝渲染。另一处接口把昵称从缺省改成 null，客户端用默认值覆盖了用户刚刚清空的昵称。兼容演进要事先写明：未知字段是否忽略、缺省和 null 是否同义、列表如何继续、时间用哪种字符串。",
        "前置是 K06-02 的业务错误与传输错误。本文的读取器是契约的可执行例子，用固定对象演示，不请求真实服务。它拒绝类型被改掉的必填字段，同时保留未知字段。"
      ]
    },
    {
      "id": "compatible",
      "title": "加可选信息通常兼容，改必填字段的类型不兼容",
      "paragraphs": [
        "旧客户端要能读取新响应：它认识的 id 和 name 仍是字符串，多出来的字段被忽略。nickname 可以缺省，也可以是字符串；如果契约写明 null 表示用户清空，读取器必须把 null 和缺省分成两个结果。id 缺失或 name 变成数字，则是破坏性变更，应拒绝并要求明确的版本或迁移，而不是尽力猜测。",
        "删除字段、改变枚举含义、把单一对象改成数组，都是不兼容变更。可以先增加新字段，让新旧客户端同时工作，再在观察到旧版本消失后删除旧字段。版本号不能只写在文档标题里；破坏性响应至少要能被客户端识别成“需要升级”，而不是半渲染。"
      ],
      "examples": [
        {
          "language": "javascript",
          "code": "function readOrder(body) {\n  if (typeof body.id !== 'string' || typeof body.name !== 'string') return 'reject';\n  if (!Object.hasOwn(body, 'nickname')) return 'ok:' + body.name + ':absent';\n  if (body.nickname === null) return 'ok:' + body.name + ':cleared';\n  if (typeof body.nickname !== 'string') return 'reject';\n  return 'ok:' + body.name + ':set';\n}\nconsole.log(readOrder({ id: 'a', name: '林', warehouse: 'east' }));\nconsole.log(readOrder({ id: 'a', name: '林', nickname: null }));\nconsole.log(readOrder({ id: 'a' }));",
          "expectedOutput": ["ok:林:absent", "ok:林:cleared", "reject"],
          "explanation": [
            "多出的 warehouse 被忽略，昵称缺省。显式 null 表示清空，与缺省不同。没有 name 字符串时拒绝。",
            "读取器不删除未知字段，便于日志保留服务端新信息。拒绝结果应该变成用户可理解的升级或错误状态，而不是抛出未处理异常后留在旧界面。"
          ]
        }
      ]
    },
    {
      "id": "page",
      "title": "游标是不透明位置，偏移会在插入时漏项或重复",
      "paragraphs": [
        "用页码和固定偏移读取活列表时，读取两页之间新插入的订单会把下一项往后推，造成漏看或重复。游标分页把上一页最后一项的稳定位置交给服务端，下一页从它之后开始。客户端不要解析游标里的时间戳或私钥，把它当成不透明字符串保存和回传。",
        "下面的例子用 id 本身当游标，只为了让结果可读。第一页取 a、b，并把 b 当作下一页游标。从 b 之后取到 c、d，没有更多项时游标为空。真实游标应能在删除 b 之后仍找到稳定位置，单靠“当前行 id”并不总是足够，所以服务端要定义失效游标的错误，客户端再重新从第一页或从最近的权威位置拉取。"
      ],
      "examples": [
        {
          "language": "javascript",
          "code": "function page(items, cursor, limit) {\n  const start = cursor === '' ? 0 : items.findIndex(item => item.id === cursor) + 1;\n  const slice = items.slice(start, start + limit);\n  const next = start + slice.length < items.length ? slice[slice.length - 1].id : '';\n  return slice.map(item => item.id).join(',') + '|' + next;\n}\nconst items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }];\nconsole.log(page(items, '', 2));\nconsole.log(page(items, 'b', 2));",
          "expectedOutput": ["a,b|b", "c,d|"],
          "explanation": [
            "空游标返回前两项，并把最后一项 b 当作下一游标。从 b 之后返回 c 和 d，没有下一游标。",
            "findIndex 找不到游标时会得到 -1，加一后从 0 重新开始。真实接口应把未知游标返回明确错误，而不是静默回到第一页；这个例子只展示找到游标时的前进方式。"
          ]
        }
      ]
    },
    {
      "id": "time",
      "title": "时间使用带偏移的字符串，不传递本地化文本",
      "paragraphs": [
        "接口里的时间使用 RFC 3339 这样的字符串，例如 2026-10-12T08:00:00.000Z。客户端再用用户的时区和日历格式去显示。把“10月12日上午8点”写进 JSON，其他语言和时区都无法稳定解析。日期与日期时间也要区分：只有日期时，不要假装它携带某一分钟。",
        "数值时间戳要写明单位是秒还是毫秒，并在契约里固定。下面用 Date 解析一条 UTC 字符串，再格式化回 ISO。这证明这条字符串能往返，不证明任意地区格式也能往返。"
      ],
      "examples": [
        {
          "language": "javascript",
          "code": "const instant = new Date('2026-10-12T08:00:00.000Z');\nconsole.log(instant.toISOString());\nconsole.log(String(Number.isNaN(new Date('10月12日').getTime())));\nfunction kind(value) {\n  if (typeof value !== 'string') return 'reject';\n  if (/^\\d{4}-\\d{2}-\\d{2}$/.test(value)) return 'date';\n  if (/^\\d{4}-\\d{2}-\\d{2}T/.test(value)) return 'instant';\n  return 'reject';\n}\nconsole.log([kind('2026-10-12'), kind('2026-10-12T08:00:00.000Z'), kind('明天')].join(','));",
          "expectedOutput": ["2026-10-12T08:00:00.000Z", "true", "date,instant,reject"],
          "explanation": [
            "UTC 字符串可以格式化回同一条 ISO 时间。中文日期文本解析为无效时间，所以 isNaN 为 true。第三条把只有日期的字符串、日期时间字符串和自然语言分开。",
            "正则只做契约示例里的形状分类，不是完整的 RFC 3339 校验器。闰秒、偏移量和非法日期仍要使用专门的解析器或服务端校验。"
          ]
        }
      ]
    },
    {
      "id": "mistakes",
      "title": "用页面语言格式充当接口编码",
      "paragraphs": [
        "错误演进是为了某个页面直接把可空字段改成另一种类型，并要求所有客户端同一天发布。应先增加新字段或新的媒体类型，旧字段保持原义到观察期结束。无法同时部署时，错误响应要标明契约版本，让旧客户端显示可恢复的升级提示。",
        "另一个错误是下一页继续用递增 offset。列表顶部插入一项后，用户会重复看到边界上的订单或漏掉一项。活列表使用不透明游标；可以接受重复的静态导出才使用偏移，并在契约里写明这个限制。"
      ]
    },
    {
      "id": "boundaries",
      "title": "读取器不验证权限和幂等",
      "paragraphs": [
        "第一条边界是授权。字段形状正确，不表示这个用户可以看 warehouse。兼容解析之后仍要走服务端的对象级权限。",
        "第二条边界是写入契约。本文读的是响应。创建和更新还要规定未知字段是拒绝还是忽略、空字符串和 null 是否都能清空，以及重复提交是否幂等。这些规则不能从响应读取器反推。"
      ]
    },
    {
      "id": "practice",
      "title": "给三个响应预测读取结果",
      "paragraphs": [
        "预测多一个未知字段、nickname 为 null、以及缺少 name 时，readOrder 各返回什么。再预测四项列表按 2 分页时两页的日志。最后说明为什么“明天”不能作为接口时间。",
        "E36、E37 仍是待制作的接口练习。在它们出现之前，用固定对象核对契约，不把未发布题目显示为可练。"
      ]
    }
  ],
  "sources": [
    { "title": "HTTP 语义：RFC 9110", "url": "https://www.rfc-editor.org/rfc/rfc9110" },
    { "title": "日期与时间：RFC 3339", "url": "https://www.rfc-editor.org/rfc/rfc3339" }
  ]
};
