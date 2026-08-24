import { defineUserConfig } from "vuepress";
import { viteBundler } from "@vuepress/bundler-vite";

import theme from "./theme.js";

export default defineUserConfig({
  base: "/",

  locales: {
    "/": {
      lang: "zh-CN",
      title: "",
      description: "vuepress-theme-hope 的博客演示",
    },
    "/en/": {
      lang: "en-US",
      title: "Blog Demo",
      description: "A blog demo for vuepress-theme-hope",
    },
  },

  // 项目位于 FUSE(fuseblk) 挂载文件系统上，fs.watch(inotify) 会触发
  // EMFILE: too many open files，因此强制 Vite 使用轮询模式监听文件
  bundler: viteBundler({
    viteOptions: {
      server: {
        watch: {
          usePolling: true,
          interval: 500,
        },
      },
    },
  }),

  theme,

  // Enable it with pwa
  // shouldPrefetch: false,
});
