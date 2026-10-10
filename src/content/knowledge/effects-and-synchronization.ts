import type { Article } from "../articles";

export const effectsAndSynchronizationArticle: Article = {
  "id": "K07-02",
  "kind": "knowledge",
  "domainSlug": "react",
  "slug": "effects-and-synchronization",
  "title": "Effect 与外部系统同步",
  "summary": "哪些逻辑不需要 Effect；依赖和清理怎么验证。通过独立样例推导机制，并检查失败路径、工程取舍和适用边界。",
  "aliases": [
    "effects-and-synchronization",
    "Effect 与外部系统同步"
  ],
  "tags": [
    "react"
  ],
  "estimatedMinutes": 22,
  "verifiedAt": "2026-10-08",
  "sections": [
    {
      "id": "problem",
      "title": "切换房间后，为什么旧房间还收到消息？",
      "paragraphs": [
        "聊天组件根据 roomId 订阅消息，切换房间后又建立新连接，却没有释放旧连接。结果是两个房间都推送，甚至卸载后仍有回调。Effect 的用途是让已提交界面与外部系统同步；每次同步都应具有对应的停止责任。",
        "可执行例子是 EventTarget 与订阅生命周期模型，独立浏览器或现代 Node 可运行。完整 React 片段另列，不把手写模型的执行时机当作框架保证。需要了解函数身份与闭包，再推导依赖、清理和过期结果。"
      ],
      "examples": [
        {
          "code": "const bus = new EventTarget();\nfunction subscribe(room) {\n  const handler = () => console.log(room);\n  bus.addEventListener('message', handler);\n  return () => bus.removeEventListener('message', handler);\n}\nlet cleanup = subscribe('A');\nbus.dispatchEvent(new Event('message'));\ncleanup(); cleanup = subscribe('B');\nbus.dispatchEvent(new Event('message'));\ncleanup();\nbus.dispatchEvent(new Event('message'));",
          "expectedOutput": [
            "A",
            "B"
          ],
          "explanation": [
            "A 的清理用原函数身份解除监听，随后只有 B。最后清理后没有输出。只创建新监听而不停止旧监听，会得到重复外部资源。"
          ],
          "language": "javascript"
        }
      ]
    },
    {
      "id": "mechanism",
      "title": "每个 Effect 有独立的同步过程",
      "paragraphs": [
        "Effect setup 在适用的提交后开始同步；依赖变化时先停止上一次，再建立本次；卸载停止最后一次。依赖说明 setup 使用了哪些响应式值，React 依据 Object.is 比较对应项。依赖不是“希望触发几次”的旋钮，而是代码读取关系的声明。",
        "setup 中读取 roomId 却省略依赖，会让旧闭包继续连接旧房间。修复应列出实际依赖或调整代码结构，而不是禁用 lint。开发 Strict Mode 的额外 setup/cleanup 检查帮助暴露不对称资源；不能通过一个运行过 ref 阻止重建来掩盖清理问题。"
      ]
    },
    {
      "id": "derived",
      "title": "派生值和用户事件通常无需 Effect",
      "paragraphs": [
        "搜索过滤由 items 与 query 决定，可在渲染中计算；提交订单源自明确点击，在事件处理器执行。若把这些工作放进 Effect，可能多一次渲染或在重挂载时重复动作。",
        "Effect 适合连接、监听、定时器、第三方组件等外部系统。把互不相关的外部过程拆成不同 Effect，可以避免一个依赖变化导致所有资源一起重建。拆分依据是同步责任，而不是每行代码必须一个 Effect。"
      ],
      "examples": [
        {
          "code": "const items = [{ title: 'React' }, { title: 'Vue' }, { title: 'React 状态' }];\nfunction visible(query) { return items.filter(item => item.title.includes(query)); }\nconsole.log(visible('React').length);\nconsole.log(visible('不存在').length);",
          "expectedOutput": [
            "2",
            "0"
          ],
          "explanation": [
            "结果由当前输入直接派生，没有第二份 filtered 状态，也无需先显示旧列表再通过副作用更新。零条结果是正常成功状态。"
          ],
          "language": "javascript"
        }
      ]
    },
    {
      "id": "react-code",
      "title": "完整组件：监听与清理形成一对",
      "paragraphs": [
        "此片段用于 React 项目。组件接收稳定的 EventTarget 和 roomId，roomId 改变时停止旧监听再建立新监听。回调把消息数通过函数式更新累加。测试应在切换与卸载后分别发送事件，确认旧监听停止。"
      ],
      "examples": [
        {
          "code": "let generation = 0;\nlet result = '';\nfunction start() { const token = ++generation; return value => { if (token === generation) result = value; }; }\nconst finishOld = start();\nconst finishNew = start();\nfinishOld('旧'); console.log(result === '');\nfinishNew('新'); console.log(result);",
          "expectedOutput": [
            "true",
            "新"
          ],
          "explanation": [
            "开始新同步使旧 token 过期。旧结果不能写入，新结果可以。真实请求通常还应 AbortController 节约资源；身份或 active 检查负责保护状态，两者并非互相替代。"
          ],
          "language": "javascript"
        }
      ],
      "code": "import { createElement, useEffect, useState } from 'react';\nexport function RoomCounter({ bus, roomId }) {\n  const [count, setCount] = useState(0);\n  useEffect(() => {\n    const handler = () => setCount(value => value + 1);\n    bus.addEventListener(roomId, handler);\n    return () => bus.removeEventListener(roomId, handler);\n  }, [bus, roomId]);\n  return createElement('p', null, roomId + ':' + count);\n}"
    },
    {
      "id": "failure",
      "title": "错误路径也要接受过期检查",
      "paragraphs": [
        "成功回调检查 active，catch 却直接 setError，会让旧请求失败覆盖当前成功。成功与失败都必须检查是否仍属于有效同步；取消后的预期异常不要显示成用户失败。清理负责取消或标记失效，不能保证服务端撤销写操作。",
        "另一个错误是依赖每次新建的配置对象。对象身份变化会导致同步频繁重启。优先把只属于 Effect 的配置放到 setup 内，或依赖原始必要值；不要为了少重跑就忽略确实变化的输入。"
      ]
    },
    {
      "id": "boundaries",
      "title": "时间与可见结果不能靠经验猜测",
      "paragraphs": [
        "第一条边界是视觉测量：需要在绘制前测量并修改布局的少量场景可能使用 useLayoutEffect，但它会阻塞绘制，不能把所有 Effect 都替换过去。第二条边界是服务端：Effect 不在服务端渲染中执行，因此首屏数据方案不能假定它已经取完。",
        "第三条边界是第三方资源清理。removeEventListener、clearInterval、disconnect 和 abort 各自停止不同对象；一个清理函数必须释放自己 setup 建立的全部资源，并允许安全地重复挂载。"
      ]
    },
    {
      "id": "application",
      "title": "审查一个 Effect 时问三个问题",
      "paragraphs": [
        "同步的外部对象是什么？哪些输入决定连接目标或参数？停止上一轮时如何保证无效回调不改变界面？如果第一个问题答不出，可能只是在同步两份本可派生的内部状态。",
        "用测试证明重新 setup 后仍只有一份有效资源，而不是只断言 mock 调用了某个函数。保留切换、失败、卸载和恢复路径证据，更容易发现真实生命周期错误。",
        "例如连接地址由服务器地址和房间号共同决定，两者都应参与同步；显示用的主题颜色却只影响消息格式。如果每次主题切换都重建网络连接，要判断它是否真正是连接依赖，还是可以把展示逻辑移到独立阶段。不能简单删掉依赖解决频繁重连，因为旧回调可能继续使用旧颜色；应通过公开 API 与明确的数据流重组读取责任。",
        "可执行订阅测试还要验证清理身份。用 removeEventListener 传入一个新箭头函数，即使函数体相同，也没有移除已注册对象。测试可先 setup 两次并各自 cleanup，再发送事件，看业务更新数量是否恰当。若只断言 removeEventListener 调用了一次，函数身份错了仍可能通过，无法证明资源真的停止。"
      ]
    },
    {
      "id": "recall",
      "title": "用重建过程检查清理完整性",
      "paragraphs": [
        "手动执行 setup、cleanup、setup，然后发送事件；有效监听应只有一份。再执行 cleanup，事件不应再产生业务更新。这个模型可迁移到 WebSocket、观察器和定时任务。",
        "回忆：为什么依赖遗漏导致旧连接？为什么 catch 同样需要有效性检查？扩展 generation 示例让旧失败尝试写 error，并证明它应被拒绝。"
      ]
    }
  ],
  "sources": [
    {
      "title": "React：Synchronizing with Effects",
      "url": "https://react.dev/learn/synchronizing-with-effects"
    },
    {
      "title": "React：useEffect",
      "url": "https://react.dev/reference/react/useEffect"
    }
  ]
};
