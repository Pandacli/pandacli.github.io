---
breadcrumbExclude: true
---

# 第16章 AI测试用例设计方法

AI测试用例设计既需要传统测试设计方法的基础，又需要针对AI系统特点的新方法。本章将两者融合，给出实用的
设计方法论。

## 16.1 AI测试用例设计原则

1. 覆盖多维度
不只测准确性，还要测安全性、公平性、鲁棒性、性能
2. 统计性思维
单个用例的通过/失败意义有限，关注整体通过率和指标分布
3. 数据驱动
用例尽量参数化，支持大规模数据集驱动执行
4. 分层设计
从数据层、模型层、系统层、业务层分别设计测试
5. 持续演进
随着模型迭代不断补充新的测试用例，尤其是失败案例

## 16.2 基于场景的测试设计

场景法在AI测试中的应用更加重要。需要覆盖正常场景、边界场景、异常场景和对抗场景四类。
| 场景类型 | 设计方法 | 示例(情感分析) |
|---|---|---|
| 正常场景 | 典型输入覆盖常见用法 | 明确正面/负面情感的文本 |
| 边界场景 | 极端长度/特殊格式 | 单字输入/超长文本/空白文本 |
| 歧义场景 | 容易混淆的输入 | 反讽/双关/模糊情感 |
| 对抗场景 | 试图欺骗模型的输入 | 错别字/同义替换/否定句嵌套 |
| 公平性场景 | 不同群体的输入 | 不同性别/种族/地域的表达 |
| 安全场景 | 试图触发不当输出 | 敏感话题/极端表达 |

## 16.3 测试数据集构建

### 16.3.1 Golden Set(黄金测试集)

黄金测试集是一组高质量、人工审核的测试数据，作为模型评估的标准基准。每次模型迭代都必须在黄金测试集上达标。
```python
# golden_set_builder.py
class GoldenSetBuilder:
  def __init__(self):
    self.test_cases = []

  def add_case(self, input_text, expected_output,
            category, difficulty, tags=None):
    self.test_cases.append({
         'input': input_text,
         'expected': expected_output,
         'category': category,
         'difficulty': difficulty,
         'tags': tags or [],
         'reviewed': True,
         'reviewer': 'human',
    })

  def validate_coverage(self):
```

'''验证测试集覆盖度'''
```python
    categories = set(c['category'] for c in self.test_cases)
    difficulties = set(c['difficulty'] for c in self.test_cases)
    print(f'类别覆盖: {categories}')
    print(f'难度覆盖: {difficulties}')
    print(f'总用例数: {len(self.test_cases)}')
```

### 16.3.2 使用LLM辅助生成测试数据

```python
def generate_test_dataset(task_description, categories,
                     n_per_category=20):
```

'''使用LLM生成测试数据集'''
```python
      dataset = []
      for category in categories:
        prompt = f'''请为以下任务生成{n_per_category}条测试数据:
```

任务: {task_description}
类别: {category}
要求:
- 覆盖简单/中等/困难不同难度
- 包含边界情况
- 包含容易混淆的案例
- 每条包含: input, expected_output, difficulty
- 以JSON数组格式输出
'''
```python
        result = llm.generate(prompt)
        cases = json.loads(result)
        for case in cases:
           case['category'] = category
           case['source'] = 'llm_generated'
        dataset.extend(cases)

      # 重要: LLM生成的数据需要人工审核!
      print(f'生成{len(dataset)}条, 请进行人工审核')
      return dataset
```

## 16.4 测试用例管理

AI测试用例通常以数据集形式管理，而非传统的Excel/用例管理工具。推荐使用以下结构管理：
```python
# 测试用例目录结构
# tests/
# golden_set/
#       sentiment_analysis.jsonl # 情感分析基准集
#       qa_factual.jsonl        # 事实问答基准集
#       safety_prompts.jsonl        # 安全测试集
# adversarial/
#       text_perturbation.jsonl # 文本扰动测试
#       prompt_injection.jsonl      # 提示注入测试
# regression/
#       known_failures.jsonl     # 已知失败案例
#       customer_issues.jsonl       # 客户反馈问题
# configs/
#       evaluation_config.yaml      # 评估配置
#       thresholds.yaml          # 质量阈值
```
