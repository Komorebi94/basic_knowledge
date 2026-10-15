import type { Article } from "../articles";

export const listsRenderingMemoryArticle: Article = {
  "revision": 2,
  id: "K10-04",
  kind: "knowledge",
  domainSlug: "performance",
  slug: "lists-rendering-and-memory",
  title: "列表、渲染与内存",
  summary: "用固定高度订单列表比较全量节点和可视窗口，说明按下标复用会错配草稿，以及可变行高不能沿用固定偏移。",
  aliases: ["virtual list", "windowing", "列表虚拟化", "DOM 节点", "行高"],
  tags: ["性能工程", "列表、渲染与内存"],
  estimatedMinutes: 24,
  verifiedAt: "2026-10-15",
  sections: [
    {
      id: "problem",
      title: "一万条订单都创建了节点，滚动为什么仍可能是错的？",
      paragraphs: [
        "订单列表有 10000 行。一次把每一行都变成 DOM，文档里就有 10000 个元素；只挂载视口附近的几行，节点数会小很多。节点变少并不自动正确：如果草稿存在行的位置上，排序后位置 0 会显示上一行的草稿。如果第 0 行实际高 40、窗口仍按 20 计算，第 1 行的偏移会指到错误的位置。",
        "本篇接续 K10-02。示例用固定行高 20 和视口 60 计算窗口，并在空白页创建元素，只核对节点数量和纯数据错配。不记录帧率，也不把 10000 次 createElement 的耗时写成性能结论。"
      ]
    },
    {
      id: "environment",
      title: "复现环境：空白页创建元素，窗口公式可独立计算",
      paragraphs: [
        "运行 npm run verify:k10。创建节点的示例只把元素放进一个尚未插入文档的容器，避免改动学习站页面。窗口函数不读取真实滚动位置，调用方传入 length、行高、视口、scrollTop 和 overscan。",
        "overscan 用行数表示，上下各预留同样行数。这个选择方便核对边界，不是所有虚拟列表库的配置方式。可变行高、粘性表头和横向表格不在公式的适用范围内。"
      ]
    },
    {
      id: "window",
      title: "窗口只覆盖视口附近，空列表和零视口不制造行",
      paragraphs: [
        "公式先把 scrollTop 夹到 0 和最大滚动值之间。最大滚动值是 length × 行高 − 视口，列表比视口更短时为 0。起点是可见顶行再减去 overscan，终点是底边所在行再加上 overscan，并且不超过 length。空列表或视口为 0 时直接返回 0:0:0。行高不是有限正数、长度或 overscan 不是非负整数时抛出 TypeError。",
        "10000 行、行高 20、视口 60、滚动 0、overscan 1，可见范围覆盖 0 到 60，对应 3 行，再加 1 行预留，终点是 4，输出 0:4:0。滚过末尾时滚动被夹到 199940，起点 9996，终点 10000，偏移 199920。预期还有 empty 为 0:0:0、零视口为 0:0:0、行高 0 为 TypeError。"
      ],
      examples: [
        {
          language: "javascript",
          code: "function range(length, rowHeight, viewport, scrollTop, overscan) {\n  if (!Number.isSafeInteger(length) || length < 0 || !Number.isFinite(rowHeight) || rowHeight <= 0 ||\n      !Number.isFinite(viewport) || viewport < 0 || !Number.isFinite(scrollTop) ||\n      !Number.isSafeInteger(overscan) || overscan < 0) throw new TypeError('无效窗口参数');\n  if (length === 0 || viewport === 0) return { start: 0, end: 0, offset: 0 };\n  const top = Math.min(Math.max(0, scrollTop), Math.max(0, length * rowHeight - viewport));\n  const start = Math.max(0, Math.floor(top / rowHeight) - overscan);\n  const end = Math.min(length, Math.ceil((top + viewport) / rowHeight) + overscan);\n  return { start, end, offset: start * rowHeight };\n}\nfunction show(length, row, viewport, scroll, overscan) {\n  try {\n    const value = range(length, row, viewport, scroll, overscan);\n    return value.start + ':' + value.end + ':' + value.offset;\n  } catch (error) { return error.name; }\n}\nconsole.log('顶部:' + show(10000, 20, 60, 0, 1));\nconsole.log('末尾:' + show(10000, 20, 60, 999999, 1));\nconsole.log('空列表:' + show(0, 20, 60, 0, 1));\nconsole.log('零视口:' + show(10000, 20, 0, 0, 1));\nconsole.log('非法行高:' + show(10, 0, 60, 0, 1));",
          expectedOutput: ["顶部:0:4:0", "末尾:9996:10000:199920", "空列表:0:0:0", "零视口:0:0:0", "非法行高:TypeError"],
          explanation: [
            "顶部视口高 60、行高 20，ceil(60/20) 是 3，再加 overscan 1 得到终点 4。末尾先把过大的 scrollTop 夹到 199940，避免起点超出最后一行。",
            "空列表若仍按滚动公式计算，可能得到负数或 NaN。这里在进入除法前返回空窗口。TypeError 只说明参数不被这个函数接受，调用方仍要决定显示校验错误还是回退到不虚拟化的短列表。"
          ]
        }
      ]
    },
    {
      id: "nodes",
      title: "窗口减少的是节点数量，不是已证明的滚动帧率",
      paragraphs: [
        "下面在空白页用同一窗口函数挂载节点。全量路径创建 10000 个 div；窗口路径只创建终点减起点的 4 个。预期 全量节点:10000、窗口节点:4、窗口范围:0:4:0。容器没有插入文档，所以这个计数不包含样式、布局和绘制。",
        "节点少通常降低后续样式和布局的规模，但是否值得虚拟化，还取决于行是否几乎都在视口内、测量和定位本身是否更贵，以及辅助技术如何发现未挂载的行。短列表为了虚拟化引入定位错误，可能得不偿失。"
      ],
      examples: [
        {
          language: "javascript",
          code: "function range(length, rowHeight, viewport, scrollTop, overscan) {\n  if (length === 0 || viewport === 0) return { start: 0, end: 0, offset: 0 };\n  const top = Math.min(Math.max(0, scrollTop), Math.max(0, length * rowHeight - viewport));\n  const start = Math.max(0, Math.floor(top / rowHeight) - overscan);\n  const end = Math.min(length, Math.ceil((top + viewport) / rowHeight) + overscan);\n  return { start, end, offset: start * rowHeight };\n}\nfunction mount(count) {\n  const root = document.createElement('div');\n  for (let index = 0; index < count; index += 1) root.append(document.createElement('div'));\n  return root.childElementCount;\n}\nconst windowed = range(10000, 20, 60, 0, 1);\nconsole.log('全量节点:' + mount(10000));\nconsole.log('窗口节点:' + mount(windowed.end - windowed.start));\nconsole.log('窗口范围:' + windowed.start + ':' + windowed.end + ':' + windowed.offset);",
          expectedOutput: ["全量节点:10000", "窗口节点:4", "窗口范围:0:4:0"],
          explanation: [
            "两次 mount 的差别只有传入的个数。4 来自上一节同一组参数的终点减起点，不是一个经验上的“快列表”常数。",
            "未插入文档的元素不会产生可见滚动。若把这 4 个节点的创建时间拿去和 10000 个比较，一次运行仍受机器调度影响；本例只断言个数。"
          ]
        }
      ]
    },
    {
      id: "identity",
      title: "草稿跟着下标走，重排后会画到另一张订单上",
      paragraphs: [
        "虚拟列表经常复用少量 DOM 节点。复用节点可以，把业务状态存在节点下标上不行。下面两行从 A、B 重排成 B、A。按下标读取时，位置 0 仍保存着原来 A 的草稿，输出 草稿A,A。按订单 id 读取时，草稿留在 A 上，输出 B,草稿A。",
        "这是数据模型，不是某个框架的 key 实现。真实节点上的输入框、选中态和焦点也要随订单身份移动。只在重绘时改 textContent、却把未提交草稿留在旧节点里，会出现同样的错配。"
      ],
      examples: [
        {
          language: "javascript",
          code: "function render(strategy, rows, state) {\n  if (strategy === 'index') return rows.map((row, index) => state[index] ?? row.value).join(',');\n  return rows.map(row => state[row.id] ?? row.value).join(',');\n}\nconst reordered = [{ id: 'b', value: 'B' }, { id: 'a', value: 'A' }];\nconsole.log('按下标:' + render('index', reordered, { 0: '草稿A' }));\nconsole.log('按身份:' + render('id', reordered, { a: '草稿A' }));",
          expectedOutput: ["按下标:草稿A,A", "按身份:B,草稿A"],
          explanation: [
            "重排后下标 0 是订单 B，但状态表仍把草稿放在键 0，于是 B 的位置显示 A 的草稿，A 的新位置没有状态，退回显示值 A。",
            "按 id 的状态表不随数组顺序变化，B 显示自己的值，A 仍显示草稿。回收 DOM 节点时可以用下标取节点对象，写入内容前必须先按身份取出对应状态。"
          ]
        }
      ]
    },
    {
      id: "retention",
      title: "离开列表后仍被集合引用的行，不会因为看不见而被回收",
      paragraphs: [
        "窗口卸载 DOM 之后，如果缓存、订阅或未完成请求仍引用该行的数据，JavaScript 堆会继续保留它。下面访问一行后离开：keep 为 true 时键还在，改为 false 后再离开则键消失。预期 离开仍保留:true、释放后:false。",
        "删除 Map 键只断掉这个教学缓存的引用。若同一对象还被闭包或全局日志引用，引擎仍然不能回收。虚拟化节省的是挂载节点，不是所有曾经出现过的业务对象。"
      ],
      examples: [
        {
          language: "javascript",
          code: "const cache = new Map();\nfunction visit(id) { cache.set(id, { node: 'row' }); }\nfunction leave(id, keep) { if (!keep) cache.delete(id); }\nvisit(1);\nleave(1, true);\nconsole.log('离开仍保留:' + cache.has(1));\nleave(1, false);\nconsole.log('释放后:' + cache.has(1));",
          expectedOutput: ["离开仍保留:true", "释放后:false"],
          explanation: [
            "第一次离开明确选择保留，Map 继续持有对象。第二次离开删除键，这个示例里不再有引用。",
            "生产代码里的保留可能来自未取消的请求、事件监听或按索引无限增长的缓存。排查时要看卸载后集合的大小是否随访问过的行数持续上涨，而不是只看视口里有几个节点。"
          ]
        }
      ]
    },
    {
      id: "variable",
      title: "第 0 行变高以后，固定行高会把下一行放到错误偏移",
      paragraphs: [
        "固定行高公式要求每一行都是 20。下面第 0 行实际高度 40，第 1 行的真实起点是 40，固定公式却给出 20。预期 固定偏移:20、实际偏移:40、错位:true。",
        "内容换行、图片加载和展开详情都会改变行高。继续使用固定偏移会让滚动条比例、点击位置和窗口切片彼此不一致。可变行高需要测量或已知高度的前缀和，并在高度变化后更新这个前缀；不能只把 rowHeight 改成平均值蒙混过去。"
      ],
      examples: [
        {
          language: "javascript",
          code: "function fixedOffset(index, rowHeight) { return index * rowHeight; }\nconst heights = [40, 20, 20];\nconst actual = heights.slice(0, 1).reduce((sum, value) => sum + value, 0);\nconsole.log('固定偏移:' + fixedOffset(1, 20));\nconsole.log('实际偏移:' + actual);\nconsole.log('错位:' + (fixedOffset(1, 20) !== actual));",
          expectedOutput: ["固定偏移:20", "实际偏移:40", "错位:true"],
          explanation: [
            "固定公式没有读取 heights，所以第 0 行增高不会改变第 1 行的理论位置。真实起点是前一行高度之和。",
            "本例没有实现可变高度窗口。它只否定“测量到高度变化后仍沿用旧行高”的做法。在高度稳定且每一行确实等高时，固定公式仍然适用。"
          ]
        }
      ]
    },
    {
      id: "boundaries",
      title: "窗口是定位合同，键盘、读屏和查找仍要能到达目标行",
      paragraphs: [
        "未挂载的行不在 DOM 里，浏览器不会替它们处理 Tab 和查找。订单列表若支持键盘遍历，窗口需要在焦点移动时把目标行纳入挂载范围，并把焦点放回对应身份的节点，而不是放回同一个下标。",
        "content-visibility 可以跳过屏外内容的部分渲染工作，但不负责按身份回收状态，也不能在行高未知时算出准确滚动偏移。它和窗口化解决的不是同一个问题。",
        "过滤、排序和分页会改变 length 与身份顺序。窗口函数必须用新的长度重新夹取滚动位置；旧的 scrollTop 在更短的列表里可能已经越过末尾。服务端仍要分页或限制一次返回的数据，浏览器窗口不能代替接口的数据量边界。"
      ]
    },
    {
      id: "practice",
      title: "用三组输入检查窗口，而不是只看滚动起来流畅",
      paragraphs: [
        "对固定行高列表核对空列表、滚动 0 和滚过末尾。再交换两行身份，确认草稿、选中和焦点没有留在下标上。最后把一行加高，确认偏移不再使用旧的固定行高，或者明确拒绝可变行高。",
        "E30 已提供可运行练习；具体入口见文末关联。DOM、焦点和框架主题的当前练习以 JavaScript 行为模型为范围，真实平台行为请按本文实验复核；通过模型不代表完成设备或框架集成验收。"
      ]
    }
  ],
  sources: [
    { title: "web.dev：content-visibility", url: "https://web.dev/articles/content-visibility" },
    { title: "MDN：Document.createElement()", url: "https://developer.mozilla.org/en-US/docs/Web/API/Document/createElement" }
  ]
};
