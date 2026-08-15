---
title: 后端测试
description: 覆盖接口测试、性能测试、安全测试、单元测试的后端测试知识体系，包括 Jmeter、Locust、Jacoco、Apifox 等工具的实践与实战案例。
icon: server
category:
  - 后端测试
breadcrumbExclude: true
tag:
  - 后端测试
  - 接口测试
  - 性能测试
  - 安全测试
  - 单元测试
sitemap:
  changefreq: weekly
  priority: 1
head:
  - - meta
    - name: keywords
      content: 后端测试,接口测试,性能测试,安全测试,单元测试,Jmeter,Locust,Jacoco,Apifox
---

# 后端测试

后端测试按测试目标分为 **接口测试、性能测试、安全测试、单元测试** 四个方向，分别回答「功能对不对、扛不扛得住、有没有漏洞、代码单元稳不稳」这几个问题。

- **接口测试**：接口功能、协议、参数的自动化测试，如基于 Apifox、Postman 的接口测试。
- **性能测试**：使用 Jmeter、Locust 等工具进行压测与负载测试，关注 QPS、TPS、响应时间等指标。
- **安全测试**：接口安全、认证授权、注入攻击、数据泄露等安全测试。
- **单元测试**：代码级单元测试与覆盖率统计，如 JUnit、Jacoco。

## 当前内容

### 接口测试

- [基于 Apifox + MCP + Agents 排查接口性能瓶颈](./interface/基于Apifox-mcp排查接口性能瓶颈.md)
- [接口自动化框架实战](./interface/接口自动化框架实战.md)

### 性能测试

- [Jmeter 指南](./performance/Jmeter指南.md)
- [Jmeter 业务场景实战](./performance/Jmeter业务场景实战.md)
- [Locust Agent 开发](performance/Locust_Agent_开发畅想.md)
- [Locust 业务实战](performance/Locust_业务实战.md)
- [云运维性能监控分析](./performance/云运维性能监控分析.md)

### 单元测试

- [Jacoco 接入使用说明](./unit_testing/Jacoco接入使用说明.md)

## 适合谁看

- 负责后端接口、服务端测试的测试工程师。
- 需要做性能压测、容量评估的测试或运维同学。
- 想补齐后端测试技能栈（接口 / 性能 / 安全 / 单测）的测试开发工程师。

> 安全测试模块内容正在持续整理中。
