---
title: Python高阶数据结构
category:
  - Python
breadcrumbExclude: true
---

# Python 四大内置数据结构

Python 内置了四种最常用的数据结构：**List（列表）、Tuple（元组）、Set（集合）、Dictionary（字典）**。它们几乎覆盖了日常开发 90% 的数据组织需求，而且语法比 Java 简洁得多。

| Python | Java 对应物 | 是否可变 | 是否有序 | 是否允许重复 |
| --- | --- | --- | --- | --- |
| `list` | `ArrayList` / `LinkedList` | 可变 | 有序 | 允许 |
| `tuple` | 无直接对应（近似 `List.of()`） | 不可变 | 有序 | 允许 |
| `set` | `HashSet` / `LinkedHashSet` | 可变 | 无序 | 不允许 |
| `dict` | `HashMap` / `LinkedHashMap` | 可变 | 有序(3.7+) | key 不允许 |

> 记忆口诀：**List 像 Java 的 ArrayList，Set 像 HashSet，Dict 像 HashMap，Tuple 则像"锁死的 List"。**

---

# 1. List 列表 —— Java 的 ArrayList

## 1.1 定义与创建

List 是 Python 中使用最频繁的数据结构，可以存放**任意类型混合**的元素，无需声明泛型：

```python
# 创建一个列表（相当于 Java 的 new ArrayList<>()）
fruits = ["apple", "banana", "cherry"]

# 空列表
empty = []

# 混合类型：Python 允许不同类型共存
mixed = [1, "hello", 3.14, True]
```

```java
// Java 需要声明泛型，且类型必须一致
List<String> fruits = new ArrayList<>(Arrays.asList("apple", "banana", "cherry"));

List<Object> mixed = new ArrayList<>();
mixed.add(1);
mixed.add("hello");
```

| 对比点 | Python | Java |
| --- | --- | --- |
| 创建空集合 | `lst = []` | `List<E> list = new ArrayList<>()` |
| 泛型 | 无 | 必须（Java 5+） |
| 元素类型 | 可混合 | 同一类型 |
| 底层实现 | 动态数组 | ArrayList 也是动态数组 |

## 1.2 索引与切片

Python 最强大的特性之一是**切片（slice）**，Java 需要借助 `subList` 实现，且不支持负数索引：

```python
nums = [10, 20, 30, 40, 50]

print(nums[0])      # 10 —— 正数索引从 0 开始
print(nums[-1])     # 50 —— 负数索引从末尾开始，-1 是最后一个
print(nums[1:3])    # [20, 30] —— 切片 [start:end]，含头不含尾
print(nums[::2])    # [10, 30, 50] —— 步长为 2
print(nums[::-1])   # [50, 40, 30, 20, 10] —— 反转
```

```java
List<Integer> nums = new ArrayList<>(Arrays.asList(10, 20, 30, 40, 50));

System.out.println(nums.get(0));                       // 10
System.out.println(nums.get(nums.size() - 1));         // 50（负数索引需要手动换算）
System.out.println(nums.subList(1, 3));                // [20, 30]
Collections.reverse(nums);                             // 反转需要工具类
```

## 1.3 常用操作

```python
fruits = ["apple", "banana"]

fruits.append("cherry")      # 末尾追加 → ["apple", "banana", "cherry"]
fruits.insert(1, "orange")   # 指定位置插入 → ["apple", "orange", "banana", "cherry"]
fruits.remove("banana")      # 按值删除（只删第一个匹配）
popped = fruits.pop()        # 弹出并返回末尾元素
fruits[0] = "watermelon"     # 按下标修改
length = len(fruits)         # 获取长度（内置函数，不是方法）
has_apple = "apple" in fruits  # 判断包含
```

```java
List<String> fruits = new ArrayList<>(Arrays.asList("apple", "banana"));

fruits.add("cherry");                    // 末尾追加
fruits.add(1, "orange");                 // 指定位置插入
fruits.remove("banana");                 // 按值删除
String popped = fruits.remove(fruits.size() - 1);  // 弹出末尾
fruits.set(0, "watermelon");             // 按下标修改
int length = fruits.size();              // 长度是方法
boolean hasApple = fruits.contains("apple");       // 包含判断
```

| 操作 | Python | Java |
| --- | --- | --- |
| 追加 | `lst.append(x)` | `list.add(x)` |
| 指定位置插入 | `lst.insert(i, x)` | `list.add(i, x)` |
| 删除 | `lst.remove(x)` / `lst.pop()` | `list.remove(x)` |
| 长度 | `len(lst)`（内置函数） | `list.size()`（方法） |
| 包含 | `x in lst`（运算符） | `list.contains(x)` |
| 遍历 | `for x in lst:` | `for (E x : list)` |

## 1.4 列表推导式 —— Java Stream 的"轻量版"

列表推导式（List Comprehension）是 Python 的标志性语法，一行代码完成"过滤 + 转换"：

```python
nums = [1, 2, 3, 4, 5, 6]

# 筛选偶数并平方
even_squares = [x * x for x in nums if x % 2 == 0]
print(even_squares)  # [4, 16, 36]
```

```java
List<Integer> nums = Arrays.asList(1, 2, 3, 4, 5, 6);

// Java 需要 Stream API + 收集器
List<Integer> evenSquares = nums.stream()
        .filter(x -> x % 2 == 0)
        .map(x -> x * x)
        .collect(Collectors.toList());
System.out.println(evenSquares);  // [4, 16, 36]
```

---

# 2. Tuple 元组 —— 不可变的 List

## 2.1 定义与特性

Tuple 与 List 几乎一样，唯一的核心区别是**不可变**：创建后不能增、删、改。一旦定义就"锁死"。

```python
# 创建元组
point = (10, 20)
single = (5,)          # 注意：单个元素必须加逗号，否则是 int 而不是 tuple
empty = ()

# 尝试修改会报错
point[0] = 99          # TypeError: 'tuple' object does not support item assignment
```

```java
// Java 没有专门的 Tuple 类型，常用 List.of() 模拟不可变性
List<Integer> point = List.of(10, 20);

point.set(0, 99);      // UnsupportedOperationException（List.of 不可变）
```

> Java 的 `List.of()` 与 Python tuple 都不可变，但 Python tuple 更"纯粹"：连 append 方法都没有，编译器/运行时不给你修改的机会。

## 2.2 元组解包

元组的经典用法是**解包（unpacking）**，一个语句把多个值赋给多个变量。Java 则需要手动取值：

```python
point = (10, 20)
x, y = point          # 解包：x=10, y=20

# 经典场景：交换两个变量，无需中间变量
a, b = 1, 2
a, b = b, a           # a=2, b=1
```

```java
// Java 交换变量需要临时变量
int a = 1, b = 2;
int temp = a;
a = b;
b = temp;
```

## 2.3 什么时候用 Tuple 而不是 List

- 数据一旦确定不再改变（如坐标、RGB 颜色值、数据库记录）；
- 作为字典的 key（List 可变不可作 key，Tuple 不可变可以）；
- 函数返回多个值时（隐式解包）。

```python
def get_user():
    return ("张三", 25, "测试工程师")   # 返回多个值

name, age, job = get_user()           # 调用处直接解包
```

```java
// Java 需要定义专门的类或用 record
record User(String name, int age, String job) {}

var u = new User("张三", 25, "测试工程师");
```

| 对比点 | Python tuple | Java 的不可变集合 |
| --- | --- | --- |
| 可变性 | 完全不可变 | `List.of()` 不可变 |
| 语法 | `(1, 2)` | `List.of(1, 2)` |
| 解包 | 原生支持 | 不支持 |
| 语义 | 一等公民类型 | 需要容器包装 |

---

# 3. Set 集合 —— Java 的 HashSet

## 3.1 定义与去重

Set 是**无序、不重复**的元素集合，最典型的应用是**去重**：

```python
# 创建集合
colors = {"red", "green", "blue"}

# 从列表去重
nums = [1, 2, 2, 3, 3, 3]
unique = set(nums)      # {1, 2, 3}

# 添加重复元素不会生效
colors.add("red")       # 已存在，无变化
colors.add("yellow")    # 新增成功

# 判断成员
print("red" in colors)  # True
```

```java
Set<String> colors = new HashSet<>(Arrays.asList("red", "green", "blue"));

// 去重
List<Integer> nums = Arrays.asList(1, 2, 2, 3, 3, 3);
Set<Integer> unique = new HashSet<>(nums);   // [1, 2, 3]

colors.add("red");       // 已存在，无变化
colors.add("yellow");    // 新增成功

System.out.println(colors.contains("red"));  // true
```

## 3.2 集合运算 —— 并集、交集、差集

Python 的集合运算直接使用运算符，一行搞定；Java 需要借助 `retainAll`、`addAll` 等，且会**修改原集合**：

```python
a = {1, 2, 3, 4}
b = {3, 4, 5, 6}

print(a | b)   # 并集 {1, 2, 3, 4, 5, 6}
print(a & b)   # 交集 {3, 4}
print(a - b)   # 差集 {1, 2}
print(a ^ b)   # 对称差 {1, 2, 5, 6}
```

```java
Set<Integer> a = new HashSet<>(Arrays.asList(1, 2, 3, 4));
Set<Integer> b = new HashSet<>(Arrays.asList(3, 4, 5, 6));

Set<Integer> union = new HashSet<>(a);
union.addAll(b);                    // 并集

Set<Integer> intersection = new HashSet<>(a);
intersection.retainAll(b);          // 交集

Set<Integer> difference = new HashSet<>(a);
difference.removeAll(b);            // 差集
```

| 对比点 | Python | Java |
| --- | --- | --- |
| 默认实现 | `set`（哈希） | `HashSet`（哈希） |
| 并集 | `a \| b` | `addAll` |
| 交集 | `a & b` | `retainAll` |
| 差集 | `a - b` | `removeAll` |
| 去重 | `set(list)` 一行 | `new HashSet<>(list)` |
| 有序集合 | 无内置 | `TreeSet` / `LinkedHashSet` |

---

# 4. Dictionary 字典 —— Java 的 HashMap

## 4.1 定义与基本操作

字典以**键值对（key-value）**形式存储数据，key 必须唯一且不可变。Python 3.7+ 字典保持插入顺序，与 Java 的 `LinkedHashMap` 行为一致：

```python
# 创建字典
user = {
    "name": "张三",
    "age": 25,
    "job": "测试工程师"
}

# 增改
user["city"] = "深圳"          # 新增 key
user["age"] = 26               # 修改 value

# 查
print(user["name"])            # 张三 —— key 不存在会抛 KeyError
print(user.get("name"))        # 张三 —— 推荐，不存在返回 None
print(user.get("salary", 0))   # 0 —— 不存在时返回默认值

# 删
del user["job"]                # 删除 key
age = user.pop("age")          # 弹出并返回

# 遍历
for k, v in user.items():      # items() 同时取键值
    print(k, v)
```

```java
Map<String, Object> user = new HashMap<>();
user.put("name", "张三");
user.put("age", 25);
user.put("job", "测试工程师");

user.put("city", "深圳");            // 新增 key
user.put("age", 26);                 // 修改 value（put 覆盖）

Object name = user.get("name");      // 不存在返回 null（不抛异常）
Object salary = user.getOrDefault("salary", 0);  // 默认值

user.remove("job");                  // 删除 key

for (Map.Entry<String, Object> e : user.entrySet()) {
    System.out.println(e.getKey() + " " + e.getValue());
}
```

| 对比点 | Python | Java |
| --- | --- | --- |
| 创建空字典 | `d = {}` | `new HashMap<>()` |
| 取值(安全) | `d.get(k)` | `map.get(k)`（返回 null） |
| 带默认值取值 | `d.get(k, def)` | `map.getOrDefault(k, def)` |
| 判断 key 存在 | `k in d` | `map.containsKey(k)` |
| 删除 | `del d[k]` / `d.pop(k)` | `map.remove(k)` |
| 遍历 | `d.items()` 一行 | `entrySet()` |

## 4.2 常用方法速查

```python
d = {"a": 1, "b": 2}

d.keys()        # 所有 key  → dict_keys(['a', 'b'])
d.values()      # 所有 value
d.items()       # 所有键值对
d.pop("a", 0)   # 删除并返回，不存在返回 0（不会报错）
d.clear()       # 清空
```

```java
Map<String, Integer> d = new HashMap<>(Map.of("a", 1, "b", 2));

d.keySet();         // 所有 key
d.values();         // 所有 value
d.entrySet();       // 所有键值对
d.remove("a");      // 删除，不存在返回 null
d.clear();          // 清空
```

> `Map.of(...)` 最多支持 10 对键值，且不可变；Python 的字面量 `{}` 没有数量与可变性限制。

---

# 5. 总结：一张表掌握四种数据结构

| 特性 | `list` | `tuple` | `set` | `dict` |
| --- | --- | --- | --- | --- |
| Java 对应物 | `ArrayList` | `List.of()` | `HashSet` | `HashMap` |
| 写法 | `[]` | `()` | `{}`（注意不是空字典） | `{k: v}` |
| 可变 | ✅ | ❌ | ✅ | ✅ |
| 有序 | ✅ | ✅ | ❌ | ✅（3.7+ 插入序） |
| 允许重复 | ✅ | ✅ | ❌ | key 不重复 |
| 能否作字典 key | ❌（可变） | ✅（不可变） | ❌ | — |
| 典型场景 | 元素列表 | 多返回值、常量组 | 去重、集合运算 | 键值映射 |

## 选择建议（对应 Java 的选型思路）

- 需要**按索引访问的有序序列** → `list`（Java 用 `ArrayList`）
- 需要**不可变常量数据** → `tuple`（Java 用 `List.of()` 或 `record`）
- 需要**去重或集合运算** → `set`（Java 用 `HashSet`）
- 需要**键值映射/查找表** → `dict`（Java 用 `HashMap`）

> 掌握这四种内置结构后，Python 的日常数据处理基本就够用了。它们底层都是哈希表或动态数组，与 Java 对应实现原理一致——理解了 Java 版本，Python 版自然一通百通。
