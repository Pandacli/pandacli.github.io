---
breadcrumbExclude: true
---

# Jacoco 接入使用说明

## 前言

阅读此说明，了解 Jacoco 信息及在 Android 本地项目中的使用方式，使用 Jacoco 实现 SDK-Project 覆盖率统计、分析、可视化输出。

### 代码覆盖率

覆盖率是用来衡量测试代码对功能代码的测试情况，通过统计测试代码对功能代码中行覆盖、分支覆盖、方法覆盖、类覆盖等场景，量化测试是否充分的度量方式。

简单来说：执行一个测试用例，覆盖了哪些模块、类、方法、行。

### 覆盖的分类

> 红色表示未覆盖，黄色表示部分覆盖，绿色表示完全覆盖。覆盖率报表功能通过颜色直观展示类/方法/分支的覆盖状态。

1. **行覆盖**：统计代码中每一行是否被执行到。
2. **分支覆盖**：针对 if/switch 语句，检查所有条件分支是否被覆盖。
3. **方法覆盖**：统计类中的方法是否被调用。
4. **类覆盖**：统计类是否被加载和测试到。

## 1. 关于Jacoco

### 1.1 介绍

> JaCoCo is a free Java code coverage library distributed under the [Eclipse Public License](https://www.jacoco.org/jacoco/trunk/doc/license.html)
>
> JaCoCo 是一个免费的 Java 代码覆盖率库，遵循 Eclipse 公共许可协议分发。
>
> 官网：https://www.jacoco.org/jacoco/index.html
>
> 定义:JaCoCo是一款免费开源的JAVA代码覆盖率工具
>
> 适用范围:仅适用于JAVA语言的代码覆盖率分析
>
> 核心功能:提供代码覆盖率测量和统计功能
>
> 工具性质:属于测试辅助工具
>
> 开源特性:采用开源许可证发布

### 1.2 Jacoco 原理

> 核心机制：使用插桩方式记录代码覆盖率，通过probe探针注入实现
>
> 插桩本质：对源代码进行修改，在代码执行路径上插入统计代码
>
> 分支覆盖原理：每个分支都需要单独插桩记录，没有覆盖的分支意味着该分支上的任何错误都测不到

#### 1.2.1 on the fly 模式

实现方式：JVM 通过-javaagent参数指定jar文件启动Instrumentation代理程序，代理程序在ClassLoader装载一个class前 判断是否转换动态修改class文件，将统计的代码插入class
特点：动态插桩，测试时插入统计代码，不测试时不插
优势：无需提前插桩，无需考虑classpath设置问题，使用更方便简单
适用场景：大多数常规测试场景

#### 1.2.2 offline 模式

实现步骤：测试前对文件进行插桩，生成插过桩的class或jar包，测试插过桩的包，生成覆盖率信息到文件
最后统一处理生成报告
特点：静态插桩，需要预先完成所有插桩工作
**两种模式对比**
）便利性对比：on-the-fly更便捷，无需提前准备；offline需要预先插桩
）适用场景对比：on-the-fly适用于大多数场景，但在以下情况需使用offline：
不支持-javaagent参数
无法设置JVM参数
字节码需要转换到其他虚拟机
动态修改字节码可能与其他agent冲突
无法自定义用户加载类
）典型流程对比（以on-the-fly为例）：
下载jacoco
拷贝jar包
启动jacocoagent
使用cli包dump生成exec文件
使用cli将exec生成report报表

## 二、Android SDK 项目整合 Jacoco（offline 模式）

> 在Android项目中只能使用JaCoCo的离线插桩模式，主要是因为Android系统破坏了JaCoCo的这种便利性，原因如下:
>
> 1. Android虚拟机跟运行在[服务器](https://cloud.tencent.com/product/cvm?from_column=20065&from=20065)上的JVM不同，它所支持的字节码必须经过特殊的处理以支持Dalvik、ART等虚拟机，所以插桩必须在处理之前完成；
>
> 2. Android虚拟机无法像服务器上的JVM那样可以通过参数的方式实现配置，所以应用启动的时候是没有机会直接配置dump输出方式获取覆盖率信息的；

### 2.1 新建 jacoco.gradle 配置

1. ` `在app 模块中 创建jacoco.gradle 文件

```text
apply plugin: 'jacoco'

android {
    buildTypes {
        debug {
            /**打开覆盖率统计开关**/
            testCoverageEnabled = true
        }
    }
}

// 源代码路径，有多少个module，就在这里写多少个路径
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

2. 在 app模块的build.gradle 文件中引入

```text
apply from: 'jacoco.gradle'
```

### 2.2 编译 build Android-Test 测试代码

- **右键项目app目录 ，点击Run，选择 All Tests 后, 会生成一个build 文件夹**
![...](/assets/images/unit_test/Jacoco接入使用说明.001.png)

> debugAndroidTest 的converage.ec 文件：
>
> 1. 文件本质
> .ec 是 Emma Coverage（Android 早期默认代码覆盖率工具）的专用格式，存储的是二进制格式的覆盖率原始数据，无法直接打开查看，需通过工具解析。
>
> 2. 生成场景
> 当你在 Android 项目中执行 ./gradlew createDebugCoverageReport（或通过 Android Studio 触发测试覆盖率报告）时，debugAndroidTest 任务（针对 debug 构建变体的仪器化测试）会在测试结束后，将覆盖率数据写入 coverage.ec。
>
> 3. 默认路径
> 生成后通常位于项目的 app/build/outputs/code_coverage/debugAndroidTest/connected/设备名/

- ec文件默认路径： /build/outputs/code_coverage/debugAndroidTest/connected/设备名/converage.ec
【该路径会在 jacoco.gradle 使用，用于生成jacoco 覆盖率测试报告】
![...](/assets/images/unit_test/Jacoco接入使用说明.002.png)
- **打开terminal 控制台，输入 ./gradlew jacocoTestReport 或者直接在android Studio 点击执行。**
![...](/assets/images/unit_test/Jacoco接入使用说明.003.png)
**等待任务执行成功**
![...](/assets/images/unit_test/Jacoco接入使用说明.004.png)
**最终 build/reports/jacoco/jacocoTestReport/html 获取 覆盖率测试报告**
![...](/assets/images/unit_test/Jacoco接入使用说明.005.png)

### 2.3 index.html 测试报告解析

#### 2.3.1 行列指标说明

![...](/assets/images/unit_test/Jacoco接入使用说明.006.png)

#### 2.3.2 颜色指标说明

![...](/assets/images/unit_test/Jacoco接入使用说明.007.png)

## 三、（Todo）Jenkins 集成 Jacoco + Gradle 实现自动化集成

### 3.1 Jenkins 环境 - 插件安装

#### 3.1.1 GitLab 插件安装

#### 3.1.2 Gradle 插件安装

### 3.2 接入流程
