/** 前端自动化测试（/frontend-test/）侧边栏 */
export const frontendTestSidebar = [
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
];
