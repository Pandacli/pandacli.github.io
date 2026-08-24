---
breadcrumbExclude: true
---

# 第10章 RAG系统测试

RAG(Retrieval-Augmented
Generation)是目前企业AI应用最主流的架构。通过检索外部知识库增强LLM的回答，减少幻觉。RAG测试需要同
时覆盖检索和生成两个环节。

## 10.1 RAG系统架构与测试分层

RAG系统由文档处理、向量索引、检索、重排序、生成五个核心环节组成，测试需要分层覆盖每个环节，同时做端到端评
估。
| 测试层级 | 测试对象 | 关键指标 |
|---|---|---|
| 文档处理测试 | 分块策略、元数据提取 | 分块质量、信息完整性 |
| 索引测试 | 向量化、索引构建 | 向量质量、索引覆盖 |
| 检索测试 | 语义搜索、关键词搜索 | 召回率、精确率、MRR |
| 重排序测试 | 检索结果排序优化 | NDCG、排序相关性 |
| 生成测试 | 基于检索结果生成回答 | 忠实性、完整性、相关性 |
| 端到端测试 | 从问题到最终回答 | 回答质量、延迟、成本 |

## 10.2 检索质量测试

```python
def evaluate_retrieval(retriever, test_queries):
```

'''检索质量评估'''
```python
  metrics = {'recall': [], 'precision': [], 'mrr': []}

  for query_data in test_queries:
     query = query_data['question']
     relevant_ids = set(query_data['relevant_doc_ids'])

     # 检索Top-K结果
     results = retriever.search(query, top_k=10)
     retrieved_ids = [r.id for r in results]

     # 召回率: 相关文档被检索到的比例
     hits = set(retrieved_ids) & relevant_ids
     recall = len(hits) / len(relevant_ids)
     metrics['recall'].append(recall)

     # 精确率: 检索结果中相关的比例
     precision = len(hits) / len(retrieved_ids)
     metrics['precision'].append(precision)

     # MRR: 第一个相关结果的排名倒数
     for i, rid in enumerate(retrieved_ids):
        if rid in relevant_ids:
             metrics['mrr'].append(1 / (i + 1))
             break
     else:
        metrics['mrr'].append(0)

  for k, v in metrics.items():
     print(f'{k}: {np.mean(v):.3f}')
```

## 10.3 生成质量测试

### 10.3.1 忠实性测试(Faithfulness)

忠实性测试验证LLM的回答是否忠实于检索到的上下文，不添加额外的未经验证的信息。
```python
 def test_faithfulness(question, answer, contexts):
```

'''检查回答是否忠实于检索上下文'''
```python
   # 将回答拆分为独立陈述
   claims = extract_claims(answer)

   supported = 0
   unsupported = []
   for claim in claims:
      # 检查每个陈述是否能从上下文中找到支持
      is_supported = verify_claim_against_context(
          claim, contexts
      )
      if is_supported:
          supported += 1
      else:
          unsupported.append(claim)

   faithfulness_score = supported / len(claims)
   print(f'忠实性评分: {faithfulness_score:.2%}')
   if unsupported:
      print(f'未支持的陈述: {unsupported}')
   return faithfulness_score
```

## 10.4 RAGAS评测框架实操

RAGAS(Retrieval Augmented Generation
Assessment)是专门用于RAG系统评测的开源框架，提供了一套标准化的评估指标和流程。
```python
from ragas import evaluate
from ragas.metrics import (
     faithfulness,
     answer_relevancy,
     context_precision,
     context_recall,
)
from datasets import Dataset

# 准备评估数据
eval_data = Dataset.from_dict({
     'question': questions,
     'answer': answers,
     'contexts': contexts_list,
     'ground_truth': ground_truths,
})

# 执行评估
results = evaluate(
     eval_data,
     metrics=[
```

faithfulness, # 回答忠实于上下文
answer_relevancy, # 回答与问题相关
context_precision, # 检索精确率
context_recall, # 检索召回率
],
)
```python
print(results)
```

## 10.5 RAG系统常见问题与测试策略

| 问题 | 表现 | 测试方法 |
|---|---|---|
| 检索失败 | 相关文档未被检索到 | 已知答案问题集测试召回率 |
| 噪声上下文 | 检索到不相关文档干扰生成 | 注入不相关文档观察影响 |
| 信息过时 | 知识库内容过期 | 时效性问题集验证 |
| 跨文档推理 | 答案需要综合多个文档 | 多跳问题集测试 |
| 长上下文丢失 | 上下文过长导致信息遗漏 | 关键信息在不同位置的测试 |
| 幻觉生成 | 生成内容超出上下文范围 | 忠实性评分检查 |
