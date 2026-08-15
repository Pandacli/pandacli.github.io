---
breadcrumbExclude: true
---

# Locust 业务实战

## 前言

performance_test 是 **Locust 性能/负载测试** 子项目，用于对广汽传祺 App 后端 API 进行压力测试。

本文档汇总各被测接口的 Locust 启动命令、测试模型与脚本代码架构，可直接作为压测执行的速查手册。所有脚本位于 `/root/gacmotor_app_test/performance_test/locust_scripts/uat` 目录，压测前务必更新账号的 X-token、UserOneId、Mobile、VIN 等认证信息。
## 1. 启动测试命令

> 建议：每压测完成一个脚本，可以键盘Ctl + Z 退出, 执行 kill -9 $(lsof -t -i:8089) ,避免占用端口号

启动成功之后，输入浏览器访问 ：http://10.123.54.131:8089/ ,点击start swarming 即可开始
阶段性压测
![Locust Web UI 阶段性压测](/assets/images/locust/Locust-业务实战.001.png)
- 所有命令在 /root/gacmotor_app_test/performance_test/locust_scripts/uat 目录下执行：

```bash
cd /root/gacmotor_app_test/_test/locust_scripts/uat
```

### 1.1 必看：启动前更新账号 X-token / UserOneId / Mobile / VIN

> 压测环境账号的 X-token、UserOneId、Mobile 可以通过 抓包获取，这里不做介绍

```bash
cd /config

vi urls_config.py

#复制 要测试的VIN码 ，X-token、UserOneId、Mobile  ，代替掉
```

![更新压测环境账号配置](/assets/images/locust/Locust-业务实战.002.png)
**find_car_location — 寻车位置V2**

```bash
#uat环境  有ui模式，方便查看请求统计图标
locust -f find_car_location.py --loglevel INFO --csv=./docs/find_car_location --csv-full-history  --host https://uat-onevehicle.gacmotor.com

#prod环境
locust -f find_car_location.py --loglevel INFO --csv=../docs/find_car_location --csv-full-history --host https://vehicle.gacmotor.com
```

**banner_select_list — banner列表查询**

```bash
#uat 环境
locust -f banner_select_list.py --loglevel INFO --csv=../docs/banner_select_list --csv-full-history --host https://uat-onevehicle.gacmotor.com

#prod 环境
locust -f banner_select_list.py --loglevel INFO --csv=../docs/banner_select_list --csv-full-history --host https://vehicle.gacmotor.com
```

**car_warn_info — 车辆告警信息**

```bash
#uat 环境
locust -f car_warn_info.py --loglevel INFO --csv=../docs/car_warn_info --csv-full-history --host https://uat-onevehicle.gacmotor.com

#prod 环境
locust -f car_warn_info.py --loglevel INFO --csv=../docs/car_warn_info --csv-full-history --host https://vehicle.gacmotor.com
```

**get_capability — 车型能力集**

```bash
#uat环境
locust -f get_capability.py --loglevel INFO --csv=../docs/get_capability --csv-full-history --host https://uat-onevehicle.gacmotor.com
#prod环境
locust -f get_capability.py --loglevel INFO --csv=../docs/get_capability --csv-full-history --host https://vehicle.gacmotor.com
```

**get_car_info — 根据vin获取车辆信息**

```bash
#uat 环境
locust -f get_car_info.py --loglevel INFO --csv=../docs/get_car_info --csv-full-history --host https://uat-onevehicle.gacmotor.com
#prod环境
locust -f get_car_info.py --loglevel INFO --csv=../docs/get_car_info --csv-full-history  --host https://vehicle.gacmotor.com
```

**get_optional_list — 虚拟商品-选装包订单列表**

```bash
#uat环境
locust -f get_optional_list.py --loglevel INFO --csv=../docs/get_optional_list --csv-full-history --host https://uat-onevehicle.gacmotor.com
#prod环境
locust -f get_optional_list.py --loglevel INFO --csv=../docs/get_optional_list --csv-full-history --host https://vehicle.gacmotor.com
```

**get_route_by_vin — 根据vin查询路由**

```bash
#uat
locust -f get_route_by_vin.py --loglevel INFO --csv=../docs/get_route_by_vin --csv-full-history --host https://uat-onevehicle.gacmotor.com

#prod
locust -f get_route_by_vin.py --loglevel INFO --csv=../docs/get_route_by_vin --csv-full-history --host https://vehicle.gacmotor.com
```

**get_skin_configure — 查询皮肤配置**

```bash
#uat
locust -f get_skin_configure.py --loglevel INFO --csv=../docs/get_skin_configure --csv-full-history --host https://uat-onevehicle.gacmotor.com

#prod
locust -f get_skin_configure.py --loglevel INFO --csv=../docs/get_skin_configure --csv-full-history --host https://vehicle.gacmotor.com
```

**get_user_ticket — 车控回调-获取蓝牙ticket**

```bash
locust -f get_user_ticket.py --loglevel INFO --csv=../docs/get_user_ticket --csv-full-history --host https://uat-onevehicle.gacmotor.com

#prod
locust -f get_user_ticket.py --loglevel INFO --csv=../docs/get_user_ticket --csv-full-history --host https://vehicle.gacmotor.com
```

**get_vehicle_status — 车况查询（影子数据）**

```bash
locust -f get_vehicle_status.py --loglevel INFO --csv=../docs/get_vehicle_status --csv-full-history --host https://uat-onevehicle.gacmotor.com

#prod
locust -f get_vehicle_status.py --loglevel INFO --csv=../docs/get_vehicle_status --csv-full-history --host https://vehicle.gacmotor.com
```

**global_notice_find_all — 全局通知小红点**

```bash
#uat
locust -f global_notice_find_all.py --loglevel INFO --csv=../docs/global_notice_find_all --csv-full-history --host https://uat-onevehicle.gacmotor.com

#prod
locust -f global_notice_find_all.py --loglevel INFO --csv=../docs/global_notice_find_all --csv-full-history --host https://vehicle.gacmotor.com
```

**oks_last_execute — 一键备车-最近执行时间**

```bash
locust -f oks_last_execute.py --loglevel INFO --csv=../docs/oks_last_execute --csv-full-history --host https://uat-onevehicle.gacmotor.com

#prod
locust -f oks_last_execute.py --loglevel INFO --csv=../docs/oks_last_execute --csv-full-history --host https://vehicle.gacmotor.com
```

- ota_upgrade_info — OTA升级信息查询

```bash
locust -f ota_upgrade_info.py --loglevel INFO --csv=../docs/ota_upgrade_info --csv-full-history --host https://uat-onevehicle.gacmotor.com

#prod
locust -f ota_upgrade_info.py --loglevel INFO --csv=../docs/ota_upgrade_info --csv-full-history  --host https://vehicle.gacmotor.com
```

- query_default_car — 用户默认车辆信息查询

```bash
locust -f query_default_car.py --loglevel INFO --csv=../docs/query_default_car --csv-full-history --host https://uat-onevehicle.gacmotor.com

#prod
locust -f query_default_car.py --loglevel INFO --csv=../docs/query_default_car --csv-full-history --host https://uat-onevehicle.gacmotor.com
```

- select_read_agreement — 查询协议状态

```bash
locust -f select_read_agreement.py --loglevel INFO --csv=../docs/select_read_agreement --csv-full-history --host https://uat-onevehicle.gacmotor.com

#prod
locust -f select_read_agreement.py --loglevel INFO --csv=../docs/select_read_agreement --csv-full-history --host https://uat-onevehicle.gacmotor.com
```

- verify_pin_code — PIN码校验

```bash
locust -f verify_pin_code.py --loglevel INFO --csv=../docs/verify_pin_code --csv-full-history --host https://uat-onevehicle.gacmotor.com

#prod
locust -f verify_pin_code.py --loglevel INFO --csv=../docs/verify_pin_code --csv-full-history --host https://uat-onevehicle.gacmotor.com
```

### 1.2 测试模型
**LoadTestShape** — 采用三段式负载：
- 0-60s：预热（80 用户，10/s 生成速率）
- 60-120s：爬升到目标并发（150 用户，15/s）
- 120-720s：稳态 10 分钟（150 用户，5/s）
## 2. 脚本代码架构

> performance_test/
> ├── locust_scripts/
> │ ├── find_car_location.py # 寻车位置V2
> │ ├── get_vehicle_status.py # 车况查询（影子数据）
> │ ├── get_capability.py # 车型能力集
> │ ├── oks_last_execute.py # 一键备车-最近执行时间
> │ ├── ota_upgrade_info.py # OTA升级信息查询
> │ ├── get_car_info.py # 根据vin获取车辆信息
> │ ├── global_notice_find_all.py # 全局通知小红点
> │ ├── banner_select_list.py # banner列表查询
> │ ├── car_warn_info.py # 车辆告警信息
> │ ├── get_optional_list.py # 虚拟商品-选装包订单列表
> │ ├── query_default_car.py # 用户默认车辆信息查询
> │ ├── select_read_agreement.py # 查询协议状态
> │ ├── get_skin_configure.py # 查询皮肤配置
> │ ├── get_route_by_vin.py # 根据vin查询路由
> │ ├── verify_pin_code.py # PIN码校验
> │ ├── get_user_ticket.py # 车控回调-获取蓝牙ticket
> │ ├── response.py # API 响应 VO 类（A2APP_BaseVO, UAT_BASE_VO）
> │ ├── config/
> │ │ └── urls_config.py # URL 常量 + 多套认证 headers
> │ ├── docs/
> │ │ └── performance_interface.md # 被测接口文档

### 核心组件
**压测脚本** (find_car_location.py) 包含四个紧密耦合的部分：
1. **业务配置** — VIN 池（使用 itertools.cycle 循环取用）+ 认证 headers（含加密的 token/Mobile/UserOneId/sign）。headers 直接从 config/urls_config.py 导入，导入失败时有内联 fallback。
2. **LoadTestShape** — FindCarLocation1Step2MinShape 定义三段式负载：
- 0-60s：预热（80 用户，10/s 生成速率）
- 60-120s：爬升到目标并发（150 用户，15/s）
- 120-720s：稳态 10 分钟（150 用户，5/s）
3. **HttpUser** — ApiUser 使用 constant_pacing(0)（无等待，最大吞吐）。唯一的 @task 对
1. findCarLocation 接口发 POST 请求，传入 VIN。
2. **业务级校验** — 响应成功判定支持多种业务码格式：code/status/resultCode，成功值包括 200、"200"、0、"0"、1、"1"、"0000"、"success"。非成功码将请求标记为 [BIZ_ERR] 失败。
**响应 VO 类** (response.py) — 定义两套响应解析模型：
- A2APP_BaseVO：使用 resultCode/resultMsg 字段的 Java 风格响应
- UAT_BASE_VO：使用 code/msg 字段的 UAT 环境响应
这些 VO 类目前被定义但未在压测脚本中直接使用 — 压测脚本内联了校验逻辑以避免额外对象创建开销。
### 脚本结构模式
每个压测脚本遵循统一结构，参考 find_car_location.py：
1. **业务配置** — 接口 URL + 对应 headers 从 config/performance_urls.py 导入，导入失败时内联 fallback
2. **VIN 池** — 需要 VIN 的接口使用 itertools.cycle 循环取用；无 VIN 的接口（如 global_notice_find_all、query_default_car、get_user_ticket）省略
3. **LoadTestShape** — 三段式负载：预热(0-60s, 80用户) → 爬升(60-120s, 150用户) → 稳态(120-720s)
4. **HttpUser** — constant_pacing(0) 无等待模式，唯一的 @task 发送 POST 请求
5. **业务级校验** — 支持多种成功码：200/"200"/0/"0"/1/"1"/"0000"/"success"
6. **shape_class 绑定** — 将 LoadTestShape 实例赋值给模块级变量
### 认证 Headers
config/urls_config.py 中定义了多套 headers 以适配不同接口的认证要求：
![认证 Headers 配置](/assets/images/locust/Locust-业务实战.003.jpeg)
**点击图片可查看完整电子表格**
注意：headers 中的 token 和签名值是静态的快照，长期运行可能需要刷新。
### 微调：性能测试模型（To do）
- 去掉限速瓶颈：把 wait_time = constant_pacing(1.4) 改为 constant_pacing(0) 或 between(0, 0)

```python
wait_time = constant_pacing(0)
```

**重做负载模型：**
- 不要前 120 秒只 100 用户，改成快速爬升到目标并发并保压。先用阶梯压测找拐点，再做稳态压测，不要一步到位上 700。
建议 shape（示例）：
- 0-60s：100 -> 300
- 60-120s：300 -> 600
- 120-300s：保压 600（观察稳定性）
- 300-420s：600 -> 800（探上限）

```python
 stage_config = [
        (60, 300),    # 0-60s 快速拉升
        (60, 600),    # 60-120s 达到目标并发
        (180, 600),   # 120-300s 稳态保压
        (120, 800),   # 300-420s 探上限
        (99999, 800),
    ]

```

- VIN_POOL 至少扩到几百条，避免redis缓存命中导致“假高 QPS”。
- 压测机与目标环境尽量同网络域，减少公网抖动。
- Locust 运行参数优化
- 单机先试： --headless -u 600 -r 50 -t 10m
- 若 CPU 飙高或 gevent 成瓶颈，改分布式：
- 1 master + N workers（按 CPU 核线性扩）
- 开启 CSV 输出用于后验分析：
- --csv=report/find_car_location --csv-full-history
### 验收标准（建议）
- 稳态 3 分钟内：QPS >= 600
- 成功率 >= 99%
- P95 延迟在可接受阈值（你们业务自定）
- 无大规模超时/连接失败
### 附录：参数说明

```bash
# 运行 Locust 压力测试（无 Web UI 模式）
locust -f locust_scripts/find_car_location.py --headless -u 150 -r 15 --run-time 720s

# 运行并生成 HTML 报告
locust -f locust_scripts/find_car_location.py --headless -u 150 -r 15 --run-time 720s --html reports/report.html

# 单用户调试（快速验证接口连通性）
locust -f locust_scripts/test/single_test.py --headless -u 1 -r 1

# 启动 Locust Web UI（在浏览器中配置和监控测试）
locust -f locust_scripts/find_car_location.py
```

![Locust Web UI](/assets/images/locust/Locust-业务实战.004.png)
