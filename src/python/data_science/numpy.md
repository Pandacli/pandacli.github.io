---
title: NumPy 数值计算框架
category:
  - Python
breadcrumbExclude: true
---

# NumPy 数值计算框架

NumPy（Numerical Python）是 Python 科学计算与数据分析的**基石库**，提供了高性能的多维数组对象 `ndarray` 和大量数学函数。
Pandas、scikit-learn、TensorFlow、PyTorch 等框架的底层都依赖 NumPy。

> 一句话理解：**NumPy 让 Python 拥有类似 MATLAB 的数组计算能力**。

同样是"一列数求和"，Python 列表要写循环，NumPy 一行搞定，而且快几十倍。

---

# 1. 为什么需要 NumPy

## 1.1 原生 Python 列表的痛点

```python
# Python 原生列表：元素是对象，类型不固定，计算靠循环
nums = [1, 2, 3, 4, 5]
total = 0
for n in nums:
    total += n * 2      # 要写循环，逐元素操作
print(total)
```

Python 列表有两个问题：
- **类型不固定**：每个元素都是独立对象，内存碎片化；
- **没有向量化**：没有内置的"对整个数组操作"的能力，必须循环。

## 1.2 NumPy 数组的优势

```python
import numpy as np

nums = np.array([1, 2, 3, 4, 5])
result = nums * 2       # 直接对整个数组运算，无需循环
print(result)           # [ 2  4  6  8 10]
```

| 对比点 | Python list | NumPy ndarray |
| --- | --- | --- |
| 元素类型 | 任意混合 | 必须统一（dtype 固定） |
| 运算方式 | 循环逐元素 | **向量化**（整体运算） |
| 存储 | 对象指针，碎片化 | 连续内存，紧凑 |
| 大数组性能 | 慢 | 快 10~100 倍 |
| 维度 | 一维嵌套 | 任意维度（2D 矩阵、3D 张量） |

> **类比 Java**：
Python 列表类似 `ArrayList<Object>`，元素是包装对象、运算要循环；
NumPy 数组类似 `double[]` 原始数组——连续内存、类型固定、底层 C 实现，所以快。

---

# 2. 安装与导入

```bash
pip install numpy
```

```python
import numpy as np    # 官方约定别名 np，看到 np.xxx 都是 NumPy
```

---

# 3. ndarray 数组对象

## 3.1 创建数组

```python
import numpy as np

# 从列表创建
a = np.array([1, 2, 3])                 # 一维数组 [1 2 3]
b = np.array([[1, 2], [3, 4]])          # 二维数组（矩阵）

# 常用创建函数
c = np.arange(10)                       # [0 1 2 ... 9]，类似 range()
d = np.zeros((2, 3))                    # 2行3列全 0
e = np.ones((2, 2))                     # 全 1
f = np.full((2, 2), 7)                  # 全填 7
g = np.eye(3)                           # 3x3 单位矩阵（对角线为 1）
h = np.linspace(0, 1, 5)                # [0, 0.25, 0.5, 0.75, 1] 均匀 5 个点

# 随机数组
r1 = np.random.rand(3)                  # [0,1) 均匀分布，3 个
r2 = np.random.randint(0, 10, size=5)   # 0~9 随机整数，5 个
r3 = np.random.randn(3)                 # 标准正态分布
np.random.seed(42)                      # 固定随机种子，结果可复现
```

## 3.2 数组属性

```python
a = np.array([[1, 2, 3], [4, 5, 6]])

a.shape       # (2, 3)   维度形状：2行3列
a.ndim        # 2        几维数组
a.size        # 6        元素总个数
a.dtype       # int64    元素数据类型
```

| 属性 | 含义 | 类比 Java |
| --- | --- | --- |
| `shape` | 各维度长度 | `arr.length`（仅一维） |
| `ndim` | 维度数 | 嵌套层数 |
| `size` | 元素总数 | 无直接对应 |
| `dtype` | 元素类型 | 数组声明时的类型 |

## 3.3 dtype 数据类型

```python
a = np.array([1, 2, 3], dtype=np.float32)   # 指定浮点类型
b = np.array([1, 2, 3]).astype(float)       # 转换类型
c = np.array(["a", "b"])                    # 字符串类型 <U1

print(a.dtype)   # float32
```

常用 dtype：`int8/16/32/64`、`float16/32/64`、`bool`、`str`。类型统一是 NumPy 高性能的根基。

---

# 4. 索引与切片

## 4.1 基础索引与切片（与 list 类似）

```python
a = np.arange(10)          # [0 1 2 3 4 5 6 7 8 9]

a[0]          # 0      第一个元素
a[-1]         # 9      最后一个
a[2:5]        # [2 3 4]  切片，含头不含尾
a[::2]        # [0 2 4 6 8]  步长 2

# 二维数组索引：行在前，列在后
m = np.array([[1, 2, 3], [4, 5, 6]])
m[1, 2]       # 6   第2行第3列
m[:, 0]       # [1 4]  所有行的第1列
m[0, :]       # [1 2 3]  第1行
```

## 4.2 布尔索引（NumPy 独有，过滤利器）

```python
a = np.array([1, 2, 3, 4, 5, 6])

# 筛选大于 3 的元素
mask = a > 3            # [False False False  True  True  True]
print(a[mask])          # [4 5 6]

# 一行写法：条件当索引用
print(a[a % 2 == 0])    # [2 4 6]  筛选偶数
```

> 布尔索引在数据分析中极常用（如筛选 DataFrame 的行），是 pandas 同款语法。Java 里对应要写循环 + 收集器。

## 4.3 花式索引（整数数组索引）

```python
a = np.array([10, 20, 30, 40, 50])

idx = [0, 2, 4]
print(a[idx])       # [10 30 50]  按索引数组取值
print(a[[3, 1]])    # [40 20]     可乱序、可重复
```

---

# 5. 数组变形与转置

## 5.1 reshape：改变形状

```python
a = np.arange(12)               # [0 1 ... 11]
b = a.reshape(3, 4)             # 3行4列
c = a.reshape(2, 3, 2)          # 变成 3 维张量
d = a.reshape(-1, 4)            # -1 自动推算：2行4列

print(b)
# [[ 0  1  2  3]
#  [ 4  5  6  7]
#  [ 8  9 10 11]]
```

> `reshape(-1, 4)` 中 `-1` 表示"这一维自动算"，是高频技巧：把一维数据规整为多行时不用数个数。

## 5.2 展平与转置

```python
m = np.array([[1, 2], [3, 4]])

m.ravel()        # [1 2 3 4]   展平成一维（尽量返回视图）
m.flatten()      # [1 2 3 4]   展平（总是复制）
m.T              # 转置：[[1 3], [2 4]]
```

---

# 6. 数组运算与广播（核心中的核心）

## 6.1 向量化运算：整个数组一起算

```python
a = np.array([1, 2, 3])
b = np.array([10, 20, 30])

a + b        # [11 22 33]   加法
a - b        # [-9 -18 -27] 减法
a * b        # [10 40 90]   逐元素乘法（不是矩阵乘法！）
a / b        # 逐元素除法
a ** 2       # [1 4 9]      平方
np.sqrt(a)   # 开方
np.abs(b)    # 绝对值
```

> **注意**：`a * b` 是**逐元素相乘**（对应位置相乘），不是数学上的矩阵乘法。矩阵乘法要用 `a @ b` 或 `np.dot(a, b)`。

## 6.2 标量运算：数组与单个数字

```python
a = np.array([1, 2, 3])

a + 1      # [2 3 4]   每个元素都 +1
a * 2      # [2 4 6]   每个元素都 *2
```

## 6.3 广播（Broadcasting）：形状不同的数组也能算

广播是 NumPy 最强大也最需要理解的机制：**当两个数组形状不同时，NumPy 自动把小的"拉伸"成大的形状再计算**。

```python
# 一维数组 + 标量
a = np.array([1, 2, 3])
print(a + 10)      # [11 12 13]  10 被广播到每个位置

# 二维 + 一维（行向量广播）
m = np.array([[1, 2, 3],
              [4, 5, 6]])
row = np.array([10, 20, 30])
print(m + row)
# [[11 22 33]
#  [14 25 36]]     每行都加上了 row

# 实用案例：标准化（每列减去均值）
data = np.array([[1., 2.], [3., 4.]])
mean = data.mean(axis=0)      # [2. 3.]  每列的均值
print(data - mean)            # 广播：每行减去该列均值
```

**广播规则**：从最后一个维度往前比较，维度相等或其中一个为 1 时兼容，否则报错。

```python
np.zeros((3, 4)) + np.array([1, 2, 3])    # 报错！(3,4) vs (3,) 末维 4≠3
```

---

# 7. 常用数学与统计函数

```python
a = np.array([[1, 2, 3], [4, 5, 6]])

a.sum()            # 21            所有元素求和
a.sum(axis=0)      # [5 7 9]       每列求和（沿着行方向压缩）
a.sum(axis=1)      # [6 15]        每行求和
a.mean()           # 3.5           均值
a.std()            # 1.7           标准差
a.var()            # 2.9           方差
a.min() / a.max()  # 1 / 6         最小/最大
a.argmax()         # 5             最大值的下标（扁平索引）
a.argmax(axis=1)   # [2 2]         每行最大值的下标
a.cumsum()         # [1 3 6 10 15 21]  累加和
```

| 函数 | 作用 | 类比 Java |
| --- | --- | --- |
| `sum / mean / min / max` | 求和/均值/最值 | `IntStream.sum()` 等 |
| `std / var` | 标准差/方差 | 需手写公式 |
| `argmax / argmin` | 最值下标 | 需手写循环 |
| `cumsum` | 累加和 | 无内置 |
| `axis` 参数 | 指定沿哪个维度计算 | 无对应（手动处理） |

> **axis 记忆口诀**：`axis=0` 沿**行方向**压缩（得到每列的结果）；`axis=1` 沿**列方向**压缩（得到每行的结果）。可以理解成"去掉 axis 指定的那个维度"。

---

# 8. 拼接、分割与排序

## 8.1 拼接与堆叠

```python
a = np.array([[1, 2], [3, 4]])
b = np.array([[5, 6], [7, 8]])

np.concatenate((a, b), axis=0)   # 垂直拼接（上下）→ 4行2列
np.concatenate((a, b), axis=1)   # 水平拼接（左右）→ 2行4列
np.vstack((a, b))                # vstack = 垂直堆叠（同 axis=0）
np.hstack((a, b))                # hstack = 水平堆叠（同 axis=1）
```

## 8.2 分割

```python
a = np.arange(10)

np.split(a, [3, 7])    # 按位置分割成 [0..2] [3..6] [7..9] 三段
np.array_split(a, 3)   # 平均分成 3 份
```

## 8.3 排序与唯一值

```python
a = np.array([3, 1, 2, 1])

np.sort(a)          # [1 1 2 3]   返回新数组排序（不改原数组）
a.sort()            # 原地排序（修改 a 本身）
np.unique(a)        # [1 2 3]     去重并排序
np.unique(a, return_counts=True)   # 同时返回每个值出现的次数
```

---

# 9. 性能对比：list vs ndarray

```python
import numpy as np
import time

# 10 万元素求和
n = 100_000
py_list = list(range(n))
np_array = np.arange(n)

# Python 列表：内置 sum
t0 = time.time()
s1 = sum(py_list)
t1 = time.time()

# NumPy：向量化
s2 = np_array.sum()
t2 = time.time()

print(f"list:  {t1 - t0:.6f} s")
print(f"numpy: {t2 - t1:.6f} s")
```

典型结果：NumPy 快 **30~100 倍**。原因：

| 因素 | Python list | NumPy ndarray |
| --- | --- | --- |
| 底层语言 | Python（解释执行） | C（编译执行） |
| 存储方式 | 对象指针数组 | 连续原始内存 |
| 计算方式 | 逐元素循环 | 向量化（批量） |

---

# 10. 小结

## 必须掌握的 8 个要点

1. **`np.array()` 创建数组**，注意与 `np.arange()`、`np.zeros()` 等工厂函数的区别；
2. **`shape` / `dtype`** 是理解数组的钥匙，类型不统一就没有高性能；
3. **切片与布尔索引**是数据筛选的核心语法；
4. **`reshape(-1, n)`** 是数据规整万能公式；
5. **向量化运算**代替循环，是 NumPy 的灵魂；
6. **广播机制**要熟记规则：末维对齐，相等或为 1；
7. **`axis` 参数**决定统计方向，多看多练；
8. **`np.unique`、`np.sort`、`np.concatenate`** 是日常数据清洗高频函数。

## 下一步

掌握 NumPy 之后，建议进入 [Pandas](./) 的学习——Pandas 的 `Series` / `DataFrame` 在 NumPy 数组之上封装了表格化、按列名操作的能力，是数据分析的主战场。

> 参考资料：[NumPy 官方文档](https://numpy.org/doc/stable/)、[NumPy 快速入门](https://numpy.org/doc/stable/user/quickstart.html)
