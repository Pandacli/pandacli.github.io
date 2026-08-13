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
      icon: "briefcase",
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
});
