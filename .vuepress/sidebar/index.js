// 侧边栏总入口
const basic = require('./ai-trainer');
const practice = require('./practice');
const skills = require('./skills');
module.exports = {
  "/docs/skills/": skills,
  "/docs/basic/": basic,
  "/docs/practice/": practice
};
