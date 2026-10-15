import type { Article } from "../articles";

export const mocksAndContractsArticle: Article = {
  id: "K12-03",
  kind: "knowledge",
  domainSlug: "testing",
  slug: "mocks-and-contracts",
  title: "Mock、替身与契约",
  summary: "用笔记保存说明固定成功替身何时只够检查界面反应，何时会藏住缺字段、冲突和超长正文。",
  aliases: ["test double", "mock", "contract test", "测试替身"],
  tags: ["测试", "替身"],
  estimatedMinutes: 23,
  verifiedAt: "2026-10-13",
  sections: [
    {
      id: "problem",
      title: "保存测试全绿，为什么缺了 id 的笔记仍显示已保存？",
      paragraphs: [
        "笔记页的测试把保存函数换成一个固定返回成功的替身，再断言按钮变成“已保存”。缺 id、重复 id 和超长正文都会走这条成功分支，因为替身根本不看参数。测试证明了界面在收到成功结果时怎么变化，没有证明保存双方交换的字段和状态码。",
        "替身、假实现和只记录调用的探针回答的是不同问题。先写这次测试要支持的结论，再决定替身能不能越过那条边界。K12-01 把层次分开；本篇只判断一种替身是否配得上它所声称的证据。"
      ]
    },
    {
      id: "environment",
      title: "复现环境：固定主张与内存保存，不启动测试框架",
      paragraphs: [
        "运行 npm run verify:k12。reviewDouble 只接受 ui-reaction 或 save-contract，替身种类只接受 stub、fake、spy，响应形状只接受 status-id 或 ok-flag。其他输入返回 invalid。内存保存使用 Map，上限 20 是本模型的拒绝条件，不是产品文案长度。",
        "stub 不执行对端。spy 只表示测试记录了调用。fake 表示内存里有一份同形状的保存规则。这些词是本篇的分类，不是某个框架的 API 名称。"
      ]
    },
    {
      id: "review",
      title: "先写要证明的结论，再决定替身能不能越过边界",
      paragraphs: [
        "save-contract 要证明请求和响应是否符合保存规则。此时 stub 直接返回 masks-contract，spy 返回 call-only，因为两者都没有执行对端规则。fake 还必须使用 status-id；ok-flag 返回 fake-wrong-shape，形状正确才是 in-memory-contract。",
        "ui-reaction 只证明调用方怎样处理一份已经给出的结果。结果若是 ok-flag，返回 wrong-branch，因为界面合同看的是状态码和 id。形状正确时，stub 和 fake 都是 reaction-only；spy 没有给出结果，返回 no-result。预期依次是 masks-contract、call-only、fake-wrong-shape、in-memory-contract、wrong-branch、reaction-only、no-result、reaction-only、invalid。"
      ],
      examples: [
        {
          language: "javascript",
          code: `function reviewDouble(claim, standIn) {
  const claims = ['ui-reaction', 'save-contract'];
  const kinds = ['stub', 'fake', 'spy'];
  const shapes = ['status-id', 'ok-flag'];
  if (!claims.includes(claim) || !kinds.includes(standIn.kind) || !shapes.includes(standIn.responseShape)) return 'invalid';
  if (claim === 'save-contract' && standIn.kind === 'stub') return 'masks-contract';
  if (claim === 'save-contract' && standIn.kind === 'spy') return 'call-only';
  if (claim === 'save-contract' && standIn.responseShape !== 'status-id') return 'fake-wrong-shape';
  if (claim === 'save-contract') return 'in-memory-contract';
  if (standIn.responseShape !== 'status-id') return 'wrong-branch';
  if (standIn.kind === 'spy') return 'no-result';
  return 'reaction-only';
}
const rows = [
  ['save-contract', 'stub', 'ok-flag'],
  ['save-contract', 'spy', 'status-id'],
  ['save-contract', 'fake', 'ok-flag'],
  ['save-contract', 'fake', 'status-id'],
  ['ui-reaction', 'stub', 'ok-flag'],
  ['ui-reaction', 'stub', 'status-id'],
  ['ui-reaction', 'spy', 'status-id'],
  ['ui-reaction', 'fake', 'status-id'],
  ['note', 'stub', 'status-id'],
];
for (const [claim, kind, responseShape] of rows) {
  console.log(claim + '/' + kind + '/' + responseShape + ':' + reviewDouble(claim, { kind, responseShape }));
}`,
          expectedOutput: [
            "save-contract/stub/ok-flag:masks-contract",
            "save-contract/spy/status-id:call-only",
            "save-contract/fake/ok-flag:fake-wrong-shape",
            "save-contract/fake/status-id:in-memory-contract",
            "ui-reaction/stub/ok-flag:wrong-branch",
            "ui-reaction/stub/status-id:reaction-only",
            "ui-reaction/spy/status-id:no-result",
            "ui-reaction/fake/status-id:reaction-only",
            "note/stub/status-id:invalid"
          ],
          explanation: [
            "保存合同先拒绝 stub 和 spy，因为它们不执行对端。fake 还要核对响应形状，ok-flag 不能驱动真实的状态码分支。",
            "界面反应允许 stub，但只接受 status-id。spy 即使形状正确也不提供结果。note 不是两种主张之一，返回 invalid，避免一个拼写被当成已分类的证据。"
          ]
        }
      ]
    },
    {
      id: "fake",
      title: "固定成功不看参数；内存假实现会拒绝缺字段、冲突和超长",
      paragraphs: [
        "cannedSave 忽略传入的笔记，始终返回 201 和 id generated。因此 { text: 'hi' } 也会被说成已保存。内存假实现先要求可修剪的 id 和字符串正文，超长返回 413，重复 id 返回 409，成功时保存修剪后的 id 并能读回正文。",
        "预期：stub 仍是 generated；缺 id 为 400；' n1 ' 保存为 n1 且读回 hi；再次保存 n1 为 409；21 个字符为 413。假实现暴露了替身藏住的三条失败路径，但它仍然只是 Map。"
      ],
      examples: [
        {
          language: "javascript",
          code: `function cannedSave(note) {
  return { status: 201, body: { id: 'generated' } };
}
function createFake() {
  const rows = new Map();
  return {
    save(note) {
      if (!note || typeof note.id !== 'string' || !note.id.trim()) return { status: 400, body: null };
      if (typeof note.text !== 'string' || note.text.length > 20) return { status: 413, body: null };
      const id = note.id.trim();
      if (rows.has(id)) return { status: 409, body: null };
      rows.set(id, note.text);
      return { status: 201, body: { id } };
    },
    read(id) {
      const text = rows.get(id);
      return text === undefined ? 'missing' : text;
    },
  };
}
const fake = createFake();
console.log('stub:' + JSON.stringify(cannedSave({ text: 'hi' })));
console.log('缺id:' + JSON.stringify(fake.save({ text: 'hi' })));
console.log('保存:' + JSON.stringify(fake.save({ id: ' n1 ', text: 'hi' })));
console.log('读回:' + fake.read('n1'));
console.log('冲突:' + JSON.stringify(fake.save({ id: 'n1', text: 'again' })));
console.log('过长:' + JSON.stringify(fake.save({ id: 'n2', text: 'x'.repeat(21) })));`,
          expectedOutput: [
            'stub:{"status":201,"body":{"id":"generated"}}',
            '缺id:{"status":400,"body":null}',
            '保存:{"status":201,"body":{"id":"n1"}}',
            "读回:hi",
            '冲突:{"status":409,"body":null}',
            '过长:{"status":413,"body":null}'
          ],
          explanation: [
            "cannedSave 的参数 note 没有被读取，所以缺 id 仍得到 201。假实现把 id 修剪后再保存，读回使用同一个键 n1。",
            "409 说明第二次写入没有覆盖正文；413 发生在写入之前。只断言“函数被调用过”会让这三条路径全部消失。"
          ]
        }
      ]
    },
    {
      id: "contract",
      title: "契约检查的是双方实际交换的样本，不是替身的调用次数",
      paragraphs: [
        "保存方和存储方可以各自用替身通过测试，却对 id 是否修剪、冲突用 409 还是 200 有不同约定。契约样本应使用双方都会见到的请求和响应：方法、路径、正文、状态码和返回 id。样本要包含成功、缺字段、冲突和超长，而不是只留一条 201。",
        "in-memory-contract 表示假实现遵守了本篇写下的形状和规则，可以在调用方测试里代替远端。它不代替对真实存储的检查。真实存储还要证明事务完成、刷新后读回和失败时没有留下半条记录。调用次数只能说明代码走到了保存入口。"
      ]
    },
    {
      id: "boundaries",
      title: "内存假实现不证明配额，调用记录也不证明响应被正确使用",
      paragraphs: [
        "Map 没有配额、持久化和跨标签冲突。保存合同若包含这些平台行为，假实现的通过不能拿来声称已经覆盖。此时需要能拒绝写入的真实或足够接近的存储，并检查原笔记还在。",
        "reaction-only 也不能累加成端到端证据。界面测试使用 status-id 的 stub 是合理的，报告里应写明对端没有运行。把同一条测试同时算作“界面正确”和“保存正确”，结论就超过了替身实际提供的事实。",
        "契约样本本身会过时。字段改名后，如果生产代码和样本一起改错，双方仍会一致。样本的预期应来自已经确认的接口说明或一条真实交换记录，不能从当前实现反推后再用来证明该实现。"
      ]
    },
    {
      id: "practice",
      title: "给每个替身写一句它允许支持的结论",
      paragraphs: [
        "新增保存测试时先选 ui-reaction 或 save-contract。界面分支使用带状态码和 id 的结果，并分别给出 201、409 和 400。保存规则使用会拒绝缺字段、冲突和超长的假实现或真实存储。报告里不要把 call-only 写成合同已验证。",
        "本主题没有已开放的独立练习。示例里的 generated 和长度 20 只属于这个模型。"
      ]
    }
  ],
  sources: [
    { title: "Martin Fowler：Mocks Aren't Stubs", url: "https://martinfowler.com/articles/mocksArentStubs.html" },
    { title: "Martin Fowler：Contract Test", url: "https://martinfowler.com/bliki/ContractTest.html" },
    { title: "Testing Library：测试指导原则", url: "https://testing-library.com/docs/guiding-principles/" }
  ]
};
