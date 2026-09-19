/** 软件测试基础（/test/）侧边栏 */
export const testSidebar = [
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
];
