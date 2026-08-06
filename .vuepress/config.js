module.exports = {
  "title": "AI-Test",
  "description": "AI 模型测评与技术实践",
  "dest": "public",
  "head": [
    ["link", { "rel": "icon", "href": "/favicon.ico" }],
    ["meta", { "name": "viewport", "content": "width=device-width,initial-scale=1,user-scalable=no" }]
  ],
  "theme": "reco",
  "plugins": [],
  "themeConfig": {
    "type": "blog",
    "logo": "/logo.png",
    "heroImage": "/hero.png",
    "author": "tommy",
    "authorAvatar": "/headerlogo.jpg",

    "nav": [
      { "text": "首页", "link": "/", "icon": "reco-home" },
      {"text":"人工智能训练师","icon":"reco-message","items":[
        { "text": "基础理论", "link": "/docs/basic/" },
        { "text": "训练实战", "link": "/docs/practice/" }
      ]},

      { "text": "关于", "link": "/about.html", "icon": "reco-account" }
    ],

    "sidebar": require('./sidebar'),
    "subSidebar": "auto",

    "blogConfig": {
      "category": { "location": 2, "text": "文章" },
      //"tag": { "location": 3, "text": "标签" }
    },

    "valineConfig": {
      "serverURLs": "https://walineblog-one.vercel.app",
      "placeholder": "填写邮箱可以收到回复提醒哦",
      "visitor": true,
      "recordIP": true
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
    "toc": { "includeLevel": [1, 2, 3] }
  }
}
