// 侧边栏总入口
const basic = require('./ai-trainer');
const practice = require('./practice');

module.exports = {
  "/docs/theme-reco/": ["", "theme", "plugin", "api"],
  "/docs/basic/": basic,
  "/docs/practice/": practice
};
