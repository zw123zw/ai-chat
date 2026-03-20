const textReplies = [
  '你好！我是 AI Chat 助手，有什么可以帮你的吗？',
  '这是一个很好的问题。让我来详细解释一下：\n\n首先，我们需要理解核心概念。在软件开发中，**模块化**是将复杂系统分解为独立、可管理的部分的过程。每个模块负责特定的功能，通过定义良好的接口与其他模块通信。\n\n其次，良好的架构设计能够提高代码的可维护性和可扩展性。',
  '根据我的分析，这个方案有以下几个优势：\n\n1. 性能更好，响应速度提升约 30%\n2. 代码结构更清晰，便于后续维护\n3. 兼容性强，支持主流浏览器\n4. 安全性高，防止常见的 XSS 和 CSRF 攻击',
  '没问题，我来帮你梳理一下思路。\n\n> 好的架构不是一蹴而就的，而是在不断迭代中逐步完善的。\n\n关键在于保持代码的**简洁性**和**可读性**，避免过度设计。',
  '理解了，让我总结一下要点：\n\n- **核心原则**：单一职责、开放封闭\n- **实践建议**：小步迭代、持续重构\n- **注意事项**：避免过早优化\n\n这样的设计能让系统更容易扩展和维护。',
  '从技术选型角度来看，我建议考虑以下几点：\n\n| 方案 | 优势 | 劣势 |\n|------|------|------|\n| 方案A | 成熟稳定 | 学习曲线陡峭 |\n| 方案B | 轻量灵活 | 生态不够完善 |\n| 方案C | 性能优异 | 社区较小 |\n\n根据项目实际情况选择最合适的方案。',
  '这个问题涉及到**并发控制**和**资源管理**两个方面。\n\n在高并发场景下，我们需要：\n1. 合理使用连接池\n2. 实现请求限流\n3. 添加熔断降级机制\n4. 优化数据库查询\n\n这些措施能有效提升系统稳定性。',
  '好的，我明白你的需求了。简单来说就是需要实现一个**可配置的数据处理管道**。\n\n核心思路是使用责任链模式，每个处理器负责一个特定的转换步骤，通过配置文件动态组装处理流程。这样既保证了灵活性，又便于测试和维护。',
]

const codeReplies = [
  '下面是一个 TypeScript 的防抖函数实现：\n\n```typescript\nfunction debounce<T extends (...args: any[]) => any>(\n  fn: T,\n  delay: number\n): (...args: Parameters<T>) => void {\n  let timer: ReturnType<typeof setTimeout> | null = null\n  return (...args: Parameters<T>) => {\n    if (timer) clearTimeout(timer)\n    timer = setTimeout(() => fn(...args), delay)\n  }\n}\n\n// 使用示例\nconst handleSearch = debounce((query: string) => {\n  console.log(\"搜索:\", query)\n}, 300)\n```\n\n这个实现支持泛型，能正确推断参数类型。',

  '这是一个 Python 快速排序的实现：\n\n```python\ndef quick_sort(arr: list[int]) -> list[int]:\n    if len(arr) <= 1:\n        return arr\n    pivot = arr[len(arr) // 2]\n    left = [x for x in arr if x < pivot]\n    middle = [x for x in arr if x == pivot]\n    right = [x for x in arr if x > pivot]\n    return quick_sort(left) + middle + quick_sort(right)\n\n# 测试\nprint(quick_sort([3, 6, 8, 10, 1, 2, 1]))\n# 输出: [1, 1, 2, 3, 6, 8, 10]\n```',

  '这是一个 Vue3 组合式 API 的示例：\n\n```vue\n<script setup lang="ts">\nimport { ref, computed, watch } from \'vue\'\n\nconst count = ref(0)\nconst doubled = computed(() => count.value * 2)\n\nwatch(count, (newVal, oldVal) => {\n  console.log(`count: ${oldVal} -> ${newVal}`)\n})\n\nfunction increment() {\n  count.value++\n}\n</script>\n```\n\n组合式 API 让逻辑复用变得更加简单直观。',

  '用 JavaScript 实现一个简单的发布订阅模式：\n\n```javascript\nclass EventBus {\n  constructor() {\n    this.events = new Map()\n  }\n\n  on(event, callback) {\n    if (!this.events.has(event)) {\n      this.events.set(event, [])\n    }\n    this.events.get(event).push(callback)\n  }\n\n  emit(event, ...args) {\n    const callbacks = this.events.get(event) || []\n    callbacks.forEach(cb => cb(...args))\n  }\n\n  off(event, callback) {\n    const callbacks = this.events.get(event) || []\n    this.events.set(event, callbacks.filter(cb => cb !== callback))\n  }\n}\n```',

  '这是一个 React Hooks 的自定义 Hook 示例：\n\n```tsx\nimport { useState, useEffect } from \'react\'\n\nfunction useLocalStorage<T>(key: string, initialValue: T) {\n  const [value, setValue] = useState<T>(() => {\n    const item = localStorage.getItem(key)\n    return item ? JSON.parse(item) : initialValue\n  })\n\n  useEffect(() => {\n    localStorage.setItem(key, JSON.stringify(value))\n  }, [key, value])\n\n  return [value, setValue] as const\n}\n```',

  '这是一个 Go 语言的并发处理示例：\n\n```go\npackage main\n\nimport (\n    "fmt"\n    "sync"\n)\n\nfunc worker(id int, jobs <-chan int, results chan<- int, wg *sync.WaitGroup) {\n    defer wg.Done()\n    for job := range jobs {\n        results <- job * 2\n    }\n}\n\nfunc main() {\n    jobs := make(chan int, 100)\n    results := make(chan int, 100)\n    var wg sync.WaitGroup\n\n    for i := 0; i < 3; i++ {\n        wg.Add(1)\n        go worker(i, jobs, results, &wg)\n    }\n\n    for i := 1; i <= 5; i++ {\n        jobs <- i\n    }\n    close(jobs)\n\n    wg.Wait()\n    close(results)\n}\n```',

  '这是一个 SQL 查询优化示例：\n\n```sql\n-- 优化前：使用子查询\nSELECT u.name, u.email\nFROM users u\nWHERE u.id IN (SELECT user_id FROM orders WHERE total > 1000);\n\n-- 优化后：使用 JOIN\nSELECT DISTINCT u.name, u.email\nFROM users u\nINNER JOIN orders o ON u.id = o.user_id\nWHERE o.total > 1000;\n\n-- 添加索引\nCREATE INDEX idx_orders_total ON orders(total);\nCREATE INDEX idx_orders_user_id ON orders(user_id);\n```\n\n使用 JOIN 替代子查询，并添加合适的索引，查询性能提升约 60%。',

  '这是一个 Rust 的错误处理示例：\n\n```rust\nuse std::fs::File;\nuse std::io::{self, Read};\n\nfn read_file(path: &str) -> Result<String, io::Error> {\n    let mut file = File::open(path)?;\n    let mut contents = String::new();\n    file.read_to_string(&mut contents)?;\n    Ok(contents)\n}\n\nfn main() {\n    match read_file("data.txt") {\n        Ok(content) => println!("文件内容: {}", content),\n        Err(e) => eprintln!("读取失败: {}", e),\n    }\n}\n```',
]

const imageReplies = [
  '这是你要的图片：\n\n![示例图片](/resources/featPermissionDark.png)\n\n这张图片展示了权限管理的界面设计。',
  '我找到了一张相关的截图：\n\n![功能截图](/resources/featPermissionDark.png)\n\n希望这是你想要的效果。',
  '这是架构示意图：\n\n![架构图](/resources/featPermissionDark.png)\n\n从图中可以看到各模块之间的依赖关系。',
  '这是系统流程图：\n\n![流程图](/resources/featPermissionDark.png)\n\n整个流程分为三个阶段：数据采集、处理和输出。',
  '这是UI设计稿：\n\n![设计稿](/resources/featPermissionDark.png)\n\n采用了现代化的扁平设计风格，用户体验更友好。',
  '这是性能监控面板：\n\n![监控面板](/resources/featPermissionDark.png)\n\n可以实时查看系统的CPU、内存和网络使用情况。',
]

const fileReplies = [
  '我已经为你准备好了文件：\n\n[测试文档.txt](/resources/test.txt)\n\n你可以点击下载查看详细内容。',
  '这是导出的数据文件：\n\n[数据文件.txt](/resources/test.txt)\n\n包含了相关的测试数据。',
  '配置文件已生成：\n\n[config.json](/resources/test.txt)\n\n请根据实际情况修改配置参数。',
  '这是API文档：\n\n[API接口文档.txt](/resources/test.txt)\n\n包含了所有接口的详细说明和示例。',
  '日志文件导出完成：\n\n[系统日志.txt](/resources/test.txt)\n\n记录了最近7天的运行日志。',
]

const mixedReplies = [
  '让我来解释一下这个流程：\n\n![流程图](/resources/featPermissionDark.png)\n\n核心代码如下：\n\n```typescript\nasync function fetchData(url: string) {\n  const response = await fetch(url)\n  if (!response.ok) {\n    throw new Error(`HTTP ${response.status}`)\n  }\n  return response.json()\n}\n```\n\n这个函数封装了基本的错误处理逻辑。',

  '这是分析结果：\n\n1. 性能指标良好\n2. 内存占用合理\n\n相关截图：\n\n![性能报告](/resources/featPermissionDark.png)\n\n优化建议代码：\n\n```python\nimport functools\n\n@functools.lru_cache(maxsize=128)\ndef expensive_computation(n: int) -> int:\n    if n < 2:\n        return n\n    return expensive_computation(n - 1) + expensive_computation(n - 2)\n```\n\n使用缓存后性能提升明显。\n\n详细报告见：[完整报告.txt](/resources/test.txt)',

  '关于数据库设计，我有以下建议：\n\n![ER图](/resources/featPermissionDark.png)\n\n建表SQL：\n\n```sql\nCREATE TABLE users (\n  id BIGINT PRIMARY KEY AUTO_INCREMENT,\n  username VARCHAR(50) UNIQUE NOT NULL,\n  email VARCHAR(100) UNIQUE NOT NULL,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n\nCREATE INDEX idx_username ON users(username);\nCREATE INDEX idx_email ON users(email);\n```\n\n索引策略文档：[数据库设计文档.txt](/resources/test.txt)',

  '部署方案如下：\n\n**架构图：**\n\n![部署架构](/resources/featPermissionDark.png)\n\n**Docker配置：**\n\n```dockerfile\nFROM node:18-alpine\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci --only=production\nCOPY . .\nEXPOSE 3000\nCMD ["npm", "start"]\n```\n\n**部署清单：**\n- [x] 配置环境变量\n- [x] 设置负载均衡\n- [ ] 配置监控告警\n\n完整文档：[部署指南.txt](/resources/test.txt)',

  '测试报告已生成：\n\n| 测试类型 | 通过率 | 覆盖率 |\n|---------|--------|--------|\n| 单元测试 | 98% | 85% |\n| 集成测试 | 95% | 72% |\n| E2E测试 | 92% | 68% |\n\n**测试截图：**\n\n![测试结果](/resources/featPermissionDark.png)\n\n**示例测试代码：**\n\n```typescript\ndescribe("UserService", () => {\n  it("should create user", async () => {\n    const user = await userService.create({ name: "test" })\n    expect(user.id).toBeDefined()\n  })\n})\n```\n\n详细报告：[测试报告.txt](/resources/test.txt)',

  '安全审计结果：\n\n⚠️ 发现 3 个中危漏洞，已修复\n\n**修复代码：**\n\n```javascript\n// 防止 XSS 攻击\nfunction sanitizeInput(input) {\n  return input\n    .replace(/&/g, "&amp;")\n    .replace(/</g, "&lt;")\n    .replace(/>/g, "&gt;")\n    .replace(/"/g, "&quot;")\n    .replace(/\'/g, "&#x27;")\n}\n```\n\n**安全检查清单：**\n- [x] SQL注入防护\n- [x] XSS防护\n- [x] CSRF防护\n- [x] 敏感数据加密\n\n![安全扫描结果](/resources/featPermissionDark.png)\n\n完整报告：[安全审计报告.txt](/resources/test.txt)',
]

const tableReplies = [
  '以下是前端框架对比：\n\n| 框架 | 语言 | 包大小 | 学习曲线 | 生态系统 |\n|------|------|--------|----------|----------|\n| Vue 3 | TypeScript | 33KB | 低 | 丰富 |\n| React 18 | JavaScript/TSX | 42KB | 中 | 非常丰富 |\n| Angular 17 | TypeScript | 65KB | 高 | 完善 |\n| Svelte 4 | JavaScript | 1.6KB | 低 | 成长中 |\n| Solid.js | TypeScript | 7KB | 中 | 较小 |\n\n综合来看，Vue 3 在包大小和学习曲线上有明显优势，适合中小型项目快速开发。',

  '数据库性能测试结果如下：\n\n| 数据库 | 读取(QPS) | 写入(QPS) | 延迟(ms) | 内存占用 |\n|--------|-----------|-----------|----------|----------|\n| PostgreSQL | 45,000 | 12,000 | 2.3 | 512MB |\n| MySQL 8.0 | 42,000 | 11,500 | 2.8 | 480MB |\n| MongoDB | 38,000 | 15,000 | 3.1 | 620MB |\n| Redis | 120,000 | 110,000 | 0.5 | 256MB |\n| SQLite | 25,000 | 5,000 | 1.2 | 64MB |\n\n> 测试环境：4核8G云服务器，100万条测试数据',

  '项目进度汇总：\n\n| 模块 | 负责人 | 状态 | 进度 | 预计完成 |\n|------|--------|------|------|----------|\n| 用户认证 | 张三 | ✅ 已完成 | 100% | 2024-01-15 |\n| 数据看板 | 李四 | 🔄 进行中 | 75% | 2024-02-01 |\n| 消息推送 | 王五 | 🔄 进行中 | 40% | 2024-02-15 |\n| 权限管理 | 赵六 | ⏳ 待开始 | 0% | 2024-03-01 |\n| 日志系统 | 孙七 | ✅ 已完成 | 100% | 2024-01-20 |\n\n整体进度约 **63%**，预计按时交付。',

  'HTTP 状态码速查表：\n\n| 状态码 | 含义 | 说明 |\n|--------|------|------|\n| 200 | OK | 请求成功 |\n| 201 | Created | 资源创建成功 |\n| 301 | Moved Permanently | 永久重定向 |\n| 400 | Bad Request | 请求参数错误 |\n| 401 | Unauthorized | 未认证 |\n| 403 | Forbidden | 无权限 |\n| 404 | Not Found | 资源不存在 |\n| 429 | Too Many Requests | 请求频率超限 |\n| 500 | Internal Server Error | 服务器内部错误 |\n| 502 | Bad Gateway | 网关错误 |\n| 503 | Service Unavailable | 服务不可用 |\n\n开发中最常见的是 200、400、401、404 和 500。',

  'npm 包体积分析结果：\n\n| 包名 | 版本 | 体积(gzip) | 依赖数 | 建议 |\n|------|------|------------|--------|------|\n| lodash | 4.17.21 | 71.5KB | 0 | 改用 lodash-es 按需引入 |\n| moment | 2.30.1 | 72.1KB | 0 | 替换为 dayjs (2KB) |\n| axios | 1.6.5 | 13.7KB | 5 | 可用 fetch 替代 |\n| ant-design-vue | 4.1.0 | 340KB | 12 | 按需引入组件 |\n| echarts | 5.4.3 | 320KB | 2 | 按需引入图表类型 |\n\n优化后预计可减少约 **45%** 的打包体积。',

  'API 接口响应时间监控：\n\n| 接口 | 方法 | P50 | P90 | P99 | 调用量/天 |\n|------|------|-----|-----|-----|----------|\n| /api/login | POST | 85ms | 120ms | 350ms | 12,000 |\n| /api/users | GET | 45ms | 80ms | 200ms | 58,000 |\n| /api/orders | GET | 120ms | 250ms | 800ms | 35,000 |\n| /api/search | POST | 200ms | 450ms | 1200ms | 22,000 |\n| /api/upload | POST | 500ms | 1200ms | 3000ms | 5,000 |\n\n`/api/search` 和 `/api/upload` 的 P99 偏高，建议优化查询逻辑并增加文件上传的分片处理。',
]

const allReplies = [
  ...textReplies,
  ...codeReplies,
  ...imageReplies,
  ...fileReplies,
  ...mixedReplies,
  ...tableReplies,
]

/**
 * 随机获取一条模拟 AI 回复
 */
export function getRandomReply(): string {
  return allReplies[Math.floor(Math.random() * allReplies.length)]
}
