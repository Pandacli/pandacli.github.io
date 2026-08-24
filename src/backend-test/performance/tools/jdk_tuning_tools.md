---
breadcrumbExclude: true
title: JDK 自带调优五件套深度解析与实战指南
date: 2026-08-22
tags:
  - JDK
  - JVM
  - 性能调优
  - Jstat
  - Jmap
---

> 原文出处：[JDK自带调优五件套（Jstat/Jinfo/Jmap/Jhat/Jstack）深度解析+实战指南 - 腾讯云开发者社区](https://cloud.tencent.com/developer/article/2654531)
>
> 原作者：果酱带你啃java（微信公众号同步）

# JDK 自带调优五件套深度解析与实战指南

在 Java 后端开发中，线上系统出现性能瓶颈、内存泄漏、线程死锁等问题时，高效的问题定位工具至关重要。很多开发者第一时间会想到第三方监控工具，但其实 JDK 自带的 Jstat、Jinfo、Jmap、Jhat、Jstack 这五款命令行工具，早已是性能调优的"神兵利器"。它们轻量、无需额外部署，却能精准穿透 JVM 运行内核，直击问题本质。本文将从底层逻辑出发，结合企业级实战案例，把这五款工具的使用场景、核心参数、实战技巧讲透，让你不用第三方工具也能轻松搞定 JVM 调优。

## 一、前置知识：JVM 核心基础与工具定位

在深入工具细节前，我们先明确 JVM 的核心内存模型和线程模型，这是理解工具工作原理的基础。同时，先搞清楚这五款工具的核心定位，避免使用时混淆场景。

### 1.1 JVM 核心内存模型（简化版）

JVM 内存分为堆内存、方法区、程序计数器、虚拟机栈、本地方法栈。其中：

- **堆内存**：存储对象实例，是 GC 的主要区域，分为年轻代（Eden 区+Survivor 区）和老年代；
- **方法区**：存储类信息、常量、静态变量等，JDK 8 后用元空间（Metaspace）替代，直接使用本地内存；
- **虚拟机栈**：每个线程对应一个栈，存储栈帧（局部变量、操作数栈等），线程私有；
- **程序计数器**：记录当前线程执行的字节码行号，线程私有；
- **本地方法栈**：为本地方法（Native 方法）提供内存空间，线程私有。

### 1.2 五款工具核心定位

| 工具 | 核心功能 | 适用场景 |
|---|---|---|
| Jstat | JVM 统计信息监控，实时采集内存、GC、类加载数据 | 实时监控 GC 状态、判断内存泄漏趋势、类加载效率分析 |
| Jinfo | 查看/修改 JVM 配置参数 | 验证 JVM 参数是否生效、动态修改部分参数（无需重启） |
| Jmap | 生成 JVM 内存快照（dump 文件）、查看内存使用详情 | 分析对象分布、定位内存泄漏、获取堆内存统计 |
| Jhat | 分析 Jmap 生成的 dump 文件，提供 Web 可视化界面 | 离线分析堆快照、定位内存泄漏根源（已被 JVisualVM 替代，但仍需掌握） |
| Jstack | 生成线程快照，查看线程状态、调用栈 | 定位线程死锁、线程阻塞、CPU 100% 问题 |

### 1.3 工具依赖：获取目标 JVM 进程 ID（PID）

所有工具使用前，都需要获取目标 Java 进程的 PID，常用方式有 3 种：

**jps**：JDK 自带进程查看工具，直接显示 Java 进程 PID 和主类名

```bash
[root@node1 ~]# jps -l
12345 com.jam.demo.Application  # PID为12345，主类为com.jam.demo.Application
67890 org.apache.catalina.startup.Bootstrap
```

**ps**：Linux 系统通用进程查看命令
示例：`ps -ef | grep java`（过滤出所有 Java 进程）

**第三方工具**：如 VisualVM、JConsole 连接后直接查看 PID

后续所有工具示例中，均以 `12345` 作为目标进程 PID 进行演示。

## 二、Jstat：JVM 实时监控"仪表盘"

Jstat（JVM Statistics Monitoring Tool）是 JDK 最常用的实时监控工具，能够持续采集 JVM 的内存使用、GC 执行、类加载等统计信息，支持指定采样频率和次数，适合实时观察 JVM 运行状态。

### 2.1 核心工作原理

Jstat 通过连接目标 JVM 进程，读取 JVM 内部的统计数据（如堆内存各区域大小、GC 执行次数/时间、类加载数量等），并以指定格式输出。其底层依赖 JVM 的 Attach API，无需在 JVM 启动时预先配置，随时可以 attach 到运行中的进程。

### 2.2 基本语法

```bash
jstat [ options vmid [ interval [ s|ms ] [ count ] ] ]
```

- **options**：监控参数（核心，如 GC 监控、类加载监控等）；
- **vmid**：目标进程 PID（本地进程直接写 PID，远程进程格式为 `[protocol:]host[:port]`）；
- **interval**：采样间隔（默认单位为毫秒，可指定 s/ms）；
- **count**：采样次数（不指定则持续采样，直到进程结束或手动中断）。

### 2.3 核心 Options 参数详解

Jstat 的 Options 参数按功能可分为 3 类：类加载监控、GC 监控、编译监控，最常用的是 GC 监控相关参数。

#### 2.3.1 类加载监控：-class

输出类加载、卸载的统计信息，包括已加载类数量、大小、卸载数量等。

示例：`jstat -class 12345 1000 5`（每 1 秒采样 1 次，共采样 5 次）

```bash
Loaded  Bytes  Unloaded  Bytes     Time
  1256  2560.3        0     0.0       0.89
  1256  2560.3        0     0.0       0.89
  1256  2560.3        0     0.0       0.89
  1256  2560.3        0     0.0       0.89
  1256  2560.3        0     0.0       0.89
```

字段说明：

- **Loaded**：已加载的类数量；
- **Bytes**：已加载类的总大小（单位：KB）；
- **Unloaded**：已卸载的类数量；
- **Bytes**：已卸载类的总大小（单位：KB）；
- **Time**：类加载/卸载的总时间（单位：秒）。

适用场景：判断是否存在类加载泄漏（如频繁加载类但不卸载，导致元空间溢出）。

#### 2.3.2 GC 监控：-gc、-gcutil、-gccapacity、-gcnew、-gcold

GC 监控是 Jstat 最核心的功能，不同参数侧重点不同：

- `-gc`：显示堆内存各区域的 GC 统计信息（绝对大小）；
- `-gcutil`：显示堆内存各区域的使用率（百分比，最常用）；
- `-gccapacity`：显示堆内存各区域的容量大小（最大/最小/当前）；
- `-gcnew`：显示年轻代 GC 统计信息；
- `-gcold`：显示老年代 GC 统计信息。

**实战示例 1：-gcutil（最常用，查看 GC 使用率）**

命令：`jstat -gcutil 12345 2000`（每 2 秒采样 1 次，持续采样）

```bash
  S0     S1     E      O      M     CCS    YGC     YGCT    FGC    FGCT     GCT
  0.00  50.23  89.45  65.78  92.31  88.67    125    6.789     8    15.678   22.467
  0.00  50.23  92.10  65.78  92.31  88.67    125    6.789     8    15.678   22.467
  0.00  0.00   10.23  66.12  92.31  88.67    126    6.890     8    15.678   22.568
```

字段说明（核心字段必须牢记）：

- **S0**：Survivor 0 区使用率（%）；
- **S1**：Survivor 1 区使用率（%）；
- **E**：Eden 区使用率（%）；
- **O**：老年代使用率（%）；
- **M**：元空间使用率（%）；
- **CCS**：压缩类空间使用率（%）；
- **YGC**：年轻代 GC 次数；
- **YGCT**：年轻代 GC 总时间（秒）；
- **FGC**：Full GC 次数；
- **FGCT**：Full GC 总时间（秒）；
- **GCT**：GC 总时间（秒）。

**关键分析点**：

1. 若 YGC 频繁（如每秒几次），且 YGCT 持续增加，可能是年轻代空间过小，或对象创建速度过快；
2. 若 FGC 频繁（如几分钟一次），则是严重问题，可能是老年代内存泄漏，或大对象直接进入老年代；
3. 若 GCT 占比过高（如超过 CPU 使用率的 20%），说明 GC 消耗大量资源，影响系统性能。

**实战示例 2：-gcnew（分析年轻代 GC 细节）**

命令：`jstat -gcnew 12345 1000 3`

```bash
     S0C    S1C    S0U    S1U   TT MTT  DSS      EC       EU     YGC     YGCT
    1024.0 1024.0    0.0  514.4  15  15  512.0   8192.0   7330.5    126    6.890
    1024.0 1024.0    0.0  514.4  15  15  512.0   8192.0   7560.2    126    6.890
    1024.0 1024.0  520.1    0.0  15  15  512.0   8192.0    830.1    127    6.992
```

字段说明：

- **S0C/S1C**：Survivor 0/1 区容量（KB）；
- **S0U/S1U**：Survivor 0/1 区已使用（KB）；
- **TT**：对象在 Survivor 区的最大存活次数（阈值）；
- **MTT**：对象在 Survivor 区的最大存活次数（最大阈值）；
- **DSS**：期望的 Survivor 区大小（KB）；
- **EC/EU**：Eden 区容量/已使用（KB）。

适用场景：分析年轻代 GC 的触发频率、Survivor 区的对象流转情况，判断年轻代大小是否合理。

#### 2.3.3 编译监控：-compiler、-printcompilation

- `-compiler`：显示 JIT 编译器的统计信息（如编译方法数、失败数）；
- `-printcompilation`：显示正在编译的方法信息。

示例：`jstat -compiler 12345`

```bash
Compiled Failed Invalid   Time   FailedType FailedMethod
  1568     0       0     3.45          0
```

字段说明：

- **Compiled**：已编译的方法数量；
- **Failed**：编译失败的方法数量；
- **Invalid**：失效的编译方法数量；
- **Time**：编译总时间（秒）。

适用场景：排查 JIT 编译相关问题（如编译失败导致的性能下降）。

### 2.4 企业级实战：用 Jstat 定位年轻代过小问题

**问题现象**：线上系统响应缓慢，JPS 查看进程正常，但 CPU 使用率持续偏高（30%-40%）。

**排查步骤**：

1. 用 `jstat -gcutil 12345 1000` 监控 GC 状态：输出显示 YGC 每秒 2-3 次，YGCT 累计快速增加，Eden 区使用率每秒从 0% 涨到 90% 以上，触发 Young GC。
2. 用 `jstat -gccapacity 12345` 查看年轻代容量：输出显示 Eden 区容量仅为 4MB，Survivor 区各 1MB，年轻代总容量 6MB。
3. **结论**：年轻代空间过小，导致对象创建速度超过 GC 回收速度，频繁触发 Young GC，消耗大量 CPU 资源。

**解决方案**：调整 JVM 参数，增大年轻代空间（如 `-Xmn256m`），重启后观察，YGC 频率降至每分钟 1-2 次，CPU 使用率恢复正常。

## 三、Jinfo：JVM 参数"侦察兵"与动态修改工具

Jinfo（JVM Configuration Info）的核心功能是查看和修改 JVM 的配置参数，包括启动时指定的参数、默认参数，以及部分支持动态修改的参数（无需重启 JVM）。对于线上系统，动态修改参数可以避免重启带来的服务中断，非常实用。

### 3.1 核心工作原理

Jinfo 通过 Attach API 连接目标 JVM 进程，读取 JVM 的参数配置信息（存储在 JVM 的内存数据结构中），同时支持对部分标记为"可动态修改"的参数进行更新，修改后立即生效。

### 3.2 基本语法

```bash
jinfo [ option ] vmid
```

- **option**：操作参数（查看所有参数、查看指定参数、修改参数等）；
- **vmid**：目标进程 PID。

### 3.3 核心功能与实战示例

#### 3.3.1 查看所有 JVM 参数：-flags

命令：`jinfo -flags 12345`

输出示例（关键部分）：

```bash
Attaching to process ID 12345, please wait...
Debugger attached successfully.
Server compiler detected.
JVM version is 17.0.8+7-LTS
Non-default VM flags: -XX:CICompilerCount=4 -XX:InitialHeapSize=536870912 -XX:MaxHeapSize=8589934592 -XX:NewSize=178257920 -XX:OldSize=358612992 -XX:+UseCompressedClassPointers -XX:+UseCompressedOops -XX:+UseG1GC
Command line:  -jar /data/app/demo.jar -Xms512m -Xmx8g -Xmn170m -XX:+UseG1GC
```

字段说明：

- **Non-default VM flags**：非默认的 JVM 参数（手动指定或修改过的）；
- **Command line**：启动时传入的命令行参数（包括 JVM 参数和程序参数）。

适用场景：验证 JVM 参数是否正确生效（如确认是否启用了 G1GC，堆大小是否符合预期）。

#### 3.3.2 查看指定 JVM 参数的值：-flag <参数名>

命令：`jinfo -flag MaxHeapSize 12345`（查看最大堆内存）

```bash
-XX:MaxHeapSize=8589934592  # 单位为字节，即8GB
```

命令：`jinfo -flag UseG1GC 12345`（查看是否启用 G1GC）

```bash
-XX:+UseG1GC  # +表示启用，-表示禁用
```

#### 3.3.3 动态修改支持的 JVM 参数：-flag [+|-]<参数名> 或 -flag <参数名>=<值>

**注意**：并非所有 JVM 参数都支持动态修改，只有标记为"manageable"的参数才能动态调整（可通过 `java -XX:+PrintFlagsFinal -version | grep manageable` 查看所有支持动态修改的参数）。

常用可动态修改的参数：

- `-XX:+PrintGC`：启用 GC 日志输出；
- `-XX:+PrintGCDetails`：启用详细 GC 日志输出；
- `-XX:GCTimeRatio`：调整 GC 时间占比阈值；
- `-XX:MaxGCPauseMillis`：调整 G1GC 的最大暂停时间目标。

**实战示例 1**：启用 GC 详细日志（无需重启）

```bash
jinfo -flag +PrintGCDetails 12345
jinfo -flag PrintGCDetails 12345   # 验证，输出 -XX:+PrintGCDetails 表示已启用
```

**实战示例 2**：调整 G1GC 最大暂停时间为 200ms

```bash
jinfo -flag MaxGCPauseMillis=200 12345
jinfo -flag MaxGCPauseMillis 12345   # 验证，输出 -XX:MaxGCPauseMillis=200
```

#### 3.3.4 查看系统属性：-sysprops

命令：`jinfo -sysprops 12345`，输出 JVM 的系统属性（如 `java.version`、`user.home` 等），等同于 `System.getProperties()` 的输出。

### 3.4 常见问题与注意事项

1. **动态修改参数失效**：确认参数是否支持动态修改（通过 `PrintFlagsFinal` 查看 `manageable` 属性）；
2. **权限问题**：执行 Jinfo 需要目标进程的权限（如 root 用户才能查看其他用户启动的 Java 进程）；
3. **远程连接**：需要目标 JVM 开启远程调试功能（如添加 `-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=8000` 参数），然后通过 `jinfo -flag <参数名> 192.168.1.100:8000` 连接。

## 四、Jmap：JVM 内存快照"生成器"

Jmap（JVM Memory Map）的核心功能是生成 JVM 的堆内存快照（dump 文件），同时可以查看堆内存的使用概况、对象分布、类加载信息等。dump 文件是分析内存泄漏、大对象问题的核心数据来源，结合后续的 Jhat 或 VisualVM 工具可以精准定位问题。

### 4.1 核心工作原理

Jmap 通过 Attach API 连接目标 JVM，遍历堆内存中的对象实例，收集对象的类型、大小、引用关系等信息，生成二进制的 dump 文件（也叫堆转储文件）。生成 dump 文件时，JVM 会暂停应用线程（STW，Stop The World），因此线上系统生成 dump 时需注意时机，避免影响业务。

### 4.2 基本语法

```bash
jmap [ option ] vmid
```

- **option**：操作参数（生成 dump、查看内存概况等）；
- **vmid**：目标进程 PID。

### 4.3 核心功能与实战示例

#### 4.3.1 生成堆内存快照（dump 文件）：-dump

核心参数：`-dump:[live,]format=b,file=<文件名>.hprof <pid>`

- **live**：可选参数，仅 dump 存活的对象（触发一次 Full GC 后再 dump，减少文件大小）；
- **format=b**：指定输出格式为二进制（必须）；
- **file**：指定 dump 文件的保存路径和文件名。

实战示例：生成仅包含存活对象的 dump 文件

```bash
jmap -dump:live,format=b,file=/data/dump/demo_heap_dump.hprof 12345
```

输出：`Dumping heap to /data/dump/demo_heap_dump.hprof ... Heap dump file created`

**注意事项**：

1. 线上系统生成 dump 时，若添加 `live` 参数，会触发 Full GC，导致 STW，需避开业务高峰期；
2. dump 文件大小可能接近堆内存大小（如堆最大 8GB，dump 文件可能达几 GB），需确保目标路径有足够磁盘空间；
3. 生成 dump 的时间与堆大小和对象数量有关，堆越大，时间越长，期间应用无法响应请求。

#### 4.3.2 查看堆内存使用概况：-heap

命令：`jmap -heap 12345`，输出堆内存的详细配置和使用情况，包括堆大小、GC 收集器、各区域使用情况等。

输出示例（关键部分）：

```bash
Attaching to process ID 12345, please wait...
Debugger attached successfully.
Server compiler detected.
JVM version is 17.0.8+7-LTS

using thread-local object allocation.
Garbage-First (G1) GC with 4 thread(s)

Heap Configuration:
   MinHeapFreeRatio         = 40
   MaxHeapFreeRatio         = 70
   MaxHeapSize              = 8589934592 (8192.0MB)
   NewSize                  = 178257920 (170.0MB)
   MaxNewSize               = 5153960448 (4915.2MB)
   OldSize                  = 358612992 (343.0MB)
   NewRatio                 = 2
   SurvivorRatio            = 8
   MetaspaceSize            = 21807104 (20.796875MB)
   CompressedClassSpaceSize = 1073741824 (1024.0MB)
   MaxMetaspaceSize         = 17179869184 (16384.0MB)

Heap Usage:
G1 Heap:
   regions  = 1024
   capacity = 8589934592 (8192.0MB)
   used     = 5662310400 (5400.0MB)
   free     = 2927624192 (2792.0MB)
   65.91796875% used
G1 Young Generation:
Eden Space:
   regions  = 256
   capacity = 2684354560 (2560.0MB)
   used     = 2684354560 (2560.0MB)
   free     = 0 (0.0MB)
   100.0% used
Survivor Space:
   regions  = 32
   capacity = 335544320 (320.0MB)
   used     = 167772160 (160.0MB)
   free     = 167772160 (160.0MB)
   50.0% used
G1 Old Generation:
   regions  = 128
   capacity = 5570505728 (5312.0MB)
   used     = 2809183232 (2680.0MB)
   free     = 2761322496 (2632.0MB)
   50.430232558139535% used
```

适用场景：快速查看堆内存配置是否符合预期（如最大堆、年轻代大小），各区域使用情况是否正常。

#### 4.3.3 查看堆内存中对象分布：-histo

命令：`jmap -histo 12345`，输出堆内存中各类对象的数量、大小统计（按大小排序）。若添加 `live` 参数（`jmap -histo:live 12345`），则仅统计存活对象（触发 Full GC）。

输出示例（关键部分）：

```bash
 num     #instances         #bytes  class name (module)
-------------------------------------------------------
   1:         85623       27400960  java.lang.String (java.base)
   2:         62345       23262200  java.util.HashMap$Node (java.base)
   3:         15678       18246720  com.jam.demo.entity.User (demo)
   4:         12345       15609600  java.util.ArrayList (java.base)
   5:          8976       10242560  com.jam.demo.service.impl.UserServiceImpl (demo)
```

字段说明：

- **num**：序号；
- **#instances**：对象实例数量；
- **#bytes**：对象总大小（字节）；
- **class name**：类名（`[I` 表示 int 数组，`[Ljava.lang.String;` 表示 String 数组）。

**关键分析点**：

1. 若某类对象（如 `com.jam.demo.entity.User`）的数量和大小异常多（如几十万实例），可能是该类对象未被正确回收，存在内存泄漏；
2. 若 String 对象数量过多，可能是字符串常量池溢出，或频繁创建大量临时字符串（未使用 `intern()` 复用）。

实战示例：定位大对象问题

```bash
jmap -histo:live 12345 | head -20   # 查看前20个最大对象
```

若输出中发现 `com.jam.demo.entity.Order` 有 10 万实例，总大小达 500MB，结合业务逻辑分析，发现是订单查询接口未分页，一次性加载了所有订单数据，导致大对象堆积。

#### 4.3.4 查看永久代（元空间）使用情况：-permstat（JDK 8+ 已废弃，用 -histo 代替）

JDK 8 及以上版本，永久代被元空间替代，`-permstat` 参数已废弃，若需查看元空间的类加载信息，可使用 `jmap -histo` 结合类名过滤（如 `grep "class"`）。

### 4.4 企业级实战：用 Jmap 生成 dump 分析内存泄漏

**问题现象**：线上系统运行 3 天后，老年代使用率从 30% 涨到 90%，频繁触发 Full GC，系统响应越来越慢。

**排查步骤**：

1. 用 `jmap -heap 12345` 确认堆内存使用情况，发现老年代使用率 92%，年轻代正常；
2. 生成存活对象的 dump 文件：`jmap -dump:live,format=b,file=/data/dump/leak_dump.hprof 12345`（避开业务高峰期）；
3. 将 dump 文件下载到本地，结合 Jhat 或 VisualVM 分析（后续 Jhat 章节详细讲解）；
4. 分析发现 `com.jam.demo.cache.UserCache` 类中有一个静态 HashMap，存储了所有用户的登录记录，但未设置过期清理机制，随着用户登录次数增加，HashMap 中的对象越来越多，无法被 GC 回收，导致老年代内存泄漏。

**解决方案**：修改 `UserCache` 类，使用 `WeakHashMap` 替代 `HashMap`，或添加定时任务清理过期的登录记录，部署后观察，老年代使用率稳定在 40% 左右，Full GC 频率恢复正常。

## 五、Jhat：堆快照"分析器"（Web 可视化）

Jhat（JVM Heap Analysis Tool）是 JDK 自带的堆快照分析工具，能够解析 Jmap 生成的 dump 文件，生成 Web 可视化界面，支持查看对象分布、引用关系、查找内存泄漏根源等。虽然 JDK 9 后 Jhat 被标记为废弃（推荐使用 JVisualVM），但由于其轻量、无需额外安装，仍在部分场景下使用。

### 5.1 核心工作原理

Jhat 启动一个 Web 服务器，解析 dump 文件中的二进制数据，将对象的类型、大小、引用关系等信息转换为 HTML 页面，用户通过浏览器访问（默认端口 7000），即可查看和分析堆内存数据。Jhat 还支持自定义查询语句（OQL，Object Query Language），精准查找目标对象。

### 5.2 基本语法

```bash
jhat [ options ] <dump-file>
```

- **options**：可选参数（如指定端口、设置堆大小等）；
- **dump-file**：Jmap 生成的 dump 文件路径。

### 5.3 核心功能与实战示例

#### 5.3.1 基本使用：启动 Jhat 服务解析 dump 文件

命令：`jhat -J-Xmx2g /data/dump/leak_dump.hprof`

- `-J-Xmx2g`：指定 Jhat 自身的堆内存大小（若 dump 文件较大，需增大此参数，否则会 OOM）；

输出示例：

```bash
Reading from /data/dump/leak_dump.hprof...
Dump file created Wed Oct 11 15:30:22 CST 2024
Snapshot read, resolving...
Resolving 567890 objects...
Chasing references, expect 113 dots...............................................................
Eliminating duplicate references...............................................................
Snapshot resolved.
Started HTTP server on port 7000
Server is ready.
```

此时，通过浏览器访问 `http://localhost:7000`（若在远程服务器，需替换为服务器 IP），即可进入 Jhat 的 Web 分析界面。

#### 5.3.2 Web 界面核心功能详解

**首页核心入口**：

- **Classes**：按类名查看所有对象（按包名分类）；
- **Class instances count**：按对象数量排序查看类；
- **Class instances size**：按对象大小排序查看类；
- **OQL Query**：自定义 OQL 查询语句；
- **Show all members of a class**：查看指定类的所有成员变量；
- **Show instance counts for all classes (including platform)**：查看所有类的实例数量（包括 JDK 内置类）。

**关键分析功能实战**：

**（1）查看大对象类**

点击首页"Class instances size"，进入按大小排序的类列表，找到最大的几个类（如 `com.jam.demo.cache.UserCache`），点击类名进入详情页，查看该类的实例数量和引用关系。

**（2）查看对象引用关系**

在类详情页，点击某个实例的"Reference"链接，可查看该对象被哪些对象引用（传入引用），以及引用了哪些对象（传出引用）。对于内存泄漏问题，重点查看"传入引用"，找到导致对象无法被回收的根引用（如静态变量、线程局部变量等）。

**（3）OQL 查询（精准查找对象）**

Jhat 支持 OQL（类似 SQL）查询堆中的对象，语法简洁，适合精准定位问题。

实战示例：查找 `com.jam.demo.entity.User` 类中 `age > 30` 的对象

在 OQL Query 输入框中输入：

```bash
select u.id, u.name, u.age from com.jam.demo.entity.User u where u.age > 30
```

点击"Execute"，即可显示符合条件的 User 对象列表。

其他常用 OQL：

- 查找指定类的所有对象：`select * from com.jam.demo.entity.User`；
- 查找大小大于 1MB 的对象：`select * from java.lang.Object o where size(o) > 1024*1024`；
- 查找被静态变量引用的对象：`select * from java.lang.Object o where referrers(o) instanceof java.lang.Class`。

#### 5.3.3 常见问题与注意事项

1. **Jhat 自身 OOM**：若 dump 文件较大（如超过 2GB），需通过 `-J-Xmx` 参数增大 Jhat 的堆内存（如 `-J-Xmx4g`）；
2. **解析速度慢**：dump 文件越大，解析时间越长，耐心等待即可；
3. **功能有限**：Jhat 不支持可视化的引用链图，复杂内存泄漏问题建议使用 JVisualVM 或 MAT（Memory Analyzer Tool）；
4. **远程访问**：若 Jhat 部署在远程服务器，需开放 7000 端口（如 `firewall-cmd --add-port=7000/tcp --permanent`），否则本地浏览器无法访问。

### 5.4 实战：用 Jhat 定位内存泄漏根源

基于 4.4 节的内存泄漏问题，使用 Jhat 分析 dump 文件：

1. 启动 Jhat 服务，访问 Web 界面，点击"Class instances size"，找到 `com.jam.demo.cache.UserCache` 类（大小 500MB，实例 1 个）；
2. 点击该类，进入详情页，查看实例的"Reference"链接，发现该实例被 `java.lang.Class`（即 UserCache 类的静态引用）引用；
3. 查看 UserCache 实例的成员变量，发现 `static HashMap<String, UserLoginRecord> loginMap` 中有 10 万+条记录，且无过期清理逻辑；
4. **结论**：静态 HashMap 持有大量 UserLoginRecord 对象的强引用，导致这些对象无法被 GC 回收，最终造成老年代内存泄漏。

## 六、Jstack：线程问题"诊断仪"

Jstack（JVM Stack Trace）的核心功能是生成线程快照（线程堆栈），显示当前所有线程的状态、调用栈信息、锁持有情况等。线程快照是定位线程死锁、线程阻塞、CPU 100% 等问题的核心工具，能够精准找到问题线程和对应的代码位置。

### 6.1 核心工作原理

Jstack 通过 Attach API 连接目标 JVM，遍历所有线程（包括用户线程和 JVM 内部线程），收集每个线程的状态（如 RUNNABLE、BLOCKED、WAITING）、调用栈（方法调用链）、锁信息（持有锁、等待锁）等，生成文本格式的线程快照。生成快照时，JVM 会短暂 STW（毫秒级，对业务影响极小）。

### 6.2 基本语法

```bash
jstack [ options ] vmid
```

- **option**：操作参数（如查看锁信息、强制生成快照等）；
- **vmid**：目标进程 PID。

### 6.3 核心线程状态说明

线程状态在 JVM 中分为 6 种，需重点关注以下 4 种（线程快照中用 `java.lang.Thread.State` 标识）：

1. **RUNNABLE**：运行中（正在执行代码或等待 CPU 调度）；
2. **BLOCKED**：阻塞状态（等待获取对象锁，如 `synchronized` 未获取到锁）；
3. **WAITING**：无限等待状态（通过 `Object.wait()`、`Thread.join()` 等方法进入，需其他线程唤醒）；
4. **TIMED_WAITING**：计时等待状态（通过 `Object.wait(long)`、`Thread.sleep(long)` 等方法进入，超时后自动唤醒）。

### 6.4 核心功能与实战示例

#### 6.4.1 生成线程快照：基本使用

命令：`jstack 12345 > /data/dump/demo_thread_dump.txt`（将快照输出到文件，方便分析）

输出文件的核心内容结构（每个线程的信息）：

```bash
"http-nio-8080-exec-1" #26 daemon prio=5 os_prio=0 cpu=1234.56ms elapsed=12345.67s tid=0x00007f8a12345678 nid=0x1234 runnable [0x00007f8a0abcdef0]
   java.lang.Thread.State: RUNNABLE
        at com.jam.demo.service.impl.UserServiceImpl.queryUserById(UserServiceImpl.java:45)
        at com.jam.demo.controller.UserController.getUser(UserController.java:30)
        at jdk.internal.reflect.NativeMethodAccessorImpl.invoke0(Native Method)
        at jdk.internal.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:77)
        at jdk.internal.reflect.DelegatingMethodAccessorImpl.invoke(DelegatingMethodAccessorImpl.java:43)
        at java.lang.reflect.Method.invoke(Method.java:568)
        at org.springframework.web.method.support.InvocableHandlerMethod.doInvoke(InvocableHandlerMethod.java:205)
        ...

"http-nio-8080-exec-2"#27 daemon prio=5 os_prio=0 cpu=987.65ms elapsed=12345.67s tid=0x00007f8a12345680 nid=0x1235 waiting for monitor entry [0x00007f8a0abd0000]
   java.lang.Thread.State: BLOCKED (on object monitor)
        at com.jam.demo.service.impl.UserServiceImpl.updateUser(UserServiceImpl.java:60)
        - waiting to lock <0x000000076ab12345> (a com.jam.demo.service.impl.UserServiceImpl)
        at com.jam.demo.controller.UserController.updateUser(UserController.java:45)
        ...
```

字段说明：

- **"http-nio-8080-exec-1"**：线程名（通常包含业务标识，如 Tomcat 的请求处理线程）；
- **#26**：线程编号；
- **daemon**：是否为守护线程（daemon 表示守护线程）；
- **prio=5**：线程优先级（默认 5）；
- **os_prio=0**：操作系统优先级；
- **cpu=1234.56ms**：线程占用 CPU 时间；
- **elapsed=12345.67s**：线程运行时间；
- **tid=0x00007f8a12345678**：线程 ID（JVM 内部标识）；
- **nid=0x1234**：线程对应的操作系统进程 ID（可通过 `top -p 12345 -H` 查看 CPU 占用高的线程 nid）；
- **runnable**：线程状态；
- 后续为调用栈：从下到上是方法调用链（最上面是当前执行的方法和行号）。

#### 6.4.2 检测线程死锁：-l 参数

`-l` 参数会在线程快照中额外输出锁的详细信息，包括死锁检测结果。若存在死锁，Jstack 会在快照末尾明确标注死锁的线程和持有的锁。

实战示例：检测死锁

```bash
jstack -l 12345 > /data/dump/demo_deadlock_dump.txt
```

输出文件末尾的死锁信息：

```bash
Found one Java-level deadlock:
=============================
"Thread-A":
  waiting to lock monitor 0x00007f8a12345678 (object 0x000000076ab12345, a com.jam.demo.service.impl.OrderServiceImpl),
which is held by "Thread-B"
"Thread-B":
  waiting to lock monitor 0x00007f8a12345680 (object 0x000000076ab12350, a com.jam.demo.service.impl.UserServiceImpl),
which is held by "Thread-A"

Java stack information for the threads listed above:
===================================================
"Thread-A":
        at com.jam.demo.service.impl.OrderServiceImpl.updateOrder(OrderServiceImpl.java:75)
        - waiting to lock <0x000000076ab12345> (a com.jam.demo.service.impl.OrderServiceImpl)
        at com.jam.demo.service.impl.UserServiceImpl.updateUserAndOrder(UserServiceImpl.java:90)
        - locked <0x000000076ab12350> (a com.jam.demo.service.impl.UserServiceImpl)
        ...
"Thread-B":
        at com.jam.demo.service.impl.UserServiceImpl.queryUserByOrderId(UserServiceImpl.java:65)
        - waiting to lock <0x000000076ab12350> (a com.jam.demo.service.impl.UserServiceImpl)
        at com.jam.demo.service.impl.OrderServiceImpl.queryOrderDetail(OrderServiceImpl.java:50)
        - locked <0x0000000076ab12345> (a com.jam.demo.service.impl.OrderServiceImpl)
        ...

Found 1 deadlock.
```

**死锁分析**：

- Thread-A 持有 UserServiceImpl 的锁（0x000000076ab12350），等待 OrderServiceImpl 的锁（0x000000076ab12345）；
- Thread-B 持有 OrderServiceImpl 的锁（0x000000076ab12345），等待 UserServiceImpl 的锁（0x000000076ab12350）；
- 两者相互等待对方的锁，形成死锁，导致两个线程无法继续执行。

#### 6.4.3 定位 CPU 100% 问题

CPU 100% 通常是由于某个线程陷入无限循环或执行耗时过长的操作（如复杂计算、死循环），通过 Jstack 结合 top 命令可快速定位。

实战步骤：

1. 用 `top` 命令找到 CPU 占用高的 Java 进程：`top -p 12345`（12345 为目标 PID）；
2. 按 `H` 键查看进程内各线程的 CPU 占用率，找到 CPU 100% 的线程（假设线程 ID 为 `0x1234`，即 nid=0x1234）；
3. 将线程 ID 转换为十进制（0x1234 → 4660）；
4. 用 Jstack 生成线程快照，过滤出该线程的信息：`jstack 12345 | grep -A 20 4660`；
5. 查看该线程的调用栈，找到对应的代码行，分析是否存在无限循环或耗时操作。

示例输出（过滤后的线程信息）：

```bash
"ComputeThread-1" #30 prio=5 os_prio=0 cpu=99876.54ms elapsed=1234.56s tid=0x00007f8a12345690 nid=0x1234 runnable [0x00007f8a0abe0000]
   java.lang.Thread.State: RUNNABLE
        at com.jam.demo.service.impl.ComputeServiceImpl.calculate(ComputeServiceImpl.java:35)
        at com.jam.demo.service.impl.ComputeServiceImpl.run(ComputeServiceImpl.java:20)
        at java.lang.Thread.run(Thread.java:833)
```

分析：`ComputeServiceImpl.java:35` 行存在无限循环（如 `while(true)` 未加退出条件），导致该线程持续占用 CPU，最终使 CPU 使用率达到 100%。

### 6.5 企业级实战：解决线程死锁问题

**问题现象**：线上系统部分订单相关接口无响应，日志无报错，线程数持续增加。

**排查步骤**：

1. 用 `jps` 获取进程 PID（12345）；
2. 用 `jstack -l 12345` 生成线程快照，发现存在死锁（如 6.4.2 节示例）；
3. 定位死锁代码：Thread-A 的 `updateUserAndOrder` 方法先锁 UserServiceImpl，再调用 OrderServiceImpl 的 `updateOrder` 方法（需要锁 OrderServiceImpl）；Thread-B 的 `queryOrderDetail` 方法先锁 OrderServiceImpl，再调用 UserServiceImpl 的 `queryUserByOrderId` 方法（需要锁 UserServiceImpl）；
4. **死锁原因**：两个线程获取锁的顺序不一致；

**解决方案**：统一锁的获取顺序，所有线程先获取 UserServiceImpl 的锁，再获取 OrderServiceImpl 的锁。修改代码后，死锁问题解决，接口恢复正常。

## 七、五款工具协同作战：企业级综合调优案例

前面分别讲解了各工具的使用，实际调优中，往往需要多工具协同配合，才能高效定位问题。下面通过一个综合案例，演示五款工具的协同使用流程。

### 7.1 案例背景

线上电商系统（Spring Boot + MyBatis-Plus）运行一周后，出现以下问题：

1. 响应时间从 100ms 增至 500ms+；
2. 内存使用率持续上升，老年代从 30% 涨到 95%；
3. 频繁触发 Full GC，每 10 分钟一次；
4. 部分接口偶发超时。

### 7.2 协同排查流程

**步骤 1：用 Jstat 实时监控 GC 状态**

命令：`jstat -gcutil 12345 2000 100`

输出显示：

- 老年代使用率 95%，FGC 次数 23 次，FGCT 累计 35 秒；
- YGC 频率正常，每秒 1-2 次；
- **结论**：问题出在老年代，存在内存泄漏。

**步骤 2：用 Jinfo 查看 JVM 参数**

命令：`jinfo -flags 12345`

输出显示：

- 堆参数：`-Xms4g -Xmx4g -Xmn1g -XX:+UseG1GC`；
- 无动态修改过的参数；
- **结论**：JVM 参数配置合理，排除参数不当问题。

**步骤 3：用 Jmap 生成堆快照**

命令：`jmap -dump:live,format=b,file=/data/dump/ecommerce_dump.hprof 12345`（凌晨 2 点业务低峰期执行）

**步骤 4：用 Jhat 分析堆快照**

1. 启动 Jhat 服务：`jhat -J-Xmx4g /data/dump/ecommerce_dump.hprof`；
2. 访问 Web 界面，点击"Class instances size"，发现 `com.jam.demo.entity.Order` 类有 50 万+实例，总大小 2.8GB；
3. 查看 Order 实例的引用关系，发现被 `com.jam.demo.service.impl.OrderQueryServiceImpl` 的静态变量 `orderCache`（HashMap）引用；
4. 查看 `orderCache` 的使用逻辑，发现是订单查询缓存，未设置过期时间，且无清理机制，导致订单数据持续堆积。

**步骤 5：用 Jstack 排查线程问题**

命令：`jstack 12345 > /data/dump/ecommerce_thread_dump.txt`

分析发现：

- 多个"http-nio-8080-exec"线程处于 BLOCKED 状态，等待获取 `orderCache` 的锁；
- 原因：`orderCache` 的操作未使用并发安全的集合，多个线程同时修改时，通过 `synchronized` 加锁，导致线程阻塞，响应时间增加。

### 7.3 解决方案

1. **缓存优化**：将 `orderCache` 从 HashMap 改为 `ConcurrentHashMap`（并发安全），并添加过期清理机制（使用 `com.google.common.cache.CacheBuilder` 设置过期时间和最大缓存数量）；

2. **代码修改示例**（符合阿里巴巴开发手册规范）：

```java
package com.jam.demo.service.impl;

import com.google.common.cache.CacheBuilder;
import com.google.common.cache.CacheLoader;
import com.google.common.cache.LoadingCache;
import com.jam.demo.entity.Order;
import com.jam.demo.mapper.OrderMapper;
import com.jam.demo.service.OrderQueryService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;
import java.util.concurrent.TimeUnit;

/**
 * 订单查询服务实现类
 *
 * @author ken
 */
@Service
@Slf4j
public class OrderQueryServiceImpl implements OrderQueryService {

    @Resource
    private OrderMapper orderMapper;

    /**
     * 订单缓存：过期时间30分钟，最大缓存10万条
     */
    private final LoadingCache<Long, Order> orderCache = CacheBuilder.newBuilder()
            .expireAfterWrite(30, TimeUnit.MINUTES)
            .maximumSize(100000)
            .build(new CacheLoader<>() {
                @Override
                public Order load(Long orderId) {
                    // 缓存未命中时，从数据库查询
                    log.info("订单缓存未命中，查询数据库：orderId={}", orderId);
                    return orderMapper.selectById(orderId);
                }
            });

    /**
     * 根据订单ID查询订单详情
     *
     * @param orderId 订单ID
     * @return 订单详情
     */
    @Override
    public Order queryOrderById(Long orderId) {
        try {
            return orderCache.get(orderId);
        } catch (Exception e) {
            log.error("查询订单详情失败，orderId={}", orderId, e);
            return null;
        }
    }
}
```

3. **依赖配置**（pom.xml，使用最新稳定版本）：

```xml
<!-- Google Guava 缓存 -->
<dependency>
    <groupId>com.google.guava</groupId>
    <artifactId>guava</artifactId>
    <version>32.1.3-jre</version>
</dependency>
<!-- Lombok -->
<dependency>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok</artifactId>
    <version>1.18.30</version>
    <scope>provided</scope>
</dependency>
<!-- MyBatis-Plus -->
<dependency>
    <groupId>com.baomidou</groupId>
    <artifactId>mybatis-plus-boot-starter</artifactId>
    <version>3.5.5</version>
</dependency>
```

### 7.4 优化效果验证

1. 用 Jstat 监控：老年代使用率稳定在 40% 左右，Full GC 频率降至每天 1-2 次；
2. 用 Jmap 生成新的 dump 文件，分析发现 Order 实例数量控制在 10 万以内；
3. 用 Jstack 查看线程状态：BLOCKED 线程消失，所有请求处理线程正常运行；
4. 业务指标：响应时间恢复至 100ms 以内，接口超时问题解决。

## 八、总结与进阶建议

JDK 自带的 Jstat、Jinfo、Jmap、Jhat、Jstack 五款工具，覆盖了 JVM 监控、参数调试、内存分析、线程诊断的全流程，是 Java 开发者必备的调优工具。它们虽然没有图形化界面，但轻量、高效、无需额外部署，在线上问题定位中发挥着不可替代的作用。

### 核心工具使用场景总结

- 实时监控 GC：**Jstat**（-gcutil）；
- 查看/修改 JVM 参数：**Jinfo**（-flags、-flag）；
- 生成堆快照：**Jmap**（-dump）；
- 分析堆快照：**Jhat**（或 JVisualVM/MAT）；
- 定位线程问题（死锁、CPU 100%）：**Jstack**（-l）。
