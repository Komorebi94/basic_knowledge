import type { Article } from "../articles";

export const serverCacheIsolationArticle: Article = {
  id: "K14-06",
  kind: "knowledge",
  domainSlug: "server",
  slug: "server-cache-and-isolation",
  title: "服务端缓存与隔离",
  summary: "用私有笔记的缓存键带上查看者，避免另一个用户命中同一路径，没有身份的私有写入直接拒绝。",
  aliases: ["private cache", "cache key", "Vary", "缓存隔离"],
  tags: ["服务端", "缓存", "隔离"],
  estimatedMinutes: 22,
  verifiedAt: "2026-10-14",
  sections: [
    {
      id: "problem",
      title: "只按路径缓存了笔记，为什么下一个登录用户看见了别人的草稿？",
      paragraphs: [
        "服务端把 /notes 的响应存进共享缓存，键只有路径。u1 的草稿先被放入，u2 请求同一路径时直接命中。页面是服务端渲染的，HTML 里已经包含 u1 的标题。浏览器缓存和 CDN 若再按这个 URL 共享，泄漏面会更大。",
        "私有响应的键必须包含查看者。没有身份时不能写入私有条目。把私有正文标成公开，则会按公开键共享。本篇用一张 Map 演示键的选择，不配置真实的 Cache-Control 或 CDN。"
      ]
    },
    {
      id: "environment",
      title: "复现环境：公开键只有路径，私有键还要有查看者",
      paragraphs: [
        "运行 npm run verify:k14。visibility 只能是 public 或 private，路径必须是以 / 开头的字符串。私有条目没有 viewer 时，keyFor 返回 refused。公开键是 public 加路径，私有键是 private、查看者和路径。",
        "put 把正文放进 Map。read 用同一套键查找，没有则 miss。模型不解析 Cookie，也不发送 Vary 头。查看者字符串由调用方传入，并假定已经在别处核对过。"
      ]
    },
    {
      id: "private",
      title: "同一路径对不同查看者是不同的键",
      paragraphs: [
        "u1 的私有 /notes 存入草稿。u1 再读是 hit:草稿。u2 读同一路径是 miss，因为键里的查看者不同。没有 viewer 的私有写入返回 refused，Map 不会增加一条谁都能命中的私有记录。",
        "miss 应该回源并使用 u2 自己的正文，而不是把 u1 的 hit 借给 u2。若回源失败，页面显示 u2 的错误，不能显示缓存里另一个人的笔记。"
      ],
      examples: [
        {
          language: "javascript",
          code: `function keyFor(entry) {
  if (!entry || (entry.visibility !== 'public' && entry.visibility !== 'private')) return 'invalid';
  if (typeof entry.path !== 'string' || !entry.path.startsWith('/')) return 'invalid';
  if (entry.visibility === 'private' && !entry.viewer) return 'refused';
  if (entry.visibility === 'public') return 'public:' + entry.path;
  return 'private:' + entry.viewer + ':' + entry.path;
}
function put(store, entry, body) {
  const key = keyFor(entry);
  if (key === 'invalid' || key === 'refused') return key;
  store.set(key, body);
  return 'stored';
}
function read(store, entry) {
  const key = keyFor(entry);
  if (key === 'invalid' || key === 'refused') return key;
  return store.has(key) ? 'hit:' + store.get(key) : 'miss';
}
const store = new Map();
console.log('私有写入:' + put(store, { visibility: 'private', viewer: 'u1', path: '/notes' }, '草稿'));
console.log('本人:' + read(store, { visibility: 'private', viewer: 'u1', path: '/notes' }));
console.log('他人:' + read(store, { visibility: 'private', viewer: 'u2', path: '/notes' }));
console.log('无身份:' + put(store, { visibility: 'private', path: '/notes' }, '草稿'));
console.log('坏路径:' + put(store, { visibility: 'public', path: 'notes' }, '样式'));`,
          expectedOutput: [
            "私有写入:stored",
            "本人:hit:草稿",
            "他人:miss",
            "无身份:refused",
            "坏路径:invalid"
          ],
          explanation: [
            "u1 和 u2 的路径都是 /notes，键却分别带有 u1 和 u2。所以第二个人不会读到草稿。",
            "没有查看者的私有写入被拒绝。路径 notes 缺少前导斜线，公开写入也是 invalid，避免一条不完整的键被共享。"
          ]
        }
      ]
    },
    {
      id: "public",
      title: "把私有正文标成公开后，任何读取公开键的人都会命中",
      paragraphs: [
        "同一份草稿若用 visibility public 写入 /notes，键里没有查看者。之后任何一次公开读取都是 hit:草稿。这不是缓存意外，而是写入时选错了可见性。",
        "样式表这类人人相同的响应才使用公开键。笔记 HTML 只要含有某个人的标题、草稿或令牌，就保持私有。公开缓存可以共享；私有缓存至少要按查看者分开，还要避免被中间层当成公开对象存储。"
      ],
      examples: [
        {
          language: "javascript",
          code: `function keyFor(entry) {
  if (!entry || (entry.visibility !== 'public' && entry.visibility !== 'private')) return 'invalid';
  if (typeof entry.path !== 'string' || !entry.path.startsWith('/')) return 'invalid';
  if (entry.visibility === 'private' && !entry.viewer) return 'refused';
  if (entry.visibility === 'public') return 'public:' + entry.path;
  return 'private:' + entry.viewer + ':' + entry.path;
}
function put(store, entry, body) {
  const key = keyFor(entry);
  if (key === 'invalid' || key === 'refused') return key;
  store.set(key, body);
  return 'stored';
}
function read(store, entry) {
  const key = keyFor(entry);
  if (key === 'invalid' || key === 'refused') return key;
  return store.has(key) ? 'hit:' + store.get(key) : 'miss';
}
const store = new Map();
console.log('误公开:' + put(store, { visibility: 'public', path: '/notes' }, '草稿'));
console.log('公开命中:' + read(store, { visibility: 'public', path: '/notes' }));
console.log('样式:' + put(store, { visibility: 'public', path: '/app.css' }, 'body{}'));
console.log('样式命中:' + read(store, { visibility: 'public', path: '/app.css' }));`,
          expectedOutput: [
            "误公开:stored",
            "公开命中:hit:草稿",
            "样式:stored",
            "样式命中:hit:body{}"
          ],
          explanation: [
            "公开键不包含查看者，所以草稿一旦按公开写入，后续公开读取都会拿到它。这是可见性选错，不是读取函数多给了权限。",
            "样式表人人相同，公开键可以共享。它和笔记正文使用不同路径，也不会覆盖 /notes 那一条。"
          ]
        }
      ]
    },
    {
      id: "vary",
      title: "响应头要表达缓存能不能共享，键只是服务端内部的一半",
      paragraphs: [
        "服务端 Map 分对了键，若响应仍是可被公共缓存存储的，CDN 或浏览器仍可能按 URL 共享 HTML。私有页面应明确不可进入公共缓存。公开资源若会因语言或编码变化，还要把这些因素放进键和 Vary，否则不同语言会互相覆盖。",
        "登录态变化后，旧的私有条目应失效。只靠路径永远不变的键，会在用户退出后仍把上一份草稿交给下一个会话。本模型没有过期时间，调用方要在身份变化时删除对应查看者的条目。"
      ]
    },
    {
      id: "boundaries",
      title: "Map 不是 CDN，查看者字符串也不是已经验证的会话",
      paragraphs: [
        "函数不发送 Cache-Control、Vary 或 Set-Cookie。hit 只说明这张 Map 里有这个键。真实共享缓存还有规范化 URL、查询参数和压缩变体。",
        "viewer 由参数传入。若它来自用户可以修改的查询参数，私有键会被伪造。身份必须来自服务端已经核对的会话。",
        "模型覆盖写入时不检查正文是否含有令牌。公开样式可以缓存；若有人把含令牌的 HTML 放进 public 路径，函数仍会存储。写入前要先决定可见性，而不是依赖键函数发现秘密。"
      ]
    },
    {
      id: "practice",
      title: "同一路径用两个查看者各读一次，再检查误标公开的结果",
      paragraphs: [
        "私有笔记应是本人 hit、他人 miss、无身份 refused。再把同一正文标成公开，确认会命中。样式表可以公开。不要只测试一个人的刷新。",
        "本主题没有已开放的独立练习。示例缓存不会发给浏览器。"
      ]
    }
  ],
  sources: [
    { title: "MDN：HTTP 缓存", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching" },
    { title: "MDN：Cache-Control", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control" },
    { title: "MDN：Vary", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Vary" }
  ]
};
