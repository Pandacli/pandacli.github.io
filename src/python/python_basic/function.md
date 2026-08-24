---
title: Python 函数
category:
  - Python
breadcrumbExclude: true
---

# Python 函数

函数是代码复用的最小单元。Python 的函数定义比 Java 简洁，而且参数体系非常灵活：**位置参数、默认参数、`可变位置参数*args`、`可变关键字参数**kwargs`、关键字专用参数**可以自由组合，一套签名就能覆盖 Java 需要写多个重载方法才能表达的场景。

先看一张全景图，再逐个击破：

| 参数写法 | 含义 | 调用示例 |
| --- | --- | --- |
| `def f(a, b)` | 位置参数 | `f(1, 2)` |
| `def f(a, b=10)` | 默认参数 | `f(1)` |
| `def f(*args)` | 可变位置参数 | `f(1, 2, 3)` |
| `def f(**kwargs)` | 可变关键字参数 | `f(x=1, y=2)` |
| `def f(a, *, b)` | 关键字专用参数 | `f(1, b=2)` |

---

## 1. 函数基础：def 与 return

```python
def add(a, b):
    """计算两个数之和"""
    return a + b

result = add(3, 5)
print(result)   # 8
```

```java
public static int add(int a, int b) {
    return a + b;
}

int result = add(3, 5);
```

| 对比点 | Python | Java |
| --- | --- | --- |
| 定义关键字 | `def` | `public static` 等修饰符 + 返回类型 |
| 返回语句 | `return` | `return` |
| 没有返回值时 | 隐式返回 `None` | 需要声明 `void` |
| 类型声明 | 可选（不强制） | 强制 |
| 代码块 | 冒号 + 缩进 | 大括号 `{}` |

> Python 的函数**不声明参数类型和返回类型**也能运行（类型标注是给 IDE/检查器看的，前面 NumPy 存根里的签名正是这种"类型标注"的极值形态）。

---

## 2. 位置参数与默认参数 —— Java 的方法重载

### 2.1 位置参数

按声明顺序一一对应传入：

```python
def greet(name, greeting):
    return f"{greeting}, {name}"

print(greet("Tom", "Hello"))   # Hello, Tom
print(greet("Hello", "Tom"))   # Tom, Hello  ← 顺序错了就变味
```

### 2.2 默认参数

给参数一个默认值，调用时**可以省略**：

```python
def greet(name, greeting="Hello"):
    return f"{greeting}, {name}"

print(greet("Tom"))          # Hello, Tom
print(greet("Tom", "Hi"))    # Hi, Tom
```

```java
// Java 没有默认参数，只能靠重载硬写两份
public static String greet(String name) {
    return greet(name, "Hello");
}

public static String greet(String name, String greeting) {
    return greeting + ", " + name;
}
```

| 对比点 | Python | Java |
| --- | --- | --- |
| 默认值 | `def f(a, b=10)` 直接写 | 无此语法，靠重载实现 |
| 重载数量 | 一份签名搞定 | 参数个数组合越多，重载方法越多 |
| 调用时用关键字指定 | `greet(greeting="Hi", name="Tom")` 乱序也行 | 不支持 |

> Python 的默认参数可以**用关键字名乱序传入**：`greet(greeting="Hi", name="Tom")`。这在 Java 里完全做不到——Java 没有命名参数。

**默认参数的坑**：默认值在函数定义时只求值一次。**不要用可变对象（如 `[]`、`{}`）当默认值**：

```python
def add_item(item, box=[]):   # 危险写法！
    box.append(item)
    return box

print(add_item("a"))   # ['a']
print(add_item("b"))   # ['a', 'b']  ← 两次共享同一个 list！
```

正确做法：默认值用 `None`，函数体内再创建：

```python
def add_item(item, box=None):
    if box is None:
        box = []
    box.append(item)
    return box
```

---

## 3. `*args` 可变位置参数 —— Java 的可变参数 `...`

`*args` 会把**多余的、按位置传入的参数**收集成一个 **tuple**。

```python
def sum_all(*args):
    print(type(args))   # <class 'tuple'>
    total = 0
    for n in args:
        total += n
    return total

print(sum_all(1, 2, 3))          # 6
print(sum_all(1, 2, 3, 4, 5))    # 15
print(sum_all())                 # 0，此时 args = ()
```

```java
// Java 的可变参数（varargs）本质是数组
public static int sumAll(int... nums) {
    int total = 0;
    for (int n : nums) total += n;
    return total;
}

sumAll(1, 2, 3);        // 6
sumAll(1, 2, 3, 4, 5);  // 15
sumAll();               // 0，nums 是空数组
```

| 对比点 | Python `*args` | Java `...` |
| --- | --- | --- |
| 收集成什么 | tuple | 数组 |
| 必须放参数末尾 | 是 | 是 |
| 元素类型 | 不限（可混合） | 必须同一类型 |
| 遍历 | `for n in args` | `for (int n : nums)` |

> **`args` 只是惯例命名**，关键是那个星号。写成 `def f(*numbers)` 效果一样——星号决定了"收集"，名字只是收件箱的标签。

---

## 4. `**kwargs` 可变关键字参数 —— Java 的 `Map<String, Object>`

`**kwargs` 会把**以 `key=value` 关键字形式传入的参数**收集成一个 **dict**。

```python
def print_profile(**kwargs):
    for key, value in kwargs.items():
        print(f"{key} = {value}")

print_profile(name="Tom", age=25, city="北京")
# name = Tom
# age = 25
# city = 北京
```

```java
// Java 没有命名参数，通常用 Map 传"不确定键集合"
public static void printProfile(Map<String, Object> params) {
    for (Map.Entry<String, Object> e : params.entrySet()) {
        System.out.println(e.getKey() + " = " + e.getValue());
    }
}

printProfile(Map.of("name", "Tom", "age", 25, "city", "北京"));
```

| 对比点 | Python `**kwargs` | Java `Map` 传参 |
| --- | --- | --- |
| 调用方写法 | `f(name="Tom", age=25)`，像命名参数 | `Map.of(...)`，先组装 Map |
| 键名拼错 | 运行时才暴露（静默进 dict） | 运行时才暴露 |
| 取默认值 | `kwargs.get("age", 18)` | `map.getOrDefault("age", 18)` |
| 类型 | value 任意 | value 是 `Object`，取用要强转 |

> **`kwargs` 同样是惯例命名**，`def f(**data)` 一样生效。`**` 决定了"收集成 dict"。

**`*args` 与 `**kwargs` 组合**（Java 无法直接对应，得 `Object...` + Map 一起上）：

```python
def log(level, *messages, **meta):
    parts = [f"[{level}]"] + list(messages)
    for k, v in meta.items():
        parts.append(f"{k}={v}")
    return " | ".join(parts)

print(log("INFO", "登录成功", "耗时 120ms", user_id=1001, ip="10.0.0.1"))
# [INFO] 登录成功 | 耗时 120ms | user_id=1001 | ip=10.0.0.1
```

---

## 5. `*` 关键字专用参数（keyword-only）

在参数列表里单独放一个 `*`，**之后的参数只能用 `key=value` 的形式传入**：

```python
def greet(name, *, punctuation="!"):
    return f"Hello, {name}{punctuation}"

print(greet("Tom"))                 # Hello, Tom!
print(greet("Tom", punctuation="?"))  # Hello, Tom?
print(greet("Tom", "?"))            # TypeError：punctuation 只能按关键字传
```

好处是防止调用方搞错位置。你之前在 NumPy 存根里见过的 `like` 参数就是这么定义的：

```python
@overload
def zeros(
    shape: _ShapeLike,
    dtype: None = ...,
    order: _OrderCF = ...,
    *,
    like: None | _SupportsArrayFunc = ...,
) -> NDArray[float64]: ...
```

`*` 后面的 `like` 只能写 `np.zeros((2, 3), like=cupy_array)`，绝不能靠位置硬塞——这就是**关键字专用参数**在实际库中的典型应用。

> Java 没有任何对应语法（Java 8 的 `@CheckReturnValue` 之类只是注解，不是参数约束）。最接近的只有 IDE 层面的提示。

---

## 6. 四种参数混合：完整签名与顺序铁律

```python
def create_user(name, age=18, *hobbies, city="北京", **extra):
    print(f"姓名: {name}, 年龄: {age}")
    print(f"爱好: {hobbies}")          # tuple
    print(f"城市: {city}")             # 关键字专用（在 * 之后）
    print(f"其他: {extra}")            # dict

create_user("Tom", 20, "篮球", "吉他", city="上海", level="VIP", sign="2026")
# 姓名: Tom, 年龄: 20
# 爱好: ('篮球', '吉他')
# 城市: 上海
# 其他: {'level': 'VIP', 'sign': '2026'}
```

**参数顺序铁律**（写反直接语法错误）：

```text
def f(位置参数, 默认参数=..., *args, 关键字专用参数, **kwargs)
     └────────┬────────┘   └┬┘   └──────┬──────┘   └──┬──┘
      必须在前             再收多余位置    必须用关键字      必须最后
```

记忆口诀：**位置在前，默认其次，`*args` 收位置，`*` 划界线，`**kwargs` 收尾。**

---

## 7. 解包调用：`*` 和 `**` 的另一个身份

函数定义里 `*`/`**` 是"收集"，**调用时**反过来是"展开"：

```python
def add(a, b, c):
    return a + b + c

nums = [1, 2, 3]
print(add(*nums))        # 6，相当于 add(1, 2, 3)

info = {"a": 1, "b": 2, "c": 3}
print(add(**info))       # 6，相当于 add(a=1, b=2, c=3)

# 混合：先位置解包，再关键字解包
base = {"b": 2, "c": 3}
print(add(1, **base))    # 6，相当于 add(1, b=2, c=3)
```

```java
// Java 只能手动拆：
int[] nums = {1, 2, 3};
add(nums[0], nums[1], nums[2]);
```

| 场景 | Python | Java |
| --- | --- | --- |
| 定义时 `*args` | 收集多余位置参数 | 可变参数 `...` |
| 定义时 `**kwargs` | 收集多余关键字参数 | 无 |
| 调用时 `f(*list)` | 把序列展开成位置参数 | 无（`list.toArray()` 后还是要手动展开） |
| 调用时 `f(**dict)` | 把 dict 展开成关键字参数 | 无 |

> 一个典型用途：把配置文件里的 dict 直接展开给函数——`connect(**db_config)`，Java 里得一行行取字段。

---

## 8. 综合示例：一个"灵活但不失约束"的函数

```python
def make_request(url, method="GET", *paths, timeout=10, **headers):
    """拼一个请求描述：url 必填，method 可省，路径可多个，超时只能用关键字，请求头随意"""
    full_url = "/".join([url] + list(paths))
    desc = f"[{method}] {full_url} (timeout={timeout}s)"
    if headers:
        desc += " headers=" + ", ".join(f"{k}={v}" for k, v in headers.items())
    return desc

print(make_request("https://api.example.com"))
# [GET] https://api.example.com (timeout=10s)

print(make_request("https://api.example.com", "POST", "users", "1001",
                   timeout=5, Authorization="Bearer xyz", Accept="json"))
# [POST] https://api.example.com/users/1001 (timeout=5s) headers=Authorization=Bearer xyz, Accept=json
```

这段签名同时体现了：
- `url`：必填位置参数
- `method`：默认参数
- `*paths`：多余位置参数 → tuple，实现"路径自由拼接"
- `timeout`：`*` 之后，必须关键字传入，避免被误当成路径
- `**headers`：任意数量请求头 → dict

---

## 9. 总结：Python 函数参数 vs Java

| 能力 | Python | Java | Python 优势 |
| --- | --- | --- | --- |
| 定义函数 | `def f(...)` | 方法 + 返回类型 + 访问修饰符 | 无样板代码 |
| 默认参数 | 语法原生支持 | 只能重载 | 一份签名顶多个重载 |
| 命名/关键字参数 | 调用时可 `f(b=1, a=2)` | 不支持 | 参数多时调用更清晰 |
| 可变参数 | `*args` → tuple | `int...` → 数组 | 类型不限、调用更灵活 |
| 关键字可变参数 | `**kwargs` → dict | `Map<String, Object>` | 调用像命名参数，无需组装 Map |
| 关键字专用参数 | `*` 分隔 | 无 | 约束调用方，防错位 |
| 解包调用 | `f(*list)` / `f(**dict)` | 无 | 传递参数/转发调用极方便 |
| 匿名函数 | `lambda x: x * 2` | `(x) -> x * 2` | 语法更简洁 |

一句话总结：**Java 靠"重载 × 可变参数 × Map"三个机制拼出灵活性，Python 用一套签名 + `*`/`**` 两个符号全部搞定**——这就是 Python 代码更短、更"声明式"的底层原因之一。

---

## 10. 函数大全：实战拆解 NumPy 的 `zeros`

前 9 章是"写一个函数"，本章用真实大型库 **NumPy** 的 `zeros` 类型存根签名做**总复习**——它把前面学过的每个机制几乎全用上了。

### 10.1 签名长什么样

```python
@overload
def zeros(
    shape: _ShapeLike,
    dtype: None = ...,
    order: _OrderCF = ...,
    *,
    like: None | _SupportsArrayFunc = ...,
) -> NDArray[float64]: ...
```

### 10.2 逐参数对号入座

| 签名片段 | 用到的机制 | 对应章节 |
| --- | --- | --- |
| `shape: _ShapeLike` | 必填位置参数 + 类型标注 | 第 2 章 |
| `dtype: None = ...` | 默认参数，且类型标注为 `None` | 第 2 章 |
| `order: _OrderCF = ...` | 默认参数 | 第 2 章 |
| `*` | 关键字专用分隔符 | 第 5 章 |
| `like: None \| _SupportsArrayFunc = ...` | 关键字专用 + 默认参数 + 类型标注 | 第 5 章 |
| `@overload` | 类型层面的多签名 | 本节 10.4 |
| `= ...` | 默认值占位符 | 本节 10.3 |
| `-> NDArray[float64]` | 返回类型标注 | 第 1 章 |

### 10.3 三个容易误解的写法

**(1) `=` 后面为什么是 `...`，不是 `0` 或 `"C"`？**

因为这是 `.pyi` 存根文件：**只声明类型，不写实现**。`...` 表示"有默认值，但具体值写在真正的 `.py` 实现里"。类比 Java：接口方法只写签名、不写方法体。

**(2) `dtype: None = ...` 的类型是字面量 `None`，不是"任意类型"**

类型标注 `None` 表示：只有**不传 dtype** 或**显式传 `dtype=None`** 时，调用才匹配这个签名。一旦传了具体 dtype（如 `dtype=np.int32`），就落到**另一个** overload 分支（见 10.4）。

**(3) `None | _SupportsArrayFunc` 是 `Optional[...]` 的缩写**

PEP 604 语法，等价于"可能为 None，也可能是实现了 `__array_function__` 协议的对象"。`like=` 的作用是让 `np.zeros(shape, like=cupy_array)` 把创建动作**派发给 CuPy 而不是 NumPy**。

### 10.4 为什么需要 `@overload`：同函数、不同返回类型

`zeros` 在存根里其实有**两个**签名：

```python
@overload
def zeros(shape, dtype=None, ...) -> NDArray[float64]: ...
@overload
def zeros(shape, dtype: _DTypeLike, ...) -> NDArray[Any]: ...
```

| 分支 | dtype 的取值 | 返回类型 | 原因 |
| --- | --- | --- | --- |
| 分支 1 | 不传 / `None` | `NDArray[float64]`（精确） | 运行时固定用默认 dtype `float64` |
| 分支 2 | 传了具体 dtype | `NDArray[Any]`（宽泛） | 类型系统推断不出你传的具体 dtype |

这正是**"参数取值不同 → 返回类型不同"**的解决方案。

> **Java 类比**：Java 的方法重载只能按"参数类型"（`int`、`String`）区分，够不到"参数取值"这一层；Python 类型系统用 `Literal[None]` 这类**字面量类型**，能在值层面区分重载分支并收窄返回类型。这是 Python 类型标注比 Java 泛型更精细的地方。

### 10.5 `_ShapeLike`、`_OrderCF` 这些类型从哪来

它们不是内置类型，而是 `.pyi` 里预定义的**类型别名/协议**（用 TypeVar、Literal、Protocol 声明，类比 Java 的泛型、enum、接口）：

| 名字 | 定义 | 类比 Java |
| --- | --- | --- |
| `_ShapeLike` | `_SupportsIndex \| NestedSequence[_SupportsIndex]`，即"整数或整数的嵌套序列" | `Iterable<Integer>` |
| `_OrderCF` | `Literal["C", "F"]`，只允许两个字符串 | enum |
| `_SupportsArrayFunc` | 有 `__array_function__` 协议的对象 | 接口 |
| `NDArray[float64]` | `ndarray[Any, dtype[float64]]` | `NDArray<Float64>` |

> 你日常写 Python 不用定义这些——但读懂它们的约定，就能看懂 NumPy、pandas 等所有大库的签名。

### 10.6 库级设计经验：这套模板值得抄

写一个"给全世界用"的函数，可以照抄 `zeros` 的布局：

1. **必填参数放最前**：`shape`（调用方最常改）
2. **常用可配置项用默认参数**：`dtype`、`order`
3. **不常用/高级选项放 `*` 之后强制关键字**：`like`，防止调用方靠位置瞎传
4. **用 `@overload` 为不同参数组合给出精确返回类型**：`dtype=None` → 精确 `float64`

```java
// 同样的需求用 Java 写，重载组合会指数级膨胀：
static NDArray<Float64> zeros(Shape shape) { ... }
static <T extends DType> NDArray<T> zeros(Shape shape, Class<T> dtype) { ... }
static NDArray<Float64> zeros(Shape shape, Order order) { ... }   // 又要重载
static NDArray<Float64> zeros(Shape shape, Class<? extends DType> dtype, Order order) { ... }
```

Python 一份签名搞定，且 `*` 之后的参数让调用方**一眼看清语义**：`np.zeros((3, 3), like=gpu_array)` 远比 `zeros(shape, null, order, gpuArray)` 好读。

### 10.7 第 10 章小结：函数大全对照表

| zeros 签名片段 | 机制 | 一句话 |
| --- | --- | --- |
| `shape` | 必填位置参数 | 没默认值，不传报错 |
| `dtype=None` | 默认参数 + 字面量类型 | 不传就是 float64 |
| `order="C"` | 默认参数 | 只在两种取值中选 |
| `*` | 关键字专用 | 后面的 `like` 不许按位置传 |
| `@overload` | 多签名 | 按 dtype 取值切换返回类型 |
| `= ...` | 占位符 | 值在实现里，存根只给类型 |

学完这一章，你已经能读懂包括 NumPy 在内绝大多数库的函数签名——**参数怎么传、为什么能这样传、类型为什么会这样推**，底层就是第 1~10 章这几套机制的排列组合。
