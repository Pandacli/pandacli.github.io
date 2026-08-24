---
title: 解释器
category:
  - Python
breadcrumbExclude: true
---

# 前言：编程语言的本质

编程语言的本质是 使用一定的`语言语法规则`，将计算机指令集的操作符和操作数用代码表示出来。 全球编程语言有2500多种，每一种语言都有自己的语法规则。

在计算机中， 每一种语言都有自己的 解释器 和 编译器，以便于计算机识别和执行。
在现实世界中，也有人类语言 各种的语言：英文、日语、汉语、中文、西语、意大利语等等

---->  写好的语言代码交给 指定的 解释器||编译器

 ```python
 print("hello world")
 ```

 ```java
 System.out.println("hello world");
 ```

 ```c
 printf("hello world");
 ```

# 1.编译器/解释器

编译器/解释器 是计算机中 编程语言 的 核心组件。可以理解为 编程语言 的 翻译官。

编译器与解释器 的区别：
  - 编译器：将 人类语言 `全文`翻译成 机器语言 的工具。类似 将 英语著作 翻译成 中文，需要耗费较长时间的工作。拿到2000行代码之后，需要先编译成一个临时文件，然后交给计算机才能执行。

  - 解释器：将 人类语言 `实时`翻译成 机器语言 的工具，耗时比较短。类似 同声翻译，解释一句就交给 操作系统 一句执行和操作。

常见的 编译器/解释器：
- Python 解释器：CPython
- Java 解释器：JVM
- C 编译器：GCC

## 1.1 使用Python解释器

### Python 解释器的种类

很多公司都开发了Python 解释器
- CPython  用C 语言开发出来的 解释器【主流】
- PyPy  针对CPython 的 优化版本，速度快，引入了编译器的功能
- Jython 用Java 语言开发出来的 解释器
- IronPython
- Stackless Python
- 。。。。

### 1.1.1 直接安装使用官网提供的 Python 解释器

官方教程网站：https://docs.python.org/zh-cn/3/tutorial/interpreter.html

官方下载地址：https://www.python.org/downloads/

python 命令行与环境：https://docs.python.org/zh-cn/3/using/cmdline.html#using-on-general

官方的Python 解释器主要使用Cpython，有两大版本
- 2.x（官方不再维护）
- 3.x（最新版本为3.14）

解释器的参数
- -VV 查看版本信息
> Python 3.12.13 | packaged by Anaconda, Inc. | (main, Mar 19 2026, 20:20:58) [GCC 14.3.0]

- -c 执行代码
- -m 执行模块
- -i 交互模式

### 1.1.2 使用conda 安装 python 解释器

conda 可以安装多个版本的 python 解释器， 并且可以切换使用。 方便不同的项目使用不同的 python 版本来维护，减少环境的冲突。

```bash
conda create -n py314 python=3.14
conda activate py314
```
