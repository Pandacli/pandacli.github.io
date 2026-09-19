import { defineUserConfig } from "vuepress";
import { viteBundler } from "@vuepress/bundler-vite";

import theme from "./theme.js";
// 注意：DocSearch 已在 theme.ts 的 plugins.docsearch 中配置（含 appId / apiKey / indices）。
// 这里不要再注册 docsearchPlugin()，否则空配置会覆盖 theme 中的配置，导致运行时报 "appId is missing"。
export default defineUserConfig({



  base: "/",

  // dev 服务器固定端口 8090（8080 常被其他本地服务占用）
  port: 8090,
  host: "0.0.0.0",

  // 站点仅保留中文，移除 "/en/" 后导航栏不会再出现中英文切换入口
  locales: {
    "/": {
      lang: "zh-CN",
      title: "",
      description: "tommy的博客演示",
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
