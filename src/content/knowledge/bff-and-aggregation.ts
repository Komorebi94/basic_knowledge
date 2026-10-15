import type { Article } from "../articles";

export const bffAggregationArticle: Article = {
  id: "K14-04",
  kind: "knowledge",
  domainSlug: "server",
  slug: "bff-and-aggregation",
  title: "BFF 与接口聚合",
  summary: "用笔记页的聚合说明先核对所有者和预算，超时与下游失败留下已得到的标题，令牌不转发出去。",
  aliases: ["BFF", "backend for frontend", "aggregation", "接口聚合"],
  tags: ["服务端", "聚合", "边界"],
  estimatedMinutes: 23,
  verifiedAt: "2026-10-14",
  sections: [
    {
      id: "problem",
      title: "页面自己拼了三个接口，为什么令牌和邮箱也进了浏览器？",
      paragraphs: [
        "笔记页需要标题列表和订单摘要。浏览器先后请求两个内部接口，把用户令牌原样带给每一个，再从完整记录里取出标题。某个接口变慢，页面一直空白；某个接口多返回了邮箱，前端若直接渲染对象，邮箱就出现在不该看的界面里。",
        "面向页面的聚合层可以替这一屏收齐数据、控制等待时间，并只返回页面要用的字段。它不拥有笔记的授权规则，也不能为了省事把令牌转发给下游。本篇用固定调用结果演示，不发起真实请求。"
      ]
    },
    {
      id: "environment",
      title: "复现环境：先看所有者和令牌，再按预算累加耗时",
      paragraphs: [
        "运行 npm run verify:k14。aggregate 要求 viewer 与 owner 相同，否则 denied。forwardToken 为真时返回 token-not-forwarded，即使查看者就是所有者。耗时必须是非负整数。",
        "每一笔调用先把毫秒加进 spent。超过 budget 时，若已经有标题，返回 timeout 加这些标题，否则只返回 timeout。状态不是 ok 或标题为空，同样把已有标题放进 partial。shape 只复制修剪后的 title 和字符串 updated，不复制其余字段。"
      ]
    },
    {
      id: "aggregate",
      title: "别人的页面直接拒绝，超时和失败保留已经拿到的标题",
      paragraphs: [
        "u2 看 u1 的聚合返回 denied，后面的调用不会被解释成成功。所有者把令牌标记为转发时返回 token-not-forwarded。两项各 10 毫秒、预算 30，结果是 ok:草稿+订单。",
        "同样两项但预算 15 时，第一项放进标题，第二项使 spent 变成 20，返回 timeout:草稿。第二项状态为 down 时返回 partial:草稿。页面可以显示草稿，并单独说明订单没有拿到，而不是当成整页成功或整页空白。"
      ],
      examples: [
        {
          language: "javascript",
          code: `function aggregate(job) {
  if (!job || job.viewer !== job.owner) return 'denied';
  if (job.forwardToken) return 'token-not-forwarded';
  const titles = [];
  let spent = 0;
  for (const call of job.calls) {
    if (!Number.isInteger(call.ms) || call.ms < 0) return 'invalid';
    spent += call.ms;
    if (spent > job.budget) return titles.length ? 'timeout:' + titles.join('+') : 'timeout';
    if (call.status !== 'ok' || typeof call.title !== 'string' || !call.title) return titles.length ? 'partial:' + titles.join('+') : 'partial';
    titles.push(call.title);
  }
  return titles.length ? 'ok:' + titles.join('+') : 'empty';
}
const ok = [{ ms: 10, status: 'ok', title: '草稿' }, { ms: 10, status: 'ok', title: '订单' }];
console.log('别人:' + aggregate({ viewer: 'u2', owner: 'u1', forwardToken: false, budget: 30, calls: ok }));
console.log('转发令牌:' + aggregate({ viewer: 'u1', owner: 'u1', forwardToken: true, budget: 30, calls: ok }));
console.log('聚合:' + aggregate({ viewer: 'u1', owner: 'u1', forwardToken: false, budget: 30, calls: ok }));
console.log('超时:' + aggregate({ viewer: 'u1', owner: 'u1', forwardToken: false, budget: 15, calls: ok }));
console.log('部分:' + aggregate({ viewer: 'u1', owner: 'u1', forwardToken: false, budget: 30, calls: [{ ms: 10, status: 'ok', title: '草稿' }, { ms: 10, status: 'down', title: '订单' }] }));`,
          expectedOutput: [
            "别人:denied",
            "转发令牌:token-not-forwarded",
            "聚合:ok:草稿+订单",
            "超时:timeout:草稿",
            "部分:partial:草稿"
          ],
          explanation: [
            "授权失败发生在读取调用之前。令牌转发被单独拒绝，不能因为 viewer 等于 owner 就把它继续传到下游。",
            "预算 15 在第二笔的 10 毫秒加上后超过，所以订单标题没有进入结果。下游 down 同样留下草稿，并用 partial 标明不完整。"
          ]
        }
      ]
    },
    {
      id: "shape",
      title: "返回给页面的对象只留标题和时间，邮箱和令牌停在聚合层",
      paragraphs: [
        "shape 要求标题是可修剪的字符串。updated 只有在本身是字符串时才复制。email 和 token 即使出现在原始对象里，也不会出现在 JSON 里。没有标题时返回 invalid，而不是返回一个只含邮箱的对象。",
        "预期整形结果是标题“草稿”和 updated 10-14。缺标题是 invalid。页面契约因此变成稳定的小对象；下游多出来的字段默认丢弃，而不是默认透传。"
      ],
      examples: [
        {
          language: "javascript",
          code: `function shape(raw) {
  if (!raw || typeof raw.title !== 'string' || !raw.title.trim()) return 'invalid';
  const shaped = { title: raw.title.trim() };
  if (typeof raw.updated === 'string') shaped.updated = raw.updated;
  return JSON.stringify(shaped);
}
console.log('整形:' + shape({ title: ' 草稿 ', updated: '10-14', email: 'a@example.com', token: 'session-demo' }));
console.log('缺标题:' + shape({ email: 'a@example.com' }));`,
          expectedOutput: [
            '整形:{"title":"草稿","updated":"10-14"}',
            "缺标题:invalid"
          ],
          explanation: [
            "JSON 里只有 title 和 updated。原始对象上的 email 和 token 没有被复制，所以输出里看不到它们。",
            "标题全是空白或缺失时，不构造部分对象。调用方不能从 invalid 里再读出邮箱。"
          ]
        }
      ]
    },
    {
      id: "boundary",
      title: "聚合层负责这一屏的等待和形状，不改写下游的授权",
      paragraphs: [
        "denied 只比较调用方传入的 viewer 和 owner。真实系统里这两个值都要来自已经核对的身份和笔记记录，不能来自浏览器自己声明的所有者。K11-02 的服务端授权仍然在下游执行。",
        "预算是这一次聚合的上限，不是每个下游各自的超时之和可以无限加。某一笔超时后，已成功的标题可以显示，但页面状态必须是不完整。把 timeout:草稿 渲染成全部加载完成，就藏住了订单失败。",
        "令牌不转发，意味着下游用聚合层自己的服务身份或经过范围限制的调用。把用户令牌放进日志同样不行，那是 K11-05 的问题。本函数只拒绝 forwardToken 这个标记。"
      ]
    },
    {
      id: "boundaries",
      title: "固定耗时不是网络测量，整形也不证明下游没有保存多余字段",
      paragraphs: [
        "ms 由作者写入，函数不发请求，也不使用 AbortSignal。真实超时要取消仍在进行的下游调用，避免用户已经看到部分结果，下游仍继续做有副作用的写入。",
        "shape 只影响返回给这一屏的对象。它不删除下游数据库里的邮箱。若聚合层把原始对象放进缓存，丢字段的承诺就破了。",
        "partial 和 timeout 都带着已得到的标题。没有标题时它们不带冒号后缀。界面要能区分还没开始、部分成功和全部成功。"
      ]
    },
    {
      id: "practice",
      title: "先写授权和令牌，再写预算用尽时页面还能显示什么",
      paragraphs: [
        "用别人的查看者、转发令牌、两项都成功、第二项超时和第二项失败各跑一次。整形用例确认邮箱和令牌不在输出里。部分结果不要画成整页完成。",
        "本主题没有已开放的独立练习。session-demo 只用于证明字段被丢弃。"
      ]
    }
  ],
  sources: [
    { title: "Azure 架构：Backends for Frontends", url: "https://learn.microsoft.com/en-us/azure/architecture/patterns/backends-for-frontends" },
    { title: "MDN：AbortSignal", url: "https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal" },
    { title: "MDN：Fetch API", url: "https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API" }
  ]
};
