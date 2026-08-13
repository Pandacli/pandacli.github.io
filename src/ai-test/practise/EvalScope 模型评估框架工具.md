---
title: EvalScope 模型评估框架工具
date: 2026-06-02
tag:
- 测评框架
category:
 - AI测评
---

# 前言

EvalScope 是一个为大模型设计的评测框架，旨在提供简单易用、功能全面的评测流程。本指南将引导您完成从简单到复杂的各类评测任务，帮助您快速上手。

[EvalScope](https://github.com/modelscope/evalscope) 是魔搭社区倾力打造的模型评测与性能基准测试框架，为您的模型评估需求提供一站式解决方案。

- 🧠 大语言模型
- 🎨 多模态模型
- 🔍 Embedding 模型
- 🏆 Reranker 模型
- 🖼️ CLIP 模型
- 🎭 AIGC模型（图生文/视频）

EvalScope 不仅仅是一个评测工具，它是您模型优化之旅的得力助手：

- 🏅 内置多个业界认可的测试基准和评测指标：MMLU、CMMLU、C-Eval、GSM8K 等。
- 📊 模型推理性能压测：确保您的模型在实际应用中表现出色。
- 🚀 与 [ms-swift](https://github.com/modelscope/ms-swift) 训练框架无缝集成，一键发起评测，为您的模型开发提供从训练到评估的全链路支持。

![...](../assets/pictures/evalscope/EvalScope_001.png)

## 1. 安装

### 方式1：使用 pip 安装（推荐）

我们推荐使用 conda 来管理环境，并使用 pip 安装依赖。

1. 创建 conda 环境（可选）

```bash
# 建议使用 python 3.10
conda create -n evalscope python=3.10
conda activate evalscope
```

2. 安装 EvalScope

```bash
pip install evalscope
```

3. 验证安装

```bash
evalscope --version
```

4. 安装额外功能（可选）

根据您的需求，安装相应的功能扩展：

![...](../assets/pictures/evalscope/EvalScope_002.png)

### 方式2：使用源码安装

1. 下载源码

```bash
git clone https://github.com/modelscope/evalscope.git
```

2. 安装依赖

```bash
cd evalscope/
pip install -e .
```

3. 安装额外依赖（可选）


- 推理性能压测
 > pip install '.[pref]'
- 可视化服务
  > pip install '.[service]'
- AIGC评测
  > pip install '.[aigc]'
- OpenCompass后端
  > pip install '.[compass]'
- VLMEvalKit后端
  > pip install '.[vlmeval]'
- RAG评测
  > pip install '.[rag]'
- 全部安装
  > pip install '.[all]'
## 2. 快速上手

### 2.1 使用命令行评估

```bash
evalscope eval \
--model Qwen/Qwen2.5-0.5B-Instruct \
--datasets gsm8k arc \
--limit 5

# 评测自定义模型
evalscope eval --model /path/to/your/model --datasets gsm8k arc --limit 5
```

**基本参数说明：**

- `--model`: 指定模型的 ModelScope ID (如 `Qwen/Qwen2.5-0.5B-Instruct`) 或本地路径。
- `--datasets`: 指定一个或多个数据集名称，以空格分隔。支持的数据集请参考[数据集列表](https://evalscope.readthedocs.io/zh-cn/latest/get_started/supported_dataset/index.html)。
- `--limit`: 每个数据集最多评测的样本数，便于快速验证。若不设置，则评测全量数据。

![...](../assets/pictures/evalscope/EvalScope_004.png)

### 2.2 使用 Python 脚本代码

通过调用 `run_task` 函数并传入 `TaskConfig` 配置，可以在 Python 环境中运行评测。配置可以是：

- `TaskConfig` 对象

```python
from evalscope.run import run_task
from evalscope.config import TaskConfig

task_cfg = TaskConfig(model='Qwen/Qwen2.5-0.5B-Instruct', datasets=['gsm8k', 'arc'], limit=5)
run_task(task_cfg)
```

- Python 字典

```python
from evalscope.run import run_task

task_cfg = {
    'model': 'Qwen/Qwen2.5-0.5B-Instruct',
    'datasets': ['gsm8k', 'arc'],
    'limit': 5
}
run_task(task_cfg=task_cfg)
```

- YAML/JSON 文件路径

```yaml
# config.yaml
model: Qwen/Qwen2.5-0.5B-Instruct
datasets:
  - gsm8k
  - arc
limit: 5
```

```python
from evalscope.run import run_task
run_task(task_cfg="config.yaml")
```

### 查看评测结果

评测完成后，终端会打印出如下格式的得分报告：

![...](../assets/pictures/evalscope/EvalScope_005.png)

> **小技巧**：您还可以通过可视化工具来深入分析评测结果。
> 详情参考：[评测结果可视化](https://evalscope.readthedocs.io/zh-cn/latest/get_started/visualization.html)

## 3. 可视化

```bash
# 安装可视化服务
pip install 'evalscope[service]'

# 启动可视化服务
evalscope service

# 服务启动后，访问 http://127.0.0.1:9000 即可打开可视化界面。

# 详情参考：https://evalscope.readthedocs.io/zh-cn/latest/get_started/visualization.html
```
