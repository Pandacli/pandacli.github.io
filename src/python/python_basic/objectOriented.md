---
title: 面向对象编程
category:
  - Python
breadcrumbExclude: true
---

# Python 面向对象编程

面向对象编程（OOP）有四大核心概念：**封装、继承、多态、抽象**。Python 与 Java 都是面向对象语言，实现思路相似，但语法风格差异很大——Java 是"强约束"，Python 是"灵活自由"。

> 一句话概括：**Java 把规则定得死死的（private、final、abstract），Python 靠约定与命名来达成同样的目标（_xxx、鸭子类型）。**

---

# 1. 类与对象

## 1.1 定义一个类

```python
class Dog:
    # 类属性：所有实例共享
    species = "canine"

    # 构造方法：创建对象时自动调用
    def __init__(self, name, age):
        self.name = name    # 实例属性
        self.age = age

    # 实例方法
    def bark(self):
        return f"{self.name} is barking!"

# 创建对象 —— 不需要 new 关键字
dog = Dog("旺财", 3)
print(dog.name)       # 旺财
print(dog.species)    # canine
print(dog.bark())     # 旺财 is barking!
```

```java
public class Dog {
    // 静态属性（类似类属性）
    static String species = "canine";

    // 实例属性
    String name;
    int age;

    // 构造方法：类名同名，创建对象时调用
    public Dog(String name, int age) {
        this.name = name;
        this.age = age;
    }

    // 实例方法
    public String bark() {
        return name + " is barking!";
    }
}

// 创建对象 —— 必须使用 new
Dog dog = new Dog("旺财", 3);
System.out.println(dog.name);      // 旺财
System.out.println(Dog.species);   // canine
System.out.println(dog.bark());    // 旺财 is barking!
```

| 对比点 | Python | Java |
| --- | --- | --- |
| 定义类 | `class Dog:` | `public class Dog { }` |
| 创建对象 | `Dog("旺财", 3)` | `new Dog("旺财", 3)` |
| 构造方法 | `__init__(self, ...)` | `Dog(...)`（与类同名） |
| 实例属性 | `self.name = ...` | `this.name = ...` |
| 类属性 | 类内直接赋值 | `static` 变量 |
| 方法中引用实例 | `self`（显式传参） | `this`（隐式） |

> **关键差异**：Python 方法的第一个参数必须是 `self`，代表实例本身；Java 的 `this` 是隐式的，不需要写进参数列表。调用时 Python 的 `self` 会自动传入，不需要手动传。

---

# 2. 封装：私有属性

封装的核心是"隐藏内部细节，只暴露必要接口"。

## 2.1 Java：语法级强制私有

```java
public class Account {
    // private 修饰：外部完全无法访问
    private double balance;

    public Account(double balance) {
        this.balance = balance;
    }

    // 通过 getter/setter 受控访问
    public double getBalance() {
        return balance;
    }

    public void deposit(double amount) {
        this.balance += amount;
    }
}
```

Java 的 `private` 是**编译期强制**的：外部代码直接访问 `balance` 会直接编译报错。

## 2.2 Python：约定式私有

```python
class Account:
    def __init__(self, balance):
        self._balance = balance    # 单下划线：约定"别动我"（可访问）
        self.__balance2 = balance  # 双下划线：名字改编，外部无法直接访问

    def get_balance(self):
        return self._balance

    def deposit(self, amount):
        self._balance += amount

acc = Account(1000)
print(acc._balance)       # 1000 —— 可以访问，但约定上不应直接读写
# print(acc.__balance2)   # AttributeError —— 双下划线触发"名字改编"（name mangling）
print(acc._Account__balance2)  # 1000 —— 名字改编后其实是这个名（仍可强制访问）
```

| 对比点 | Python | Java |
| --- | --- | --- |
| 私有关键字 | 无（双下划线改名） | `private` |
| 强制程度 | 约定 > 强制（"请勿使用"） | 编译期强制 |
| 单下划线 `_x` | 约定：内部使用 | 无对应（package-private） |
| 双下划线 `__x` | 名字改编，防误用 | 类似 private |
| getter/setter | `@property`（见下） | `getX()` / `setX()` |

## 2.3 @property：Python 风格的 getter/setter

Python 用 `@property` 装饰器实现"像访问属性一样调用方法"：

```python
class Temperature:
    def __init__(self, celsius):
        self._celsius = celsius

    @property
    def celsius(self):
        return self._celsius

    @property
    def fahrenheit(self):      # 只读属性
        return self._celsius * 9 / 5 + 32

    @celsius.setter            # 赋值时校验
    def celsius(self, value):
        if value < -273.15:
            raise ValueError("温度不能低于绝对零度")
        self._celsius = value

t = Temperature(25)
print(t.celsius)        # 25 —— 像属性一样读取
print(t.fahrenheit)     # 77.0 —— 计算后返回
t.celsius = 30          # 走 setter 校验
```

```java
public class Temperature {
    private double celsius;

    public Temperature(double celsius) { this.celsius = celsius; }

    public double getCelsius() { return celsius; }

    public double getFahrenheit() {
        return celsius * 9 / 5 + 32;
    }

    public void setCelsius(double value) {
        if (value < -273.15) throw new IllegalArgumentException("温度不能低于绝对零度");
        this.celsius = value;
    }
}
```

调用处对比：Python 是 `t.celsius`（无括号、无 get），Java 是 `t.getCelsius()`。Python 把"读"和"写"包装成了属性语法，代码更简洁。

---

# 3. 继承

## 3.1 单继承

```python
class Animal:
    def __init__(self, name):
        self.name = name

    def speak(self):
        return "..."

class Dog(Animal):              # 继承：括号中写父类
    def __init__(self, name):
        super().__init__(name)  # 调用父类构造

    def speak(self):            # 方法重写
        return f"{self.name} 汪汪!"

class Cat(Animal):
    def speak(self):
        return f"{self.name} 喵喵!"

dog = Dog("旺财")
cat = Cat("咪咪")
print(dog.speak())   # 旺财 汪汪!
print(cat.speak())   # 咪咪 喵喵!
```

```java
class Animal {
    protected String name;

    public Animal(String name) { this.name = name; }

    public String speak() { return "..."; }
}

class Dog extends Animal {      // 继承：extends 关键字
    public Dog(String name) { super(name); }   // 调用父类构造

    @Override
    public String speak() {     // 方法重写，必须加 @Override
        return name + " 汪汪!";
    }
}

class Cat extends Animal {
    @Override
    public String speak() { return name + " 喵喵!"; }
}
```

| 对比点 | Python | Java |
| --- | --- | --- |
| 继承关键字 | `class A(B):` | `class A extends B` |
| 调用父类构造 | `super().__init__(...)` | `super(...)` |
| 方法重写 | 直接同名定义（无需标注） | 必须 `@Override` |
| 多继承 | 支持 | 不支持（接口可多实现） |

## 3.2 Python 独有的多继承

```python
class Flyable:
    def fly(self):
        return "I can fly!"

class Swimmable:
    def swim(self):
        return "I can swim!"

class Duck(Flyable, Swimmable):   # 多继承：同时拥有两个父类能力
    pass

duck = Duck()
print(duck.fly())    # I can fly!
print(duck.swim())   # I can swim!
```

```java
// Java 不支持多继承，用接口实现多能力
interface Flyable { void fly(); }
interface Swimmable { void swim(); }

class Duck implements Flyable, Swimmable {
    @Override public void fly() { System.out.println("I can fly!"); }
    @Override public void swim() { System.out.println("I can swim!"); }
}
```

> Java 通过"类单继承 + 接口多实现"来规避多继承的菱形问题；Python 直接支持多继承，遇到同名方法时按 **MRO（方法解析顺序）** 决定调用哪个，灵活性更高、也更容易踩坑。

---

# 4. 多态：鸭子类型 vs 接口

## 4.1 Java：靠接口/继承实现多态（强类型约束）

```java
// 定义统一接口
interface Shape {
    double area();
}

class Circle implements Shape {
    private double r;
    public Circle(double r) { this.r = r; }
    @Override public double area() { return Math.PI * r * r; }
}

class Rectangle implements Shape {
    private double w, h;
    public Rectangle(double w, double h) { this.w = w; this.h = h; }
    @Override public double area() { return w * h; }
}

// 多态：同一接口，不同实现
List<Shape> shapes = List.of(new Circle(2), new Rectangle(3, 4));
for (Shape s : shapes) {
    System.out.println(s.area());
}
```

Java 中，对象必须**显式声明实现某个接口**，编译器才允许调用接口方法。

## 4.2 Python：鸭子类型（无接口约束）

Python 没有接口概念，只要对象"长得像、叫得像"（有对应方法），就能调用——这就是**鸭子类型**："如果它走路像鸭子、叫起来像鸭子，那它就是鸭子"：

```python
class Circle:
    def __init__(self, r):
        self.r = r

    def area(self):
        return 3.14159 * self.r ** 2

class Rectangle:
    def __init__(self, w, h):
        self.w = w
        self.h = h

    def area(self):
        return self.w * self.h

# 不要求继承任何基类/实现任何接口
shapes = [Circle(2), Rectangle(3, 4)]
for s in shapes:
    print(s.area())     # 只要对象有 area() 方法就能调用
```

| 对比点 | Python | Java |
| --- | --- | --- |
| 多态基础 | 鸭子类型（运行时） | 接口/继承（编译期） |
| 类型检查 | 运行时才报错 | 编译期就报错 |
| 抽象类/接口 | `ABC`（abc 模块，可选） | `interface` / `abstract class`（强制） |
| 灵活性 | 高 | 低 |
| 安全性 | 低（调用不存在的方法才暴露） | 高 |

> **最佳实践**：Python 允许不写任何父类就能实现多态。但对大型项目，建议使用 `abc.ABC` 定义抽象基类来约束行为，把"约定"提升为"规范"：

```python
from abc import ABC, abstractmethod

class Shape(ABC):
    @abstractmethod
    def area(self): ...

class Circle(Shape):      # 不实现 area() 会报错，无法实例化
    def __init__(self, r): self.r = r
    def area(self): return 3.14159 * self.r ** 2
```

---

# 5. 类方法 / 静态方法

Python 用装饰器区分三种方法，Java 用 `static` 关键字：

```python
class MathUtils:
    count = 0

    def __init__(self):
        MathUtils.count += 1

    # 实例方法：需要 self，能访问实例属性
    def instance_method(self):
        return f"实例方法，count={MathUtils.count}"

    # 类方法：第一个参数是 cls（类本身），可访问/修改类属性
    @classmethod
    def class_method(cls):
        return f"类方法，类名={cls.__name__}"

    # 静态方法：与类无关的工具函数
    @staticmethod
    def static_method(a, b):
        return a + b
```

```java
public class MathUtils {
    static int count = 0;

    public MathUtils() { count++; }

    // 实例方法：能访问实例与静态属性
    public String instanceMethod() {
        return "实例方法，count=" + count;
    }

    // 静态方法：Java 用 static 修饰
    public static String classMethod() {
        return "静态方法，类名=" + MathUtils.class.getSimpleName();
    }

    // 静态工具方法
    public static int staticMethod(int a, int b) {
        return a + b;
    }
}
```

| 对比点 | Python | Java |
| --- | --- | --- |
| 实例方法 | `def m(self):` | `public void m() { }` |
| 类方法/静态 | `@classmethod` / `@staticmethod` | `static` 修饰符 |
| 类方法第一参数 | `cls` | 无（隐式类上下文） |
| 本质区别 | 类方法可访问/修改类属性 | 静态方法不可访问实例属性 |

---

# 6. 特殊方法（魔术方法）vs Java 的 Object 方法

Python 通过**双下划线特殊方法**让对象支持内置操作，对应 Java 中 `Object` 类的方法：

```python
class Book:
    def __init__(self, title, price):
        self.title = title
        self.price = price

    # Java 的 toString()
    def __str__(self):
        return f"《{self.title}》 ¥{self.price}"

    # Java 的 equals() + hashCode()
    def __eq__(self, other):
        return isinstance(other, Book) and self.title == other.title

    # Java 的 compareTo() —— 支持 < 排序
    def __lt__(self, other):
        return self.price < other.price

    # 支持 len(obj)
    def __len__(self):
        return len(self.title)

b1 = Book("Python入门", 59)
b2 = Book("Python入门", 59)
print(b1)             # 《Python入门》 ¥59 —— 自动调用 __str__
print(b1 == b2)       # True —— 自动调用 __eq__
print(b1 < Book("Java入门", 99))   # True —— 自动调用 __lt__
```

```java
public class Book {
    private String title;
    private int price;

    // Java 需要显式 override Object 的方法
    @Override
    public String toString() { return "《" + title + "》 ¥" + price; }

    @Override
    public boolean equals(Object o) {
        if (!(o instanceof Book b)) return false;
        return title.equals(b.title);
    }

    @Override
    public int hashCode() { return title.hashCode(); }

    // 排序需要实现 Comparable
    public int compareTo(Book o) { return Integer.compare(price, o.price); }
}
```

| Python 特殊方法 | 触发场景 | Java 对应 |
| --- | --- | --- |
| `__init__` | 创建对象 | 构造方法 |
| `__str__` | `print(obj)` | `toString()` |
| `__eq__` | `==` | `equals()` |
| `__hash__` | 作为 dict 的 key | `hashCode()` |
| `__lt__` | `<` 比较/排序 | `compareTo()` / `Comparator` |
| `__len__` | `len(obj)` | `.size()`（无语法糖） |
| `__getitem__` | `obj[i]` | `.get(i)` |

---

# 7. 总结对比表

| 特性 | Python | Java |
| --- | --- | --- |
| 创建对象 | `Dog("旺财")`，无 new | `new Dog("旺财")` |
| 构造方法 | `__init__(self, ...)` | `Dog(...)` 与类同名 |
| 实例引用 | `self`（显式） | `this`（隐式） |
| 私有 | 约定 `_x` / 名字改编 `__x` | `private` 强制 |
| 继承 | `class A(B):` | `class A extends B` |
| 多继承 | 直接支持 | 不支持（用接口） |
| 多态 | 鸭子类型（运行时） | 接口实现（编译期） |
| 抽象 | `abc.ABC`（可选） | `abstract class` / `interface`（强制） |
| 重写标注 | 无（同名即重写） | `@Override` |
| 方法重载 | 不支持（同名覆盖） | 支持 |

## 给 Java 开发者的学习建议

1. **忘掉 `new` 和 `private`**：Python 更依赖约定而非语法强制，代码能跑不代表规范，要自觉遵守 `_` 前缀约定。
2. **重视 `self`**：所有实例方法第一个参数都是 `self`，这是与 Java 最大的语法差异。
3. **善用鸭子类型**：Python 不强制接口，但大型项目建议用 `ABC` 约束，保证"约定即规范"。
4. **特殊方法是精华**：`__str__`、`__eq__`、`__lt__` 让对象无缝融入 Python 语法，这是 Java 的 `Object` 方法做不到的灵活。

> 面向对象思想是相通的：Java 的"类、封装、继承、多态"经验可以直接迁移到 Python，差异只在语法层面。理解了这套映射关系，就能在两种语言之间自由切换。
