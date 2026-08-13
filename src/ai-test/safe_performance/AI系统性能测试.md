---
breadcrumbExclude: true
---

# 第14章 AI系统性能测试
AI推理服务的性能直接影响用户体验和运营成本。LLM推理的高延迟和高成本使得性能测试尤为重要。
## 14.1 AI推理性能指标
| 指标 | 定义 | 典型要求 |
|---|---|---|
| 首Token延迟(TTFT) | 从请求到收到第一个Token | < 500ms |
| Token生成速率(TPS) | 每秒生成的Token数 | > 30 tokens/s |
| 端到端延迟(E2E) | 从请求到完整响应 | 依赖输出长度 |
| 吞吐量(QPS) | 每秒处理的请求数 | 依赖硬件和模型 |
| 并发能力 | 同时处理的请求数 | 依赖资源配置 |
| GPU利用率 | GPU计算资源使用率 | 60-80%最优 |
| 内存使用 | 模型+推理的内存消耗 | 不超过可用内存90% |

## 14.2 使用Locust进行AI接口压测
```python
# locustfile.py
from locust import HttpUser, task, between
import json

class AIModelUser(HttpUser):
  wait_time = between(1, 3)
  host = 'http://ai-service:8000'

  @task(3)
  def short_query(self):
```

'''短文本推理请求'''
self.client.post(
'/api/predict',
```python
         json={'text': '这是一条短测试文本', 'max_tokens': 100},
         name='短文本推理',
     )

  @task(1)
  def long_query(self):
```

'''长文本推理请求'''
self.client.post(
'/api/predict',
```python
         json={'text': '长文本...' * 100, 'max_tokens': 500},
         name='长文本推理',
     )

  @task(2)
  def streaming_query(self):
```

'''流式响应请求'''
```python
     with self.client.post(
         '/api/stream',
         json={'text': '测试流式响应'},
         stream=True,
         name='流式推理',
         catch_response=True,
     ) as resp:
         first_chunk_time = None
         for chunk in resp.iter_content():
           if first_chunk_time is None:
              first_chunk_time = resp.elapsed
         resp.success()
```

## 14.3 LLM Token成本测试
LLM的使用成本与Token消耗直接相关，测试Prompt的Token效率也是性能测试的重要环节。
```python
import tiktoken

def analyze_token_cost(prompt_template, test_inputs,
                 model='gpt-4'):
   '''分析Prompt的Token消耗和成本'''
   enc = tiktoken.encoding_for_model(model)
   pricing = {
       'gpt-4': {'input': 30, 'output': 60}, # $/M tokens
       'claude-sonnet': {'input': 3, 'output': 15},
   }

   total_input_tokens = 0
   total_output_tokens = 0

   for inp in test_inputs:
       prompt = prompt_template.format(**inp)
       input_tokens = len(enc.encode(prompt))
       # 假设输出约为输入的30%
       output_tokens = int(input_tokens * 0.3)
       total_input_tokens += input_tokens
       total_output_tokens += output_tokens

   price = pricing.get(model, pricing['gpt-4'])
   cost = (
       total_input_tokens * price['input']
       + total_output_tokens * price['output']
   ) / 1_000_000
   print(f'总输入Token: {total_input_tokens:,}')
   print(f'总输出Token: {total_output_tokens:,}')
   print(f'预估成本: ${cost:.2f}')
```

## 14.4 性能优化建议
| 优化方向 | 具体方法 | 效果 |
|---|---|---|
| Prompt优化 | 减少冗余Prompt/使用缓存 | 降低Token 30-50% |
| 模型选择 | 简单任务用小模型 | 降低成本 50-80% |
| 批处理 | 合并请求批量推理 | 提升吞吐量 2-5x |
| 缓存策略 | 相同/相似请求缓存结果 | 减少API调用 40-60% |
| 流式响应 | 使用SSE流式返回 | 降低用户感知延迟 |
| 并行请求 | 独立请求并行发送 | 降低总延迟 |
