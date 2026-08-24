---
title: JVM  - GC 垃圾回收基础知识
date: 2026-08-24T00:00:00.000Z
tags:
  - JVM
  - 垃圾回收
  - Java
---

> 参考来源：[GC - Java 垃圾回收基础知识（Java 全栈知识体系）](https://pdai.tech/md/java/jvm/java-jvm-gc.html) · 作者：pdai

> **GC 收集范围**：垃圾收集主要针对`堆(Heap)和方法区(Method Area)`进行；
程序计数器、虚拟机栈和本地方法栈属于线程私有的区域，只存在于线程的生命周期内，线程结束之后也会消失因此不需要对这三个区域进行垃圾回收。

---

## 一、判断一个对象是否可被回收

### 1.1 引用计数算法（已弃用）

给对象添加一个引用计数器：对象增加一个引用时计数器加 1，引用失效时计数器减 1。**引用计数为 0 的对象可被回收**。

> **致命缺陷：循环引用**。两个对象相互引用时，计数器永远不为 0，导致它们无法被回收。

```java
public class ReferenceCountingGC {

    public Object instance = null;

    public static void main(String[] args) {
        ReferenceCountingGC objectA = new ReferenceCountingGC();
        ReferenceCountingGC objectB = new ReferenceCountingGC();
        // 循环引用：A 引用 B，B 引用 A，两者的引用计数都不为 0
        objectA.instance = objectB;
        objectB.instance = objectA;
    }
}
```

正因为循环引用的存在，**Java 虚拟机不使用引用计数算法**，而是采用下面的可达性分析算法。

### 1.2 可达性分析算法（核心）

> **记忆口诀**：GC Roots = 栈引用（线程）+ 静态/常量引用（类级）+ JNI 引用。
排查内存泄漏时，重点检查 `static` 集合、缓存等「类静态属性」持有的大对象。

#### 1.2.1 搜索过程：从 GC Roots 出发

可达性分析 = 从 GC Roots 出发，沿着引用链"走一遍"。**能走到的对象就是可达（活的），走不到的就是不可达（垃圾，等待回收）**。

> **生活化理解**：GC Roots 是"话源头"，引用链是"电话线"。只有能直接或间接通上话的对象才存活；两个对象互相打电话、但都没连上话源头，整组一起"断电"回收。

以「购物车」为例：

```java
public class ReachableDemo {
    public static void main(String[] args) {
        // ===== ① 可达链：从 GC Root（局部变量 cart）出发 =====
        Cart cart = new Cart();          // cart 是 GC Root（栈中的局部变量）
        Item apple = new Item("苹果");
        cart.items.add(apple);           // cart ──▶ apple

        Product p = new Product("红富士");
        apple.product = p;               // apple ──▶ product
        // 链路：cart(GCRoot) → apple → product，全部可达

        // ===== ② 不可达孤岛：两个对象互指，但连不到根 =====
        Item ghostA = new Item("幽灵A");
        Item ghostB = new Item("幽灵B");
        ghostA.partner = ghostB;         // ghostA ──▶ ghostB
        ghostB.partner = ghostA;         // ghostB ──▶ ghostA
        // 互相"认识"，但没有引用链连到 cart 或任何 GC Root
        // → 孤岛，下一次 GC 一起回收

        System.gc();
    }
}

class Cart {
    List<Item> items = new ArrayList<>();
}

class Item {
    String name;
    Item partner;    // 关联对象（互指用）
    Product product; // 关联商品

    Item(String name) {
        this.name = name;
    }
}

class Product {
    String name;

    Product(String name) {
        this.name = name;
    }
}
```

对应的内存关系图：

```text
GC Roots（话源头）                  Java 堆（对象）
─────────────────                  ─────────────────────────

cart（局部变量）
  │ 引用
  ▼
[Cart 购物车] ──list──▶ [Item 苹果] ──product──▶ [Product 红富士]
    可达①              可达②               可达③

[Item 幽灵A] ◀──partner──▶ [Item 幽灵B]
    不可达④                    不可达⑤
   （两个幽灵互相引用，但没有任何电话线连到 cart 等话源头）
```

- **可达**：`cart → 购物车 → 苹果 → 红富士`，从 GC Root（局部变量 `cart`）一路有引用链连过去，全线通电，全部存活。
- **不可达**：幽灵A、幽灵B 虽然**互相有引用**，但这条线"自成一圈"，永远接不到话源头，整个圈子一起断电、一起回收。

> **关键点**：**有引用 ≠ 可达，连得上根才算数**。不可达的判定看的是与 GC Roots 的连通性，而不是"有没有人引用它"。幽灵A/B 正好呼应了 1.1 节的**循环引用**——引用计数算法算不出来，可达性分析一眼看穿。

#### 1.2.2 GC Roots 的四种来源

> 查看GC Roots 的起源 ： 

Java 虚拟机使用可达性分析算法来判断对象是否可被回收，GC Roots 一般包含以下内容：

| 来源 | 存放位置 | 生命周期 | 典型示例 |
|---|---|---|---|
| 虚拟机栈中引用的对象 | 栈帧局部变量表 | 方法执行期间 | `User obj = new User()` |
| 本地方法栈中引用的对象 | JNI 本地栈帧 | native 方法执行期间 | JNI 的 `jobject` 引用 |
| 方法区中类静态属性引用的对象 | 方法区（`static` 字段） | 类加载 ~ 类卸载 | `private static User u` |
| 方法区中的常量引用的对象 | 常量池 | 类加载 ~ 类卸载 | `private static final User C` |

#### 1.2.3 四种来源的代码示例

**① 虚拟机栈中引用的对象（最常见）**

栈帧的局部变量表里的引用就是 GC Root，方法结束、变量失效后对象即不可达：

```java
public class GCRootStack {
    public static void main(String[] args) {
        // 局部变量 obj 存在虚拟机栈的局部变量表中
        User obj = new User("张三");     // obj 引用 -> 堆中的 User 对象，此时它是"活的"
        System.out.println(obj);

        obj = null;                      // 栈中的引用断开（GC Root 消失）
        System.gc();                     // 此时 User 对象不可达，被回收
    }
}

class User {
    String name;

    User(String name) {
        this.name = name;
    }
}
```

执行 `main()` 方法时的内存图：

```text
线程的虚拟机栈                     Java 堆
┌───────────────┐
│ 栈帧: main    │
│ 局部变量表     │
│  obj ────────┼─────▶  [User 对象]  ← 可达（GC Root 指向）
│  args        │
└───────────────┘
```

**② 本地方法栈中引用的对象（JNI）**

调用 `native` 方法时，JNI 层持有的 Java 对象引用存在本地方法栈中，也是 GC Root：

```java
public class GCRootNative {
    private native void process(User user);   // native 方法：把 Java 对象引用传给 C/C++ 层

    static {
        System.loadLibrary("native-lib");     // 加载 JNI 动态库
    }

    public static void main(String[] args) {
        User user = new User("李四");
        // 调用期间，JNI 栈中的 user 引用是 GC Root，
        // 即使 main 方法里 user = null，native 层仍引用它，对象不会被回收
        new GCRootNative().process(user);
    }
}
```

对应的 C 侧代码（`jobject user` 就是本地方法栈中的引用）：

```c
JNIEXPORT void JNICALL Java_GCRootNative_process
  (JNIEnv *env, jobject obj, jobject user) {
    // user 引用在 native 栈帧中，是 GC Root
    // 只要此方法未返回，user 指向的对象不会被 GC 回收
}
```

**③ 方法区中类静态属性引用的对象**

`static` 变量存在方法区（JDK 8 后类静态属性在堆中，概念上属于方法区），只要类不被卸载，它指向的对象就一直是 GC Root：

```java
public class GCRootStatic {
    private static User staticUser = new User("王五");  // 类加载时初始化，引用长期存活

    public static void main(String[] args) {
        System.gc();
        // 即使没有任何局部变量引用 staticUser 指向的对象，
        // 它依然存活（被 static 引用"钉"在堆上）
        System.out.println(staticUser.name);  // 仍能打印：王五
    }
}
```

> **对比测试**：把 `static` 去掉试试，`System.gc()` 后该对象就可能被回收。

**④ 方法区中常量引用的对象**

常量池里的常量（尤其是 `static final` 引用类型常量）引用的对象也是 GC Root：

```java
public class GCRootConst {
    private static final String CONST_STR = "hello-jvm";         // 字符串常量：存放在常量池
    private static final User CONST_USER = new User("赵六");     // 引用类型常量：也是 GC Root

    public static void main(String[] args) {
        System.gc();
        // 常量引用的对象永远可达，除非类被卸载
        System.out.println(CONST_STR);
        System.out.println(CONST_USER.name);
    }
}
```

#### 1.2.4 可达会变成不可达吗？

**会，而且非常常见。** 可达性是**动态的**，随程序运行实时变化，引用链一旦断裂，对象就从"可达"掉进"不可达"。

| 场景 | 操作 | 结果 |
|---|---|---|
| 局部变量置 null | `obj = null` | 引用断开，对象立即不可达 |
| 方法返回 | 栈帧弹出 | 局部变量消失，对象不可达 |
| 静态变量置空 | `staticUser = null` | 类级引用断开（内存泄漏高发点） |
| 容器移除引用 | `list.clear()` | 容器内对象不可达 |
| 弱引用失效 | 下一次 GC | 弱引用对象必然被回收 |

```java
// 场景一：局部变量置 null
public class GCRootUnreachable {
    public static void main(String[] args) {
        User obj = new User("张三");
        obj = null;   // 桥断了！User 不可达，成为垃圾
        System.gc();
    }
}

// 场景二：方法返回（栈帧弹出）
public void demo() {
    User u = new User("张三");  // 可达
}   // ← 方法结束，栈帧弹出，局部变量 u 消失，User 立即不可达

// 场景三：静态变量被置空（类级引用断开）
// 这是内存泄漏的高发点：忘了把 static 引用置 null，对象就永远可达、永远不被回收
public class Cache {
    private static User cachedUser = new User("缓存");  // 可达（static 钉住）

    public static void clear() {
        cachedUser = null;  // 引用桥断了！cachedUser 从"长期存活"变成垃圾
    }
}

// 场景四：容器移除引用
List<User> list = new ArrayList<>();
list.add(new User("临时"));     // 可达（list 本身是 GC Root，list → User）
list.clear();                    // 桥断了！User 不可达，被回收

// 场景五：弱引用被回收
WeakReference<User> wf = new WeakReference<>(new User("弱引用"));
System.gc();
// 弱引用对象在下一次 GC 时必然被回收 → 可达变成不可达
System.out.println(wf.get());  // null
```

> **反向问题：不可达还能重新可达吗？**
>
> 一般不能——不可达 = 已判死刑，等待回收。唯一特例是 `finalize()`（见 1.4 节）：对象在回收前可在该方法中把自己重新挂到 GC Roots 上"自救"一次。

**记法**：GC Roots 是"电源"，引用链是"电线"，对象是"灯泡"。断一根线，下游所有灯泡一起熄灭（成为垃圾）。排查内存问题时，就找"哪根线忘了断"（如 static 缓存、未关闭的监听器）。

### 1.3 方法区的回收

方法区主要存放永久代对象，其回收率比新生代低很多，因此在方法区上回收**性价比不高**，主要做两件事：

- **常量池的回收**
- **类的卸载**

在大量使用反射、动态代理、CGLib 等 ByteCode 框架、动态生成 JSP 以及 OSGi 这类频繁自定义 ClassLoader 的场景，都需要虚拟机具备类卸载功能，以保证不会出现内存溢出。

类的卸载需要满足以下三个条件（**满足了也不一定会被卸载**）：

- 该类所有的实例都已经被回收，也就是堆中不存在该类的任何实例。
- 加载该类的 ClassLoader 已经被回收。
- 该类对应的 Class 对象没有在任何地方被引用，也就无法在任何地方通过反射访问该类方法。

可以通过 `-Xnoclassgc` 参数来控制是否对类进行卸载。

### 1.4 finalize()

`finalize()` 类似 C++ 的析构函数，用来做关闭外部资源等工作。但是 try-finally 等方式可以做得更好，并且该方法运行代价高昂、不确定性大、无法保证各个对象的调用顺序，因此**最好不要使用**。

当一个对象可被回收时，如果需要执行该对象的 `finalize()` 方法，那么就有可能通过在该方法中让对象重新被引用，从而实现**自救**。自救只能进行一次：如果回收的对象之前已通过 `finalize()` 自救，后面回收时不会再调用 `finalize()`。

## 二、引用类型

无论是通过引用计数算法判断对象的引用数量，还是通过可达性分析算法判断对象是否可达，判定对象是否可被回收都与引用有关。Java 具有四种强度不同的引用类型：

| 引用类型 | 回收时机 | 主要用途 | 实现方式 |
|---|---|---|---|
| 强引用 | 永不回收（除非不可达） | 常规对象引用 | 直接 `new` |
| 软引用 | **内存不够时**才回收 | 内存敏感缓存（如图片缓存） | `SoftReference` |
| 弱引用 | **下一次 GC 必然回收** | 缓存、避免内存泄漏 | `WeakReference` |
| 虚引用 | 随时可回收，无法获取对象 | 对象被回收时收到系统通知 | `PhantomReference` |

### 2.1 强引用

被强引用关联的对象**不会被回收**。使用 `new` 一个新对象的方式来创建强引用：

```java
Object obj = new Object();
```

### 2.2 软引用

被软引用关联的对象**只有在内存不够的情况下才会被回收**。使用 `SoftReference` 类来创建：

```java
Object obj = new Object();
SoftReference<Object> sf = new SoftReference<Object>(obj);
obj = null;  // 使对象只被软引用关联
```

### 2.3 弱引用

被弱引用关联的对象**一定会被回收**，也就是说它只能存活到下一次垃圾回收发生之前。使用 `WeakReference` 类来实现：

```java
Object obj = new Object();
WeakReference<Object> wf = new WeakReference<Object>(obj);
obj = null;
```

### 2.4 虚引用

又称幽灵引用或幻影引用。一个对象是否有虚引用的存在，完全不会对其生存时间构成影响，**也无法通过虚引用取得一个对象**。设置虚引用的唯一目的，就是能在这个对象被回收时**收到一个系统通知**。使用 `PhantomReference` 来实现：

```java
Object obj = new Object();
PhantomReference<Object> pf = new PhantomReference<Object>(obj);
obj = null;
```

## 三、垃圾回收算法

| 算法 | 原理 | 优点 | 缺点 | 适用区域 |
|---|---|---|---|---|
| 标记 - 清除 | 标记存活对象 → 清除未标记对象 | 实现简单 | 效率低、产生内存碎片 | 老年代 |
| 标记 - 整理 | 标记 → 存活对象向一端移动 → 清理边界外内存 | 无内存碎片 | 移动对象成本高 | 老年代 |
| 复制 | 内存一分为二，存活对象复制到另一半 | 高效、无碎片 | 只使用一半内存 | 新生代 |
| 分代收集 | 按对象存活周期划分区域，各用合适算法 | 综合最优 | 实现复杂 | 商业虚拟机默认 |

### 3.1 标记 - 清除

将存活的对象进行标记，然后清理掉未被标记的对象。

**不足**：

- 标记和清除过程效率都不高；
- 会产生大量不连续的内存碎片，导致无法给大对象分配内存。

### 3.2 标记 - 整理

让所有存活的对象都向一端移动，然后直接清理掉端边界以外的内存。相比标记-清除，**解决了内存碎片问题**。

### 3.3 复制

将内存划分为大小相等的两块，每次只使用其中一块。当这一块内存用完时，将还存活的对象复制到另一块上面，再把使用过的内存空间一次性清理。

**主要不足**：只使用了内存的一半。

现代商业虚拟机都用它回收**新生代**，但不是划分为大小相等的两块，而是分为**一块较大的 Eden 空间和两块较小的 Survivor 空间**，每次使用 Eden 空间和其中一块 Survivor。回收时将 Eden 和 Survivor 中存活的对象一次性复制到另一块 Survivor，最后清理 Eden 和使用过的那块 Survivor。

HotSpot 虚拟机的 Eden 和 Survivor 比例默认为 **8:1**，内存利用率达到 90%。如果每次回收有超过 10% 的对象存活，一块 Survivor 就不够用了，此时需要**老年代分配担保**——借用老年代空间存储放不下的对象。

### 3.4 分代收集

商业虚拟机采用分代收集算法：根据对象存活周期将内存划分为几块，不同块采用适当的收集算法。一般将堆分为新生代和老年代：

- **新生代**使用：复制算法
- **老年代**使用：标记 - 清除 或者 标记 - 整理 算法

## 四、垃圾收集器

### 4.1 基础概念

HotSpot 虚拟机中的 7 个垃圾收集器，连线表示收集器可以配合使用。

- **单线程与多线程**：单线程指收集器只用一个线程收集；多线程指使用多个线程。
- **串行与并行**：串行指收集器与用户程序**交替执行**（GC 时需要停顿用户程序）；并行指收集器与用户程序**同时执行**。除 CMS 和 G1 外，其它收集器都以串行方式执行。

### 4.2 收集器总览对比

| 收集器 | 线程 | 串行/并行 | 适用区域 | 算法 | 特点 / 场景 |
|---|---|---|---|---|---|
| Serial | 单线程 | 串行 | 新生代 | 复制 | Client 模式默认，单 CPU 最高效率 |
| ParNew | 多线程 | 串行 | 新生代 | 复制 | Server 模式首选，可与 CMS 配合 |
| Parallel Scavenge | 多线程 | 串行 | 新生代 | 复制 | **吞吐量优先**，可自适应调节 |
| Serial Old | 单线程 | 串行 | 老年代 | 标记 - 整理 | Client 模式老年代 |
| Parallel Old | 多线程 | 串行 | 老年代 | 标记 - 整理 | 与 Parallel Scavenge 搭配 |
| CMS | 多线程 | **并行** | 老年代 | 标记 - 清除 | **低停顿**，有碎片/浮动垃圾问题 |
| G1 | 多线程 | **并行** | **整堆** | 标记-整理 + 复制 | 大内存服务器，可预测停顿 |

### 4.3 Serial 收集器

Serial 翻译为串行，即以串行的方式执行。它是**单线程**收集器，只会用一个线程进行垃圾收集。

**优点**：简单高效。对于单个 CPU 环境，由于没有线程交互的开销，拥有最高的单线程收集效率。

它是 **Client 模式下的默认新生代收集器**。桌面应用场景下分配给虚拟机的内存一般不大，Serial 收集几十兆甚至一两百兆的新生代，停顿时间可控制在一百多毫秒以内，只要不是太频繁，这点停顿可以接受。

### 4.4 ParNew 收集器

它是 **Serial 收集器的多线程版本**，是 Server 模式下虚拟机的首选新生代收集器。除了性能原因外，主要是因为**除了 Serial，只有它能与 CMS 收集器配合工作**。

默认开启的线程数量与 CPU 数量相同，可通过 `-XX:ParallelGCThreads` 参数设置线程数。

### 4.5 Parallel Scavenge 收集器

与 ParNew 一样是多线程收集器，但关注点不同：

- 其它收集器关注**尽可能缩短停顿时间**；
- 它追求**达到一个可控制的吞吐量**，被称为"吞吐量优先"收集器（吞吐量 = CPU 运行用户代码的时间 / 总时间）。

停顿时间越短越适合需要与用户交互的程序（良好响应提升体验）；高吞吐量则能高效利用 CPU、尽快完成运算，适合后台计算任务。

> **注意**：缩短停顿时间是以牺牲吞吐量和新生代空间换取的——新生代空间变小，GC 变得频繁，吞吐量下降。

可通过开关参数打开 **GC 自适应调节策略（GC Ergonomics）**：无需手动指定新生代大小（`-Xmn`）、Eden/Survivor 比例、晋升年龄等参数，虚拟机根据系统运行情况动态调整，以提供最合适的停顿时间或最大吞吐量。

### 4.6 Serial Old 收集器

是 **Serial 收集器的老年代版本**，给 Client 模式虚拟机使用。在 Server 模式下有两大用途：

- 在 JDK 1.5 及之前版本（Parallel Old 诞生前）与 Parallel Scavenge 收集器搭配使用。
- 作为 CMS 收集器的后备预案，在并发收集发生 Concurrent Mode Failure 时使用。

### 4.7 Parallel Old 收集器

是 **Parallel Scavenge 收集器的老年代版本**。在注重吞吐量及 CPU 资源敏感的场合，优先考虑 Parallel Scavenge + Parallel Old 组合。

### 4.8 CMS 收集器

CMS（Concurrent Mark Sweep），Mark Sweep 即**标记 - 清除算法**，目标是**尽可能缩短停顿时间**。分为四个流程：

| 流程 | 说明 | 是否需要停顿 |
|---|---|---|
| 初始标记 | 标记 GC Roots 能直接关联到的对象，速度很快 | 需要停顿 |
| 并发标记 | 进行 GC Roots Tracing，全程耗时最长 | 不需要停顿 |
| 重新标记 | 修正并发标记期间用户程序继续运作导致的标记变动 | 需要停顿 |
| 并发清除 | 清理未标记对象 | 不需要停顿 |

耗时最长的**并发标记**和**并发清除**阶段，收集器线程可与用户线程一起工作，不需要停顿。

**缺点**：

- **吞吐量低**：低停顿时间以牺牲吞吐量为代价，CPU 利用率不够高。
- **无法处理浮动垃圾**，可能出现 Concurrent Mode Failure。浮动垃圾指并发清除阶段用户线程继续运行产生的垃圾，只能等下次 GC 再回收。因此 CMS 需要预留一部分内存，不能像其它收集器那样等老年代快满才回收；预留内存不够时出现 Concurrent Mode Failure，虚拟机临时启用 **Serial Old** 替代 CMS。
- **标记 - 清除导致空间碎片**：老年代空间剩余但无法找到足够大的连续空间分配对象时，不得不提前触发一次 Full GC。

### 4.9 G1 收集器

G1（Garbage-First）面向**服务端应用**，在多 CPU 和大内存场景下性能很好，目标是**未来替换 CMS**。

- 其它收集器的回收范围是整个新生代或老年代，而 G1 **可以直接对新生代和老年代一起回收**。
- G1 把堆划分为**多个大小相等的独立区域（Region）**，新生代和老年代不再物理隔离。
- 每个 Region 记录历史回收时间与回收所得空间，维护一个**优先列表**，每次根据允许的收集时间优先回收**价值最大的 Region**，从而支持**可预测的停顿时间模型**。
- 每个 Region 有 **Remembered Set**，记录该 Region 对象引用的对象所在 Region，做可达性分析时可**避免全堆扫描**。

G1 的运作步骤（不计维护 Remembered Set 的操作）：

| 步骤 | 说明 |
|---|---|
| 初始标记 | 标记 GC Roots 直接关联的对象 |
| 并发标记 | GC Roots Tracing，与用户线程并发 |
| 最终标记 | 将 Remembered Set Logs 合并到 Remembered Set（需要停顿线程，但可并行） |
| 筛选回收 | 对各 Region 回收价值/成本排序，按期望停顿时间制定回收计划（停顿用户线程可大幅提高效率） |

**特点**：

- **空间整合**：整体基于"标记 - 整理"，局部（Region 之间）基于"复制"，运行期间**不产生内存碎片**。
- **可预测的停顿**：可指定在 M 毫秒时间片段内，GC 消耗不超过 N 毫秒。

更详细内容请参考：[Getting Started with the G1 Garbage Collector](http://www.oracle.com/webfolder/technetwork/tutorials/obe/java/G1GettingStarted/index.html)

## 五、内存分配与回收策略

### 5.1 GC 分类：Minor / Major / Mixed / Full

JVM 进行 GC 时，并非每次都回收所有区域，大部分时候回收的都是新生代。针对 HotSpot VM，按回收区域分为**部分收集（Partial GC）**和**整堆收集（Full GC）**：

| GC 类型 | 回收范围 | 备注 |
|---|---|---|
| Minor GC / Young GC（新生代收集） | 新生代 | 最频繁，Eden 满即触发 |
| Major GC / Old GC（老年代收集） | 老年代 | 目前只有 CMS 单独收集老年代；常与 Full GC 混用需具体分辨 |
| Mixed GC（混合收集） | 整个新生代 + 部分老年代 | 目前只有 G1 有这种行为 |
| Full GC（整堆收集） | 整个 Java 堆 + 方法区 | 代价最大，应尽量避免 |

### 5.2 内存分配策略

#### 1. 对象优先在 Eden 分配

大多数情况下，对象在新生代 Eden 区分配，当 Eden 区空间不够时，发起 Minor GC。

#### 2. 大对象直接进入老年代

大对象指需要**连续内存空间**的对象，最典型的是很长的字符串和数组。经常出现大对象会提前触发垃圾收集，以获取足够的连续空间。

`-XX:PretenureSizeThreshold`：大于此值的对象直接在老年代分配，避免在 Eden 区和 Survivor 区之间的大量内存复制。

#### 3. 长期存活的对象进入老年代

为对象定义**年龄计数器**：对象在 Eden 出生，经过 Minor GC 依然存活则移到 Survivor，年龄加 1 岁；增加到一定年龄则进入老年代。`-XX:MaxTenuringThreshold` 用来定义年龄阈值。

#### 4. 动态对象年龄判定

虚拟机并非要求年龄必须达到 MaxTenuringThreshold 才能晋升。**如果 Survivor 中相同年龄所有对象大小的总和大于 Survivor 空间的一半**，则年龄大于或等于该年龄的对象可直接进入老年代，无需等到阈值。

#### 5. 空间分配担保

发生 Minor GC 之前，虚拟机先检查**老年代最大可用连续空间是否大于新生代所有对象总空间**：

- 条件成立 → Minor GC 可以确认是安全的；
- 条件不成立 → 查看 `HandlePromotionFailure` 是否允许担保失败：
  - 允许：继续检查老年代最大可用连续空间是否大于历次晋升对象的平均大小，大于则尝试一次 Minor GC，否则转 Full GC；
  - 不允许冒险：直接进行一次 Full GC。

### 5.3 Full GC 的触发条件

Minor GC 的触发条件很简单——**Eden 空间满时触发一次 Minor GC**。Full GC 相对复杂，有以下条件：

| 触发条件 | 说明 |
|---|---|
| 调用 `System.gc()` | 只是"建议"执行 Full GC，虚拟机不一定执行；不建议使用，应让虚拟机管理内存 |
| 老年代空间不足 | 常见于大对象直接进老年代、长期存活对象进老年代 |
| 空间分配担保失败 | 复制算法 Minor GC 需老年代担保，担保失败执行 Full GC（见 5.2 第 5 点） |
| JDK 1.7 及以前永久代空间不足 | 永久代存 Class 信息/常量/静态变量，占满且 Full GC 无法回收时抛 `OutOfMemoryError` |
| Concurrent Mode Failure | CMS GC 过程中有对象要进老年代但空间不足（浮动垃圾过多导致），触发 Full GC |

**避免老年代不足引发的 Full GC**：

- 尽量不要创建过大的对象及数组；
- 用 `-Xmn` 调大新生代，让对象尽量在新生代被回收；
- 用 `-XX:MaxTenuringThreshold` 调大晋升年龄，让对象在新生代多存活一段时间；
- 对永久代问题：增大永久代空间或改用 CMS GC。

## 参考

- [GC算法 垃圾收集器](https://mp.weixin.qq.com/s/olNXcRAT3PTK-hV_ehtmtw)
- [Java GC 分析](https://mp.weixin.qq.com/s/S3PcA2KIzCVB2hJmsbVzyQ)
- [Java应用频繁FullGC分析](https://yq.aliyun.com/articles/94557)
