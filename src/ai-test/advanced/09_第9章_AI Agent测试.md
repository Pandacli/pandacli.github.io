# 第9章 AI Agent测试
AI
Agent是LLM应用的高级形态，能够自主决策、调用工具、多轮交互。Agent测试需要覆盖决策逻辑、工具调用、
状态管理和端到端行为等多个层面。
## 9.1 AI Agent架构与测试切入点
一个典型的AI Agent由以下组件构成，每个组件都需要独立测试和集成测试：
| 组件 | 功能 | 测试重点 |
|---|---|---|
| LLM核心 | 理解指令、推理决策 | 推理准确性、指令遵循 |
| Prompt/System Message定义Agent角色和行为 | 角色一致性、边界遵守 |  |
| 工具集(Tools) | 外部能力调用 | 调用正确性、参数验证、错误处理 |
| 记忆(Memory) | 上下文保持、历史记录 | 信息持久化、检索准确性 |
| 规划(Planning) | 任务分解、执行计划 | 计划合理性、步骤完整性 |
| 编排(Orchestration) | 多步骤流程控制 | 流程正确性、异常恢复 |

## 9.2 Agent决策测试
```python
def test_agent_decision_making():
```

'''测试Agent在不同场景下的决策正确性'''
```python
  test_cases = [
      {
```

'input': '帮我查一下北京明天的天气',
'expected_tool': 'weather_api',
'expected_params': {'city': '北京'},
},
{
'input': '把这段英文翻译成中文: Hello',
'expected_tool': None, # 应直接回答
},
{
'input': '帮我发一封邮件给张三',
'expected_tool': 'send_email',
'should_confirm': True, # 应先确认内容
},
]
```python
  for case in test_cases:
      result = agent.plan(case['input'])
      if case.get('expected_tool'):
           assert result.tool_name == case['expected_tool']
      if case.get('should_confirm'):
           assert result.requires_confirmation
```

## 9.3 工具调用测试
### 9.3.1 工具调用正确性
```python
class TestToolCalling:
  def test_correct_tool_selection(self, agent):
```

'''Agent是否选择了正确的工具'''
```python
     response = agent.run('查询订单12345的状态')
     assert 'order_query' in response.tools_used

  def test_correct_parameters(self, agent):
```

'''工具调用参数是否正确'''
```python
     response = agent.run('查询订单12345的状态')
     call = response.tool_calls[0]
     assert call.name == 'order_query'
     assert call.args['order_id'] == '12345'

  def test_tool_error_handling(self, agent, mock_tools):
```

'''工具返回错误时Agent的处理'''
mock_tools['order_query'].side_effect = \
Exception('服务不可用')
```python
     response = agent.run('查询订单12345')
     # Agent应优雅处理错误而非崩溃
     assert '无法查询' in response.text or \
          '稍后再试' in response.text

  def test_multi_tool_orchestration(self, agent):
```

'''多工具协作是否正确'''
```python
     response = agent.run(
```

'查询订单12345,如果已发货就查物流信息'
)
```python
     assert 'order_query' in response.tools_used
     # 根据订单状态决定是否调用物流查询
     if '已发货' in str(response.intermediate):
         assert 'logistics_query' in response.tools_used
```

## 9.4 多轮对话测试
```python
def test_multi_turn_context():
```

'''多轮对话上下文保持测试'''
```python
  agent = create_agent()

  # 第1轮: 建立上下文
  r1 = agent.chat('我想订一张从北京到上海的机票')
  assert '日期' in r1 or '时间' in r1 # 应追问日期

  # 第2轮: 补充信息
  r2 = agent.chat('明天上午的')
  # 应记住 北京->上海, 且理解'明天上午'
  assert '北京' in str(agent.context)
  assert '上海' in str(agent.context)

  # 第3轮: 引用之前的信息
  r3 = agent.chat('改成后天的吧')
  # 应正确更新日期,保持其他信息不变
  assert '后天' in str(agent.context) or \
       next_day in str(agent.context)

  # 第4轮: 话题切换
  r4 = agent.chat('另外帮我订个酒店')
  # 应记住目的地是上海
  assert '上海' in r4
```

## 9.5 Agent安全边界测试
- 权限越界：Agent是否执行了超出授权范围的操作
- 确认机制：高风险操作(删除/发送/支付)是否有确认步骤
- 数据泄露：Agent是否在回复中泄露了内部数据或系统信息
- 无限循环：Agent是否可能陷入死循环(反复调用工具)
- 资源消耗：Agent的Token消耗和工具调用次数是否有上限控制
