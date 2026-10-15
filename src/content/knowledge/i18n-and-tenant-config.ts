import type { Article } from "../articles";

export const i18nTenantConfigArticle: Article = {
  id: "K13-07",
  kind: "knowledge",
  domainSlug: "architecture",
  slug: "i18n-and-tenant-config",
  title: "国际化与多租户配置",
  summary: "用租户和语言的查找顺序取文案与布局，缺字段逐级回退，配置值只接受字面量而不执行函数。",
  aliases: ["i18n", "localization", "multi-tenant", "多租户"],
  tags: ["架构", "国际化", "配置"],
  estimatedMinutes: 22,
  verifiedAt: "2026-10-13",
  sections: [
    {
      id: "problem",
      title: "只加了一个租户，为什么保存按钮的判断要再写四层分支？",
      paragraphs: [
        "基础产品用中文“保存”和纵向布局。Acme 的中文要把按钮写成“提交笔记”，英文布局要并排。实现写成如果租户是 Acme 且语言是英文就用并排，否则如果是 Acme 且是中文就换文案。第二个租户到来时，每个字段都再乘一层。漏掉的组合会落到错误的语言，或者把上一个租户的函数配置执行进页面。",
        "文案和布局应是按租户与语言存放的字面量。查找先要当前语言，再回退，而不是在组件里枚举租户。本篇用一张固定表演示顺序，不加载真实语言包，也不格式化日期。"
      ]
    },
    {
      id: "environment",
      title: "复现环境：先当前语言，再基础租户，最后才回到中文",
      paragraphs: [
        "运行 npm run verify:k13。表里有 base 和 acme 的中文、英文行，但不是每格都有值。resolve 的顺序是租户加当前语言、base 加当前语言、租户加 zh、base 加 zh。某一格有该字段就返回，四格都没有则 missing。",
        "因此 Acme 的英文保存不会先拿中文“提交笔记”，而会落到 base 的 Save。acceptValue 只接受字符串、数字和布尔值。函数返回 rejected，配置不能变成可执行代码。"
      ]
    },
    {
      id: "lookup",
      title: "同一语言的基础文案，优先于租户的另一种语言",
      paragraphs: [
        "Acme 中文保存是“提交笔记”，因为 acme:zh 自己有这个字段。Acme 英文保存是 Save：acme:en 没有 save，下一格 base:en 有。Acme 英文布局是 split，中文布局没有专属值，落到 base 的 stack。不存在的 color 是 missing。base 英文保存就是 Save。",
        "若把租户默认语言放在当前语言的基础文案之前，英文界面会显示中文按钮。这个顺序故意先保语言一致，再使用租户覆盖。租户没有翻译时，用户看到的是基础产品的同语言文案，而不是另一种语言的租户文案。"
      ],
      examples: [
        {
          language: "javascript",
          code: `const rows = {
  'base:zh': { save: '保存', layout: 'stack' },
  'base:en': { save: 'Save', layout: 'stack' },
  'acme:zh': { save: '提交笔记' },
  'acme:en': { layout: 'split' },
};
function resolve(tenant, locale, field) {
  const chain = [tenant + ':' + locale, 'base:' + locale, tenant + ':zh', 'base:zh'];
  for (const key of chain) {
    const row = rows[key];
    if (row && Object.hasOwn(row, field)) return row[field];
  }
  return 'missing';
}
console.log('中文保存:' + resolve('acme', 'zh', 'save'));
console.log('英文保存:' + resolve('acme', 'en', 'save'));
console.log('英文布局:' + resolve('acme', 'en', 'layout'));
console.log('中文布局:' + resolve('acme', 'zh', 'layout'));
console.log('缺失:' + resolve('acme', 'en', 'color'));
console.log('基础:' + resolve('base', 'en', 'save'));`,
          expectedOutput: [
            "中文保存:提交笔记",
            "英文保存:Save",
            "英文布局:split",
            "中文布局:stack",
            "缺失:missing",
            "基础:Save"
          ],
          explanation: [
            "英文保存跳过了 acme:zh 里的“提交笔记”，因为 base:en 出现在租户中文之前。语言没有配齐时，不会把另一种语言的租户文案当成翻译。",
            "中文布局在 acme:zh 没有该字段，于是用 base:zh 的 stack。color 四级都没有，返回 missing，调用方不能把空字符串假装成已配置。"
          ]
        }
      ]
    },
    {
      id: "literal",
      title: "配置值停留在数据，函数和分支留给代码里的少数规则",
      paragraphs: [
        "字符串“保存”是 literal。函数返回 rejected。租户差异若通过配置里的函数读取页面状态，每个租户都会带进一份脚本，审核和回退都无法只比较数据。",
        "布局名 split 或 stack 仍是数据。真正的排版规则留在组件里，按这个名字选择已有布局。不要让配置返回一段样式或一个组件。新增租户时加一行字面量，而不是再写一层 if。"
      ],
      examples: [
        {
          language: "javascript",
          code: `function acceptValue(value) {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return 'literal';
  return 'rejected';
}
console.log('字面量:' + acceptValue('保存'));
console.log('数字:' + acceptValue(2));
console.log('布尔:' + acceptValue(false));
console.log('函数:' + acceptValue(() => '保存'));
console.log('对象:' + acceptValue({ save: '保存' }));`,
          expectedOutput: [
            "字面量:literal",
            "数字:literal",
            "布尔:literal",
            "函数:rejected",
            "对象:rejected"
          ],
          explanation: [
            "false 也是字面量，不能因为布尔值为假就当成缺配置。缺配置应由字段不存在表示，而不是由 false 表示。",
            "函数和对象都被拒绝。嵌套对象会把新的条件结构带回来，所以这一层只收标量。"
          ]
        }
      ]
    },
    {
      id: "scale",
      title: "租户覆盖只写和基础不同的字段，翻译缺失要看得见",
      paragraphs: [
        "acme:zh 只写了 save，没有重复 layout。查找会补上基础布局。这样新增字段时，多数租户不用同时改一遍。覆盖字段要能说出和基础的差别，避免复制整份配置后只改一个字，以后基础改了租户仍是旧副本。",
        "missing 应进入翻译检查，而不是在界面上显示字段名。日期、数字和复数仍交给 Intl 等专门格式化，不要把每种格式都放进这张字符串表。语言回退的默认 zh 是本模型的基础语言，不是所有产品的默认语言。"
      ]
    },
    {
      id: "boundaries",
      title: "查找顺序不格式化日期，字面量检查也不读取外部配置服务",
      paragraphs: [
        "模型没有时区、复数和双向文本。Save 和“保存”只是表里的字符串。货币和日期要用对应语言的格式化器，并单独测试舍入和历法。",
        "四层顺序是作者选定的。若产品要求租户默认语言优先于基础产品的当前语言，英文就可能显示“提交笔记”。换顺序前要有这种例子，而不是只说回退到默认。",
        "acceptValue 不执行配置，也不证明配置来源可信。远程配置仍要校验类型和允许的布局名，拒绝后再使用基础字面量。"
      ]
    },
    {
      id: "practice",
      title: "为一个新租户只加不同的字段，并写出每种语言的回退结果",
      paragraphs: [
        "给 Acme 写中文保存、英文布局，然后查英文保存和中文布局分别落在哪一格。再确认函数和对象不能作为配置值。缺失字段保持 missing，不要自动显示键名。",
        "本主题没有已开放的独立练习。表里的租户名和文案不是生产语言包。"
      ]
    }
  ],
  sources: [
    { title: "MDN：Intl", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl" },
    { title: "W3C：国际化", url: "https://www.w3.org/International/questions/qa-i18n" },
    { title: "Unicode：LDML", url: "https://www.unicode.org/reports/tr35/tr35.html" }
  ]
};
