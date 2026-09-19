import { sidebar } from "vuepress-theme-hope";

import { aiSidebar } from "./ai.js";
import { aiTestSidebar } from "./ai-test.js";
import { backendTestSidebar } from "./backend-test.js";
import { booksSidebar } from "./books.js";
import { frontendTestSidebar } from "./frontend-test.js";
import { pythonSidebar } from "./python.js";
import { testSidebar } from "./test.js";

export * from "./ai.js";
export * from "./ai-test.js";
export * from "./backend-test.js";
export * from "./books.js";
export * from "./frontend-test.js";
export * from "./python.js";
export * from "./test.js";

/**
 * 中文站侧边栏总入口
 *
 * 每个 navbar 对应一个独立文件（ai.ts / ai-test.ts / backend-test.ts ...），
 * 便于按栏目维护，避免在单个大文件里滚动查找。
 */
export const zhSidebar = sidebar({
  "/ai-test/": aiTestSidebar,
  "/ai/": aiSidebar,
  "/test/": testSidebar,
  "/frontend-test/": frontendTestSidebar,
  "/backend-test/": backendTestSidebar,
  "/books/": booksSidebar,
  "/python/": pythonSidebar,
});
