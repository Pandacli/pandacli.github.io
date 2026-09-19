/** Python 编程（/python/）侧边栏 */
export const pythonSidebar = [
  {
    text: "Python 编程导学",
    icon: "fa6-brands:python",
    link: "",
  },
  {
    text: "Python 基础",
    icon: "book",
    prefix: "python_basic/",
    collapsible: true,
    children: [
      {
        text: "解释器",
        link: "interpreter",
      },
      {
        text: "Python 高阶数据结构",
        link: "datastruct",
      },
      {
        text: "面向对象编程",
        link: "objectOriented",
      },
      {
        text: "Python 函数",
        link: "function",
      },
    ],
  },
  {
    text: "算法与数据结构",
    icon: "code",
    link: "algorithm/",
  },
  {
    text: "数据分析与科学计算",
    icon: "chart-pie",
    link: "data_science/",
  },
  {
    text: "机器学习",
    icon: "robot",
    link: "machine_learning/",
  },
  {
    text: "深度学习",
    icon: "brain",
    link: "deepmind_learning/",
  },
  {
    text: "OpenCV 图像处理",
    icon: "eye",
    link: "open-cv/",
  },
];
