---
breadcrumbExclude: true
---

# 第3章 Python编程基础（测试人员必备）

Python是AI测试的第一语言。如果你之前用的是Java/C#等语言做自动化测试，Python的简洁语法会让你很快上
手。重点掌握数据处理库和测试框架。

## 3.1 Python基础语法速览

以下假设你已有其他语言基础，快速过一遍Python的核心语法差异。

### 3.1.1 变量与数据类型

```python
# Python是动态类型语言，不需要声明变量类型
name = 'AI Tester'        # 字符串
accuracy = 0.95           # 浮点数
num_samples = 10000          # 整数
is_valid = True           # 布尔值
labels = ['cat', 'dog']   # 列表(可变)
config = {'lr': 0.001}    # 字典
scores = (0.9, 0.8, 0.85) # 元组(不可变)
unique_ids = {1, 2, 3}     # 集合(去重)
```

### 3.1.2 条件与循环

```python
# 条件判断
if accuracy > 0.9:
  print('模型达标')
elif accuracy > 0.8:
  print('模型基本达标')
else:
  print('模型需要优化')

# 列表推导式(Pythonic写法)
#类似 java 的流处理 List<Double> passed = scores.stream().filter(s -> s > 0.8).collect(Collectors.toList());
passed = [s for s in scores if s > 0.8]

# 字典推导式
# 
result_map = {k: v > 0.9 for k, v in results.items()}
```

### 3.1.3 函数与类

```python
# 函数定义
def evaluate_model(predictions, labels, threshold=0.5):
   correct = sum(1 for p, l in zip(predictions, labels)
            if (p >= threshold) == l)
   return correct / len(labels)

# 类定义
class TestCase:
   def __init__(self, input_data, expected):
     self.input_data = input_data
     self.expected = expected

   def run(self, model):
     result = model.predict(self.input_data)
     return self.validate(result)

   def validate(self, result):
     return result == self.expected
```

## 3.2 数据处理三件套

### 3.2.1 NumPy — 数值计算基础

NumPy是Python科学计算的基础库，提供高性能的多维数组操作。在AI测试中，你会频繁使用它来处理模型的输入输出
数据。
```python
import numpy as np

# 创建数组
predictions = np.array([0.9, 0.3, 0.8, 0.2, 0.7])
labels = np.array([1, 0, 1, 0, 1])

# 向量化计算(比for循环快100倍)
binary_pred = (predictions > 0.5).astype(int)
accuracy = np.mean(binary_pred == labels)
print(f'准确率: {accuracy:.2%}') # 100.00%

# 统计计算
print(f'均值: {predictions.mean():.3f}')
print(f'标准差: {predictions.std():.3f}')
print(f'最大值: {predictions.max()}')
```

### 3.2.2 Pandas — 数据分析利器

Pandas提供DataFrame数据结构，是数据质量检查和测试数据管理的核心工具。
```python
import pandas as pd

# 读取测试数据
df = pd.read_csv('test_results.csv')

# 数据质量检查
print(df.info())        # 数据类型和缺失值
print(df.describe())       # 统计摘要
print(df.isnull().sum()) # 各列缺失值数量
print(df.duplicated().sum()) # 重复行数

# 按条件筛选
failed = df[df['score'] < 0.8]
print(f'低于阈值的样本数: {len(failed)}')

# 分组统计
group_stats = df.groupby('category')['score'].agg(
    ['mean', 'std', 'min', 'max', 'count']
)
```

### 3.2.3 Matplotlib/Seaborn — 数据可视化

```python
import matplotlib.pyplot as plt
import seaborn as sns

# 模型预测分布直方图
plt.figure(figsize=(10, 6))
plt.hist(predictions, bins=50, alpha=0.7, label='预测分数')
plt.axvline(x=0.5, color='r', linestyle='--', label='阈值')
plt.xlabel('预测分数')
plt.ylabel('频次')
plt.legend()
plt.savefig('prediction_distribution.png')

# 混淆矩阵热力图
from sklearn.metrics import confusion_matrix
cm = confusion_matrix(y_true, y_pred)
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues')
```

## 3.3 AI测试常用Python库

| 库名 | 用途 | AI测试场景 |
|---|---|---|
| scikit-learn | 传统ML算法+评估指标 | 模型指标计算、数据预处理 |
| pytest | 测试框架 | 编写AI测试用例 |
| requests | HTTP请求 | 测试AI模型API接口 |
| openai/anthropic | LLM API客户端 | LLM测试交互 |
| langchain | LLM应用框架 | Agent/RAG系统测试 |
| deepeval | LLM评测框架 | LLM输出质量评估 |
| ragas | RAG评测框架 | RAG系统质量评估 |
| great_expectations | 数据质量框架 | 数据质量自动化检查 |
| locust | 性能测试 | AI推理接口压测 |
| transformers | Hugging Face模型库 | 模型加载与本地评测 |

## 3.4 pytest测试框架实操

pytest是Python生态最流行的测试框架，也是AI测试用例编写的首选。
```python
# test_model_api.py
import pytest
import requests

BASE_URL = 'http://localhost:8000/api/v1'

class TestModelAPI:
  def test_predict_returns_200(self):
       resp = requests.post(
           f'{BASE_URL}/predict',
           json={'text': '这是一条测试数据'}
       )
       assert resp.status_code == 200

  def test_predict_has_required_fields(self):
       resp = requests.post(
           f'{BASE_URL}/predict',
           json={'text': '测试'}
       ).json()
       assert 'label' in resp
       assert 'confidence' in resp
       assert 0 <= resp['confidence'] <= 1

  @pytest.mark.parametrize('input_text,expected_label', [
       ('我很高兴', 'positive'),
       ('太糟糕了', 'negative'),
```

('今天天气不错', 'positive'),
])
```python
  def test_sentiment_classification(self, input_text,
                            expected_label):
       resp = requests.post(
           f'{BASE_URL}/predict',
           json={'text': input_text}
       ).json()
       assert resp['label'] == expected_label
```
