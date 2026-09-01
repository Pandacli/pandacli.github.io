---
breadcrumbExclude: true
title: Jacoco 接入使用说明
date: 2026-08-31
tags:
  - Jacoco
  - 代码覆盖率
  - 单元测试
  - Java
  - Spring Boot
---

# Jacoco 接入使用说明

阅读此说明，了解 JaCoCo 信息及在 **Android 本地项目**与 **Java 后端项目**中的使用方式，使用 JaCoCo 实现覆盖率统计、分析、可视化输出。

> 文档结构：一、覆盖率基础概念；二、JaCoCo 原理；三、Android 项目接入（offline 模式）；**四、Java 后端项目单元测试覆盖率实战（重点）**；五、Jenkins 自动化集成（Todo）。

## 一、代码覆盖率基础

### 1.1 什么是代码覆盖率

覆盖率是用来衡量测试代码对功能代码的测试情况，通过统计测试代码对功能代码中**行覆盖、分支覆盖、方法覆盖、类覆盖**等场景，量化测试是否充分的度量方式。

简单来说：执行一个测试用例，覆盖了哪些模块、类、方法、行。

### 1.2 覆盖的分类

> 红色表示未覆盖，黄色表示部分覆盖，绿色表示完全覆盖。覆盖率报表功能通过颜色直观展示类/方法/分支的覆盖状态。

| 覆盖类型 | 说明 | 统计口径 |
|---|---|---|
| **行覆盖**（Line） | 代码中每一行是否被执行到 | 已执行行数 / 总行数 |
| **分支覆盖**（Branch） | 针对 if/switch 语句，检查所有条件分支是否被覆盖 | 已覆盖分支 / 全部分支 |
| **方法覆盖**（Method） | 类中的方法是否被调用 | 已调用方法数 / 总方法数 |
| **类覆盖**（Class） | 类是否被加载和测试到 | 已加载类数 / 总类数 |

## 二、关于 JaCoCo

### 2.1 介绍

> JaCoCo is a free Java code coverage library distributed under the [Eclipse Public License](https://www.jacoco.org/jacoco/trunk/doc/license.html)

- **官网**：https://www.jacoco.org/jacoco/index.html
- **定义**：JaCoCo 是一款免费开源的 Java 代码覆盖率工具
- **适用范围**：仅适用于 Java 语言的代码覆盖率分析
- **核心功能**：提供代码覆盖率测量和统计功能
- **工具性质**：属于测试辅助工具
- **开源特性**：采用开源许可证发布

### 2.2 原理

> 核心机制：使用**插桩（Instrumentation）**方式记录代码覆盖率，通过 probe 探针注入实现。
>
> 插桩本质：对字节码进行修改，在代码执行路径上插入统计代码。
>
> 分支覆盖原理：每个分支都需要单独插桩记录，没有覆盖的分支意味着该分支上的任何错误都测不到。

#### 2.2.1 on-the-fly 模式（动态插桩）

| 维度 | 说明 |
|---|---|
| 实现方式 | JVM 通过 `-javaagent` 参数指定 jar 启动 Instrumentation 代理，代理在 ClassLoader 装载 class 前动态修改 class 文件，插入统计代码 |
| 特点 | 动态插桩：测试时插入统计代码，不测试时不插 |
| 优势 | 无需提前插桩、无需考虑 classpath 设置，使用更方便简单 |
| 适用场景 | 大多数常规测试场景（**Java 后端服务**） |

#### 2.2.2 offline 模式（静态插桩）

| 维度 | 说明 |
|---|---|
| 实现步骤 | 测试前对文件插桩，生成插过桩的 class/jar → 测试插过桩的包 → 生成覆盖率信息到文件 → 统一处理生成报告 |
| 特点 | 静态插桩，需要预先完成所有插桩工作 |
| 适用场景 | **Android 项目**（见第三章）及无法使用 `-javaagent` 的环境 |

#### 2.2.3 两种模式对比

| 对比维度 | on-the-fly | offline |
|---|---|---|
| 便利性 | 更便捷，无需提前准备 | 需要预先插桩 |
| 适用场景 | 大多数常规场景 | 不支持 `-javaagent`、无法设置 JVM 参数、字节码需转换到其他虚拟机、动态修改字节码可能与其他 agent 冲突、无法自定义用户加载类 |
| 典型流程 | 下载 jacoco → 拷贝 jar → 启动 jacocoagent → 使用 cli 包 dump 生成 exec 文件 → 使用 cli 将 exec 生成 report 报表 | 预先插桩 → 测试 → 生成覆盖率文件 → 生成报表 |

## 三、Android SDK 项目整合 Jacoco（offline 模式）

> 在 Android 项目中只能使用 JaCoCo 的离线插桩模式，原因如下：
>
> 1. Android 虚拟机与运行在服务器上的 JVM 不同，它所支持的字节码必须经过特殊处理以支持 Dalvik、ART 等虚拟机，所以插桩必须在处理之前完成；
> 2. Android 虚拟机无法像服务器上的 JVM 那样通过参数配置，应用启动时没有机会直接配置 dump 输出方式获取覆盖率信息。

### 3.1 新建 jacoco.gradle 配置

1. 在 app 模块中创建 `jacoco.gradle` 文件：

```groovy
apply plugin: 'jacoco'

android {
    buildTypes {
        debug {
            /**打开覆盖率统计开关**/
            testCoverageEnabled = true
        }
    }
}

// 源代码路径，有多少个 module，就在这里写多少个路径
def coverageSourceDirs = [
        // 主应用代码路径（建议统计这个）
        //"$project.projectDir/src/main/java",
        // 如果需要统计测试代码本身的覆盖率，可以保留下面这行
         "$project.projectDir/src/androidTest/java"
]

// class文件路径
def coverageClassDirs = [
        // 主程序编译后的class文件（关键修正）
        //"$project.buildDir/intermediates/javac/debug/compileDebugJavaWithJavac/classes",
        // 如果有Kotlin代码，添加下面这行
        // "$project.buildDir/tmp/kotlin-classes/debug"
        //测试代码
        "$project.buildDir/intermediates/javac/debugAndroidTest/compileDebugAndroidTestJavaWithJavac/classes",
        //'app/build/intermediates/javac/debugAndroidTest/compileDebugAndroidTestJavaWithJavac/classes',
]

// Jacoco 版本，建议用这个版本兼容性比较好
jacoco {
    toolVersion = "0.8.2"
}

// 生成报告task
task jacocoTestReport(type: JacocoReport) {
    group = "JacocoReport"
    description = "Generate Jacoco coverage reports after running tests."
    reports {
        xml.required = true
        html.required = true
    }

    classDirectories.from = files(coverageClassDirs).collect { path ->
        def dir = file(path)
        logger.lifecycle("Processing class directory: ${dir}")
        fileTree(dir: dir,
                excludes: [
                        '**/R*.class',
                        '**/*$InjectAdapter.class',
                        '**/*$ModuleAdapter.class',
                        '**/*$ViewInjector*.class'
                ])
    }

    sourceDirectories.from = files(coverageSourceDirs)
    executionData.from = fileTree(dir: "$buildDir/outputs/code_coverage/debugAndroidTest/connected/",
            include: "*/coverage.ec")
    doFirst {
        coverageClassDirs.each { path ->
            def dir = file(path)
            logger.lifecycle("Scanning class directory: ${dir}")
            if (!dir.exists()) {
                logger.warn("Class directory does not exist: ${dir}")
                return
            }

            try {
                dir.eachFileRecurse(groovy.io.FileType.FILES) { file ->
                    if (file.name.contains('$$')) {
                        def newName = file.name.replace('$$', '$')
                        def newPath = new File(file.parent, newName)
                        if (newPath.exists()) {
                            logger.debug("Target file already exists, skipping rename: ${newPath}")
                            return
                        }
                        if (!file.renameTo(newPath)) {
                            logger.warn("Failed to rename file: ${file} -> ${newPath}")
                        }
                    }
                }
            } catch (IOException e) {
                logger.error("IO error while renaming class files in ${dir}", e)
            } catch (SecurityException e) {
                logger.error("Permission denied while accessing directory: ${dir}", e)
            } catch (Exception e) {
                logger.error("Unexpected error while renaming class files in ${dir}", e)
            }
        }
    }
}

// 初始化Jacoco Task
task jacocoInit() {
    group = "JacocoReport"
    doFirst {
        def outputDir = file("$buildDir/outputs/code_coverage/")
        if (!outputDir.exists()) {
            try {
                if (!outputDir.mkdirs()) {
                    logger.warn("Failed to create directory: ${outputDir}")
                }
            } catch (SecurityException e) {
                logger.error("Permission denied when creating directory: ${outputDir}", e)
            }
        }
    }
}
```

2. 在 app 模块的 `build.gradle` 文件中引入：

```groovy
apply from: 'jacoco.gradle'
```

### 3.2 编译 build Android-Test 测试代码

- 右键项目 app 目录，点击 Run，选择 All Tests 后，会生成一个 build 文件夹：

![...](/assets/images/unit_test/Jacoco接入使用说明.001.png)

> **debugAndroidTest 的 coverage.ec 文件说明**：
>
> 1. 文件本质：`.ec` 是 Emma Coverage（Android 早期默认代码覆盖率工具）的专用格式，存储的是二进制格式的覆盖率原始数据，无法直接打开查看，需通过工具解析。
> 2. 生成场景：执行 `./gradlew createDebugCoverageReport`（或通过 Android Studio 触发测试覆盖率报告）时，debugAndroidTest 任务（针对 debug 构建变体的仪器化测试）会在测试结束后，将覆盖率数据写入 `coverage.ec`。
> 3. 默认路径：`app/build/outputs/code_coverage/debugAndroidTest/connected/设备名/`

- ec 文件默认路径：`/build/outputs/code_coverage/debugAndroidTest/connected/设备名/coverage.ec`，该路径会在 jacoco.gradle 中使用，用于生成 jacoco 覆盖率测试报告：

![...](/assets/images/unit_test/Jacoco接入使用说明.002.png)

- 打开 terminal 控制台，输入 `./gradlew jacocoTestReport`，或者直接在 Android Studio 点击执行：

![...](/assets/images/unit_test/Jacoco接入使用说明.003.png)

- 等待任务执行成功：

![...](/assets/images/unit_test/Jacoco接入使用说明.004.png)

- 最终在 `build/reports/jacoco/jacocoTestReport/html` 获取覆盖率测试报告：

![...](/assets/images/unit_test/Jacoco接入使用说明.005.png)

### 3.3 index.html 测试报告解析

#### 3.3.1 行列指标说明

![...](/assets/images/unit_test/Jacoco接入使用说明.006.png)

#### 3.3.2 颜色指标说明

![...](/assets/images/unit_test/Jacoco接入使用说明.007.png)

## 四、Java 后端项目单元测试覆盖率实战（重点）

> 本章面向 **Spring Boot + Maven/Gradle 后端项目**，完整演示：接入 JaCoCo → 编写单元测试 → 提升覆盖率 → 设置质量门禁 → CI 集成，一条龙实战。

### 4.1 后端项目与 Android 项目的差异

| 对比维度 | Android 项目 | Java 后端项目 |
|---|---|---|
| 插桩模式 | 只能 offline（静态插桩） | **on-the-fly（`-javaagent` 动态插桩）**，配置最简单 |
| 构建工具 | Gradle | Maven / Gradle 均可 |
| 测试类型 | 仪器化测试（Instrumented Test） | **纯 JVM 单元测试（JUnit + Mockito）**，无需真机/模拟器 |
| 覆盖率数据 | `coverage.ec` 文件 | 由 agent 生成的 `jacoco.exec` 文件 |
| 执行环境 | Android Studio / Gradle | `mvn test` / `gradle test` / CI 流水线 |

**关键结论**：后端项目接入 JaCoCo 比 Android 简单得多——加一个 Maven 插件（或 Gradle 插件），跑 `mvn test` 就能出报告，无需任何手动插桩步骤。

### 4.2 Maven 项目接入（Spring Boot 为例）

#### 4.2.1 pom.xml 配置 jacoco-maven-plugin

在 `pom.xml` 的 `<build><plugins>` 中加入：

```xml
<plugin>
    <groupId>org.jacoco</groupId>
    <artifactId>jacoco-maven-plugin</artifactId>
    <version>0.8.12</version>
    <configuration>
        <!-- 排除无需统计的代码：实体、DTO、配置、生成代码、lombok 等 -->
        <excludes>
            <exclude>**/entity/**</exclude>
            <exclude>**/dto/**</exclude>
            <exclude>**/config/**</exclude>
            <exclude>**/*Application.class</exclude>
            <exclude>**/*Mapper.class</exclude>
        </excludes>
    </configuration>
    <executions>
        <!-- 1. 绑定 test 阶段前：启动 agent（on-the-fly 插桩） -->
        <execution>
            <id>prepare-agent</id>
            <goals>
                <goal>prepare-agent</goal>
            </goals>
        </execution>
        <!-- 2. 绑定 test 阶段后：生成覆盖率报告 -->
        <execution>
            <id>report</id>
            <phase>test</phase>
            <goals>
                <goal>report</goal>
            </goals>
        </execution>
        <!-- 3. 绑定 verify 阶段：覆盖率质量门禁（不达标构建失败） -->
        <execution>
            <id>check</id>
            <phase>verify</phase>
            <goals>
                <goal>check</goal>
            </goals>
            <configuration>
                <rules>
                    <rule>
                        <element>BUNDLE</element>
                        <limits>
                            <limit>
                                <counter>LINE</counter>
                                <value>COVEREDRATIO</value>
                                <minimum>0.80</minimum>
                            </limit>
                            <limit>
                                <counter>BRANCH</counter>
                                <value>COVEREDRATIO</value>
                                <minimum>0.70</minimum>
                            </limit>
                        </limits>
                    </rule>
                </rules>
            </configuration>
        </execution>
    </executions>
</plugin>
```

> 配置说明：
> - `prepare-agent`：在测试 JVM 上挂载 JaCoCo agent，自动插桩并记录数据到 `target/jacoco.exec`；
> - `report`：测试结束后把 `jacoco.exec` 渲染成 HTML/XML/CSV 报告，输出到 `target/site/jacoco/`；
> - `check`：按规则校验覆盖率，**低于阈值直接让 `mvn verify` 失败**，作为质量门禁。

#### 4.2.2 常用命令

```bash
mvn test                    # 跑测试 + 自动生成报告（report 绑定在 test 阶段）
mvn jacoco:report           # 仅重新生成报告（复用已有 jacoco.exec）
mvn verify                  # 测试 + 报告 + 覆盖率门槛校验
```

报告位置：`target/site/jacoco/index.html`，浏览器直接打开即可。

### 4.3 Gradle 项目接入

在 `build.gradle` 中配置：

```groovy
plugins {
    id 'java'
    id 'jacoco'
}

jacoco {
    toolVersion = "0.8.12"
}

jacocoTestReport {
    dependsOn test                      // 先生成测试结果
    reports {
        xml.required = true
        csv.required = false
        html.required = true
    }
    // 排除统计项
    afterEvaluate {
        classDirectories.setFrom(files(classDirectories.files.collect {
            fileTree(dir: it, exclude: [
                    '**/entity/**',
                    '**/dto/**',
                    '**/config/**',
                    '**/*Application*',
                    '**/*Mapper*'
            ])
        }))
    }
}

// 覆盖率门槛：不达标则 test 失败
jacocoTestCoverageVerification {
    violationRules {
        rule {
            limit {
                counter = 'LINE'
                value = 'COVEREDRATIO'
                minimum = 0.80
            }
        }
        rule {
            limit {
                counter = 'BRANCH'
                value = 'COVEREDRATIO'
                minimum = 0.70
            }
        }
    }
}

check.dependsOn jacocoTestReport, jacocoTestCoverageVerification
```

报告位置：`build/reports/jacoco/test/html/index.html`。

### 4.4 实战一：给一个下单服务写单元测试

下面以一个真实的 `OrderService` 为例，演示"从 0 到高覆盖率"的完整过程。

#### 4.4.1 被测代码

```java
@Service
public class OrderService {

    private final OrderMapper orderMapper;
    private final StockClient stockClient;   // 远程扣库存（Feign/RPC）

    public OrderService(OrderMapper orderMapper, StockClient stockClient) {
        this.orderMapper = orderMapper;
        this.stockClient = stockClient;
    }

    /**
     * 创建订单：参数校验 -> 扣减库存 -> 落库
     */
    public Order createOrder(Long userId, Long skuId, Integer count) {
        // 分支 1：非法参数
        if (userId == null || skuId == null || count == null || count <= 0) {
            throw new IllegalArgumentException("非法下单参数");
        }
        // 分支 2：超限拦截
        if (count > 99) {
            throw new BizException("单次下单数量不能超过 99");
        }
        // 分支 3：扣库存失败
        boolean deducted = stockClient.deduct(skuId, count);
        if (!deducted) {
            throw new BizException("库存不足");
        }
        // 正常流程
        Order order = new Order();
        order.setUserId(userId);
        order.setSkuId(skuId);
        order.setCount(count);
        order.setStatus(OrderStatus.CREATED);
        orderMapper.insert(order);
        return order;
    }
}
```

#### 4.4.2 单元测试（JUnit 5 + Mockito）

```java
@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderMapper orderMapper;
    @Mock
    private StockClient stockClient;
    @InjectMocks
    private OrderService orderService;

    @Test
    void createOrder_正常流程_订单落库并返回() {
        when(stockClient.deduct(1001L, 2)).thenReturn(true);

        Order order = orderService.createOrder(1L, 1001L, 2);

        assertNotNull(order);
        assertEquals(OrderStatus.CREATED, order.getStatus());
        assertEquals(2, order.getCount());
        verify(orderMapper).insert(any(Order.class));
    }

    @Test
    void createOrder_库存不足_抛业务异常且不落库() {
        when(stockClient.deduct(1001L, 2)).thenReturn(false);

        assertThrows(BizException.class, () -> orderService.createOrder(1L, 1001L, 2));

        verify(orderMapper, never()).insert(any(Order.class));
    }

    @Test
    void createOrder_非法参数_抛IllegalArgumentException() {
        assertThrows(IllegalArgumentException.class, () -> orderService.createOrder(null, 1001L, 2));
        assertThrows(IllegalArgumentException.class, () -> orderService.createOrder(1L, null, 2));
        assertThrows(IllegalArgumentException.class, () -> orderService.createOrder(1L, 1001L, 0));
        assertThrows(IllegalArgumentException.class, () -> orderService.createOrder(1L, 1001L, null));
    }

    @Test
    void createOrder_数量超限_抛业务异常() {
        assertThrows(BizException.class, () -> orderService.createOrder(1L, 1001L, 100));
    }
}
```

> 技巧：**Mock 掉一切外部依赖**（Mapper、Feign Client），单测只关注当前类的逻辑；这样无需启动 Spring 容器，测试快（毫秒级）、稳定（不依赖环境）。

#### 4.4.3 覆盖情况分析

| 用例 | 覆盖的分支 | 说明 |
|---|---|---|
| 正常流程 | 走完 4 个分支判断的"否"路径 + 落库 | 主流程 |
| 库存不足 | 分支 3 的"是"路径 | 异常分支 |
| 非法参数 ×4 | 分支 1 的"是"路径（覆盖 `||` 的 4 种短路组合） | 边界 |
| 数量超限 | 分支 2 的"是"路径 | 边界 |

> 通过这张表可以看到：**分支覆盖的意义在于每个 if 的"是/否"都要测到**。只写"正常流程"一个用例，行覆盖率或许能到 60%，但分支覆盖会很低——这正是 JaCoCo 报告里行覆盖率与分支覆盖率分开统计的原因。

### 4.5 实战二：分支覆盖与测试用例设计

看一个典型的折扣计算函数：

```java
public BigDecimal calcDiscount(BigDecimal amount, Integer level) {
    BigDecimal discount;
    if (level != null && level >= 3) {   // 复合条件 A && B
        discount = new BigDecimal("0.8"); // 老客户 8 折
    } else {
        discount = new BigDecimal("1.0"); // 默认无折扣
    }
    return amount.multiply(discount);
}
```

`level != null && level >= 3` 是两个子条件组合（A = `level != null`，B = `level >= 3`），**分支覆盖要求 A/B 的 true/false 都被验证到**：

| 用例 | 入参 level | A（非空） | B（>=3） | 执行分支 | 覆盖意义 |
|---|---|---|---|---|---|
| 1 | `null` | false（短路） | 不执行 | else | 覆盖 A=false |
| 2 | 2 | true | false | else | 覆盖 B=false |
| 3 | 3 | true | true | if | 覆盖 A=true、B=true |

> 只写用例 3（正常 8 折）是远远不够的——`level=null` 的空指针风险、`level=2` 的边界都没测到。**分支覆盖是发现"漏测分支"的最直接指标**。

### 4.6 覆盖率规则与质量门禁（CI 集成）

#### 4.6.1 阈值设置建议

| 覆盖指标 | 建议基线 | 说明 |
|---|---|---|
| 行覆盖（LINE） | ≥ 80% | 主流程核心代码应达到 |
| 分支覆盖（BRANCH） | ≥ 70% | 分支越多越难，可适当放宽 |
| 方法覆盖 | ≥ 85% | 一般随行覆盖同步达标 |

> 不建议盲目追求 100%：getter/setter、样板代码、纯配置类等应通过 `<excludes>` 排除，把覆盖率指标用在**核心业务逻辑**上。

#### 4.6.2 接入 CI（以 GitLab CI 为例）

```yaml
test:
  stage: test
  script:
    - mvn clean verify          # 执行测试 + 覆盖率门槛校验
  artifacts:
    paths:
      - target/site/jacoco/     # 报告上传，可在 CI 页面查看
    expire_in: 7 days
```

> `verify` 阶段若行覆盖率 < 80%，流水线直接失败（红灯），形成"**覆盖率不达标不能合并**"的硬约束。

### 4.7 报告解析与指标解读

JaCoCo 生成的 `index.html` 报告（后端项目位于 `target/site/jacoco/`）：

| 指标列 | 含义 |
|---|---|
| Element | 包 / 类 / 方法 |
| Missed Instructions | 未执行的字节码指令比例 |
| Missed Branches | 未覆盖的分支比例 |
| Missed Cxty（复杂度） | 未覆盖的圈复杂度路径 |
| Missed Lines | 未覆盖的行数 |

> **读报告的正确姿势**：从 Package 逐层点进去 → 找到 Missed Branches 高的类 → 点进类源码，JaCoCo 会用**红/黄/绿**标注每行：绿色=完全覆盖，黄色=部分覆盖（有分支没走完），红色=未覆盖。红黄行就是你下一轮补用例的清单。

### 4.8 常见问题与排错

| 问题 | 原因 | 解决 |
|---|---|---|
| 报告里看不到某个类 | 该类在 `<excludes>` 中被排除 | 检查 exclude 配置 |
| 行覆盖率 100% 但分支只有 50% | 只测了 if 的一个分支 | 按 4.5 的分支矩阵补用例 |
| `mvn test` 没生成报告 | 未绑定 `prepare-agent` / `report` execution | 检查 executions 配置 |
| 覆盖率偏低但不知道补哪里 | 没看报告 | 打开 index.html，红色行逐个补 |
| 启动报 `jacoco.exec` 找不到 | agent 未挂载成功 | 确认 `prepare-agent` 在 test 前执行 |
| 多模块项目 | 各模块需分别配置/汇总 | 根 pom 统一配置插件，子模块继承；或用 `report-aggregate` 合并 |
| Lombok 代码拉低覆盖率 | getter/setter 被统计 | 排除 lombok 生成类，或配置 lombok 忽略 |

### 4.9 最佳实践：提升覆盖率的方法论

1. **先看报告再写测试**：优先补"红黄"严重、圈复杂度高的核心业务类；
2. **分层策略**：
   - **Service 层**：覆盖率重点，用 Mockito 单测覆盖全部业务分支（性价比最高）；
   - **Controller 层**：用 `@WebMvcTest` 测参数校验与返回结构，不必追求 100%；
   - **Mapper/DAO 层**：SQL 正确性靠集成测试（`@SpringBootTest` + 真实/嵌入式数据库），单测的 Mock 覆盖率意义有限；
3. **测试金字塔意识**：大量快速稳定的单测打底，少量集成测试验证链路，E2E 测试只覆盖关键路径；
4. **覆盖率是过程指标，不是目标**：不要为了凑数字写"空测试"（只调用不断言）。衡量标准是**断言覆盖了行为**；
5. **持续门槛**：接入 CI 的 `check` 规则，防止新代码让覆盖率倒退；
6. **团队约定**：新功能必须带单测再合并，PR 中展示覆盖率变化。

## 五、（Todo）Jenkins 集成 Jacoco + Gradle 实现自动化集成

### 5.1 Jenkins 环境 - 插件安装

#### 5.1.1 GitLab 插件安装

#### 5.1.2 Gradle 插件安装

### 5.2 接入流程
