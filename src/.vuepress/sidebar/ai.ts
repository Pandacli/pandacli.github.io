/** AI 应用开发知识体系（/ai/）侧边栏 */
export const aiSidebar = [
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
];
