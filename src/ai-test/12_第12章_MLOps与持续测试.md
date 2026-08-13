# 第12章 MLOps与持续测试
MLOps是将DevOps理念应用到ML系统的实践，持续测试是其中核心环节。理解MLOps流程能帮助你在AI开发全
生命周期中嵌入质量保障。
## 12.1 MLOps概述
MLOps(Machine Learning
Operations)是一套管理ML系统开发、部署和运维的最佳实践。核心理念是将ML模型像软件一样进行版本管理、自动化
测试、持续部署和监控。
| MLOps级别 | 特征 | 测试成熟度 |
|---|---|---|
| Level 0 手动 | 手动训练/手动部署/手动测试 | 无自动化测试 |
| Level 1 自动化训练 | 自动化训练流水线 | 数据验证+模型验证 |
| Level 2 CI/CD | 完整CI/CD流水线 | 全自动化测试+监控 |

## 12.2 ML流水线中的测试节点
1. 数据验证门禁
新数据进入训练管道前，自动检查数据质量(完整性、分布、异常值)
2. 特征验证
验证特征工程的输出：特征值范围、缺失率、分布一致性
3. 训练过程验证
监控训练指标(Loss/Accuracy)是否正常收敛，检测过拟合
4. 模型质量门禁
训练后的模型必须通过评估指标阈值才能进入下一阶段
5. 集成测试
模型与前后处理管道的集成测试，验证端到端功能
6. 影子测试(Shadow Test)
新模型在生产流量上做影子推理，对比旧模型但不影响用户
7. 金丝雀发布
新模型先对少量流量(如5%)服务，监控关键指标无异常后逐步放量
## 12.3 模型质量门禁实现
```python
# model_quality_gate.py
class ModelQualityGate:
     def __init__(self, thresholds):
       self.thresholds = thresholds

     def check(self, metrics):
```

'''模型质量门禁检查'''
```python
       results = []
       all_passed = True

       for metric, threshold in self.thresholds.items():
          actual = metrics.get(metric)
          if actual is None:
              results.append((metric, 'MISSING', None))
              all_passed = False
              continue

          passed = actual >= threshold
          status = 'PASS' if passed else 'FAIL'
          results.append(
              (metric, status, f'{actual:.3f}>={threshold}')
          )
          if not passed:
              all_passed = False

       return all_passed, results

# 使用
gate = ModelQualityGate({
     'accuracy': 0.90,
     'f1_score': 0.85,
     'auc_roc': 0.92,
     'latency_p99_ms': 100,
})
passed, details = gate.check(model_metrics)
if not passed:
     raise Exception('模型质量门禁未通过')
```

## 12.4 模型监控与告警
### 12.4.1 监控指标体系
| 监控类别 | 关键指标 | 告警阈值 |
|---|---|---|
| 性能指标 | 准确率/F1/AUC | 低于基线5% |
| 数据漂移 | KS统计量/PSI | PSI > 0.2 |
| 延迟指标 | P50/P95/P99延迟 | P99 > 200ms |
| 吞吐量 | QPS/并发数 | 低于预期80% |
| 错误率 | 推理错误/超时/拒绝 | 错误率 > 1% |
| 资源消耗 | CPU/内存/GPU利用率 | 利用率 > 85% |

### 12.4.2 数据漂移监控实现
```python
def calculate_psi(expected, actual, bins=10):
   '''计算PSI(Population Stability Index)'''
   breakpoints = np.linspace(0, 1, bins + 1)
   expected_pct = np.histogram(expected, breakpoints)[0]
   actual_pct = np.histogram(actual, breakpoints)[0]

   # 避免除以0
   expected_pct = np.maximum(expected_pct, 0.001)
   actual_pct = np.maximum(actual_pct, 0.001)

   # 归一化
   expected_pct = expected_pct / expected_pct.sum()
   actual_pct = actual_pct / actual_pct.sum()

   psi = np.sum(
       (actual_pct - expected_pct)
       * np.log(actual_pct / expected_pct)
   )
   # PSI < 0.1: 稳定
   # 0.1-0.2: 需关注
   # > 0.2: 显著漂移
   return psi
```
