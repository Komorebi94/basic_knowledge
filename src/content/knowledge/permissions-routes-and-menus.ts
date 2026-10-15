import type { Article } from "../articles";

export const permissionsRoutesArticle: Article = {
  id: "K13-04",
  kind: "knowledge",
  domainSlug: "architecture",
  slug: "permissions-routes-and-menus",
  title: "权限、路由与菜单",
  summary: "用菜单是否显示和操作是否允许分开判断，隐藏删除入口不能代替服务端对笔记所有者的检查。",
  aliases: ["authorization", "route guard", "menu visibility", "访问控制"],
  tags: ["架构", "权限", "路由"],
  estimatedMinutes: 22,
  verifiedAt: "2026-10-13",
  sections: [
    {
      id: "problem",
      title: "菜单里没有删除，为什么换一个请求仍然能删掉别人的笔记？",
      paragraphs: [
        "界面按角色隐藏了查看者的删除按钮。查看者打开开发工具，直接请求删除接口，服务器只检查“这个人登录过”，笔记就被删了。另一边编辑者看得到每篇笔记上的删除，包括不属于自己的那篇；菜单显示被当成已经允许操作。",
        "菜单回答的是这一屏要不要给出入口。允许回答的是这个人和这条笔记能不能执行这个动作。隐藏入口可以减少误点，不能代替 K11-02 里服务端要做的授权。本篇用固定角色演示这两种判断，不连接真实路由。"
      ]
    },
    {
      id: "environment",
      title: "复现环境：三种角色和四类动作，阅读在模型里对所有角色开放",
      paragraphs: [
        "运行 npm run verify:k13。角色只有 admin、editor、viewer。动作只有 read、edit、delete、audit。visible 只看角色和动作：管理可见全部，编辑看不见 audit，查看者只看见 read。",
        "allow 里管理始终允许。read 对三种已知角色都允许，因此这个模型没有私密笔记。编辑只能编辑或删除自己拥有的笔记，不能审计。查看者不能编辑、删除或审计。未知角色或动作返回 invalid。"
      ]
    },
    {
      id: "decision",
      title: "编辑者看得到删除，不拥有笔记时仍然被拒绝",
      paragraphs: [
        "编辑者的删除菜单是 shown，但笔记所有者是 u9 时 allow 返回 denied。自己的笔记才是 allowed。查看者的删除菜单是 hidden，对本人笔记的删除仍是 denied。查看者阅读别人的笔记是 shown 且 allowed。",
        "管理的审计是 shown 且 allowed。编辑者的审计是 hidden 且 denied。菜单和授权碰巧一致时，也不能把其中一列删掉；下一节会看到 shown 仍然可以拒绝。"
      ],
      examples: [
        {
          language: "javascript",
          code: `function visible(role, action) {
  if (role === 'admin') return 'shown';
  if (role === 'editor' && action !== 'audit') return 'shown';
  if (role === 'viewer' && action === 'read') return 'shown';
  return 'hidden';
}
function allow(actor, note, action) {
  if (!actor || !note || !['read', 'edit', 'delete', 'audit'].includes(action)) return 'invalid';
  if (!['admin', 'editor', 'viewer'].includes(actor.role)) return 'invalid';
  if (actor.role === 'admin') return 'allowed';
  if (action === 'read') return 'allowed';
  if (actor.role !== 'editor') return 'denied';
  if (action === 'audit') return 'denied';
  if (note.owner !== actor.id) return 'denied';
  return 'allowed';
}
const editor = { role: 'editor', id: 'u1' };
const viewer = { role: 'viewer', id: 'u2' };
const admin = { role: 'admin', id: 'u3' };
console.log('菜单:' + visible('editor', 'delete') + '/' + allow(editor, { owner: 'u9' }, 'delete'));
console.log('自己的:' + allow(editor, { owner: 'u1' }, 'delete'));
console.log('只读:' + visible('viewer', 'delete') + '/' + allow(viewer, { owner: 'u2' }, 'delete'));
console.log('阅读:' + visible('viewer', 'read') + '/' + allow(viewer, { owner: 'u9' }, 'read'));
console.log('管理:' + visible('admin', 'audit') + '/' + allow(admin, { owner: 'u9' }, 'audit'));
console.log('编辑审计:' + visible('editor', 'audit') + '/' + allow(editor, { owner: 'u1' }, 'audit'));`,
          expectedOutput: [
            "菜单:shown/denied",
            "自己的:allowed",
            "只读:hidden/denied",
            "阅读:shown/allowed",
            "管理:shown/allowed",
            "编辑审计:hidden/denied"
          ],
          explanation: [
            "第一行是同一名编辑者：菜单给出删除，授权因为所有者不是 u1 而拒绝。隐藏和显示都没有改变查看者不能删除的结果。",
            "阅读不检查所有者，所以查看者可以打开 u9 的笔记。这是模型的范围，不是私密笔记的产品规则。审计只有管理可以通过。"
          ]
        }
      ]
    },
    {
      id: "route",
      title: "路由打开看授权结果，菜单状态只说明入口有没有画出来",
      paragraphs: [
        "openRoute 先分别计算菜单和授权。授权不是 allowed 时返回 rejected，并带上菜单是 shown 还是 hidden。授权通过时返回 open，同样带上菜单状态。直接输入地址和点击菜单都走这一函数。",
        "编辑者删除别人的笔记是 rejected:shown：入口在，路由仍不打开。查看者删除是 rejected:hidden。查看者阅读和管理审计是 open:shown。路由不能写成“菜单里有就渲染页面”。"
      ],
      examples: [
        {
          language: "javascript",
          code: `function visible(role, action) {
  if (role === 'admin') return 'shown';
  if (role === 'editor' && action !== 'audit') return 'shown';
  if (role === 'viewer' && action === 'read') return 'shown';
  return 'hidden';
}
function allow(actor, note, action) {
  if (!actor || !note || !['read', 'edit', 'delete', 'audit'].includes(action)) return 'invalid';
  if (!['admin', 'editor', 'viewer'].includes(actor.role)) return 'invalid';
  if (actor.role === 'admin') return 'allowed';
  if (action === 'read') return 'allowed';
  if (actor.role !== 'editor') return 'denied';
  if (action === 'audit') return 'denied';
  if (note.owner !== actor.id) return 'denied';
  return 'allowed';
}
function openRoute(actor, note, action) {
  const menu = visible(actor.role, action);
  const decision = allow(actor, note, action);
  if (decision !== 'allowed') return 'rejected:' + menu;
  return 'open:' + menu;
}
console.log('别人的删除:' + openRoute({ role: 'editor', id: 'u1' }, { owner: 'u9' }, 'delete'));
console.log('查看者删除:' + openRoute({ role: 'viewer', id: 'u2' }, { owner: 'u2' }, 'delete'));
console.log('查看者阅读:' + openRoute({ role: 'viewer', id: 'u2' }, { owner: 'u9' }, 'read'));
console.log('管理审计:' + openRoute({ role: 'admin', id: 'u3' }, { owner: 'u9' }, 'audit'));`,
          expectedOutput: [
            "别人的删除:rejected:shown",
            "查看者删除:rejected:hidden",
            "查看者阅读:open:shown",
            "管理审计:open:shown"
          ],
          explanation: [
            "shown 和 hidden 都可以出现在拒绝结果里。第一种是菜单过宽，第二种是入口已藏但接口仍必须拒绝。",
            "打开路由只依赖授权等于 allowed。菜单状态留在结果里，便于界面决定是隐藏入口还是显示无权限，而不是用来放行。"
          ]
        }
      ]
    },
    {
      id: "split",
      title: "菜单可以比授权更窄，不能比授权更宽之后还当作已经检查",
      paragraphs: [
        "查看者看不见删除，是菜单窄于授权能力：他本来也没有删除能力。编辑者看见别人的删除，是菜单宽于授权。宽菜单必须在点击和直接访问时重新调用 allow，并在服务器上再做一次。只在前端过滤列表，请求体里换一个 id 就会绕过。",
        "无权限页面和隐藏按钮是两种界面。rejected:hidden 可以不画按钮；rejected:shown 说明用户从可见入口进来了，应显示不能操作这条笔记，而不是装成笔记不存在，除非产品明确要隐藏存在性。"
      ]
    },
    {
      id: "boundaries",
      title: "模型里的阅读对所有角色开放，也没有会话和 CSRF",
      paragraphs: [
        "allow 对 read 不看所有者。私密笔记、共享链接和租户隔离都还没写进去。把这段函数说成完整访问控制，会放过“查看者读到了不该看的笔记”。",
        "函数不检查登录是否过期，也不检查请求来源。删除即使 allow 返回 allowed，仍要有 K11-02 的会话和跨站请求防护。菜单显示更不包含这些。",
        "角色是调用方传入的字符串。真实系统里的角色应来自服务器已经核对的身份，不能来自路由查询参数或本地存储里用户自己改的字段。"
      ]
    },
    {
      id: "practice",
      title: "每个动作都写一行菜单和一行授权",
      paragraphs: [
        "对删除至少覆盖编辑者的自己的笔记、编辑者的别人的笔记，以及查看者。路由用例要包含 rejected:shown，避免只测试隐藏按钮。阅读若以后变成私密，先改 allow，再决定菜单。",
        "本主题没有已开放的独立练习。u1、u9 只是固定身份，不是账户系统。"
      ]
    }
  ],
  sources: [
    { title: "OWASP：授权备忘录", url: "https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html" },
    { title: "OWASP：访问控制失效", url: "https://owasp.org/Top10/A01_2021-Broken_Access_Control/" },
    { title: "MDN：403", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/403" }
  ]
};
