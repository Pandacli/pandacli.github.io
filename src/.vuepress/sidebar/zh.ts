import { sidebar } from "vuepress-theme-hope";

export const zhSidebar = sidebar({
  "/ai-test/": [
    {
      text: "入门导学",
      icon: "lightbulb",
      link: "",
    },
    {
      text: "基础理论",
      icon: "book",
      prefix: "basic/",
      collapsible: true,
      children: [
        {
          text: "AI与机器学习基础",
          link: "AI与机器学习基础",
        },
        {
          text: "Python编程基础（测试人员必备）",
          link: "Python编程基础（测试人员必备）",
        },
        {
          text: "AI测试核心概念与方法论",
          link: "AI测试核心概念与方法论",
        },
        {
          text: "探秘AI大脑：一个语言模型的文件包里到底有什么？",
          link: "探秘AI大脑：一个语言模型的文件包里到底有什么？",
        },
      ],
    },
    {
      text: "核心测试",
      icon: "flask",
      prefix: "core/",
      collapsible: true,
      children: [
        {
          text: "数据质量测试",
          link: "数据质量测试",
        },
        {
          text: "模型评估与测试",
          link: "模型评估与测试",
        },
        {
          text: "大语言模型(LLM)测试基础",
          link: "大语言模型(LLM)测试基础",
        },
        {
          text: "Prompt Engineering测试",
          link: "Prompt Engineering测试",
        },
      ],
    },
    {
      text: "进阶测试",
      icon: "rocket",
      prefix: "advanced/",
      collapsible: true,
      children: [
        {
          text: "AI Agent测试",
          link: "AI Agent测试",
        },
        {
          text: "RAG系统测试",
          link: "RAG系统测试",
        },
        {
          text: "AI辅助测试工具",
          link: "AI辅助测试工具",
        },
        {
          text: "MLOps与持续测试",
          link: "MLOps与持续测试",
        },
      ],
    },
    {
      text: "安全与性能",
      icon: "shield-halved",
      prefix: "safe_performance/",
      collapsible: true,
      children: [
        {
          text: "AI安全测试",
          link: "AI安全测试",
        },
        {
          text: "AI系统性能测试",
          link: "AI系统性能测试",
        },
      ],
    },
    {
      text: "测试设计",
      icon: "pen-ruler",
      prefix: "system_design/",
      collapsible: true,
      children: [
        {
          text: "AI测试框架与工具链",
          link: "AI测试框架与工具链",
        },
        {
          text: "AI测试用例设计方法",
          link: "AI测试用例设计方法",
        },
      ],
    },
    {
      text: "实战演练",
      icon: "code",
      prefix: "practise/",
      collapsible: true,
      children: [
        {
          text: "测试人员必备的统计学基础",
          link: "测试人员必备的统计学基础",
        },
        {
          text: "AI测试实战案例",
          link: "AI测试实战案例",
        }
      ],
    },
    {
      text: "面试与职业发展",
      icon: "briefcase",
      prefix: "interview/",
      collapsible: true,
      children: [
        {
          text: "AI测试面试准备",
          link: "AI测试面试准备",
        },
        {
          text: "转型路线图与职业发展",
          link: "转型路线图与职业发展",
        },
      ],
    },
    {
      text: "开源工具",
      icon: "toolbox",
      prefix: "opensource/",
      collapsible: true,
      children: [
        {
          text: "EasyData数据集工具",
          link: "EasyData开源数据集工具",
        },
        {
          text: "EvalScope 模型评估框架工具",
          link: "EvalScope 模型评估框架工具",
        },
        {
          text: "LLaMA-Factory 微调训练使用指南",
          link: "LLaMA-Factory 微调训练使用指南",
        },
        {
          text: "Easy Dataset × LLaMA Factory实战",
          link: "Easy Dataset × LLaMA Factory实战",
        }
      ],
    },
  ],
  "/ai/": [
    {
      text: "AI 应用开发知识体系",
      icon: "house",
      link: "",
    },
    {
      text: "AI 核心概念总览",
      icon: "brain",
      link: "ai-core-concepts",
    },
    {
      text: "大模型基础",
      icon: "book",
      prefix: "llm-basis/",
      collapsible: true,
      children: [
        {
          text: "LLM 运行机制",
          link: "llm-operation-mechanism",
        },
        {
          text: "大模型 API 调用工程实践",
          link: "llm-api-engineering",
        },
        {
          text: "大模型结构化输出详解",
          link: "structured-output-function-calling",
        },
        {
          text: "AI 应用评测体系",
          link: "llm-evaluation",
        },
      ],
    },
    {
      text: "AI Agent",
      icon: "robot",
      prefix: "agent/",
      collapsible: true,
      children: [
        {
          text: "AI Agent 核心概念",
          link: "agent-basis",
        },
        {
          text: "AI Agent 记忆系统",
          link: "agent-memory",
        },
        {
          text: "大模型提示词工程",
          link: "prompt-engineering",
        },
        {
          text: "上下文工程",
          link: "context-engineering",
        },
        {
          text: "万字拆解 MCP 协议",
          link: "mcp",
        },
        {
          text: "万字详解 Agent Skills",
          link: "skills",
        },
        {
          text: "Harness Engineering",
          link: "harness-engineering",
        },
        {
          text: "AI 工作流：Workflow、Graph 与 Loop",
          link: "workflow-graph-loop",
        },
        {
          text: "Loop Engineering",
          link: "loop-engineering",
        },
      ],
    },
    {
      text: "RAG 检索增强生成",
      icon: "magnifying-glass",
      prefix: "rag/",
      collapsible: true,
      children: [
        {
          text: "RAG 基础概念",
          link: "rag-basis",
        },
        {
          text: "RAG 文档处理与切分策略",
          link: "rag-document-processing",
        },
        {
          text: "RAG 向量索引与向量数据库",
          link: "rag-vector-store",
        },
        {
          text: "RAG 检索优化",
          link: "rag-optimization",
        },
        {
          text: "GraphRAG",
          link: "graphrag",
        },
        {
          text: "RAG 知识库文档更新策略",
          link: "rag-knowledge-update",
        },
      ],
    },
    {
      text: "AI 系统设计",
      icon: "diagram-project",
      prefix: "system-design/",
      collapsible: true,
      children: [
        {
          text: "AI 应用系统设计",
          link: "ai-application-architecture",
        },
        {
          text: "大模型网关详解",
          link: "llm-gateway",
        },
        {
          text: "AI 语音技术详解",
          link: "ai-voice",
        },
      ],
    },
    {
      text: "面试题",
      icon: "comments",
      prefix: "interview-questions/",
      collapsible: true,
      children: [
        {
          text: "AI 应用开发面试指南",
          link: "ai-interview-guide",
        },
        {
          text: "大模型基础面试题总结",
          link: "llm-interview-questions",
        },
        {
          text: "AI Agent 面试题总结",
          link: "agent-interview-questions",
        },
        {
          text: "RAG 面试题总结",
          link: "rag-interview-questions",
        },
        {
          text: "AI 系统设计面试题总结",
          link: "ai-system-design-interview-questions",
        },
      ],
    },
    {
      text: "Skills 实践",
      icon: "wand-magic-sparkles",
      prefix: "skills/",
      collapsible: true,
      children: [
        {
          text: "如何写好一个 Skill",
          link: "如何写好一个Skill",
        },
      ],
    },
    {
      text: "MCP 集合",
      icon: "plug",
      prefix: "mcps/",
      collapsible: true,
      children: [
        {
          text: "MCP 测试集合",
          link: "mcp集合",
        },
      ],
    },
  ],
  "/test/": [
    {
      text: "软件测试基础导学",
      icon: "vial",
      link: "",
    },
    {
      text: "测试基础",
      icon: "book",
      link: "basic/",
    },
    {
      text: "需求分析",
      icon: "list-check",
      link: "requirement/",
    },
    {
      text: "用例设计",
      icon: "pen-ruler",
      link: "case-design/",
    },
    {
      text: "缺陷管理",
      icon: "bug",
      prefix: "bug/",
      collapsible: true,
      children: [
        {
          text: "缺陷管理导学",
          link: "bug/",
        },
        {
          text: "Java 常见异常与缺陷实战指南",
          link: "bug/java_error_guide",
        },
      ],
    },
  ],
  "/frontend-test/": [
    {
      text: "前端自动化测试导学",
      icon: "mobile-screen-button",
      link: "",
    },
    {
      text: "Android",
      icon: "fa6-brands:android",
      link: "android/",
    },
    {
      text: "HarmonyOS",
      icon: "tablet",
      prefix: "harmony/",
      collapsible: true,
      children: [
        {
          text: "鸿蒙 Hypium 自动化（Python 版本）",
          link: "鸿蒙-Hypium自动化（Python版本）",
        },
      ],
    },
    {
      text: "iOS",
      icon: "fa6-brands:apple",
      link: "ios/",
    },
    {
      text: "Web",
      icon: "globe",
      prefix: "web/",
      collapsible: true,
      children: [
        {
          text: "基于 Playwright + MCP + Allure 的 Web UI 项目",
          link: "基于PlaywrightMCP+python+Allure的Web-ui的项目",
        },
      ],
    },
  ],
  "/backend-test/": [
    {
      text: "后端测试导学",
      icon: "server",
      link: "",
    },
    {
      text: "接口测试",
      icon: "plug",
      prefix: "interface/",
      collapsible: true,
      children: [
        {
          text: "基于 Apifox + MCP + Agents 排查接口性能瓶颈",
          link: "基于Apifox-mcp排查接口性能瓶颈",
        },
        {
          text: "接口自动化框架实战",
          link: "接口自动化框架实战",
        },
      ],
    },
    {
      text: "性能测试",
      icon: "gauge-high",
      prefix: "performance/",
      collapsible: true,
      children: [

        {
          text: "Locust Agent 开发",
          link: "Locust_Agent_开发畅想",
        }
       ,
        {
          text: "JVM 调优",
          icon: "microchip",
          prefix: "jvm/",
          collapsible: true,
          children: [
            {
              text: "JVM 内存结构",
              link: "java-jvm-struct",
            },
            {
              text: "JVM GC 回收基本原理",
              link: "java-jvm-gc",
            },
            {
              text: "线程分析之 Thread Dump",
              link: "java-jvm-thread-dump",
            },
          ],
        },
        {
          text: "MySQL",
          icon: "database",
          prefix: "mysql/",
          collapsible: true,
          children: [],
        },
        {
          text: "Tomcat",
          icon: "server",
          prefix: "tomcat/",
          collapsible: true,
          children: [],
        },
        {
          text: "测试工具",
          icon: "toolbox",
          prefix: "tools/",
          collapsible: true,
          children: [
            {
              text: "Java 问题排查工具",
              link: "jdk_tuning_tools"
            },
            {
              text: "压测工具 Jmeter 指南",
              link: "Jmeter指南",
            },
            {
              text: "基于 AI Skills 的全链路性能测试提效实战指南",
              link: "ai_jmeter_test",
            },
            {
              text: "压测工具 Locust 业务实战",
              link: "Locust_业务实战",
            },
          ],
        },

      ],
    },
    {
      text: "安全测试",
      prefix: "security/",
      icon: "shield-halved",
      collapsible: true,
      children: [
        {
          text: "接口安全",
          link: "interface-security",
        },
        {
          text: "认证授权",
          link: "authentication-authorization",
        },
        {
          text: "注入攻击（SQL / XSS / 越权）",
          link: "injection-attack",
        },
        {
          text: "数据泄露",
          link: "data-leak",
        },
      ]
    },
    {
      text: "单元测试",
      icon: "cube",
      prefix: "unit_testing/",
      collapsible: true,
      children: [
        {
          text: "Jacoco 接入使用说明",
          link: "Jacoco接入使用说明",
        },
      ],
    },
  ],
  "/books/": [
    {
      text: "推荐书籍",
      icon: "book-open",
      link: "",
    },
    {
      text: "高频测试开发面试题",
      icon: "pen-to-square",
      prefix: "interview/",
      collapsible: true,
      children: [
        {
          text: "接口测试",
          link: "接口测试",
        },
        {
          text: "性能测试面试题",
          link: "性能测试面试题",
        },
        {
          text: "测试基础与测试理论",
          link: "测试基础与测试理论",
        },
        {
          text: "测试用例设计与质量",
          link: "测试用例设计与质量",
        },
        {
          text: "编程与算法",
          link: "编程与算法",
        },
        {
          text: "软技能与开放题",
          link: "软技能与开放题",
        },
        
        {
          text: "数据库与中间件",
          link: "数据库与中间件",
        },
        {
          text: "自动化测试",
          link: "自动化测试",
        },
        {
          text: "持续集成与测试平台",
          link: "持续集成与测试平台",
        },
        {
          text: "AI测试",
          link: "AI测试",
        },
        {
          text: "高频测试开发面试题汇总",
          link: "tester",
        },
         
      ],
    },
  ],
  "/python/": [
    {
      text: "Python 编程导学",
      icon: "fa6-brands:python",
      link: "",
    },
    {
      text: "Python 基础",
      icon: "book",
      prefix: "python_basic/",
      collapsible: true,
      children: [
        {
          text: "解释器",
          link: "interpreter",
        },
        {
          text: "Python 高阶数据结构",
          link: "datastruct",
        },
        {
          text: "面向对象编程",
          link: "objectOriented",
        },
        {
          text: "Python 函数",
          link: "function",
        },
      ],
    },
    {
      text: "算法与数据结构",
      icon: "code",
      link: "algorithm/",
    },
    {
      text: "数据分析与科学计算",
      icon: "chart-pie",
      link: "data_science/",
    },
    {
      text: "机器学习",
      icon: "robot",
      link: "machine_learning/",
    },
    {
      text: "深度学习",
      icon: "brain",
      link: "deepmind_learning/",
    },
    {
      text: "OpenCV 图像处理",
      icon: "eye",
      link: "open-cv/",
    },
  ],
});
