const path = require('path')

module.exports = {
    chainWebpack (config) {
        // 覆盖主题首页组件，在 hero 区域显示一言格言
        // 注意：`@theme` 是一个前缀 alias（webpack AliasPlugin 按插入顺序做前缀匹配），
        // 而 reco 主题的 HomeBlog 位于子目录 components/HomeBlog/index.vue，
        // 没有独立的 alias，全靠 `@theme` 前缀命中。因此必须把我们的精确 alias
        // 排到 `@theme` 之前，否则会被前缀匹配抢先命中主题原组件。
        const themePath = config.resolve.alias.get('@theme')
        config.resolve.alias
            .delete('@theme')
            .set('@theme/components/HomeBlog', path.resolve(__dirname, 'components/HomeBlog.vue'))
            .set('@theme', themePath)
    },
    "title": "AI-Test",
    "description": "AI 模型测评与技术实践",
    "dest": "public",
    "head": [
        ["link", {"rel": "icon", "href": "/favicon.ico"}],
        ["meta", {"name": "viewport", "content": "width=device-width,initial-scale=1,user-scalable=no"}],
        ["link", {"rel": "stylesheet", "href": "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css"}]
    ],
    "theme": "reco",
    "plugins": [
        //粒子网络背景
        ["vuepress-plugin-nest"],
        //彩色飘带
        ["vuepress-plugin-ribbon"],
        //鼠标点击涟漪
        ["vuepress-plugin-cursor-effects"],
        

    ],
    "themeConfig": {
        "type": "blog",
        "logo": "/logo.png",
        "heroImage": "/hero.png",
        "author": "Tommy",
        "authorAvatar": "/headerlogo.jpg",

        "nav": [
            {"text": "首页", "link": "/", "icon": "reco-home"},
            {"text": "生活随笔", "link": "/docs/life/"},
            {
                "text": "AI测试", "icon": "reco-message", "items": [
                    {"text": "Python编程", "link": "/docs/python/"},
                    {"text": "AI与机器学习基础", "link": "/docs/basic/"},
                    {"text": "统计学", "link": "/docs/statistics/"},
                    {"text": "LLM大模型", "link": "/docs/llm/"},
                    {"text": "数据工程", "link": "/docs/data/"},
                    {"text": "MLOps运维", "link": "/docs/mlops/"},
                    {"text": "Ai安全", "link": "/docs/ai_security/"},
                    {"text":"云平台","link": "/docs/cloudy/"},
                    {"text": "训练实战", "link": "/docs/practice/"}
                ]
            },
            {"text": "skills商店", "link": "/docs/skills/"},
            {"text": "关于", "link": "/about.html", "icon": "reco-account"}
        ],

        "sidebar": require('./sidebar'),
        "subSidebar": "auto",

        "blogConfig": {
            "category": {"location": 3, "text": "AI工具库"},
        },

        "valineConfig": {
            "showComment": false
        },

        "search": true,
        "searchMaxSuggestions": 10,

        "friendLink": [
            {
                "title": "vuepress-theme-reco",
                "desc": "A simple and beautiful vuepress Blog & Doc theme.",
                "avatar": "https://vuepress-theme-reco.recoluan.com/icon_vuepress_reco.png",
                "link": "https://vuepress-theme-reco.recoluan.com"
            }
        ],

        "lastUpdated": "Last Updated",
        "startYear": "2017",
        "mode": "auto",
        "modePicker": true
    },
    "markdown": {
        "lineNumbers": true,
        "extractHeaders": ["h1", "h2", "h3"],
        "toc": {"includeLevel": [1, 2, 3]},
        "extendMarkdown": md => {
            md.use(require("markdown-it-texmath"), {
                engine: require("katex"),
                delimiters: "dollars"
            });
        }
    }
}
