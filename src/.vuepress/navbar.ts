import { navbar } from "vuepress-theme-hope";

export const zhNavbar = navbar([
  {
    text: "首页",
    icon: "house",
    link: "/",
  },
  {
    text: "AI测试",
    icon: "laptop-code",
    link: "/ai-test/",
  },
  {
    text: "关于",
    icon: "circle-info",
    link: "/intro.html",
  },
  {
    text: "网站相关",
    icon: "link",
    children: [
      {
        text: "GitHub",
        icon: "fa6-brands:github",
        link: "https://github.com/Pandacli",
      },
      {
        text: "更新历史",
        icon: "clock",
        link: "/timeline/",
      },
    ],
  },
]);

export const enNavbar = navbar([
  "/en/",
  "/en/demo/",
  {
    text: "Posts",
    icon: "pen-to-square",
    prefix: "/en/books/",
    children: [
      {
        text: "Apple",
        icon: "pen-to-square",
        prefix: "apple/",
        children: [
          { text: "Apple1", icon: "pen-to-square", link: "1" },
          { text: "Apple2", icon: "pen-to-square", link: "2" },
          "3",
          "4",
        ],
      },
      {
        text: "Banana",
        icon: "pen-to-square",
        prefix: "banana/",
        children: [
          { text: "Banana 1", icon: "pen-to-square", link: "1" },
          { text: "Banana 2", icon: "pen-to-square", link: "2" },
          "3",
          "4",
        ],
      },
      { text: "Cherry", icon: "pen-to-square", link: "cherry" },
      { text: "Dragon Fruit", icon: "pen-to-square", link: "dragonfruit" },
      "tomato",
      "strawberry",
    ],
  },
  {
    text: "V2 Docs",
    icon: "book",
    link: "https://theme-hope.vuejs.press/",
  },
]);

export default zhNavbar;
