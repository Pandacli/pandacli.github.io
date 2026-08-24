---
breadcrumbExclude: true
title: 认证与授权：Session、JWT、OAuth2 与越权防护全解析
date: 2026-08-24
tags:
  - 认证
  - 授权
  - JWT
  - OAuth2
  - 越权
  - 安全测试
---

# 认证与授权：Session、JWT、OAuth2 与越权防护全解析

认证（Authentication）与授权（Authorization）是几乎所有系统的安全基石。二者经常被混为一谈，但"**你能登录**"和"**你能看别人的订单**"是完全两码事——OWASP 接口安全 Top 1 漏洞（失效的对象级授权）恰恰就是只做了认证、没做授权。

本文系统讲解 Session、Token、JWT、OAuth2/OIDC、SSO 的原理与安全要点，剖析 JWT 常见攻击与越权漏洞，并给出安全测试实战方法，帮助测试工程师与研发建立完整的认证授权知识体系。

## 一、认证与授权的基本概念

### 1.1 认证（Authentication）

**认证回答"你是谁"**：验证用户身份的真实性，常见的认证因素：

| 因素类型 | 示例 | 强度 |
|---|---|---|
| 你知道的 | 密码、PIN 码 | 弱（可被猜测/钓鱼） |
| 你拥有的 | 短信验证码、动态令牌、U 盾 | 中 |
| 你是什么 | 指纹、人脸、声纹 | 中高 |
| 行为特征 | 打字节奏、鼠标轨迹 | 辅助 |
| 位置/设备 | 可信设备、IP 白名单 | 辅助 |

**多因素认证（MFA）**：组合 2 种以上独立因素，是防爆破、防账号接管最有效的手段之一。

### 1.2 授权（Authorization）

**授权回答"你能干什么"**：在确认身份后，决定其可访问的资源与可执行的操作。

```text
用户登录成功（认证通过）
    │
    ▼
访问 /api/order/10001（授权检查）
    │
    ├─ 是本人的订单  → 放行（对象级授权通过）
    └─ 他人的订单    → 403（水平越权被拦截）
```

### 1.3 认证 vs 授权

| 维度 | 认证 | 授权 |
|---|---|---|
| 问题 | 你是谁？ | 你能做什么？ |
| 时机 | 先于授权 | 认证之后 |
| 失败表现 | 401 Unauthorized（实际应为 Unauthenticated） | 403 Forbidden |
| 常见漏洞 | 弱口令、暴力破解、Token 泄露 | 水平/垂直越权、BOLA |
| 常见方案 | 密码、MFA、JWT、OAuth2 | RBAC、ABAC、ACL、CASB |

> 测试要点：认证漏洞测"能不能混进来"，授权漏洞测"进来后能不能越界"。

## 二、认证方式演进与实现原理

### 2.1 Session/Cookie 认证（传统单体应用）

```text
1. 用户提交账号密码 → 服务端校验成功
2. 服务端创建 Session（存内存/Redis），返回 SessionId
3. 客户端将 SessionId 写入 Cookie
4. 后续请求携带 Cookie，服务端比对 Session 是否有效
```

**安全问题**：

- Session 固定（Session Fixation）：登录前就下发 SessionId，攻击者诱导受害者使用其已知的 SessionId；
- 会话劫持：Cookie 被 XSS 窃取（Cookie 未设 `HttpOnly`）或明文传输被截获；
- 服务端状态依赖：分布式/微服务下 Session 需集中存储（Redis），否则需要粘性会话。

**加固**：`HttpOnly`（防 XSS 读取）、`Secure`（仅 HTTPS）、`SameSite`（防 CSRF）、定期轮换 SessionId、设置合理过期时间。

### 2.2 Token 认证（前后端分离/移动端）

```text
1. 用户登录 → 服务端签发一个 Token 返回
2. 客户端将 Token 存本地（LocalStorage/内存），请求头携带
3. 服务端校验 Token 有效性，无状态处理
```

相比 Session：服务端无状态、易扩展、适合跨域与多端。但 Token 存本地有被 XSS 窃取的风险，且签发后难以立即吊销。

### 2.3 JWT（JSON Web Token）

JWT 是 Token 的一种标准化实现，详见第三章。

### 2.4 OAuth2.0 与 OIDC

OAuth2.0 解决"**授权第三方访问**"问题（如"用微信登录某 App"），OIDC 在其上增加身份层（返回 ID Token），详见第四章。

### 2.5 SSO 单点登录

一次登录、多处通行。常见协议：CAS、SAML、OIDC。核心思路：统一认证中心（IdP）签发凭证，各业务系统（SP）信任并校验。

```text
用户访问业务A → 跳转统一认证中心登录 → 登录成功
    → 携带凭证访问业务A（免登）
    → 访问业务B（凭同一凭证，免登）
```

## 三、JWT 深入剖析

### 3.1 JWT 结构

JWT 由三部分组成：`Header.Payload.Signature`，各部分以 `.` 分隔，均为 Base64Url 编码：

```text
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6InRvbSIsImlhdCI6MTUxNjIzOTAyMn0
.5Y2wH_0qE4e4Vh6vHzjTzF3rQmUw9KpWc0oV6w7X1Y
```

解码后：

```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

```json
{
  "sub": "1234567890",
  "name": "tom",
  "role": "admin",
  "iat": 1516239022,
  "exp": 1516242622
}
```

| 字段 | 含义 |
|---|---|
| `alg` | 签名算法（HS256/RS256/ES256） |
| `sub` | 主题，一般为用户 ID |
| `iat` | 签发时间 |
| `exp` | 过期时间 |
| `role` | 业务自定义声明（权限） |

### 3.2 签名算法与安全

- **HS256（对称）**：签发与校验共用同一个密钥（secret），密钥必须足够长且保密；
- **RS256/ES256（非对称）**：私钥签名、公钥验签，公钥可公开，推荐用于多服务之间。

```bash
# 使用 openssl 生成用于 HS256 的强密钥
openssl rand -base64 64

# 使用 openssl 生成 RS256 密钥对
openssl genrsa -out private.pem 2048
openssl rsa -in private.pem -pubout -out public.pem
```

### 3.3 JWT 常见攻击与测试

| 攻击手法 | 原理 | 测试方法 |
|---|---|---|
| `alg=none` | 将算法改为 none，删掉签名，部分实现直接信任 | 构造无签名 JWT 请求 |
| HS256 密钥爆破 | 密钥过短/弱口令，爆破出 secret | 用 jwt_tool、hashcat 爆破已知 Token |
| RS256→HS256 混淆 | 服务端按 Header 里的 alg 选择算法，用公钥当 HS256 密钥验签 | 用服务端公钥构造 HS256 签名的 Token |
| 过期校验缺失 | 不校验 `exp`，旧 Token 永不过期 | 使用一个已过期的 Token 请求 |
| 篡改 payload 未验签 | 服务端只解码不验签 | 修改 payload 中 `role: admin` 后请求 |
| kid 注入 | `kid`（Key ID）参数被用于拼接路径，可指向任意文件 | 修改 kid 为 `/dev/null` 等 |
| Token 存储不当 | 放 LocalStorage 被 XSS 窃取 | 注入 XSS 读取 localStorage |

**测试工具**：`jwt_tool`（python 编写，功能全面）、`jwt.io`（在线解码）。

```bash
# jwt_tool 爆破 HS256 密钥
python3 jwt_tool.py <JWT> -C -d /usr/share/wordlists/rockyou.txt

# jwt_tool 伪造 alg=none
python3 jwt_tool.py <JWT> -X a
```

### 3.4 JWT 安全最佳实践

- 服务端**校验签名、校验 `exp`、校验 `aud/iss`**；
- 拒绝 `alg=none`，显式白名单允许的算法；
- HS256 密钥 ≥ 256 bit 随机生成，纳入密钥管理（Vault/KMS）；
- 敏感接口加**签名+加密**双层（JWE）或避免在 payload 放敏感信息；
- 客户端 Token 存内存/HttpOnly Cookie，**不要放 LocalStorage**；
- 支持**黑名单/版本号**实现注销。

## 四、OAuth2.0 与 OIDC

### 4.1 核心角色与授权模式

| 角色 | 说明 |
|---|---|
| 资源所有者（User） | 数据的拥有者，通常是最终用户 |
| 客户端（Client） | 需要访问资源的第三方应用 |
| 授权服务器（Auth Server） | 负责认证并颁发授权码/Token |
| 资源服务器（Resource Server） | 存储资源，校验 Token 后放行 |

四种授权模式：授权码模式（最常用）、隐式模式（已不推荐）、密码模式、客户端凭证模式。

### 4.2 授权码模式流程（+ PKCE）

```text
1. 用户访问客户端 → 跳转授权服务器，携带 client_id、redirect_uri、state
2. 用户在授权服务器登录并授权
3. 授权服务器 302 回跳 redirect_uri?code=xxx&state=xxx
4. 客户端用 code + client_secret 换 access_token
5. 客户端携带 access_token 访问资源服务器获取用户信息
```

> **PKCE（Proof Key for Code Exchange）**：针对无法安全保存 client_secret 的客户端（SPA/移动端），用 `code_verifier` + `code_challenge` 防止授权码被截获后冒用。

### 4.3 OAuth2 常见漏洞与测试

| 漏洞 | 原理 | 测试方法 |
|---|---|---|
| redirect_uri 校验不严 | 未严格校验回跳地址，可劫持授权码 | 修改 redirect_uri 为攻击者域名 |
| state 缺失/固定 | 无 CSRF 防护，攻击者诱导受害者完成授权后回跳 | 检查 state 是否随机且校验 |
| 授权码复用 | 授权码未做一次性使用限制 | 重复使用同一 code |
| client_secret 泄露 | 前端/公开仓库泄露密钥 | 检查源码与请求参数 |
| Token 作用域过大 | scope 包含多余权限 | 检查默认 scope |

### 4.4 OAuth 安全最佳实践

- **严格白名单校验 redirect_uri**（精确匹配，拒绝前缀匹配）；
- 强制使用随机 `state` 并服务端校验，防 CSRF；
- 授权码一次性使用、短时效；访问 Token 短时效 + refresh token 可吊销；
- SPA/移动端必须使用 PKCE；
- 最小化 scope，遵循最小权限原则。

## 五、授权模型与越权

### 5.1 常见授权模型

| 模型 | 全称 | 核心思想 | 适用 |
|---|---|---|---|
| RBAC | 基于角色的访问控制 | 用户→角色→权限，角色是中间层 | 后台管理系统 |
| ABAC | 基于属性的访问控制 | 用户/资源/环境属性动态判定（如"本部门"） | 复杂组织场景 |
| ACL | 访问控制列表 | 直接为对象维护"谁能访问"的列表 | 文件系统、资源级控制 |
| 对象级授权 | 数据归属校验 | 每个资源校验 owner/租户 | 所有含私有数据的接口 |

### 5.2 水平越权（Horizontal Privilege Escalation）

**同级别用户之间的越权**，通过修改资源 ID 访问他人数据：

```http
GET /api/order/10002        # 本应是 /api/order/10001（自己的）
Authorization: Bearer <用户A的Token>
```

典型成因：

- 只校验登录态，未校验资源归属；
- 数据按 `userId` 过滤缺失或过滤条件可被绕过（如 `userId` 从请求参数读取）；
- 分页/导出接口未按用户隔离。

### 5.3 垂直越权（Vertical Privilege Escalation）

**低权限用户调用高权限功能**：

```http
# 普通用户直接调用管理员接口
GET /api/admin/users
GET /api/admin/deleteUser?id=123
```

典型成因：

- 前端隐藏入口，后端未校验角色；
- 方法级权限注解缺失或配置错误；
- 通过修改请求头（如 `X-Forwarded-For`、`role` 参数）伪造身份。

### 5.4 越权测试方法（重点）

```text
1. 注册两个普通账号 A、B 和一个管理员账号 C
2. 抓取 A 的正常请求，用 B 的 Token 重放（水平越权测试）
3. 遍历资源 ID（10001, 10002, 10003…）观察是否返回他人数据
4. 用普通账号 Token 访问管理员接口（垂直越权测试）
5. 修改请求体中的 userId/role/orgId 字段，观察服务端是否信任
6. 关注批量接口（导出、列表、搜索）：是否按用户过滤数据
```

**自动化辅助**：Burp 插件 `Autorize`（一键以低权限 Token 重放所有请求）、`AuthMatrix`。

```bash
# 手动验证水平越权：用 A 的 Token 依次遍历 ID
for id in 10001 10002 10003; do
  curl -s "https://api.example.com/order/$id" \
    -H "Authorization: Bearer <A的Token>"
done
```

## 六、认证授权漏洞与测试实战

### 6.1 弱口令与暴力破解

- 弱口令字典：`admin/123456`、`test/test123`、`root/root`；
- 爆破测试：Burp Intruder 对登录接口跑字典；
- 观察服务端是否有失败次数限制、锁定策略、验证码、MFA。

```bash
# hydra 对登录接口爆破（测试环境授权下使用）
hydra -l admin -P /usr/share/wordlists/rockyou.txt \
  https-post-form://target/login:username=^USER^&password=^PASS^:F=login failed
```

### 6.2 验证码缺陷

| 缺陷 | 说明 |
|---|---|
| 验证码不刷新 | 同一验证码可无限重试 |
| 验证码可复用 | 图形验证码多次请求仍有效 |
| 验证码可绕过 | 删除验证码参数/字段后直接放行 |
| 逻辑验证码 | 验证码存请求参数或前端可计算 |
| 短信轰炸 | 短信接口无频控，可批量刷 |

### 6.3 Token 与会话管理测试

- Token 过期时间是否合理（过长=风险，过短=体验差）；
- 注销后 Token 是否立即失效（服务端黑名单）；
- 修改密码/登录后旧会话是否失效；
- 同一账号多端登录是否有策略；
- Token 是否随机（能否预测）、是否含敏感信息。

### 6.4 认证授权测试用例清单

| 编号 | 测试点 | 操作 | 期望 |
|---|---|---|---|
| AUTH-01 | 未认证访问 | 不带 Token 访问 | 401 |
| AUTH-02 | Token 过期 | 过期 Token 访问 | 401 |
| AUTH-03 | 篡改 Token | 修改 payload/签名 | 401 |
| AUTH-04 | alg 混淆 | alg=none / RS→HS | 401 |
| AUTH-05 | 弱口令 | 常见口令尝试 | 被锁定/验证码 |
| AUTH-06 | 爆破防护 | 连续错误密码 N 次 | 触发锁定/频控 |
| AUTH-07 | 验证码绕过 | 删除验证码参数 | 不通过 |
| AUTH-08 | 注销失效 | 注销后用原 Token | 401 |
| AUTH-09 | 会话固定 | 登录前后 SessionId 是否变化 | 变化 |
| AUTH-10 | 水平越权 | A 的 Token 访问 B 的资源 | 403 |
| AUTH-11 | 垂直越权 | 普通用户调用管理员接口 | 403 |
| AUTH-12 | 角色篡改 | 修改 role 字段 | 服务端以服务端数据为准 |
| AUTH-13 | Cookie 属性 | HttpOnly/Secure/SameSite | 均已设置 |
| AUTH-14 | OAuth 回调 | 修改 redirect_uri/state | 被拒绝 |

## 七、防护最佳实践

1. **认证层**：强制强密码策略 + MFA；登录接口限流防爆破；验证码一次性使用；Token 随机、短时效、可吊销；
2. **授权层**：**服务端对每个资源做对象级归属校验**（owner/租户隔离）；方法级权限控制；禁止信任客户端传入的 userId/role；
3. **JWT**：严格验签、校验 exp/aud/iss、拒绝 alg=none、密钥纳入 KMS 管理；
4. **OAuth**：严格 redirect_uri 白名单、强制 state、SPA 使用 PKCE、最小 scope；
5. **会话**：HttpOnly + Secure + SameSite Cookie；登录/改密后轮换会话；
6. **日志审计**：登录、授权失败、越权尝试都要记录，便于追溯与告警。

## 八、总结

- **认证 ≠ 授权**：这是所有越权漏洞的根源，测试时务必把两者分开验证；
- 认证方案演进：Session → Token → JWT → OAuth2/OIDC，每种都有对应的安全坑（会话劫持、alg 混淆、redirect_uri 绕过、state CSRF）；
- **越权（尤其对象级授权缺失）是测试重点**：两个账号互换 ID 是最简单有效的验证手段；
- 安全测试四件套：登录接口爆破、Token 攻击、越权遍历、会话管理检查，配合 Burp Autorize 可自动化覆盖；
- 安全是默认拒绝：**最小权限 + 服务端数据为准 + 每资源校验归属**，即可堵住绝大多数认证授权漏洞。

> 延伸阅读：《接口安全》提供接口安全测试用例清单；《注入攻击》详解 SQL/XSS/越权；《数据泄露》详解敏感信息保护。
