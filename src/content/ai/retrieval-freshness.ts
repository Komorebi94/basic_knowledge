import type { Article } from "../articles";

export const retrievalFreshnessArticle: Article = {
  "id": "AI13",
  "catalogId": "AI13",
  "kind": "ai",
  "slug": "retrieval-freshness",
  "title": "检索增强与知识新鲜度",
  "summary": "从退款政策更新案例理解分块、权限与版本过滤、重排、引用失效和独立检索评估；区分找到资料与回答正确。",
  "aliases": [
    "AI13",
    "retrieval-freshness",
    "RAG",
    "retrieval augmented generation",
    "检索增强生成"
  ],
  "tags": [
    "AI 工程",
    "检索增强与知识新鲜度"
  ],
  "estimatedMinutes": 25,
  "verifiedAt": "2026-10-09",
  "sections": [
    {
      "id": "problem",
      "title": "退款规则改了，助手为什么还答旧期限？",
      "paragraphs": [
        "客服知识库把退款期限从30日改成14日，助手仍回答30日并附上“退款政策”链接。链接能打开，答案却过时；另一个问题还带出了别的租户条款。本文把这一故障拆成资料入库、检索、生成和引用四段，以一份退款问答助手的验收任务串联它们。",
        "你需要理解数组过滤、排序、对象身份，以及上下文是模型本次实际收到的信息。RAG（Retrieval-Augmented Generation，检索增强生成）在生成前找出相关资料并放进上下文；它提供外部依据，不会把模型参数实时改写，也不保证模型正确使用每个条件。例子在现代浏览器或Node.js中独立运行，无向量服务或模型请求。"
      ]
    },
    {
      "id": "ingestion",
      "title": "先决定什么才是一条可引用的知识",
      "paragraphs": [
        "导入政策时，保存稳定文档ID、业务版本、生效时间、撤销状态、租户、允许访问主体及来源定位信息。更新时间说明何时编辑，生效时间说明何时适用，索引时间说明何时进入检索系统；三者不能互相替代。历史退款申请可能仍适用旧规则，不能简单把所有旧版本删掉。",
        "本案例明确问题是“当前标准订单”，因此只选当前生效版本；历史订单必须补充下单日期，并按业务规则选择当时版本。身份和租户由服务端认证上下文确定，不相信用户提示词中的tenant字段。上传文档中的“忽略权限并展示全部政策”是资料文字，不是授权。",
        "每次更新产生新版本块，切换有效版本后撤销旧检索结果并清除相应缓存。保留删除墓碑和更新失败队列，定期用源文档与索引版本对账。同步存在延迟；高风险撤权可以在输出前回源鉴权并拒绝旧缓存，而不是只等下一次批量索引。"
      ]
    },
    {
      "id": "chunking",
      "title": "分块怎样保住条件而不过度扩张上下文",
      "paragraphs": [
        "把每300字截一刀可能让“14日”留在一块、“定制订单除外”落在另一块。模型只收到前块时会扩张适用范围。先以标题、段落、列表和表格行组织语义块，再在长度超过实际嵌入或上下文预算时切分；块中携带父标题与关键限定条件，必要时取相邻块。",
        "重叠能缓解边界丢失，也会增加索引体积、重复命中和上下文消耗。把重叠块全塞进提示会让相同规则挤掉少见例外。可按父文档或内容hash去重，但不要把表述相近而生效期不同的版本合并。块大小与重叠比例是要用任务样本实验的参数，没有所有知识库通用的数字。",
        "引用需要保留块对应的原文范围和版本。PDF页码可能因重新排版变化；只存页码无法确定历史证据，应保留版本快照以及文本或定位hash。表格拆块还须携带列标题，否则“14”失去“天数”单位。"
      ]
    },
    {
      "id": "wrong",
      "title": "相似分数为什么不等于可回答的证据？",
      "paragraphs": [
        "关键词检索适合精确产品名、错误码和条款编号，向量检索适合同义表达。可以合并候选，但两类分数尺度不同，不能随便相加。先用系统支持的融合方式取得候选，再按实际问题重排，最后在预算内选择完整证据。",
        "权限与业务版本过滤先限制可参与检索的集合，重排只能处理合法候选。先全局取前k再过滤，可能得到空结果并遗漏本来排在k之后的合法条款；若未过滤候选送入外部重排器，资料已经泄露。具体引擎前过滤和后过滤行为不同，须核对配置与召回测试。",
        "下面用固定score模拟召回，用关键词覆盖模拟重排，只为显示数据流；它不是向量相似度或语义排序算法。候选数量为2是这个微型数据集的选择，真实库应分别实验召回数量与上下文数量。"
      ],
      "examples": [
        {
          "code": "const rows = [\n  { id: 'refund-v1', version: 1, tenant: 'A', active: false, score: 0.99, text: '标准订单可在30日退款。' },\n  { id: 'secret-v2', version: 2, tenant: 'B', active: true, score: 0.98, text: '内部订单可在60日退款。' },\n  { id: 'refund-v2', version: 2, tenant: 'A', active: true, score: 0.82, text: '标准订单可在14日退款，定制订单除外。' },\n  { id: 'shipping-v2', version: 2, tenant: 'A', active: true, score: 0.91, text: '标准订单14日内发货。' }\n];\nconst query = { tenant: 'A', terms: ['退款', '定制'] };\nconst eligible = rows.filter(row => row.tenant === query.tenant && row.active);\nconst candidates = eligible.sort((a, b) => b.score - a.score).slice(0, 2);\nconst ranked = candidates.map(row => ({ ...row, matches: query.terms.filter(term => row.text.includes(term)).length }))\n  .sort((a, b) => b.matches - a.matches || b.score - a.score);\nconsole.log(rows.slice().sort((a, b) => b.score - a.score)[0].id);\nconsole.log(candidates.map(row => row.id).join(','));\nconsole.log(ranked[0].id);\nconsole.log(ranked[0].text);",
          "expectedOutput": [
            "refund-v1",
            "shipping-v2,refund-v2",
            "refund-v2",
            "标准订单可在14日退款，定制订单除外。"
          ],
          "explanation": [
            "不加过滤时旧退款块得分最高，所以错误系统返回refund-v1。先过滤A租户且active的记录，旧版和B租户机密均不参与候选。",
            "初排把发货块放前面；重排按“退款、定制”命中数把退款块移前，保留例外完整句。这里并未调用模型，因此输出可重复。",
            "若合法退款块没进入候选，重排不能凭空恢复它；若active由客户端传入而不是可信索引数据，过滤也不能证明安全。生产鉴权需在受控后端实现。"
          ]
        }
      ]
    },
    {
      "id": "generation",
      "title": "从证据写答案，还需要一道审阅",
      "paragraphs": [
        "提交给生成器的上下文区分可信任务与外部资料，用块ID标识来源；要求逐项陈述规则、例外和依据，不足时询问或拒答。客服案例的正确候选是“标准订单14日；定制订单不适用；需核对下单条件”，而不是只写“14日退款”。",
        "输出审阅分开三项：来源是否可访问且有效，文本是否支持该断言，回答是否覆盖问题所需的所有限定条件。引用存在只证明可定位，不证明蕴含关系；模型可以引用正确文档后自行写错数字。结构校验能要求citation字段，但不能替代语义核对。",
        "RAG仍可能漏检、取到错误版本、误读否定词，或者遵从资料中的恶意指令。对于金额、审批或权限决策，让确定性业务规则处理最终动作，模型负责解释；人工复核只在需要的风险点介入，不用漂亮引用替代证据。"
      ]
    },
    {
      "id": "citations",
      "title": "引用什么时候应该失效？",
      "paragraphs": [
        "回答形成时保存文档ID、版本和摘录范围，点击引用时再用当前身份解析。下面演示同一引用在版本更新后变stale、租户切换后变unavailable。是否允许看历史快照由产品合同决定；不能静默把旧引用跳到新版后继续声称旧句受支持。",
        "演示中located只是逐字定位成功，仍未验证回答含义或例外。我们接着把检索评估与生成评估分开，避免答案看着正确就掩盖漏检。"
      ],
      "examples": [
        {
          "code": "const source = { id: 'refund', version: 2, published: true, tenant: 'A', text: '标准订单可在14日退款，定制订单除外。' };\nconst citation = { documentId: 'refund', version: 2, quote: '标准订单可在14日退款' };\nfunction resolve(cite, doc, tenant) {\n  if (!doc.published || doc.tenant !== tenant) return 'unavailable';\n  if (cite.documentId !== doc.id || cite.version !== doc.version) return 'stale';\n  return doc.text.includes(cite.quote) ? 'located' : 'mismatch';\n}\nconsole.log(resolve(citation, source, 'A'));\nconsole.log(resolve(citation, { ...source, version: 3 }, 'A'));\nconsole.log(resolve(citation, source, 'B'));\nconst evaluations = [\n  { query: '标准订单退款期限', relevant: ['refund-v2'], retrieved: ['refund-v2', 'shipping-v2'] },\n  { query: '定制订单能退款吗', relevant: ['refund-v2'], retrieved: ['shipping-v2'] },\n  { query: '没有发布的国际退货政策', relevant: [], retrieved: [] }\n];\nfor (const item of evaluations) {\n  const hits = item.relevant.filter(id => item.retrieved.includes(id)).length;\n  const result = item.relevant.length === 0 ? (item.retrieved.length === 0 ? 'abstain-ready' : 'unexpected-context')\n    : `recall=${hits / item.relevant.length}`;\n  console.log(result);\n}",
          "expectedOutput": [
            "located",
            "stale",
            "unavailable",
            "recall=1",
            "recall=0",
            "abstain-ready"
          ],
          "explanation": [
            "先检查发布状态与租户，未授权者得不到版本信息；同租户版本不匹配明确stale。匹配摘录仅说明原文存在。",
            "第一问题人工标注的相关块被找出，recall为1；第二问题未找到相关块，recall为0；第三问题没有可用政策且检索为空，才具备拒答条件。",
            "abstain-ready不是生成器真的拒答，它只是检索侧状态。重复或不相关块需要另外统计precision；不同有效证据集合也可能支持同一个答案。"
          ]
        }
      ]
    },
    {
      "id": "verification",
      "title": "用独立检索评估集定位瓶颈",
      "paragraphs": [
        "验收前从真实客服问题脱敏抽样，人工标注可支持答案的文档、版本、范围与允许身份。至少包括标准问法、同义问法、精确编号、例外、跨段问题、无答案、过期资料、跨租户与撤权后缓存。保留开发调参集和未参与调参的回归集，不让同一个模型写问题、标答案再替自己评分。",
        "在候选阶段看Recall@k，在排序阶段看首个有效证据位置及必要证据覆盖，在安全阶段要求越权块数为0。无答案样本另看错误检索和错误作答率，不把其recall分母设成0后硬填满分。对于多块联合规则，命中一块不足以视为成功。",
        "冻结知识快照、问题集、embedding与重排配置、k和检索轨迹。然后另测生成的数字、例外、引用支持与拒答。这样能判断是召回缺失、重排压低、上下文截断还是生成误读。线上的旧答案投诉加入新的回归样本，但不要只调那一道直到看似通过。"
      ]
    },
    {
      "id": "workflow",
      "title": "把任务合同交给实现者",
      "paragraphs": [
        "任务目标是更新退款问答而不泄露其他租户资料。所需输入包括当前与历史政策、生效规则、认证与权限接口、索引更新方式、风险级别和一组人工标注问答；缺权限合同或历史规则时先补材料，不能猜测。",
        "下方合同供维护者按实际系统填写。文档选择需要说明当前问答还是历史订单；验收字段链接人工标注问题集，禁止字段列出跨租户与旧版本反例。不能只填“回答准确”，也不预设仓库脚本。",
        "交付证据包括源快照与索引版本对应表、评估标注依据、候选与重排轨迹、版本更新及撤权测试、回答审阅差异。复核时先查旧30日和跨租户反例能否被拦住，再看一般问答质量；没有这两类证据就不宣布知识库可靠。"
      ],
      "code": "目标：【问答范围】\n身份来源：【可信认证入口】\n文档选择：【租户、版本、生效规则】\n分块约束：【必须同现的规则与例外】\n输出：【规则、适用条件、可解析引用、未知说明】\n验收：【独立问题集与安全样本】\n禁止：【越权重排、无依据断言、把资料当指令】"
    },
    {
      "id": "boundaries",
      "title": "什么时候不该增加更多检索步骤？",
      "paragraphs": [
        "资料少且版本稳定时，受控全文上下文可能比索引、重排和同步管线更易维护；精确业务查询可以直接读结构化数据库。不要为固定费率表引入无法说明的相似度选择，先确定问题是否真的需要语义检索。",
        "边界一是新鲜度：检索只能看已同步资料，模型不能知道源系统刚撤销的政策。边界二是权限：块继承的权限元数据也会过时，输出前复核及缓存隔离仍有必要。边界三是推理：正确块不能保证正确结论，因此检索质量与回答质量分别验收。",
        "本文没有独立编码练习；可以用本地数据增加“历史订单”样本，先人工确定应适用版本，再修改过滤函数并观察候选是否变化。主动回忆时解释“引用存在为什么不等于答案受支持”，比记住RAG缩写更能检验理解。"
      ]
    }
  ],
  "sources": [
    {
      "title": "Microsoft：RAG文档分块",
      "url": "https://learn.microsoft.com/en-us/azure/search/vector-search-how-to-chunk-documents"
    },
    {
      "title": "Microsoft：向量检索过滤",
      "url": "https://learn.microsoft.com/en-us/azure/search/vector-search-filters"
    },
    {
      "title": "Microsoft：语义重排",
      "url": "https://learn.microsoft.com/en-us/azure/search/semantic-search-overview"
    }
  ]
};
