---
breadcrumbExclude: true
title: JVM 问题排查工具全解析（JDK 五件套 + 在线调试 + 图形化分析）
date: 2026-08-22
tags:
  - JDK
  - JVM
  - 性能调优
  - Jstat
  - Jmap
---



# JVM 问题排查工具全解析（JDK 五件套 + 在线调试 + 图形化分析）

在 Java 后端开发中，线上系统出现性能瓶颈、内存泄漏、线程死锁等问题时，高效的问题定位工具至关重要。很多开发者第一时间会想到第三方监控工具，但其实 JDK 自带的 Jstat、Jinfo、Jmap、Jhat、Jstack 这五款命令行工具，早已是性能调优的"神兵利器"。它们轻量、无需额外部署，却能精准穿透 JVM 运行内核，直击问题本质。

本文将从底层逻辑出发，结合企业级实战案例，把这五款工具的使用场景、核心参数、实战技巧讲透；同时补充 **jps 进程查看**、**在线调试工具（jdb/btrace/Greys/Arthas/javOSize）**、**OOM Killer 排查（dmesg）** 以及 **图形化分析工具（VisualVM/JProfiler/MAT）**，形成从命令行到可视化、从本地到生产环境的完整排查工具链。

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

#### 1.3.1 Jps 命令详解（进程状态工具）

Jps 全称 Java Virtual Machine Process Status Tool，类似 Linux 的 `ps`，专门用来显示本地/远程 JVM 进程。

**原理**：Jps 通过扫描 JVM 启动时在 `/tmp/hsperfdata_{userName}/` 目录下生成的 `hsperf` 性能数据文件来获取进程信息，**目录下的文件名就是进程的 PID**。

```bash
[root@node1 ~]# ls /tmp/hsperfdata_admin/
12345  67890
```

**常用参数：**

| 参数 | 说明 |
|---|---|
| `-q` | 只输出 PID，省略类名/Jar 名等参数 |
| `-m` | 输出传递给 main 方法的参数 |
| `-l` | 输出应用程序主类的完整包名或 Jar 文件完整路径名 |
| `-v` | 输出传递给 JVM 的参数（如 `-Xms -Xmx`） |
| `-V` | 输出通过标志文件（`.hotspotrc` 或 `-XX:Flags=<file>`）传给 JVM 的参数 |
| `-Joption` | 传递参数给 jps 启动的 JVM（例如 `-J-Xms512m`） |

**远程使用：**

```bash
jps -l 192.168.10.1:1099   # 通过 RMI 协议查看远程 JVM
```

> **说明**：生产环境若加了 `-Djava.security.manager` 安全策略，Jps 可能无法读取进程信息，此时改用 `ps -ef | grep java` 获取 PID。

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

## 八、在线调试与问题排查进阶工具

前文的 Jstat/Jinfo/Jmap/Jhat/Jstack 是 JDK 自带的基础排查工具，适用于"先抓快照、再分析"的场景。但在**生产环境（网络隔离、不能轻易重启应用）**下，还需要一批在线调试工具，它们能直接 attach 到运行中的 JVM，动态观察方法调用、字节码甚至修改代码行为。参考 pdai 的「Java 问题排查之工具单」，常用进阶工具如下。

### 8.1 Jdb：Java 调试器（远程调试）

Jdb 是 JDK 自带的命令行调试器，功能类似 gdb，可以远程 attach 到运行中的 JVM 进行断点调试。

```bash
jdb -attach 8000   # 远程 attach 到启动参数带 -agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=8000 的进程
```

常用命令：`stop at 类名:行号`（下断点）、`print 表达式`（求值）、`threads`（查看线程）、`cont`（继续执行）。

### 8.2 Btrace：生产环境动态追踪

Btrace 基于字节码注入技术（Instrumentation），可以在**不重启应用**的情况下，动态追踪目标方法的调用，输出方法参数、返回值、调用次数等，是定位生产环境疑难杂症的利器。

**示例：查看谁调用了 `ArrayList.add` 且参数 size 大于 479**

```java
package com.taobao.taokeeper.monitor.core.task;

import com.sun.btrace.annotations.*;
import static com.sun.btrace.BTraceUtils.*;
import java.util.ArrayList;

@BTrace
public class TraceArrayListAddSize {

    // 监控 ArrayList.add 方法
    @OnMethod(clazz = "java.util.ArrayList", method = "add")
    public static void onArrayListAdd(@Self ArrayList self, Object element) {
        // 当集合大小超过 479 时，打印堆栈
        if (size(self) > 479) {
            println("================ArrayList.size() > 479==================");
            jstack();
        }
    }
}
```

**示例：监控方法返回值与耗时**

```java
package com.taobao.taokeeper.monitor.core.task;

import com.sun.btrace.annotations.*;
import static com.sun.btrace.BTraceUtils.*;

@BTrace
public class TraceMethodReturn {

    @OnMethod(clazz = "com.demo.OrderService", method = "createOrder", location = @Location(Kind.RETURN))
    public static void traceReturn(@ProbeMethodName String methodName, @Return String result) {
        println("方法 " + methodName + " 返回值: " + result);
    }
}
```

**使用注意事项：**

1. 输出不稳定，**JDK 1.3.9 release 模式下输出不可靠**；
2. 注入正则表达式务必**控制好范围**，否则会匹配过多方法导致 CPU 被打满；
3. 属于**字节码注入**，一旦运行无法卸载，需要重启应用才能恢复；生产环境使用需谨慎。

### 8.3 Greys：在线类与方法诊断

Greys 是基于 JVM attach 机制实现的在线诊断工具，不需要重启服务，常用命令：

- `sc -df 类名`：查看类的源码级信息（反编译、类加载器、方法签名等）
- `trace 类名 方法名`：追踪方法内部调用路径与耗时

### 8.4 Arthas：阿里开源的在线调试利器

Arthas 是阿里开源（基于 Greys 扩展）的 Java 在线诊断工具，目前功能最强、社区最活跃，支持在线查看类、方法、堆栈、参数、反编译（`jad`）、方法执行统计（`trace`/`watch`）、热更新（`redefine`）等。生产环境排查线上问题的首选：

```bash
java -jar arthas-boot.jar          # 启动后选择目标进程
watch com.demo.OrderService createOrder '{params, returnObj}'   # 观察方法入参与返回值
trace com.demo.OrderService createOrder                           # 追踪方法内部调用耗时
jad com.demo.OrderService                                         # 在线反编译查看代码
```

### 8.5 JavOSize：字节码热修改

JavOSize 通过修改字节码，可以让**代码修改即时生效**，无需重启：

```bash
java -jar javosize.jar
classes         # 列出已加载的类
classpath ...
```

> **注意**：它属于字节码层面的侵入式修改，误操作可能破坏 JVM 内部状态，**慎用于生产环境**。

### 8.6 CHLSDB：HotSpot 底层分析

CHLSDB（Command-line HotSpot Debugger）可以查看 JVM 底层的结构信息，如堆、方法区、常量池等，适合分析 JVM 崩溃（hs_err 文件）或极端问题：

```bash
java -classpath /opt/taobao/java/lib/sa-jdi.jar sun.jvm.hotspot.CLHSDB
```

### 8.7 Dmesg：排查进程被"悄无声息"杀死

线上应用突然消失、日志却查不到异常时，优先怀疑**操作系统 OOM Killer** 把进程杀掉了。用 `dmesg` 查看系统日志：

```bash
sudo dmesg | grep -i kill | less
```

```text
[145400.537663] Out of memory: Kill process 12345 (java) score 121 or sacrifice child
[145400.537664] Killed process 12345 (java) total-vm:4123124kB, anon-rss:2896540kB
```

- 看到 **`Out of memory` / `Kill process`** 关键字即确认是 OOM Killer 所为；
- 方括号内为内核时间戳（开机后秒数），可用 `date -d "1970-01-01 + 145400秒"` 换算为真实时间；
- 本质是**物理内存不足**，解决方案：扩容内存、降低 JVM 堆大小（`-Xmx`）、排查进程内存泄漏。

> **在线工具选型建议**：生产环境优先 **Arthas**（功能全、社区活跃）；只需临时追踪某个方法，**btrace** 更轻量；进程莫名消失先查 **dmesg**。

## 九、图形化工具分析 GC Roots（VisualVM / JProfiler）

前文的五件套解决了"抓快照"的问题，但要**真正"看见" GC Roots 引用链**，还需要图形化工具。完整排查链路是：CLI 工具生成 dump → 图形化工具打开 dump → 顺着引用链找到根。

### 9.1 图形化工具总览

| 能力 | JConsole | VisualVM | JProfiler | MAT |
|---|---|---|---|---|
| 价格 | JDK 自带（免费） | 免费 | 商业 | 免费 |
| 定位 | 内存/线程/类监控 | 综合诊断 + 轻量性能分析 | 深度性能剖析 | 离线堆转储分析 |
| 看 GC Root 路径 | 无 | `Show Nearest GC Root` | `Paths from GC Roots` | `Path to GC Roots` |
| 引用链可视化 | 无 | 普通 | 图表化最丰富 | 普通 |
| 分配点定位 | 无 | 无 | **Allocation Recording** | 无 |
| 远程连接 | JMX | JMX | agent 自动注入 | 离线分析 dump |

**官方地址：**

| 工具 | 官网地址 | 说明 |
|---|---|---|
| JConsole | https://docs.oracle.com/en/java/javase/17/management/using-jconsole.html | JDK 自带，无需下载 |
| VisualVM | https://visualvm.github.io/ | Oracle 开源（GitHub: oracle/visualvm），独立于 JDK 分发 |
| JProfiler | https://www.ej-technologies.com/products/jprofiler/overview.html | ej-technologies 商业软件，支持 10 天免费评估 |
| Eclipse MAT | https://eclipse.dev/mat/ | Eclipse 基金会开源，堆转储分析神器 |

### 9.2 JConsole（JDK 自带监控工具）

JConsole 是 JDK 自带的图形化监控工具，通过 JMX 连接 JVM，实时查看堆内存、线程、类加载、CPU 使用情况，**无需额外下载**，是快速了解 JVM 运行状态的第一站。

**启动：**

```bash
jconsole           # 弹出选择框，选本地/远程进程
jconsole 12345     # 直接连接指定 PID
jconsole host:port # 连接远程 JMX（目标 JVM 需开启 -Dcom.sun.management.jmxremote）
```

**六大标签页：**

| 标签页 | 功能 |
|---|---|
| 概述 | CPU、堆内存、类加载数、线程数总览曲线 |
| 内存 | 堆/非堆内存各区使用情况，可手动触发 GC |
| 线程 | 线程列表 + **检测死锁**按钮 |
| 类 | 已加载类数量与变化曲线 |
| VM 摘要 | 系统属性、JVM 启动参数、类路径等 |
| MBean | JMX 管理 Bean 树，可查询所有运行时指标 |

**死锁检测**：切到「线程」标签 → 点「检测死锁」，若有死锁会直接高亮显示死锁线程及相互等待关系，是定位死锁最快的手段。

### 9.3 VisualVM（免费，推荐先上手）

> **官网**：https://visualvm.github.io/ （Oracle 开源项目，GitHub: oracle/visualvm，从官网下载 zip 解压即用）

VisualVM 是"All-in-One Java Troubleshooting Tool"，集成了命令行 JDK 工具（jmap/jstack/jstat）与轻量 CPU/内存采样，比 JConsole 多了**堆转储分析**能力。

#### 9.3.1 抓堆转储

启动 VisualVM → 左侧选目标进程 → **Profiler** 标签（或 Monitor）→ 点 **Heap Dump**。

```text
进程右键 → 也可以直接 "Heap Dump"
```

#### 9.3.2 打开转储，找嫌疑对象

转储自动打开，切到 **Classes** 视图，按 **Retained Size**（保留大小，即自己死掉能释放的内存）排序，点开大对象类 → 展开 **Instances** 列表。

#### 9.3.3 查看 GC Root（关键操作）

选中某个对象实例 → **右键** → 选：

```text
Show Nearest GC Root        ← 从对象出发，找到最近的根
```

VisualVM 会打开一个引用链视图，显示从 **GC Root → ... → 当前对象** 的完整路径，链的顶端就是根。

#### 9.3.4 OQL 高级查询（可选）

菜单 **工具 → OQL 控制台**，可以直接写查询找持有对象最多的根：

```java
// 找出持有对象数最多的静态字段
select x from java.lang.Class x
where x.name like "com.demo.%"
  and (x.stat is not null)
```

### 9.4 JProfiler（商业版，功能最全）

> **官网**：https://www.ej-technologies.com/products/jprofiler/overview.html （ej-technologies 商业软件，支持 10 天免费评估）

JProfiler 是功能最全的 Java 性能剖析工具，其 **Heap Walker（堆遍历器）** 是最强的 GC Roots 分析工具，还提供 CPU/内存/线程实时剖析。

#### 9.4.1 连接进程

新建 Session → 选 **本地/远程** 应用 → 自动注入 agent 并启动（远程需在启动参数加 `-agentpath:...`）。

#### 9.4.2 抓取堆快照

顶部切到 **Heap Walker** 视图 → 工具栏 **"Garbage Collect"** 后再点 **"Take Heap Snapshot"**。

#### 9.4.3 找嫌疑对象

Heap Walker 左侧 **All Objects / Biggest Objects** 按大小排序，或按 Class 筛选。双击展开实例。

#### 9.4.4 查看 GC Roots（核心操作）

选中对象实例 → **右键 → Show References**（或工具栏 Reference Graph）：

```text
右键对象 → Show References → 切换视图:
  ├─ Incoming References（谁引用我）
  └─ Paths from GC Roots     ← 从根到我的路径
```

> **关键选项**：分析时可按需勾选 `Exclude weak/soft/phantom references`，跳过软/弱引用干扰，直接看强引用链。

**JProfiler 额外优势：**

- **Allocation Recording**：先记录分配，再看某对象"是在哪行代码被创建的"（比 GC Roots 更适合定位创建点）
- **实时 GC Root 视图**：不 dump 也能看，适合快速排查

### 9.5 Eclipse Memory Analyzer（MAT）

> **官网**：https://eclipse.dev/mat/ （Eclipse 基金会开源，官方推荐配合 `jmap -dump` 分析堆转储）

MAT（Memory Analyzer Tool）是专为 **Java 堆转储分析** 设计的开源工具，也是内存泄漏排查最专业的分析器。它不会让你"肉眼找嫌疑对象"，而是**自动生成泄漏嫌疑报告**，大幅提升排查效率。

**核心视图：**

| 视图 | 作用 |
|---|---|
| **Leak Suspects** | 自动分析并生成泄漏嫌疑报告，饼图显示各对象占比 |
| **Histogram（直方图）** | 按类统计对象数量与 Shallow Heap / Retained Heap |
| **Dominator Tree（支配树）** | 按保留大小列出对象，快速定位占用最大的对象树 |
| **Path to GC Roots** | 从对象反推引用链，链顶端即 GC Root |
| **OQL 控制台** | 类 SQL 语言查询堆中对象 |

**分析步骤：**

1. **打开堆转储**：File → Open Heap Dump → 选择 `jmap -dump:format=b` 生成的 `.hprof` 文件，选择 **Leak Suspects Report** 模式；
2. **查看泄漏嫌疑**：MAT 自动给出报告，饼图展示最可能泄漏的对象及保留大小占比；
3. **Histogram 定位类**：按 Retained Heap 排序，点开大对象类查看实例；
4. **Dominator Tree 找树**：查看对象保留的子对象树，确认是"整棵树泄漏"还是"单个大对象"；
5. **Path to GC Roots**：右键对象 → Path To GC Roots → **exclude weak/soft references**，引用链顶端 `Thread <xxx>` / `Class <xxx>` / `JNI Global` 即根。

> **内存配置**：分析大 dump（几个 GB）需调大 MAT 自身 JVM 内存，修改安装目录 `MemoryAnalyzer.ini` 中的 `-Xmx1024m` 为更大值，否则分析会报内存不足。

### 9.6 无论用哪个工具，排查套路都一样

```text
1. jmap/JProfiler/VisualVM 抓堆转储
2. 按 Retained Size 找最大的对象类（或直接用 MAT Leak Suspects 自动分析）
3. 右键 → 查 GC Root 路径
4. 看引用链顶端：Thread <xxx> ？Class <xxx> ？JNI Global ？
5. 80% 的结论：static 集合/缓存没清理，或 ThreadLocal 没 remove
```

> **建议**：日常监控用 **JConsole**（零成本）；泄漏排查用 **VisualVM 的 Show Nearest GC Root** 或 **MAT 的 Leak Suspects**（都免费）；如果还想看"对象在哪行代码分配的"，再上 **JProfiler 的 Allocation Recording**（商业版）。

## 十、总结与进阶建议

JDK 自带的 Jstat、Jinfo、Jmap、Jhat、Jstack 五款工具，覆盖了 JVM 监控、参数调试、内存分析、线程诊断的全流程，是 Java 开发者必备的调优工具。它们虽然没有图形化界面，但轻量、高效、无需额外部署，在线上问题定位中发挥着不可替代的作用。

结合前文的进阶工具，完整的 JVM 问题排查工具链如下：

```text
JVM 问题排查工具链
├── 基础排查（JDK 五件套，先抓快照再分析）
│     Jps(找进程) → Jstat(监控) → Jinfo(查参数) → Jmap(抓堆) → Jstack(抓线程) → Jhat(看堆)
├── 在线调试（生产环境，不重启应用）
│     Arthas / btrace / Greys / javOSize / jdb / CHLSDB
├── 图形化分析（监控 / 剖析 / 离线分析 dump）
│     JConsole（JDK 自带监控）/ VisualVM（免费）/ JProfiler（商业）/ MAT（免费）
└── 系统层面
      top / dmesg（排查进程被杀、OOM Killer）
```

**工具选型建议：**

| 场景 | 首选工具 |
|---|---|
| 线上 CPU 飙高、响应慢 | jstack（多抓几次对比）+ top -H |
| 日常监控 JVM 状态 | JConsole（JDK 自带，零成本） |
| 内存泄漏、OOM | jmap 抓 dump → MAT Leak Suspects / VisualVM 看 GC Root 链 |
| 生产环境在线诊断（不重启） | **Arthas**（首选）或 btrace |
| 进程莫名消失、日志无异常 | dmesg 查 OOM Killer |
| 本地深度性能分析、分配点定位 | JProfiler Allocation Recording |
| 远程断点调试 | jdb / IDE 远程调试 |

进阶学习建议：Arthas 是当前生产排查最实用的工具，值得系统学习；JFR（Java Flight Recorder）配合 JDK Mission Control 可作为长期监控方案，与本文工具形成"监控 + 快照 + 在线诊断"的立体组合。

### 核心工具使用场景总结

- 实时监控 GC：**Jstat**（-gcutil）；
- 查看/修改 JVM 参数：**Jinfo**（-flags、-flag）；
- 生成堆快照：**Jmap**（-dump）；
- 分析堆快照：**Jhat**（或 JVisualVM/MAT）；
- 定位线程问题（死锁、CPU 100%）：**Jstack**（-l）。
