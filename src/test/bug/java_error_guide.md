---
breadcrumbExclude: true
title: Java 常见异常与缺陷实战指南
date: 2026-08-25
tags:
  - Java
  - 异常
  - 缺陷
  - JVM
  - 并发
  - Spring
---

# 服务器后端 常见异常与缺陷实战指南

后端 应用"看起来正常、跑起来出问题"是测试与研发同学最头疼的事。一次高并发下的锁竞争、一个深层递归、一处忘记释放的资源，都可能让线上服务卡死、OOM 甚至雪崩。

本文面向测试工程师与研发同学，按**业务场景**梳理  常见业务异常与缺陷：从线程锁竞争、死锁、JVM 栈溢出与内存溢出，到 Spring Bean 循环依赖，再到日常开发高频踩坑的运行时异常，每类都给出**典型业务案例 + 报错现象 + 定位工具 + 解决方案**，并在文末汇总为"缺陷速查表"，方便排障时快速索引。



## 

## 一、线程锁竞争（Lock Contention）

### 1.1 什么是锁竞争

多个线程同时访问同一把锁保护的临界区时，只有一个线程能获得锁，其余线程必须**阻塞等待**。当竞争激烈时，线程大量时间花在"抢锁-等待-抢锁"上，CPU 空转、请求 RT 飙升，这就是锁竞争。

> **典型现象**：接口平时 10ms，并发一上来变成 500ms；`jstack` 大量线程处于 `BLOCKED` 状态；`synchronized` 修饰的大方法处处可见。

### 1.2 业务场景案例：库存扣减

```java
public class StockService {
    private final Object lock = new Object();

    // 问题：把整个业务方法都锁住了，含查库、校验、下单等耗时代码
    public synchronized boolean deductStock(String skuId, int count) {
        // 1. 查询库存（耗时 30ms）
        Stock stock = stockMapper.selectBySkuId(skuId);
        // 2. 业务校验（耗时 20ms）
        if (stock.getCount() < count) return false;
        // 3. 扣减库存（耗时 5ms）
        stock.setCount(stock.getCount() - count);
        stockMapper.updateById(stock);
        // 4. 写日志、发消息（耗时 20ms）
        logService.write(skuId, count);
        return true;
    }
}
```

上面这段代码锁住了全部 75ms 的逻辑，且用 `synchronized` 修饰在方法上，所有调用都串行化，并发一高必然成为性能瓶颈。

### 1.3 定位工具

| 工具 | 命令 | 看到什么 |
|---|---|---|
| jstack | `jstack <pid>` | 大量线程 `BLOCKED`，monitor 相同地址 |
| jconsole / jvisualvm | 线程 Tab | 线程状态分布、锁等待可视化 |
| async-profiler | `-e lock` | 锁等待热点火焰图 |
| Arthas | `thread -n 3` | 找出最忙/阻塞最久的线程栈 |

### 1.4 优化方案

```java
public class StockServiceV2 {
    // 方案一：缩小锁粒度——只锁扣减那一步，用数据库原子更新代替整段锁
    public boolean deductStock(String skuId, int count) {
        // 前置校验（不锁）
        Stock stock = stockMapper.selectBySkuId(skuId);
        if (stock.getCount() < count) return false;
        // 只在临界区使用乐观锁（CAS）
        int updated = stockMapper.deductStockCAS(skuId, count, stock.getCount());
        return updated > 0;
    }
}
```

```sql
-- 方案二：数据库乐观锁（update 自带原子性，天然免锁）
UPDATE stock SET count = count - #{count}
 WHERE sku_id = #{skuId} AND count >= #{count};
```

- **缩小锁粒度**：只锁真正需要互斥的代码，避免"大锁包全流程"；
- **锁分段**：`ConcurrentHashMap` 就是典型，把一把大锁拆成多把小锁；
- **读写分离**：读多写少用 `ReentrantReadWriteLock`，读锁可共享；
- **无锁化**：能用 CAS / 原子类（`AtomicInteger`）就不用锁；
- **减小持锁时间**：耗时的 IO 操作（查库、调外部接口）移出临界区。

## 二、死锁（Deadlock）

### 2.1 死锁产生的四要素

死锁必须**同时满足**以下四个条件，缺一不可：

| 条件 | 含义 | 反例（破坏手段） |
|---|---|---|
| 互斥 | 资源一次只能被一个线程占用 | 共享读锁 |
| 持有并等待 | 持有一把锁时又去申请另一把锁 | 一次性申请全部锁 |
| 不可剥夺 | 已持有的锁不能被强制拿走 | 超时释放（tryLock） |
| 循环等待 | 线程间形成"你等我、我等你"的环 | 统一锁获取顺序 |

> **破局思路**：破坏四要素中的任意一个即可解除死锁。工程上最常用的是**统一加锁顺序**（破坏循环等待）和 **tryLock 超时**（破坏不可剥夺）。

### 2.2 业务场景案例：转账死锁

```java
public class TransferService {
    private final Object lockA = new Object(); // 账户 A 的锁
    private final Object lockB = new Object(); // 账户 B 的锁

    public void transfer(String from, String to, int amount) {
        Object first = from.compareTo(to) < 0 ? lockA : lockB;
        Object second = from.compareTo(to) < 0 ? lockB : lockA;
        // 按账户 id 顺序加锁，避免 A->B 与 B->A 相互等待
        synchronized (first) {
            synchronized (second) {
                // 转账逻辑
            }
        }
    }
}
```

**经典死锁场景**：
- 线程 1 转账 A→B，先锁 A 再锁 B；线程 2 转账 B→A，先锁 B 再锁 A → 互相持有对方需要的锁，**永久等待**；
- 嵌套锁：业务代码在持锁状态下调用其他服务，对方又回调回来抢同一把锁；
- **数据库死锁**：两个事务以不同顺序更新多张表，触发 `Deadlock found when trying to get lock`。

### 2.3 死锁检测

用 `jstack` 抓线程栈，出现下面这段关键字即可确认死锁：

```
Found one Java-level deadlock:
"Thread-1":
  waiting to lock monitor 0x00007f... (object 0x00000000..., a java.lang.Object)
"Thread-0":
  waiting to lock monitor 0x00007f... (object 0x00000000..., a java.lang.Object)
```

代码层面也可以主动监控：

```java
// ThreadMXBean 自带死锁检测，可接入告警
ThreadMXBean tmb = ManagementFactory.getThreadMXBean();
long[] deadlockedIds = tmb.findDeadlockedThreads();
if (deadlockedIds != null) {
    // 死锁发生，输出栈信息并告警
}
```

### 2.4 解决方案

- **统一锁顺序**：多把锁时按固定规则（如 id 排序）获取；
- **超时放弃**：用 `ReentrantLock.tryLock(3, TimeUnit.SECONDS)`，拿不到就放弃并释放已有锁；
- **避免嵌套锁**：一个临界区内尽量只持有一把锁；
- **数据库层面**：统一表更新顺序、缩短事务、设置 `innodb_lock_wait_timeout` 超时回滚；
- **死锁监控**：生产环境定期执行 `jstack` 或接入 ThreadMXBean 告警。

## 三、JVM StackOverflowError 栈溢出

### 3.1 原理

每个线程调用方法时，JVM 会在线程栈（默认 512KB~1MB，由 `-Xss` 控制）上分配一个**栈帧**。当栈深度超过限制时抛出 `StackOverflowError`。

> **关键认知**：`StackOverflowError` 属于 `Error` 而非 `Exception`，**不需要也不能被 try-catch 兜底**——正确做法是定位并修复触发递归/深调用的代码。

### 3.2 业务场景案例

**案例一：无限递归（最常见）**

```java
// 递归查询部门树，父节点 id 数据脏乱导致递归永不结束
public List<Dept> buildTree(Long parentId) {
    List<Dept> depts = deptMapper.selectByParentId(parentId);
    for (Dept dept : depts) {
        // 若某条记录的 parent_id 指向自身 → 死循环递归 → StackOverflowError
        dept.setChildren(buildTree(dept.getId()));
    }
    return depts;
}
```

**案例二：JSON 循环序列化**——对象互相引用（A 里有 B，B 里有 A），`fastjson / Jackson` 序列化时无限递归：

```
com.alibaba.fastjson.JSONException: create instance error
    at ... (StackOverflowError: null)
```

**案例三：`-Xss` 设置过小**——合法但很深的调用（如深层 XML/JSON 解析、正则递归）也可能触发，可适当调大 `-Xss`，但根本解法仍是避免过深递归。

### 3.3 排查与解决

| 步骤 | 操作 |
|---|---|
| 看栈顶 | 报错堆栈最深处通常就是递归入口，直接看 `at xxx.java:NN` |
| 查递归终止条件 | 数据是否出现环（如 parent_id 指向自己）、终止条件是否恒为 false |
| 查序列化配置 | 有循环引用时用 `@JsonIgnore` / `@JSONField(serialize=false)` / DTO 转换 |
| 改成迭代 | 深树、深链表等场景用循环 + 显式栈替代递归 |
| 调整 -Xss | 治标手段，`-Xss512k` 改为 `-Xss1m`，仅缓解 |

## 四、JVM 内存溢出（OutOfMemoryError）

OOM 是生产事故的头号杀手。不同区域溢出报错信息不同，**报错关键字直接决定排查方向**。

### 4.1 OOM 类型速查表

| 报错关键字 | 溢出区域 | 典型原因 | 排查命令 |
|---|---|---|---|
| `Java heap space` | 堆 | 对象过多、大对象、泄漏 | `jmap -dump` + MAT |
| `Metaspace` | 元空间 | 动态生成类过多（代理/热部署） | `jstat -gc` |
| `GC overhead limit exceeded` | 堆 | 对象基本回收不掉，GC 空转 | `jstat -gcutil` |
| `Direct buffer memory` | 直接内存 | NIO/Netty 缓冲未释放 | 检查堆外内存 |
| `Unable to create new native thread` | 系统线程 | 线程数超上限 | `ulimit -u`、`jstack` 数线程 |
| `Out of swap space` | 操作系统 | 物理内存不足/换页 | `free -m` |
| `stack overflow`（Error） | 线程栈 | 无限递归 | 见第三章 |

### 4.2 业务场景案例：堆内存溢出

**案例一：无界缓存**

```java
// 问题代码：缓存只放不清理，大促期间 key 激增 → Java heap space
public class SmsCache {
    private static final Map<String, String> CACHE = new HashMap<>();

    public static void put(String key, String value) {
        CACHE.put(key, value);  // 永不淘汰，无限增长
    }
}
```

**案例二：分页缺失导致全表加载**

```java
// 问题代码：一次性查出全部用户并发邮件，数据量大直接撑爆堆
List<User> users = userMapper.selectAll();  // 1000W 行全进内存
for (User user : users) {
    mailService.send(user.getEmail());
}
```

**案例三：经典内存泄漏**——`static` 集合持有业务对象、`ThreadLocal` 用完不 `remove`、数据库连接/流未关闭、监听器注册后未反注册。

### 4.3 排查套路（堆溢出）

```bash
# 1. 发生 OOM 时自动导出堆转储
java -Xms2g -Xmx2g -XX:+HeapDumpOnOutOfMemoryError \
     -XX:HeapDumpPath=/data/dump/ java -jar app.jar

# 2. 用 MAT 分析 dump 文件（或 jhat / Eclipse Memory Analyzer）
#    重点看：Leak Suspects（泄漏嫌疑）、Dominator Tree（支配树）
#    定位到大对象 / 被 static 持有的对象集合

# 3. 用 jstat 观察 GC 与堆增长趋势
jstat -gcutil <pid> 1000
```

| 排查问题 | 答案对应工具 |
|---|---|
| 堆多大、用了多少 | `jstat -gc` / `jmap -heap` |
| 哪些对象占了内存 | MAT `Histogram` / `Dominator Tree` |
| 对象被谁引用导致回收不掉 | MAT `Path to GC Roots` |
| 是否有明显泄漏 | MAT `Leak Suspects` / 连续多次 dump 对比 |

> **关键技巧**：线上连续抓 2~3 次 dump（间隔数分钟）做对比，若对象数量持续增长而无法回收，基本可判定为**内存泄漏**而非单纯量大的"内存不足"。

### 4.4 其他区域溢出案例

**Metaspace 溢出**——热部署 / 动态代理生成类过多：

```
java.lang.OutOfMemoryError: Metaspace
    at java.lang.ClassLoader.defineClass1(Native Method)
```

> 排查方向：减少无意义热部署、复用 ClassLoader、`-XX:MaxMetaspaceSize` 设上限做保护。

**Unable to create new native thread**——线程池无界创建线程，耗尽系统线程资源：

```java
// 问题代码：每次都 new 线程池（线程不回收），或线程池不设上限
ExecutorService pool = Executors.newCachedThreadPool(); // 危险：最大线程数=Integer.MAX_VALUE
```

> 排查方向：`jstack <pid> | grep "java.lang.Thread" | wc -l` 数线程数；检查 `ulimit -u`；排查线程池是否复用。

## 五、Spring Bean 循环依赖

### 5.1 什么是循环依赖

Bean A 依赖 Bean B，Bean B 又依赖 Bean A（或形成 A→B→C→A 的环），Spring 在创建时无法决定先创建谁。

```
┌─────┐     ┌─────┐
│  A  │────▶│  B  │
│  B  │────▶│  A  │
└─────┘     └─────┘
```

> **典型报错**：`BeanCurrentlyInCreationException: Error creating bean with name 'a': Requested bean is currently in creation`，同时日志会打印 `The dependencies of some of the beans in the application context form a cycle`。

### 5.2 场景分类：哪种循环依赖能解决

| 注入方式 | 能否解决 | 原因 |
|---|---|---|
| **构造器注入** 循环依赖 | ❌ 无法解决 | 构造器执行必须拿到完整依赖，无法提前暴露半成品 Bean |
| **setter / 字段注入** 循环依赖 | ✅ 默认可解决 | Spring 三级缓存提前暴露 Bean 的早期引用 |
| `@Async` / `@Transactional` 代理 Bean 循环依赖 | ⚠️ 需谨慎 | 代理对象依赖完整 Bean，可能拿到未织入代理的原始对象 |

### 5.3 Spring 三级缓存原理（了解即可）

```java
// 三级缓存（DefaultSingletonBeanRegistry）：
Map<String, Object> singletonObjects;       // 一级：成品单例池
Map<String, Object> earlySingletonObjects;  // 二级：提前暴露的半成品（未走初始化）
Map<String, ObjectFactory<?>> singletonFactories; // 三级：对象工厂（生成早期引用/代理）
```

创建 A 时：实例化 A → 把 A 的 `ObjectFactory` 放入三级缓存 → 填充 B → 创建 B → B 需要 A → 从三级缓存取出 A 的早期引用注入 B → B 创建完成 → A 完成属性填充与初始化 → 移入一级缓存。

> **注意（Spring Boot 2.6+）**：默认关闭了循环依赖支持！`spring.main.allow-circular-references=false`，遇到循环依赖直接报错。老项目升级后出现循环依赖报错，通常是这个开关引起。

### 5.4 解决方案

```java
// 方案一：@Lazy 延迟注入（最省事的应急手段）
@Service
public class AService {
    private final BService bService;

    public AService(@Lazy BService bService) {  // 注入代理，真正使用时才解析
        this.bService = bService;
    }
}

// 方案二：改为 setter / 字段注入（仅当必须保留循环时，不推荐）
@Service
public class AService {
    @Autowired
    private BService bService;   // 字段注入可打破构造器循环
}

// 方案三（推荐）：重构消除循环——抽取公共依赖到第三个 Bean
// A 与 B 共同需要的逻辑下沉到 CommonService，A/B 各自只依赖 CommonService
```

| 方案 | 适用场景 | 评价 |
|---|---|---|
| `@Lazy` | 快速上线、改动最小 | 治标，掩盖设计问题 |
| 字段/setter 注入 | 老代码兼容 | 不推荐新代码，无法用 final 保证不变性 |
| **重构抽取依赖** | 新代码、根治 | 推荐，消除环最彻底 |
| `@DependsOn` 调整顺序 | 初始化顺序问题 | 只解决顺序，不解决依赖环 |

## 六、日常高频运行时异常大全

> 这组异常最常见、最"接地气"，多半不是环境问题，而是**代码逻辑缺陷**。测试时尤其要在边界场景、异常数据、空数据下验证。

### 6.1 空指针 NullPointerException（出现频率 No.1）

| 触发场景 | 示例 | 防御方案 |
|---|---|---|
| 数据库查询结果为 null | `user.getPhone()` 但 user 为 null | 判空 / `Optional` |
| JSON 反序列化缺字段 | 接口返回 `{}`，强转对象后取属性 | 默认值、校验必填 |
| 链式调用中间断链 | `order.getUser().getName()` | 每个环节判空 |
| Map 取值不存在 | `map.get(key).toString()` | `getOrDefault` |
| 拆箱导致 NPE | `Integer` 为 null 时赋给 `int` | 避免自动拆箱 |

```java
// 推荐写法：Optional 链式，避免层层 if
String name = Optional.ofNullable(order)
        .map(Order::getUser)
        .map(User::getName)
        .orElse("未知用户");
```

### 6.2 并发修改 ConcurrentModificationException

```java
// 问题代码：边遍历边删除
List<String> list = new ArrayList<>(Arrays.asList("a", "b", "c"));
for (String s : list) {
    if ("b".equals(s)) list.remove(s);  // 抛 ConcurrentModificationException
}
```

| 修复方式 | 代码 | 适用场景 |
|---|---|---|
| Iterator 的 remove | `it.remove()` | 单线程遍历删除 |
| 收集后统一删除 | `removeAll(待删除集合)` | 批量删除 |
| 并发写集合 | `CopyOnWriteArrayList` | 读多写少 |
| 改用 `removeIf` | `list.removeIf("b"::equals)` | Java 8+ |

### 6.3 类型转换 ClassCastException

- **泛型擦除**：`List` 不加泛型，放入不同类型对象后强转出错；
- **JSON 反序列化**：字段类型不匹配（字符串反序列化成整数）；
- **多态转型**：父类引用强转子类但实际是另一个子类。

```java
// 典型场景：从 Redis / JSON 取出后强转
Object obj = redisTemplate.opsForValue().get("user");
User user = (User) obj;  // 若存的是 JSON 字符串则抛 ClassCastException
```

### 6.4 类加载相关：ClassNotFoundException vs NoClassDefFoundError

| 异常 | 语义 | 常见原因 | 解决 |
|---|---|---|---|
| `ClassNotFoundException` | 编译期存在、运行时**动态加载**类找不到 | jar 未打进去、类名拼写错误 | 检查 classpath / 依赖 |
| `NoClassDefFoundError` | 该类**编译加载过**，后续初始化失败或 jar 被替换 | 类初始化抛异常、jar 冲突版本 | 修初始化代码、排依赖冲突 |

> 常见场景：**多版本 jar 冲突**（如 `slf4j`、`guava` 多个版本共存），用 `mvn dependency:tree` 排查。

### 6.5 数值与参数异常

| 异常 | 触发场景 | 解决 |
|---|---|---|
| `NumberFormatException` | `"abc".parseInt()` / 空串转数字 | 捕获 + 校验 + 默认值 |
| `ArithmeticException` | 整数除以 0 | 除数判空 |
| `IndexOutOfBoundsException` | 数组/List 越界，含 `String.substring` 越界 | 边界判断 |
| `IllegalArgumentException` | 非法参数 | 入参校验 |

### 6.6 资源泄漏（最隐蔽的"慢性病"）

```java
// 问题代码：异常时连接/流不关闭
public String query(Connection conn, String sql) {
    Statement stmt = conn.createStatement();
    ResultSet rs = stmt.executeQuery(sql);   // 若这里抛异常，stmt/rs 永不关闭
    return rs.getString(1);
}
```

| 资源类型 | 泄漏后果 | 正确姿势 |
|---|---|---|
| 数据库连接 | 连接池耗尽 → 接口全部超时 | try-with-resources / 归还连接池 |
| 文件流 / Socket | 句柄耗尽 → 无法打开新文件 | try-with-resources |
| HTTP 客户端 | 连接不释放 → 线程/内存上涨 | 使用连接池并正确关闭 |
| ThreadLocal | 线程池复用线程 → 脏数据 + 内存泄漏 | `finally { remove(); }` |

```java
// try-with-resources 自动关闭，异常也不会泄漏
try (Connection conn = dataSource.getConnection();
     Statement stmt = conn.createStatement();
     ResultSet rs = stmt.executeQuery(sql)) {
    return rs.getString(1);
}
```

## 七、线程池与并发缺陷

### 7.1 线程池线程耗尽

**场景**：线程池被"慢任务"占满，新任务全部排队或走拒绝策略，接口大面积超时。

```java
// 问题代码：固定 2 个线程处理所有消息，任务处理慢时消息堆积
ExecutorService pool = Executors.newFixedThreadPool(2);
```

**排查**：`jstack` 看线程都在 `WAITING`（队列取任务）；`jstat` / 监控看队列长度。

**解决**：
- 线程池参数按业务评估：核心线程数、最大线程数、队列容量、拒绝策略四件套要配齐；
- 慢任务与快任务**分池隔离**，避免互相挤占；
- 对任务执行时长做超时兜底；
- **拒绝策略别用默认 AbortPolicy 悄悄丢任务**，统一告警或降级。

### 7.2 任务堆积导致 OOM

无界队列（`LinkedBlockingQueue` 默认无界）+ 任务生产速度 > 消费速度 → 队列无限增长 → 堆溢出。

> 修复：**用有界队列**（如 `ArrayBlockingQueue` 指定容量）并配合理想的拒绝策略；同时给生产者限流。

### 7.3 并发集合误用

| 场景 | 错误用法 | 正确用法 |
|---|---|---|
| 高并发写 Map | `HashMap` | `ConcurrentHashMap` |
| 需要排序的并发集合 | 手工加锁 TreeMap | `ConcurrentSkipListMap` |
| 计数器 | `int` + synchronized | `AtomicLong` / `LongAdder` |
| 队列 | 不加锁的 ArrayList 当队列 | `LinkedBlockingQueue` / `ConcurrentLinkedQueue` |

## 八、故障排查方法论与工具全景

### 8.1 JDK 自带工具速查

| 工具 | 用途 | 关键输出 |
|---|---|---|
| `jps` | 列出 Java 进程 | 进程 pid |
| `jstack <pid>` | 线程栈快照 | 死锁、BLOCKED/WAITING 状态、线程堆栈 |
| `jmap -heap <pid>` | 堆配置与使用 | 各代容量、使用率 |
| `jmap -dump:format=b,file=xxx.hprof <pid>` | 导出堆转储 | 供 MAT 分析 |
| `jstat -gcutil <pid> 1000` | GC 统计 | YGC/FGC 次数、GC 时间占比 |
| `jinfo <pid>` | JVM 参数 | -Xmx 等配置是否生效 |
| `Arthas` | 线上诊断神器 | dashboard、thread、sc、watch、trace |

### 8.2 三类高频事故的标准排查路径

**场景一：CPU 飙高**

```bash
top -Hp <pid>              # 找出 CPU 最高的线程 tid
printf "%x\n" <tid>        # 转十六进制
jstack <pid> | grep -A 30 "nid=0x<hex>"  # 定位到具体业务代码
```

**场景二：内存持续上涨 / OOM**

```bash
jstat -gcutil <pid> 1000   # 看 GC 是否频繁且回收不掉
jmap -dump:format=b,file=/tmp/dump.hprof <pid>  # 连续抓 2-3 次做对比
# MAT 分析：Leak Suspects → Path to GC Roots
```

**场景三：接口卡死 / 线程不释放**

```bash
jstack <pid>               # 观察大量 BLOCKED / WAITING 线程
# 确认是否死锁（Found one Java-level deadlock）
# 确认是否锁竞争 / 线程池耗尽 / 远程调用无超时
```

### 8.3 预防体系（测试视角）

| 阶段 | 动作 |
|---|---|
| 代码评审 | 检查锁粒度、递归边界、资源关闭、线程池参数 |
| 静态扫描 | SonarQube：空指针、资源泄漏、并发缺陷规则 |
| 压测 | 并发下验证：线程池是否耗尽、是否出现死锁/内存增长 |
| 监控告警 | JVM 指标（堆使用率、GC 时间、线程数、FGC 次数）接入监控 |
| 演练 | 定期做故障演练：OOM 兜底、线程池降级、dump 自动化采集 |

## 附录：Java 异常与缺陷速查表

| 缺陷类型 | 报错关键字 / 现象 | 定位工具 | 核心解法 |
|---|---|---|---|
| 锁竞争 | `BLOCKED` 线程多、RT 飙升 | jstack、async-profiler | 缩小锁粒度、锁分段、CAS |
| 死锁 | `Found one Java-level deadlock` | jstack、ThreadMXBean | 统一加锁顺序、tryLock 超时 |
| 栈溢出 | `StackOverflowError` | 报错堆栈 | 修递归边界、改迭代 |
| 堆溢出 | `Java heap space` | jmap dump + MAT | 修泄漏、限缓存、分批 |
| 元空间溢出 | `Metaspace` | jstat -gc | 限制动态类、MaxMetaspaceSize |
| 线程数超限 | `Unable to create new native thread` | ulimit、jstack | 线程池复用、设上限 |
| GC 空转 | `GC overhead limit exceeded` | jstat -gcutil | 排查泄漏、调整堆参数 |
| Spring 循环依赖 | `BeanCurrentlyInCreationException` | 启动日志 | @Lazy / 重构 |
| 空指针 | `NullPointerException` | 报错堆栈 | 判空 / Optional |
| 并发修改 | `ConcurrentModificationException` | 报错堆栈 | Iterator.remove / CopyOnWrite |
| 类型转换 | `ClassCastException` | 报错堆栈 | 泛型规范、序列化配置 |
| 类缺失 | `ClassNotFoundException` / `NoClassDefFoundError` | mvn dependency:tree | 补依赖、排冲突 |
| 资源泄漏 | 连接池耗尽、句柄耗尽 | 监控、代码审计 | try-with-resources |
| 线程池耗尽 | 接口超时、任务排队 | jstack、队列监控 | 有界队列、分池隔离 |

> **排障心法**：先看报错关键字缩小范围（栈溢出 vs 堆溢出 vs 并发），再用 jstack/jstat/jmap 三件套取证，最后回代码找根因。测试阶段多构造并发、边界、异常数据场景，能提前暴露绝大多数上述缺陷。
