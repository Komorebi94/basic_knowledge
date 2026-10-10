# P0 持久化配额验证范围

执行 `node scripts/verify-real-quota.mjs`，服务地址默认 `http://127.0.0.1:5173`。脚本用临时 Chrome 浏览器上下文；不连接用户现有浏览器数据。每轮生成 1,600,000 字节 ASCII 草稿文本，未通过写满磁盘制造错误。

最新实际数据见 [JSON 报告](p0-real-quota-report.json)，其中记录浏览器版本、站点使用量、CDP 额度、原生错误及恢复结果。

真实浏览器检查用 [CDP Storage.overrideQuotaForOrigin](https://chromedevtools.github.io/devtools-protocol/tot/Storage/#method-overrideQuotaForOrigin) 将原站点额度设为当前使用量加 128 KiB。先等 32 秒，使 Chromium 的 IndexedDB 额度缓存失效；[Chromium 源码](https://chromium.googlesource.com/chromium/src/+/1ef1c1e6d3d38a1f19cb1c21c65c62364c4c60af/content/browser/indexed_db/instance/bucket_context.h) 记录该缓存最长 30 秒。第一次立即导入曾被已有额度缓存放行，因此脚本不能省去等待，或仅凭设置额度就宣称配额拒绝通过。

检查 1.6 MB schema1 导入时，捕获原生 `IDBTransaction.error.name === 'QuotaExceededError'`，确认应用返回 `quota`；导入前后整个应用数据库的元数据及所有数据集记录严格相同，私人原文可读，无新旧混库。解除额度限制后，同一备份能够成功导入，再恢复前一数据集，旧记录原文和学习状态严格相同，恢复点继续保留。

恢复、丢弃恢复点、删除记录、清理应用数据，通常只修改少量元数据或减少空间，不能据此可靠制造真实额度耗尽。这四项另用明确标注的事务中止和 `QuotaExceededError` getter 注入，验证错误分类与整库原子回滚；这部分属于故障注入，不属于真实配额耗尽。脚本还断言没有未捕获浏览器异常。

这是单一 Chrome 版本的受控站点额度检查，不能等同物理磁盘耗尽、真实用户设备配额、Safari/Firefox 或多浏览器设备矩阵。
