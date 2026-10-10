# 数据模型、持久化与恢复

## 边界

公共知识内容来自版本化静态资源；个人学习数据存 IndexedDB。P0 无账户、服务器数据库、自动云备份。用户数据不会因文章构建重新生成而覆盖。

域名/端口变化视为不同 origin，数据不会自动迁移；导出/导入用于换设备或地址。私密浏览、配额不足或系统清理可能导致数据不可持久保存，首次使用与设置页用一句话说明，并提供备份入口。

## 领域实体

| 实体 | 主键与字段 | 不变量 |
| --- | --- | --- |
| ContentManifest | contentId、kind、revision、slug、title、status、关系 | 构建校验唯一 ID 与引用 |
| ReadingProgress | contentId、status、headingId、scrollOffset、updatedAt | in-progress/read；缺失代表未读 |
| Bookmark | contentId、createdAt、titleSnapshot | 每内容一条 |
| Note | noteId、contentId、headingId(可空)、text、revision、updatedAt、titleSnapshot | 内容+章节唯一；revision 乐观并发控制 |
| CardProgress | cardId、cardRevision、stage、lastRating、lastReviewedAt、intervalDays、dueDate、paused、revision | stage 0..6；首次未评分字段可空 |
| ReviewEvent | eventId、sessionId、cardId、cardRevision、rating、before、after、occurredAt、timezone、algorithmVersion、revertedAt | eventId 唯一；评分快照完整 |
| ReviewSession | sessionId、cardsSnapshot、cursor、status、startedAt、timezone、answerDraft、answerRevealed、revision | 一次一个 active；cursor 与评分一致 |
| ExerciseDraft | exerciseId、exerciseRevision、attemptId、code、codeRevision、updatedAt、revision | 每题一个当前草稿 |
| ExerciseAttempt | attemptId、exerciseId、exerciseRevision、startedAt、endedAt、assistanceLevel、selfReportedHelp、reflection | 揭示辅助后本次不能转回 independent |
| ExerciseRun | runId、attemptId、codeRevision、codeSnapshot、status、caseResults、durationMs、createdAt | 绑定运行快照，不等同当前代码 |
| ExerciseEvidence | evidenceId、exerciseId、exerciseRevision、attemptId、runId、completionKind、completedAt | 仅全部通过生成；保留长期证据 |
| WeakMarker | contentId、createdAt、reasonText | 仅保存手动标记，自动原因派生 |
| Preferences | singleton、dailyLimit、studyTimezone、bodySize、runShortcut、lastExportAt | 白名单值，损坏字段回默认 |
| DatasetMeta | schemaVersion、datasetRevision、createdAt、contentBuildId、activeSessionId | 不用 schemaVersion 代表内容版本；单一活动会话 |

个人随机 ID 用平台随机 UUID；内容 ID 来自清单。事件时间为 UTC ISO 时刻；dueDate 是受控时区里的 YYYY-MM-DD，语义见 06。不由 UI 手工拼装非法联合状态。

## 保存策略

笔记/草稿编辑后 500 ms 保存；离开输入框或站内切页前立即尝试保存，不能依赖卸载事件完成异步数据库写入。只有事务提交后才显示“已保存”。异常时保留内存版本，提供复制/下载。

评分、收藏、暂停订阅与设置即时事务提交。乐观 UI 在写入失败时回滚；评分等待成功再进入下一卡。自动保存不生成学习历史；运行与主动新尝试才生成历史节点。

写入层返回成功/校验错误/配额不足/版本冲突/不可用，不能吞异常。UI 不直接访问数据库，写操作通过统一领域接口进入事务。

## 多标签页与冲突

每条可变记录带 revision。提交时事务内比较读取版本：相同则加一写入，不同则返回冲突。通过 BroadcastChannel 或等价机制通知其他标签页刷新只读视图；一致性由事务内比较保证，不能只靠通知。

笔记/代码冲突展示“此内容已在另一页面更新”，保留两份文本，可选择加载新版本或明确以本页覆盖。评分冲突重新加载卡片后再操作。导入/清除期间所有标签页进入维护态；未保存输入先处理，不能整库替换后悄悄丢弃。

创建会话与设置 activeSessionId 在同一事务内完成。两标签页同时点开始时只有一个事务创建成功，另一页恢复已存在会话。结束会话时核对 ID 再清空，不能清掉另一场新会话。

## 导出

用户主动下载 zhixu-backup-YYYY-MM-DD.json。包含 exportFormat、schemaVersion、exportedAt、studyTimezone、contentBuildId、各个人实体；不打包公共文章、运行器、依赖、API Key 或浏览器其他数据。

导出读取同一一致性快照。下载启动成功后才记录导出时间，界面写“上次发起导出”；浏览器不能证明用户已永久保存文件。导入替换前要求用户确认备份文件已保留。

下载旁提示“备份包含你的笔记与代码，请妥善保存”。首版不加密备份，不承诺保密存储。

## 导入：只提供全量替换

不在 P0 做合并，避免同一卡片的复习历史冲突难以解释。

1. 文件上限 50 MiB，UTF-8 JSON；拒绝压缩包、可执行格式与顶层结构不符。
2. 预校验：格式版本、字段类型/长度、枚举、ID 唯一、引用完整、日期合法、整体尺寸；未知字段不进入实际写入结构。
3. 比当前 schema 新的备份阻止导入；旧版本仅按明确迁移链转化，不猜缺失字段。失败不写当前数据。
4. 预览：将替换的笔记/草稿/评分/收藏数量、时间、内容版本；旧内容 ID 找不到标归档，不丢私人记录。
5. 导出当前数据并等待用户确认已保留；显示“替换个人数据”按钮与影响范围。
6. 在新 dataset 中写入全部数据，核验后切换 activeDatasetId。当前笔记/草稿实现把暂存、核验、切换放在同一 IndexedDB 事务中，任何一步失败整笔回滚，保持原数据集；页面不能读到中间状态。
7. 旧数据集作为恢复点保留，导入后允许“恢复导入前数据”；清理恢复点需主动确认。再次导入前先处理旧恢复点。
8. 刷新视图，显示导入数量与孤立内容数；不能执行导入的任何代码文本。

过程失败可重试，不能先清空旧数据再写新数据。空间不足时先取消暂存数据集，不删除原数据。P0 只保留一个恢复数据集。恢复点不是长期备份，不替代用户下载。

## schema 升级与内容升级

schema 升级先备份可读旧数据，执行经 fixture 验证的迁移；失败不把空库当作新用户。升级代码要支持恢复提示或导出旧格式，不静默重建。

内容升级只更新清单与内容资源。slug 用 ID 映射，标题快照用于归档项。题目 revision 变化：保留旧草稿，只读展示并提示“题目已更新”，可复制到新尝试；旧通过不算新版独立通过。不能自动把旧接口代码放进新题运行。

## 容量与保留

笔记 20,000 字符/条，草稿 100,000 字符/题；单次结果载荷 256 KiB、控制台 200 行且总文本最多 64 KiB。过量输出截断并说明。

评分历史不自动删除。运行详细快照按 06 保留；长期 Evidence 与辅助记录不裁剪。空间达到浏览器估计配额 80% 时提示导出与清理运行详情；无法获取配额时不显示伪造数值。

## 私人数据保护

默认无第三方统计、远程字体、上传日志。错误日志不含笔记正文、代码或备份内容。清除仅删除本应用命名的数据集；取消确认不得部分清理。个人资料按纯文本或净化 Markdown 渲染，导入文件不是信任来源。
