---
breadcrumbExclude: true
---

# 基于 Apifox + MCP + Agents 排查接口性能瓶颈

## 前言

排查接口性能瓶颈，传统链路通常是：在 Apifox 里发请求复现慢接口 → 打开数据库跑 `EXPLAIN` 看执行计划 → 凭经验判断哪里出了问题。这条链路依赖人对 MySQL 索引、执行计划的熟悉程度，中间步骤多、也容易漏。

本文换一种思路，把「接口调试、压测、执行计划分析」串起来，交给 AI Agent 来做诊断：**Apifox** 负责接口抓包与调试，**MCP** 把 Apifox 的能力暴露给 AI 开发工具，**AI Agents（Trae 等 IDE 里的智能体）** 负责读执行计划、定位瓶颈、给出优化方案。

以一个真实的慢接口——「查询系统用户项目未读消息数量」为例：该接口在无数据时平均响应就有 0.8s，有数据时更慢。下面从复现延迟、定位 SQL、分析执行计划到给出索引优化，完整走一遍。

## 一、关联表

慢接口对应的 SQL 只涉及一张 `notification`（通知/消息）表，`WHERE` 条件用到 `project_id`、`receiver`、`status` 三个字段。

**表结构**

`notification` 表的核心字段如下（字段以实际表结构为准）：

```sql
CREATE TABLE notification (
    id          BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键',
    project_id  VARCHAR(32)  NOT NULL                COMMENT '项目 ID',
    receiver    VARCHAR(64)  NOT NULL                COMMENT '接收人',
    status      VARCHAR(16)  NOT NULL                COMMENT '状态：UNREAD / READ',
    type        VARCHAR(32)  DEFAULT NULL            COMMENT '消息类型',
    title       VARCHAR(255) DEFAULT NULL            COMMENT '消息标题',
    content     TEXT                                 COMMENT '消息内容',
    created_at  DATETIME     DEFAULT NULL            COMMENT '创建时间',
    read_at     DATETIME     DEFAULT NULL            COMMENT '已读时间',
    PRIMARY KEY (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;
```

**表索引**

问题就出在索引上：`notification` 表此时只有主键 `id` 一个索引，**没有**覆盖 `(project_id, receiver, status)` 的复合索引，因此这条 `COUNT(*)` 查询只能走全表扫描，行数一多就会越来越慢。

![表结构与表索引](/assets/images/interface/基于Apifox-mcp-trae排查接口性能瓶颈.001.png)

## 二、用 Locust 压测接口平均响应时长

先用 Locust 脚本对慢接口做压测，量化平均响应时长。脚本复用抓包里的 Cookie / Token，循环请求 10 次并打印每次状态：

```python
import time
from locust import HttpUser, task, constant

class GetUnreadCountUser(HttpUser):
    host = "http://localhost:5173"
    wait_time = constant(0)
    fixed_count = 1

    # 直接复用抓包中的 Cookie。
    COOKIE = (
        "locale=zh-Hans; "
        "Pycharm-50751dcc=5bcf46a5-3c76-44e9-b38e-e07aa61efef6; "
        "refresh_token=bbecae567a828498f3315fa6a78b284eb33fa147807e4eeb0ec33f50e96d8502b3654f832bcb81c267ace5e96b21b4d4f60c871432026a7aeb9d4950a11d0c52; "
        "session=MTc3NDU3MjgzNXxEWDhFQVFMX2dBQUJFQUVRQUFCc180QUFCQVp6ZEhKcGJtY01DZ0FJZFhObGNtNWhiV1VHYzNSeWFXNW5EQVlBQkhKdmIzUUdjM1J5YVc1bkRBWUFCSEp2YkdVRGFXNTBCQU1BXzhnR2MzUnlhVzVuREFnQUJuTjBZWFIxY3dOcGJuUUVBZ0FDQm5OMGNtbHVad3dFQUFKcFpBTnBiblFFQWdBQ3x9f4X5ug2l5IbcNdbeKtvQ1KQx1EQ2A3qRl0P9SuUS4g==; "
        "__stripe_mid=7cbf51b3-949a-40d1-b275-f5223edf09e4c2bae7; "
        "_ga=GA1.1.877290594.1774836486; "
        "_ga_FVWC4GKEYS=GS2.1.s1774836486$o1$g1$t1774840122$j60$l0$h0; "
        "token=AOy3FOY0f9B7zgr7tSojEps2hgDL6AfC9Ig9yUbCgPdPTv9jIOcoauoayW7aDgRiONWEFv0oR9EECyhTkfxTysWJRli7/zm3LBN2Pk+PY95qf81sltX9rAdz5JHg8kW329VfyXwjMEGzewB2YANl0g8kv3ck59N6RtV0OeTYSK1AEvxZHM2kml2YVWg5JMZYN3VBRBC5R4OWEMQ0AaIl6nZFJpTgfx3QW2opXUR9zMDq4j/WnOxWuTq3T4Dl1RZLcw7pElQzVtL3gVWf2djseinfkRDagzUPhDDGA5P9MnRUJS+fCeABRwIQmpzs/8VYhqXtPjJhQX+7gBbHrLIkTlhHqGrT7ZWA/CAj5r3DFCJA4vbLSHOKFG9KVdBX2RMRX2XkhVLstnpf9zfy5MGpUHnNyixPB5z2QG3lGKfeNISj9sxdmV7EGaUckDn+ExHcc+p2M2n8DclISesH5qi5yWdSMTJHDmNpdViNtQcsbppuJAhKdlFWdF+PC6Tn0iIzFPhiK6LGkW2r6jDdkDqwJ+rtiE6+ubo0Fx0mosGqPElp9ycKM1xJ3lRYlQ=="
    )

    HEADERS = {
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "zh-CN",
        "CSRF-TOKEN": "dVInqvFRaZ7wJyFP0x1zqu6EQAdooLTNIMtcoV7D53pPooeRwwCBDwhhI50ttvrkWWHFPO09DeNkG0F37s0LwA==",
        "Connection": "keep-alive",
        "ORGANIZATION": "100001",
        "PROJECT": "100001100001",
        "Referer": "http://localhost:5173/",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/147.0.0.0 Safari/537.36"
        ),
        "X-AUTH-TOKEN": "a230240e-a8ed-4e06-9c51-c16180a08d15",
        "sec-ch-ua": '"Google Chrome";v="147", "Not.A/Brand";v="8", "Chromium";v="147"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "Cookie": COOKIE,
    }

    @task
    def get_unread_count_10_times(self) -> None:
        for i in range(1, 11):
            params = {"_t": int(time.time() * 1000)}
            with self.client.get(
                "/front/notification/un-read/100001100001",
                params=params,
                headers=self.HEADERS,
                name="GET /front/notification/un-read/{projectId}",
                catch_response=True,
            ) as response:
                if response.status_code == 200:
                    response.success()
                    print(f"[{i}/10] success: status={response.status_code}")
                else:
                    response.failure(
                        f"[{i}/10] failed: status={response.status_code}, body={response.text}"
                    )

        # 执行完 10 次后，结束本次 Locust 运行。
        if self.environment.runner:
            self.environment.runner.quit()
```

### 测试报告

![Locust 测试报告](/assets/images/interface/基于Apifox-mcp-trae排查接口性能瓶颈.002.png)

从报告可以看到，该接口平均响应时间在 0.8s 左右——对一条 `COUNT(*)` 统计查询来说明显偏慢。

## 三、场景：查询系统用户项目未读消息数量

接口 `GET /front/notification/un-read/{projectId}` 返回当前用户在某项目下的未读消息数量，底层就是对 `notification` 表做一条 `COUNT(*)` 统计。

> 当前无数据时，查询平均耗时约 0.8s；当消息有数据时，性能瓶颈会更明显。

## 四、用 EXPLAIN 定位慢查询

对上面的 `COUNT(*)` 语句执行 `EXPLAIN`，查看执行计划：

```sql
EXPLAIN
SELECT COUNT(*)
FROM notification
WHERE project_id = '100001100001'
  AND receiver = 'admin'
  AND status = 'UNREAD';
```

### 分析结果

![EXPLAIN 分析结果](/assets/images/interface/基于Apifox-mcp-trae排查接口性能瓶颈.003.png)

`EXPLAIN` 输出的关键字段：

- `select_type`：查询类型，`SIMPLE` 表示简单查询（无子查询 / UNION）。
- `table`：访问的表名。
- `partitions`：命中的分区，无分区时为 `NULL`。
- `type`：访问类型，性能从好到差依次为 `system > const > eq_ref > ref > range > index > ALL`。这里是 **`ALL`（全表扫描）**，是慢的根源。
- `possible_keys`：可能用到的索引，此处为空，说明没有可用的索引。
- `key`：实际使用的索引，此处为 `NULL`，说明一个索引都没用上。
- `key_len`：使用的索引长度（字节），为 `NULL` 时表示未用索引。
- `ref`：索引与哪个列或常量做比较。
- `rows`：预估需要扫描的行数，数值越大越慢。
- `filtered`：按表条件过滤后剩余行数的百分比。

## 五、Agents 分析：瓶颈定位与优化方案

把执行计划交给 AI Agent 分析，它给出的诊断和优化建议如下：

**现象**：接口平均响应 0.8s，一条 `COUNT(*)` 查询明显偏慢。

**执行计划关键信号**：

- `type = ALL`：走了全表扫描，没有命中任何索引。
- `key = NULL`、`possible_keys = NULL`：`(project_id, receiver, status)` 三个过滤条件没有对应索引可用。
- `rows` 数值大：随着表数据增长，扫描行数线性增加，响应时间只会越来越差。

**根因判断**：`notification` 表缺少 `(project_id, receiver, status)` 的复合索引，导致每次统计未读消息都要扫描整张表。

**优化方案**：按查询条件建一个复合索引：

```sql
ALTER TABLE notification
    ADD INDEX idx_project_receiver_status (project_id, receiver, status);
```

索引列顺序按「等值过滤、区分度高」的原则排列：`project_id`（项目维度，区分度最高）→ `receiver`（接收人）→ `status`（状态）。

**优化后预期**：`EXPLAIN` 里 `type` 会从 `ALL` 变为 `ref`，`key` 命中 `idx_project_receiver_status`，`rows` 大幅下降，接口平均响应时间从 0.8s 降到毫秒级。

## 总结

这条排查链路可以复用到绝大多数慢接口：

1. 用 Apifox / Locust 复现并量化接口延迟；
2. 用 `EXPLAIN` 拿到执行计划；
3. 交给 AI Agent 解读 `type`、`key`、`rows` 等关键字段，定位是不是全表扫描、缺索引；
4. 按过滤条件建复合索引，再重新 `EXPLAIN` 和压测验证。
