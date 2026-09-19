/** 后端测试（/backend-test/）侧边栏 */
export const backendTestSidebar = [
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
      },
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
            link: "jdk_tuning_tools",
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
    ],
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
];
