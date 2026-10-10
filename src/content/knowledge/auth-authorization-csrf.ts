import type { Article } from "../articles";

export const authAuthorizationArticle: Article = {
  id: "K11-02", kind: "knowledge", domainSlug: "security", slug: "auth-authorization-csrf",
  title: "认证、授权与 CSRF",
  summary: "沿一次修改记录的请求分清身份识别、资源权限和请求来源，解释隐藏按钮为何不能保护接口，以及 Cookie 会话下跨站请求的防御边界。",
  aliases: ["authentication", "authorization", "CSRF", "access control"], tags: ["安全", "权限", "HTTP"],
  estimatedMinutes: 22, verifiedAt: "2026-10-08",
  sections: [
    { id: "problem", title: "用户已经登录，为什么仍不能编辑所有记录？", paragraphs: [
      "系统有两份笔记，分别属于用户 A 与用户 B。A 登录成功，页面只显示 A 的编辑按钮；但如果接口只验证“有会话”，A 更换请求中的记录 ID 就可能修改 B 的笔记。认证回答是谁，授权回答这个主体能否对这项资源执行这项操作，二者不能合并成一个 loggedIn 布尔值。",
      "浏览器按钮只是交互提示，不能约束直接发送 HTTP 请求的人。真正的权限判断在服务端取得可信身份、加载目标资源之后做，并与写入保持正确的事务及并发关系。下例是独立可运行的策略模型，不是认证服务器；主体由调用方传入仅用于演示，生产环境不能信任客户端自报的 userId。",
    ], examples: [{ code: `function mayEdit(subject, note) {
  if (!subject || !note) return false;
  return subject.tenantId === note.tenantId && subject.id === note.ownerId;
}
const alice = { id: 'A', tenantId: 'T1' };
console.log(mayEdit(alice, { ownerId: 'A', tenantId: 'T1' }));
console.log(mayEdit(alice, { ownerId: 'B', tenantId: 'T1' }));
console.log(mayEdit(alice, { ownerId: 'A', tenantId: 'T2' }));
console.log(mayEdit(null, { ownerId: 'A', tenantId: 'T1' }));`, expectedOutput: ["true", "false", "false", "false"], explanation: [
      "第一个判断同时满足所属租户和所有者。第二个跨所有者、第三个跨租户、第四个缺少身份，全部拒绝。这些用例分别验证资源关系与主体存在，避免只测管理员成功路径。",
      "模型明确采用只允许所有者编辑的规则。真实系统若允许团队协作，需要另外建模成员关系、操作能力和资源状态，不应无条件给登录用户放行。展示层也可以调用类似模型改善反馈，但服务端仍需独立执行可信判断。",
    ] }] },
    { id: "identity", title: "可信身份来自验证过程，不来自请求参数", paragraphs: [
      "会话 Cookie 或访问令牌是身份验证流程的材料。服务端验证有效性、时效与适用范围，得到内部主体后，再执行授权。把请求 JSON 中的 role: admin 当成可信身份，相当于让请求者给自己签权限。令牌“能解码”也不等于签名、受众与有效期已经被验证。",
      "401 与 403 表达不同失败类别：身份缺失或不能验证，和身份已知但操作不允许。具体系统还可能用统一的资源不存在反馈减少信息泄露；这属于接口合同，需要保持一致。前端据此提供重新认证或权限不足的恢复入口，但不能仅因页面保有旧 user 对象就认为会话仍有效。",
      "会话材料的保存方式带来不同风险。HttpOnly Cookie 限制脚本读取，不代表浏览器不会随请求发送它，也不能阻止已在同源执行的恶意脚本借用户权限发起操作。任何单个属性都不是完整的安全方案。",
    ] },
    { id: "csrf", title: "浏览器自动携带凭据时，请求来源为什么成为额外边界", paragraphs: [
      "CSRF 的关键是用户在目标站已认证，攻击者诱导浏览器发出用户没有意图的有副作用请求，浏览器又可能自动附带相关会话 Cookie。服务端看到有效会话，却不能仅由此确认这是用户在可信页面发起的操作。",
      "跨域读取响应被同源策略或 CORS 限制，不等于请求一定不能被发送。某些表单请求无需预检，若接口使用 GET 改状态，甚至一次普通导航也可能有副作用。先让读操作无副作用，再对写操作采用系统一致的 CSRF 防护。",
      "Cookie 的 SameSite 可以减少部分跨站携带场景，但 site 与 origin 是不同概念，不能把同站不同子域都视为同样可信。SameSite 的配置、跨站登录回调和业务嵌入需求应一起验证。",
    ] },
    { id: "guards", title: "来源检查与 CSRF token 在模型中分别验证什么", paragraphs: [
      "防御应采用成熟服务端框架的机制。常见同步 token 模式把不可预测 token 关联到当前会话，可信页面携带 token，服务器检查它。它不是写死在前端文件里的公共字符串；URL 和日志也不应包含这些敏感材料。下面使用固定占位值只展示判断分支，不提供真实 token 生成或比较实现。",
    ], examples: [{ code: `function acceptsMutation(request, session) {
  if (request.method === 'GET') return false;
  if (request.origin !== 'https://notes.example') return false;
  return typeof request.token === 'string' && request.token === session.token;
}
const session = { token: 'demo-session-token' };
console.log(acceptsMutation({ method: 'POST', origin: 'https://notes.example', token: session.token }, session));
console.log(acceptsMutation({ method: 'POST', origin: 'https://other.example', token: session.token }, session));
console.log(acceptsMutation({ method: 'POST', origin: 'https://notes.example' }, session));`, expectedOutput: ["true", "false", "false"], explanation: [
      "可信来源且 token 匹配的模型请求通过。第二个请求即使有正确 token，也因来源不同拒绝；第三个来源相同但没有 token 也拒绝。联合条件展示了不同证据怎样进入写请求边界。",
      "这个对象模型没有 HTTP 头验证、密码学随机数、代理配置或会话生命周期。真实 Origin 缺失时的处理要遵循部署策略，不能默默放行。token 校验也不能替代资源授权：通过 CSRF 判断的 A 用户仍不能修改 B 的记录。",
    ] }] },
    { id: "bad-check", title: "只检查请求里有 token，为什么任何人都能满足？", paragraphs: [
      "存在性检查只能证明传了一个字段，不能证明该字段关联当前会话。类似的错误还有只检查角色字段、只校验资源 ID 长度，或只在列表过滤资源，却在写接口按任意 ID 修改。每层都要明确自己证明了哪一个事实。",
    ], examples: [{ code: `function incorrect(request) { return Boolean(request.token); }
console.log(incorrect({ token: 'made-up' }));
function correctModel(request, expected) {
  return typeof request.token === 'string' && request.token === expected;
}
console.log(correctModel({ token: 'made-up' }, 'session-bound'));
console.log(correctModel({ token: 'session-bound' }, 'session-bound'));`, expectedOutput: ["true", "false", "true"], explanation: [
      "错误实现接受随手构造的字符串，因此 token 字段对攻击者没有形成额外约束。模型修复把值与当前会话预期关联，伪造值拒绝，正确关联值通过。",
      "字符串相等只是演示预期行为，不是建议手写生产 CSRF 系统。真实防护还需要安全生成、存储、生命周期和完整请求处理链；重复造安全机制比复用经过审查的框架机制更容易遗漏条件。",
    ] }] },
    { id: "boundaries", title: "两种经常被混在一起的攻击边界", paragraphs: [
      "CSRF 防护不能解决 XSS：若攻击者已经在可信同源页面执行脚本，可能读取页面可见的 token 并调用接口。反过来，文本输出安全也不能保证 Cookie 写接口不会遭到跨站诱导。数据解释与请求意图是两个需要分别验证的边界。",
      "使用显式 Authorization 头的访问令牌流程，浏览器通常不会自动帮外部页面附加这个头，因此威胁模型与自动 Cookie 携带不同。但令牌保存、CORS、泄露及 XSS 风险仍要评估，不能据此宣称系统不需要安全检查。",
      "检查权限时还要考虑资源状态变化。先允许、很久后才修改，如果中间成员已被移除或资源转移，就可能使用过期授权。判断与写入是否需要同一事务或版本约束，取决于数据存储和业务合同。",
    ] },
    { id: "verification", title: "验证从不同主体与资源关系出发", paragraphs: [
      "为每个敏感操作列出：匿名主体、有效普通主体、失效会话、资源所有者、同租户非所有者、其它租户主体。再覆盖可信来源正确 token、缺少 token、错误 token、非可信来源，以及合法的跨站回调。测试结果应按系统实际合同判断，不能用“前端按钮没显示”代替接口证据。",
      "客户端在 401 时引导重新认证，在 403 时保留用户输入并说明无权限；避免无限重试同一拒绝，也不要把具体私密资源信息放进错误日志。安全设计最终应能说明：身份在何处验证、每次操作在何处授权、请求意图由哪些可信证据约束。",
    ] },
    { id: "recall", title: "把三项判断重新应用到一个删除接口", paragraphs: [
      "先确定可信主体，再加载目标及租户关系，最后按操作策略授权。若采用 Cookie 会话，还要检查写请求的 CSRF 防护。任意一步拒绝都不能发生删除副作用。",
      "隐藏按钮、随机资源 ID、CORS 和 CSRF token 各有作用，但没有一个能单独替代完整授权。用另一名合法用户请求同一个 ID，是检查是否存在横向越权的直接反例。",
    ] },
  ],
  sources: [
    { title: "OWASP：授权检查", url: "https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html" },
    { title: "MDN：CSRF", url: "https://developer.mozilla.org/en-US/docs/Web/Security/Attacks/CSRF" },
  ],
};
