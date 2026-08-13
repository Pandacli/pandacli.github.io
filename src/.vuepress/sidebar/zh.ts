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
          text: "第2章 AI与机器学习基础",
          link: "02_第2章_AI与机器学习基础",
        },
        {
          text: "第3章 Python编程基础（测试人员必备）",
          link: "03_第3章_Python编程基础（测试人员必备）",
        },
        {
          text: "第4章 AI测试核心概念与方法论",
          link: "04_第4章_AI测试核心概念与方法论",
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
          text: "第5章 数据质量测试",
          link: "05_第5章_数据质量测试",
        },
        {
          text: "第6章 模型评估与测试",
          link: "06_第6章_模型评估与测试",
        },
        {
          text: "第7章 大语言模型(LLM)测试基础",
          link: "07_第7章_大语言模型(LLM)测试基础",
        },
        {
          text: "第8章 Prompt Engineering测试",
          link: "08_第8章_Prompt Engineering测试",
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
          text: "第9章 AI Agent测试",
          link: "09_第9章_AI Agent测试",
        },
        {
          text: "第10章 RAG系统测试",
          link: "10_第10章_RAG系统测试",
        },
        {
          text: "第11章 AI辅助测试工具",
          link: "11_第11章_AI辅助测试工具",
        },
        {
          text: "第12章 MLOps与持续测试",
          link: "12_第12章_MLOps与持续测试",
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
          text: "第13章 AI安全测试",
          link: "13_第13章_AI安全测试",
        },
        {
          text: "第14章 AI系统性能测试",
          link: "14_第14章_AI系统性能测试",
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
          text: "第15章 AI测试框架与工具链",
          link: "15_第15章_AI测试框架与工具链",
        },
        {
          text: "第16章 AI测试用例设计方法",
          link: "16_第16章_AI测试用例设计方法",
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
          text: "第17章 测试人员必备的统计学基础",
          link: "17_第17章_测试人员必备的统计学基础",
        },
        {
          text: "第18章 AI测试实战案例",
          link: "18_第18章_AI测试实战案例",
        },
        {
          text: "Easy Dataset × LLaMA Factory 让大模型高效学习领域知识",
          link: "Easy Dataset × LLaMA Factory实战",
        },
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
      ],
    },
    {
      text: "面试与职业发展",
      icon: "briefcase",
      prefix: "interview/",
      collapsible: true,
      children: [
        {
          text: "第19章 AI测试面试准备",
          link: "19_第19章_AI测试面试准备",
        },
        {
          text: "第20章 转型路线图与职业发展",
          link: "20_第20章_转型路线图与职业发展",
        },
      ],
    },
  ],
});
