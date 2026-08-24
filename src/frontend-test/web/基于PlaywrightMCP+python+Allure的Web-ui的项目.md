---
breadcrumbExclude: true
---

# 基于 Playwright MCP + Python + Allure 的 Web UI 自动化项目

## 前言

本文记录一个基于 Playwright + MCP + Python + Allure 的 Web UI 自动化测试项目，以「用户登录 - 后台管理系统」为例，讲解如何借助 MCP 让 AI 智能体驱动 Playwright 完成网页自动化测试。

文章先介绍 Playwright 与 MCP 的技术背景，再讲环境搭建与核心工具集，最后通过一个完整的登录流程实战案例，展示从传统脚本到 AI 驱动测试的演进，并总结快照生成原理、常见问题与适用场景。

## 一、Playwright 与 MCP：技术概述

### 1.1 Playwright 的核心优势

Playwright是微软开源的现代化Web自动化框架，具有以下突出特点：
- 跨浏览器支持：原生支持Chromium（Chrome/Edge）、Firefox和WebKit（Safari）三大浏览器引擎
- 智能等待机制：自动检测元素可交互状态，减少因网络延迟导致的测试失败
- 多语言支持：提供JavaScript/TypeScript、Python、.NET和Java等多种语言API
- 移动端模拟：内置设备描述符，可真实模拟移动设备环境
- 录制功能：通过playwright codegen命令可录制操作并生成脚本

### 1.2 MCP 协议的核心价值

MCP（Model Context Protocol）是Anthropic推出的一个开放协议，它允许AI模型安全、可控地访问外部工具和数据源。它的价值在于：
- 统一交互标准：让LLM能够与浏览器、数据库等外部工具无缝对话
- 动态流程控制：根据实时反馈调整指令，使自动化流程更加灵活
- 安全机制：权限分层设计，防止越权操作敏感资源

### 1.3 协同效应：1+1>2

当Playwright与MCP结合时，创造了全新的自动化测试体验：
- 自然语言驱动：用简单指令替代复杂脚本编写
- 实时交互调试：每一步操作都可即时验证和调整
- 降低技术门槛：非技术人员也能参与自动化流程创建

## 二、环境搭建与配置

### 2.1 基础环境准备

确保你的系统满足以下要求：
- Node.js v16+ 或
- Python 3.10 新增了 match-case 等语法，langchain-mcp 内部使用了这些新特性，因此无法向下兼容；
- 一款支持MCP的客户端（如Cursor、VS Code、Claude Desktop）

### 2.2 安装 Playwright MCP 服务器

方案一：使用npm安装（推荐）

```text
# 全局安装Playwright MCP服务器
npm install -g @playwright/mcp@latest

# 安装Playwright浏览器
npx playwright install
```

方案二：使用Python环境

```text
# 安装Playwright Python包
pip install playwright

# 安装浏览器驱动
playwright install
```

对于国内用户，可以通过镜像加速下载：

```text
set PLAYWRIGHT_DOWNLOAD_HOST=https://npmmirror.com/mirrors/playwright
playwright install
```

### 2.3 配置 MCP 客户端

Cursor配置示例：
在Cursor的MCP设置中添加以下配置：

```text
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```

Claude Desktop配置示例：
找到Claude Desktop的配置目录，创建或编辑claude_desktop_config.json文件：

```text
{
  "mcpServers": {
    "playwright": {
      "command": "node",
      "args": [
        "/path/to/your/anthropic-mcp-playwright/dist/index.js"
      ],
      "env": {
        "BROWSER": "chromium"
      }
    }
  }
}
```

VSCode配置示例：
在VSCode的settings.json中加入：

```text
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"],
      "timeout": 300
    }
  }
}
```

### 2.4 验证安装

创建一个简单的测试脚本来验证环境：

```text
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)
    page = browser.new_page()
    page.goto("https://playwright.dev")
    print("页面标题:", page.title())
    browser.close()
```

运行成功后，将看到浏览器自动打开并显示Playwright官网，控制台输出正确标题。

## 三、核心功能与工具集

Playwright MCP提供了一系列强大的工具函数，让AI可以全面操作浏览器。

### 3.1 浏览器控制工具

- create_browser_session：创建新的浏览器会话，可指定浏览器类型、视口大小等参数
- close_browser_session：关闭当前浏览器会话，释放资源
- navigate_to_url：导航到指定URL

### 3.2 页面交互工具

- click_element：点击页面元素，支持多种定位策略
- fill_input：在输入框中填写文本
- wait_for_selector：等待元素出现或达到特定状态
- double_click_element：双击元素
- select_option：选择下拉选项

### 3.3 数据提取工具

- get_text_content：获取元素文本内容
- get_element_attribute：获取元素属性值
- get_page_title：获取页面标题
- get_page_url：获取当前页面URL
- fetch_json：直接获取JSON数据（特定服务器支持）
- fetch_txt：获取网页纯文本内容

### 3.4 高级功能工具

- take_screenshot：截取页面截图，支持全页截图
- execute_javascript：执行JavaScript代码并返回结果
- generate_test_cases：从需求描述自动生成测试用例

## 四、实战案例：完整的 UI 自动化测试流程

### 4.1 测试场景描述

假设我们需要自动化测试一个网站的登录流程：
- 打开网站登录页面
- 输入用户名和密码
- 点击登录按钮
- 验证登录成功
- 执行登出操作

### 4.2 传统 Playwright 脚本实现

首先，我们看看传统的实现方式：

```text
from playwright.sync_api import sync_playwright

def test_login():
    with sync_playwright() as p:
        # 启动浏览器
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()

        # 导航到登录页面
        page.goto("https://example.com/login")

        # 输入凭据
        page.fill("#username", "testuser")
        page.fill("#password", "password123")

        # 点击登录按钮
        page.click("#login-btn")

        # 验证登录成功
        assert page.is_visible(".dashboard")

        # 执行登出
        page.click("#logout-btn")

        browser.close()
```

### 4.3 基于 MCP 的 AI 驱动实现

现在，使用Playwright MCP实现相同的测试流程。只需要向AI发送自然语言指令：
"请测试后台登录页面（https://admin.example.com/login）的登录功能。使用测试账号'test@example.com'和密码'123456'进行登录，并验证登录成功后是否跳转到了仪表盘页面。"

### 4.4 智能体决策与执行流程

AI智能体接收到指令后，会按照以下流程执行测试：
1. 目标理解：LLM解析用户指令，理解测试需求
2. 导航：调用navigate_to工具打开目标URL
3. 观察：调用get_page_snapshot获取页面快照
4. 决策与操作：分析快照，识别用户名输入框、密码输入框和登录按钮，依次调用fill、click等工具
5. 验证：跳转后再次获取页面快照，分析是否包含成功登录标识
6. 报告：根据验证结果生成最终测试报告

### 4.5 完整代码示例

```text
import asyncio
from langchain.agents import AgentExecutor, create_tool_calling_agent
from langchain.tools.mcp import create_mcp_tool, MCPClientSession, MCPServerParameters
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate

async def run_ui_test():
    # 配置并启动Playwright MCP服务器
    server_params = MCPServerParameters(
        command="playwright-mcp",
        args=["--headless=true"]  # 以无头模式启动浏览器
    )
    session = MCPClientSession(server_params=server_params)

    # 创建MCP工具集
    tools = await create_mcp_tool(session, name="playwright-tools")

    # 构建测试智能体
    llm = ChatOpenAI(model="gpt-4o", temperature=0)

    # 系统提示词指导AI如何测试
    prompt = ChatPromptTemplate.from_messages([
        ("system", "你是一个专业的UI自动化测试工程师，能够使用Playwright工具进行网页测试。请根据用户需求，制定测试计划并执行相应的浏览器操作。"),
        ("human", "{input}")
    ])

    agent = create_tool_calling_agent(llm, tools, prompt)
    agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)

    # 执行测试任务
    async with session:
        result = await agent_executor.ainvoke({
            "input": "请测试后台登录页面（https://admin.example.com/login）的登录功能。使用测试账号'test@example.com'和密码'123456'进行登录，并验证登录成功后是否跳转到了仪表盘页面。"
        })

    print("测试结果:", result["output"])

# 运行测试
asyncio.run(run_ui_test())
```

## 五、核心技术原理：快照生成

快照生成是整个流程的"信息燃料"，其设计直接决定AI对页面的理解程度。一个高效的快照包含多个层次的信息：

```text
<!-- 1. 关键URL和元信息 -->
<base url="https://admin.example.com/login" />

<!-- 2. 基于可访问性树的精简DOM -->
<body>
<main aria-label="登录表单">
    <img src="logo.png" alt="公司Logo" />
    <h1>欢迎回来</h1>
    <form>
      <div role="group">
        <label for="username">用户名</label>
        <input id="username" type="text" aria-required="true"
                value="" placeholder="请输入邮箱或手机号">
      </div>
      <button type="submit" aria-busy="false">登录</button>
    </form>
</main>
</body>
```

快照生成策略解析：
- 过滤与精简：移除所有

```text
# 示例：健壮的元素操作
async def smart_click(page, text):
    selectors = [
        f'button:has-text("{text}")',
        f'div:has-text("{text}")',
        f'//*[contains(text(), "{text}")]'
    ]

    for selector in selectors:
        try:
            element = await page.wait_for_selector(selector, timeout=2000)
            await element.click()
            return True
        except:
            continue

    print(f"找不到文本为 {text} 的元素")
    return False
```

## 六、实战技巧

### 6.1 管理浏览器状态

```text
# 保存认证状态
await context.storage_state(path='auth.json')

# 使用保存的状态
browser = await p.chromium.launch()
context = await browser.new_context(storage_state='auth.json')
```

### 6.2 处理动态内容

```text
# 等待元素出现
await page.wait_for_selector('.dynamic-content', timeout=10000)

# 等待网络空闲
await page.wait_for_load_state('networkidle')
```

## 七、常见问题与解决方案

### 7.1 Windows 环境下启动失败

问题：Windows环境下启动失败怎么办？解决方案：尝试执行npm run build编译TypeScript项目，或使用WSL环境运行。

### 7.2 元素定位超时

问题：元素定位超时怎么办？解决方案：页面可能有动态加载内容，增加等待时间或添加wait_for_selector步骤。

### 7.3 快照的信息丢失与认知偏差

挑战：精简后的快照无法完全还原真实渲染页面，可能导致AI误判。解决方案：
- 结合视觉截图辅助AI理解复杂组件状态
- 对关键交互元素添加详细描述注释

### 7.4 脆弱的元素定位策略

挑战：AI倾向于使用文本内容定位元素，UI文本变更会导致测试失败。解决方案：
- 在关键元素上添加稳定的data-testid属性
- 引导AI优先使用语义角色和关系定位元素

## 八、总结

Playwright与MCP的结合正在重塑UI自动化测试的格局。通过自然语言驱动的测试智能体，团队能够显著降低自动化测试的技术门槛，提升测试效率，并增强测试脚本的适应性。

### 8.1 主要优势

1. 降低测试门槛：自然语言交互使产品经理、手动测试人员等非技术背景人员也能参与自动化测试创建
2. 提升测试效率：AI智能体可快速探索应用，自动生成测试代码，节省模板代码编写时间
3. 增强脚本可靠性：基于可访问性树和语义属性的元素定位，对页面样式变化适应性更好

### 8.2 适用场景

- 探索性测试：快速验证新功能或界面
- 回归测试：核心业务流程的自动化验证
- 数据抓取：从网页中提取结构化数据
- 跨浏览器测试：验证网站在不同浏览器中的兼容性

### 8.3 未来展望

随着MCP生态的日益成熟，Playwright MCP有望成为连接AI与数字世界的核心组件之一。未来的发展方向包括：
- 更智能的自愈能力：当UI发生变化时能够自动调整测试策略
- 人机协同的测试模式：AI负责执行固定流程，人类专家专注于测试策略设计
- 多模态测试能力扩展：结合视觉验证、性能监控和用户体验评估
现在就开始尝试Playwright MCP吧，让你从繁琐的浏览器操作中解放出来，真正让AI为你打工！
