---
title: JVM 基础 - JVM 内存结构
date: 2026-08-22T00:00:00.000Z
tags:
  - JVM
  - 内存结构
  - Java
---

> 来源：[JVM 基础 - JVM 内存结构（Java 全栈知识体系）](https://pdai.tech/md/java/jvm/java-jvm-struct.html) · 作者：海星（公众号「JavaKeeper」），pdai 替换整理
>
> 本文讲的是 **JVM 内存结构**，不要和 **Java 内存模型（JMM）** 混淆。

## 运行时数据区

内存是硬盘和 CPU 的中间仓库及桥梁，JVM 内存布局规定了 Java 运行过程中内存申请、分配、管理的策略。

Java 虚拟机定义了若干程序运行期间会使用的运行时数据区：

- **线程私有**：程序计数器、虚拟机栈、本地方法栈
- **线程共享**：堆、方法区、堆外内存（Java 7 的永久代或 JDK 8 的元空间、代码缓存）

## 一、程序计数器

**Program Counter Register**，JVM 中的 PC 寄存器是对物理 PC 寄存器的一种抽象模拟，是一块较小的内存空间，可看作当前线程所执行字节码的**行号指示器**。

### 1.1 作用

PC 寄存器用来存储指向下一条指令的地址，即将要执行的指令代码，由执行引擎读取下一条指令。

### 1.2 概述

- 使用 PC 寄存器存储字节码指令地址，是因为 CPU 需要不停切换线程，切换回来后要知道接着从哪开始执行
- 多线程环境下，CPU 会不停做任务切换，为准确记录各个线程正在执行的字节码指令地址，PC 寄存器被设计为线程私有
- 它是一块很小的内存空间，运行速度最快的存储区域
- 每个线程都有独立的程序计数器，生命周期与线程一致
- 如果当前线程执行的是 Java 方法，记录的是 JVM 字节码指令地址；如果是 native 方法，则为未指定值（undefined）
- 它是程序控制流的指示器，分支、循环、跳转、异常处理、线程恢复都依赖它
- 字节码解释器通过改变计数器值来选取下一条字节码指令
- **它是唯一一个在 JVM 规范中没有规定任何 `OutOfMemoryError` 情况的区域**

## 二、虚拟机栈

**Java Virtual Machine Stacks**，也叫 Java 栈。每个线程创建时都会创建一个虚拟机栈，内部保存一个个栈帧（Stack Frame），对应一次次 Java 方法调用，是线程私有的，生命周期和线程一致。

**作用**：主管 Java 程序的运行，保存方法的局部变量、部分结果，并参与方法的调用和返回。

**特点**：

- 栈是一种快速有效的分配存储方式，访问速度仅次于程序计数器
- JVM 对虚拟机栈的操作只有两个：方法执行时入栈，方法结束出栈
- **栈不存在垃圾回收问题**

**异常**：

- 固定大小栈：线程请求栈容量超过最大值，抛出 `StackOverflowError`
- 动态扩展栈：无法申请到足够内存或无法创建新线程的栈时，抛出 `OutOfMemoryError`
- 可通过参数 `-Xss` 设置线程最大栈空间，栈大小直接决定函数调用的最大深度

### 2.2 栈的存储单位

- 每个线程的栈中，数据以**栈帧**格式存在
- 正在执行的每个方法都对应一个栈帧
- 栈帧是内存区块，维系方法执行过程中的各种数据信息

### 2.3 栈运行原理

- JVM 对 Java 栈的操作只有压栈和出栈，遵循"先进后出/后进先出"
- 一个时间点只有一个活动栈帧，即栈顶栈帧，称为**当前栈帧**，对应**当前方法**、**当前类**
- 执行引擎的所有字节码指令只针对当前栈帧操作
- 调用其他方法时，新栈帧被创建放在栈顶，成为新的当前栈帧
- 不同线程的栈帧不允许相互引用
- 方法返回时，当前栈帧会传回执行结果给前一个栈帧，然后被丢弃
- 方法退出有两种方式：正常 return 返回，或抛出异常；都会导致栈帧弹出

### 2.4 栈帧的内部结构

每个栈帧存储：

- 局部变量表（Local Variables）
- 操作数栈（Operand Stack）
- 动态链接（Dynamic Linking）
- 方法返回地址（Return Address）
- 附加信息

#### 2.4.1 局部变量表

- 也叫局部变量数组或本地变量表
- 存储方法参数和方法体内定义的局部变量，包括基本数据类型、对象引用（reference）、returnAddress 类型
- 线程私有，不存在数据安全问题
- 容量大小在编译期确定，保存在 Code 属性的 `maximum local variables`
- 方法嵌套调用次数由栈大小决定；局部变量越多，栈帧越大，嵌套调用次数越少
- 局部变量只在当前方法调用中有效
- 参数值从 index0 开始存放

**槽 Slot**：

- 局部变量表基本存储单元是 Slot
- 32 位以内类型占用一个 Slot；64 位类型（long、double）占用两个连续 Slot
- byte、short、char、boolean 存储前会被转换为 int
- JVM 为每个 Slot 分配访问索引
- 实例方法调用时，`this` 存放在 index 0 的 Slot 处
- 静态方法中不能引用 `this`，因为 `this` 不存在于静态方法的局部变量表中
- 栈帧中槽位可以重用，过了作用域的局部变量槽位会被后续新变量复用，节省资源
- 局部变量表是重要的 GC 根节点，被其直接或间接引用的对象不会被回收

#### 2.4.2 操作数栈

- 也叫表达式栈，后进先出
- 方法执行过程中，根据字节码指令入栈/出栈
- 用于保存计算过程的中间结果，是 JVM 执行引擎的工作区
- 方法刚开始时操作数栈为空
- 最大深度在编译期确定，保存在 Code 属性的 `max_stack`
- 32 位类型占一个栈单位深度，64 位类型占两个
- 只能通过入栈和出栈访问，不能通过索引访问
- 方法有返回值时，返回值被压入当前栈帧的操作数栈，并更新 PC 寄存器
- 数据类型必须与字节码指令严格匹配
- Java 虚拟机的解释引擎是基于栈的执行引擎，这里的栈指操作数栈

**栈顶缓存（Top-of-stack-Cashing）**：

HotSpot 将栈顶元素缓存在物理 CPU 寄存器中，降低对内存的读/写次数，提升执行效率。

#### 2.4.3 动态链接（指向运行时常量池的方法引用）

- 每个栈帧内部包含一个指向运行时常量池中该栈帧所属方法的引用
- 作用是将符号引用转换为调用方法的直接引用

**JVM 方法调用相关概念**：

- **静态链接**：目标方法在编译期可知且运行期不变，将符号引用转为直接引用
- **动态链接**：目标方法在运行期才能确定，转换过程具有动态性
- **早期绑定**：编译期可知目标方法，使用静态链接
- **晚期绑定**：运行期根据实际类型绑定方法

**虚方法和非虚方法**：

- 非虚方法：静态方法、私有方法、final 方法、实例构造器、父类方法
- 其他方法为虚方法

**虚方法表**：

- 为了提高动态分派性能，JVM 在类的方法区建立虚方法表（virtual method table）
- 表中存放各个方法的实际入口，非虚方法不会出现
- 类加载的连接阶段创建并初始化虚方法表

#### 2.4.4 方法返回地址

用来存放调用该方法的 PC 寄存器的值。

- 正常完成出口：执行引擎遇到方法返回字节码指令，如 ireturn、lreturn、freturn、dreturn、areturn、return
- 异常完成出口：方法内异常未被处理，通过异常表确定返回地址；不会给上层调用者产生返回值

本质上，方法退出就是当前栈帧出栈。

#### 2.4.5 附加信息

栈帧还允许携带与 JVM 实现相关的附加信息，例如调试信息，取决于具体虚拟机实现。

## 三、本地方法栈

### 3.1 本地方法接口

Native Method 是 Java 调用非 Java 代码的接口，例如 `Unsafe` 类就有很多本地方法。

使用本地方法的原因：

- 与 Java 环境外交互
- 与操作系统交互
- Sun 的解释器是 C 实现的，jre 大部分用 Java 实现，也通过本地方法与外界交互

### 3.2 本地方法栈（Native Method Stack）

- 用于管理本地方法的调用，线程私有
- 允许固定或动态扩展大小；同样可能抛出 `StackOverflowError` / `OutOfMemoryError`
- 本地方法使用 C 语言实现
- `Native Method Stack` 中登记 native 方法，`Execution Engine` 执行时加载本地方法库
- 本地方法可以通过本地方法接口访问虚拟机内部运行时数据区，甚至使用本地处理器寄存器，从本地内存堆中分配任意数量内存
- JVM 规范未强制 JVM 支持本地方法
- 在 Hotspot JVM 中，本地方法栈和虚拟机栈合二为一

> **栈是运行时的单位，堆是存储的单位**。栈解决程序如何执行，堆解决数据怎么放、放在哪。

## 四、堆内存

### 4.1 内存划分

Java 堆是 JVM 管理的内存中最大的一块，被所有线程共享，存放对象实例。

为了高效 GC，堆内存逻辑上划分为三块：
```text
Heap
 PSYoungGen      total 416256K, used 218590K [0x0000000672900000, 0x000000068f400000, 0x00000007c0000000)
  eden space 373760K, 58% used [0x0000000672900000,0x000000067fe77948,0x0000000689600000)
  from space 42496K, 0% used [0x000000068bf80000,0x000000068bf80000,0x000000068e900000)
  to   space 42496K, 0% used [0x0000000689600000,0x0000000689600000,0x000000068bf80000)
 ParOldGen       total 660992K, used 19158K [0x00000003d7a00000, 0x00000003fff80000, 0x0000000672900000)
  object space 660992K, 2% used [0x00000003d7a00000,0x00000003d8cb5b80,0x00000003fff80000)
 Metaspace       used 39085K, capacity 41396K, committed 41728K, reserved 1085440K
  class space    used 5346K, capacity 5772K, committed 5888K, reserved 1048576K

```

- **年轻代 PSYoungGen**：新对象和未达到一定年龄的对象
- **老年代 ParOldGen**：长时间使用的对象，空间应比年轻代更大
- **元空间 Metaspace**（JDK 1.8 之前叫永久代）：JDK 1.8 之前占用 JVM 内存，之后直接使用物理内存

Java 堆物理上可以不连续，逻辑上连续即可。主流虚拟机堆大小可扩展，通过 `-Xmx` 和 `-Xms` 控制，无法扩展时抛出 `OutOfMemoryError`。

**年轻代（PSYoungGen）**：

- 所有新对象创建的地方
- 分为 Eden Memory 和两个 Survivor Memory（ `from/to` 或 s0/s1），默认比例 `8:1:1`

- Eden 空间被填满时执行 Minor GC，幸存对象移动到 Survivor
- 每次 Minor GC 后，一个 Survivor 空间总是空的
- 经过多轮 GC 后存活的对象移动到老年代

**老年代（Old Generation）**：

- 包含经过多轮 Minor GC 后仍存活的对象
- 老年代满时执行 Major GC，通常耗时更长
- 大对象直接进入老年代，避免 Eden 区和 Survivor 区的大量内存拷贝

**元空间**：

- JDK 8 之前是永久代，JDK 8 及以后是元空间
- 是 JVM 规范中方法区的实现
- 方法区有别名 Non-Heap（非堆），与 Java 堆区分

### 4.2 设置堆内存大小和 OOM

- `-Xms`：堆的起始内存，等价于 `-XX:InitialHeapSize`
- `-Xmx`：堆的最大内存，等价于 `-XX:MaxHeapSize`
- 堆内存超过 `-Xmx` 时抛出 `OutOfMemoryError`
- 通常将 `-Xms` 和 `-Xmx` 设为相同值，避免 GC 后重新分隔计算堆大小
- 默认初始堆内存：电脑内存大小 / 64
- 默认最大堆内存：电脑内存大小 / 4

可通过代码获取设置值：

```java
public static void main(String[] args) {

  // 返回 JVM 堆大小
  long initalMemory = Runtime.getRuntime().totalMemory() / 1024 /1024;
  // 返回 JVM 堆的最大内存
  long maxMemory = Runtime.getRuntime().maxMemory() / 1024 /1024;

  System.out.println("-Xms : " + initalMemory + "M");
  System.out.println("-Xmx : " + maxMemory + "M");

  System.out.println("系统内存大小：" + initalMemory * 64 / 1024 + "G");
  System.out.println("系统内存大小：" + maxMemory * 4 / 1024 + "G");
}
```

**查看 JVM 堆内存分配**：

- 默认不配置时，JVM 根据默认值配置当前内存大小
- 默认新生代和老年代比例 1:2，可通过 `-XX:NewRatio` 配置
- 新生代 Eden : From Survivor : To Survivor 默认 8:1:1，可通过 `-XX:SurvivorRatio` 配置
- JDK 7 开启 `-XX:+UseAdaptiveSizePolicy` 后，JVM 会动态调整堆区域大小和晋升年龄；JDK 8 默认开启，不要随意关闭
- 每次 GC 后重新计算 Eden、From Survivor、To Survivor 大小，依据是 GC 时间、吞吐量、内存占用量

命令行查看：

```bash
java -XX:+PrintFlagsFinal -version | grep HeapSize
    uintx ErgoHeapSizeLimit                         = 0                                   {product}
    uintx HeapSizePerGCThread                       = 87241520                            {product}
    uintx InitialHeapSize                          := 134217728                           {product}
    uintx LargePageHeapSizeThreshold                = 134217728                           {product}
    uintx MaxHeapSize                              := 2147483648                          {product}
java version "1.8.0_211"
Java(TM) SE Runtime Environment (build 1.8.0_211-b12)
Java HotSpot(TM) 64-Bit Server VM (build 25.211-b12, mixed mode)
```

```bash
jmap -heap 进程号
```

### 4.3 对象在堆中的生命周期

1. 堆分为新生代和老年代，新生代分为 Eden 区、From Survivor、To Survivor
2. 新对象优先分配到 Eden 区，JVM 定义对象年轻计数器（`-XX:MaxTenuringThreshold`）
3. Eden 空间不足时执行 Minor GC，存活对象转移到 Survivor，年龄 +1
4. Survivor 中每经历一次 Minor GC，年龄 +1
5. 超过 `-XX:PetenureSizeThreshold` 的对象直接分配到老年代

### 4.4 对象的分配过程

1. new 的对象先放在伊甸园区
2. 伊甸园满时，触发 Minor GC，销毁不再被引用的对象，再加载新对象
3. 伊甸园剩余对象移动到幸存者 0 区
4. 再次触发 GC 时，上次幸存对象如果在 0 区没被回收，就放到幸存者 1 区
5. 再次 GC 后重新放回幸存者 0 区，接着再去幸存者 1 区
6. 默认 15 次回收标记后进入养老区
7. 养老区内存不足时触发 Major GC
8. 若 Major GC 后仍无法保存对象，产生 OOM 异常

### 4.5 GC 垃圾回收简介

- **Minor GC / Young GC**：新生代垃圾收集
- **Major GC / Old GC**：老年代垃圾收集，目前只有 CMS GC 会单独收集老年代
- **Mixed GC**：收集整个新生代和部分老年代，目前只有 G1 GC
- **Full GC**：收集整个 Java 堆和方法区

### 4.6 TLAB

**什么是 TLAB（Thread Local Allocation Buffer）**：

- 从内存分配角度，对 Eden 区域继续划分，JVM 为每个线程分配私有缓存区域
- 避免多线程分配内存时的线程安全问题，提升分配吞吐量
- OpenJDK 衍生 JVM 大都提供 TLAB

**为什么需要 TLAB**：

- 堆区线程共享，并发环境下从堆划分内存是不安全的
- 避免多个线程操作同一地址，减少加锁影响

**参数设置**：

- 可以通过 `-XX:UseTLAB` 设置是否开启
- 默认 TLAB 只占 Eden 空间的 1%，可通过 `-XX:TLABWasteTargetPercent` 设置
- TLAB 分配失败时，JVM 会通过加锁机制直接在 Eden 空间分配

### 4.7 堆是分配对象存储的唯一选择吗

随着 JIT 编译期发展和逃逸分析技术成熟，栈上分配、标量替换等优化会使对象不一定都分配到堆上。

**逃逸分析（Escape Analysis）**：

- 分析对象动态作用域
- 对象只在方法内部使用，则认为没有发生逃逸
- 对象被外部方法引用，则发生逃逸

例如：

```java
public static StringBuffer craeteStringBuffer(String s1, String s2) {
   StringBuffer sb = new StringBuffer();
   sb.append(s1);
   sb.append(s2);
   return sb;
}
```

这里 `sb` 返回后可能被外部改变，发生了方法逃逸。

不逃逸的写法：

```java
public static String createStringBuffer(String s1, String s2) {
   StringBuffer sb = new StringBuffer();
   sb.append(s1);
   sb.append(s2);
   return sb.toString();
}
```

**参数设置**：

- JDK 6u23 之后 HotSpot 默认开启逃逸分析
- 较早版本可用 `-XX:+DoEscapeAnalysis` 显式开启

**逃逸分析可做的优化**：

- **栈上分配**：将堆分配转化为栈分配
- **同步省略（锁消除）**：如果对象只能被一个线程访问，取消同步
- **标量替换**：对象部分或全部不存储在内存，而存储在 CPU 寄存器

**同步省略示例**：

```java
public void keep() {
  Object keeper = new Object();
  synchronized(keeper) {
    System.out.println(keeper);
  }
}
```

JIT 编译后会优化为：

```java
public void keep() {
  Object keeper = new Object();
  System.out.println(keeper);
}
```

**标量替换**：

- 标量：无法再分解的数据，如 Java 原始数据类型
- 聚合量：可以分解的数据，如 Java 对象
- JIT 阶段如果对象不会被外部访问且可分解，则不创建对象，改为用成员变量替代

```java
public static void main(String[] args) {
   alloc();
}

private static void alloc() {
   Point point = new Point(1,2);
   System.out.println("point.x=" + point.x + "; point.y=" + point.y);
}

class Point {
    private int x;
    private int y;
}
```

可能被优化为：

```java
private static void alloc() {
   int x = 1;
   int y = 2;
   System.out.println("point.x=" + x + "; point.y=" + y);
}
```

**总结**：

逃逸分析可以配合标量替换、栈上分配、锁消除，但逃逸分析本身也耗时。如果分析后没有对象不逃逸，分析过程就浪费了。该技术并不十分成熟，但仍是 JIT 优化的重要手段。

## 五、方法区

- 方法区与 Java 堆一样，是所有线程共享的内存区域
- JVM 规范把方法区描述为堆的逻辑部分，但别名是 Non-Heap（非堆）
- 运行时常量池是方法区的一部分
- 常量池存放编译期生成的字面量和符号引用；运行期间也可能加入新常量，如 `String.intern()`
- 常量池无法申请到内存时抛出 `OutOfMemoryError`
- 方法区大小可选择固定或可扩展；类太多导致方法区溢出也会抛内存溢出错误
- JVM 关闭后方法区即被释放

### 5.1 解惑

- **方法区（method area）** 是 JVM 规范中的概念，用于存储类信息、常量池、静态变量、JIT 编译后的代码等
- **永久代（PermGen）** 是 Hotspot 虚拟机特有概念，Java 8 被**元空间**取代
- 永久代和元空间都是方法区的落地实现
- 永久代物理上是堆的一部分，与新生代、老年代地址连续，受 GC 管理；元空间存在于本地内存（堆外内存），不受 GC 管理
- Java 7 用 `-XX:PermSize` 和 `-XX:MaxPermSize` 设置永久代；Java 8 后用 `-XX:MetaspaceSize` 和 `-XX:MaxMetaspaceSize`
- 存储内容不同：元空间存储类的元信息，静态变量和常量池等并入堆中
- 方法区内存无法满足分配请求时抛出 `OutOfMemoryError`
- 方法区在逻辑上是堆的一部分，目前实际上与 Java 堆分开

Java 8 之后的变化：

- 移除永久代，替换为元空间
- class metadata 转移到 native memory
- interned Strings 和 class static variables 转移到 Java heap
- 永久代参数变为元空间参数

### 5.2 设置方法区内存的大小

JDK 8 及以后：

- `-XX:MetaspaceSize`：初始元空间大小
- `-XX:MaxMetaspaceSize`：最大元空间大小
- Windows 下默认 `-XX:MetaspaceSize` 是 21M，`-XX:MaxMetaspacaSize` 是 -1（不限制）
- 不指定大小时，虚拟机会耗尽所有可用系统内存；元数据溢出抛 `OutOfMemoryError:Metaspace`
- 默认 64 位服务器端 JVM 的 `-XX:MetaspaceSize` 为 20.75MB，触及后可能触发 Full GC 并卸载无用类，高水位线会重置
- 为避免频繁 GC，建议将 `-XX:MetaspaceSize` 设置为相对较高的值

### 5.3 方法区内部结构

存储：类型信息、常量、静态变量、即时编译器编译后的代码缓存等。

**类型信息**：

- 类型完整有效名称（包名.类名）
- 类型直接父类的完整有效名
- 类型修饰符（public、abstract、final 等）
- 类型直接接口的有序列表

**域（Field）信息**：

- 域名称、域类型、域修饰符（public、private、protected、static、final、volatile、transient 等）
- 保存顺序

**方法（Method）信息**：

- 方法名称
- 返回类型
- 参数数量、类型
- 修饰符（public、private、protected、static、final、synchronized、native、abstract 等）
- 字节码、操作数栈、局部变量表及大小（abstract 和 native 方法除外）
- 异常表（abstract 和 native 方法除外）

### 5.4 运行时常量池

**常量池**：

- Class 文件中的常量池表（Constant Pool Table），包含字面量和对类型、域和方法的符号引用
- 字节码需要数据支持，大块数据不能直接存到字节码里，所以存到常量池
- 常量池可以看作一张表，虚拟机指令根据它找到类名、方法名、参数类型、字面量等

**运行时常量池**：

- 在类加载后创建，是方法区的一部分
- JVM 为每个已加载类型维护一个常量池，通过索引访问
- 包含编译期明确的数值字面量，也包含运行期解析后的方法或字段引用
- 具有动态性，运行期间也可以将新常量放入池中，如 `String.intern()`
- 构造运行时常量池内存超过方法区最大值时，抛出 `OutOfMemoryError`

### 5.5 方法区在 JDK6、7、8 中的演进细节

只有 HotSpot 才有永久代概念。

- **jdk1.6 及之前**：有永久代，静态变量存放在永久代上；方法区由永久代实现
- **jdk1.7**：有永久代，但已逐步"去永久代"，字符串常量池、静态变量移除，保存在堆中；方法区由永久代（类型信息、字段、方法、常量）和堆（字符串常量池、静态变量）共同实现
- **jdk1.8 及之后**：取消永久代，类型信息、字段、方法、常量保存在本地内存的元空间；字符串常量池、静态变量仍在堆中；方法区由元空间和堆共同实现

**字符串常量池与永久代在不同 JDK 版本中的位置**：

| JDK 版本 | 是否有永久代，字符串常量池放在哪里？ | 方法区逻辑上规范，由哪些实际的部分实现的？ |
| --- | --- | --- |
| jdk1.6 及之前 | 有永久代，运行时常量池（包括字符串常量池），静态变量存放在永久代上 | 方法区在 HotSpot 中由永久代实现，以至于这个时期说方法区就是指永久代 |
| jdk1.7 | 有永久代，但已逐步"去永久代"，字符串常量池、静态变量移除，保存在堆中 | 方法区在 HotSpot 中由永久代（类型信息、字段、方法、常量）和堆（字符串常量池、静态变量）共同实现 |
| jdk1.8 及之后 | 取消永久代，类型信息、字段、方法、常量保存在本地内存的元空间，但字符串常量池、静态变量仍在堆中 | 方法区在 HotSpot 中由本地内存的元空间（类型信息、字段、方法、常量）和堆（字符串常量池、静态变量）共同实现 |

**移除永久代原因**：

- 永久代空间大小难以确定，动态加载类过多时容易产生 Perm 区 OOM
- 元空间不在虚拟机中，而是使用本地内存，默认大小仅受本地内存限制
- 对永久代进行调优较困难

参考：http://openjdk.java.net/jeps/122

### 5.6 方法区的垃圾回收

方法区垃圾收集主要回收两部分：**常量池中废弃的常量和不再使用的类型**。

常量池中的常量分为字面量和符号引用：

- 类和接口的全限定名
- 字段的名称和描述符
- 方法的名称和描述符

HotSpot 对常量池的回收策略：只要常量池中常量没有被任何地方引用，就可以被回收。

判定类型为"不再被使用的类"，需同时满足三个条件：

1. 该类所有实例都已被回收，Java 堆中不存在该类及任何派生子类的实例
2. 加载该类的类加载器已被回收
3. 该类对应的 `java.lang.Class` 对象没有在任何地方被引用，无法通过反射访问该类方法

HotSpot 提供 `-Xnoclassgc` 参数控制是否回收类，可用 `-verbose:class`、`-XX:+TraceClassLoading`、`-XX:+TraceClassUnLoading` 查看类加载/卸载信息。

在大量使用反射、动态代理、CGLib、动态生成 JSP、OSGi 等频繁自定义 ClassLoader 的场景，需要类卸载功能以避免永久代/元空间溢出。

## 参考与感谢

- 作者：海星
- 来源于：JavaKeeper
- 主要参考资料：《深入理解 Java 虚拟机 第三版》、宋红康老师的 JVM 教程、Oracle JVM 规范文档、部分博客链接
