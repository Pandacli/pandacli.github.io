---
breadcrumbExclude: true
---

# Jmeter 业务实战

## 前言

本文记录一次真实的 Jmeter 生产环境压测实战——清明节重保期间对传祺 App 后端接口进行压力测试，完整覆盖压测环境资源梳理、测试对象选取、性能目标制定、脚本设计与执行、结果分析复盘等环节。

实战以传祺 App 的核心接口（寻车位置、车况数据、OTA 升级、SDK 初始化等）为对象，给出 QPS/TPS 目标、脚本设计思路以及最终的压测结果与复盘，可作为移动 App 后端压测的参考模板。

**实战一：清明节重保 - Prod 生产环境 传祺 App 压测**

## 1. 压测环境资源

- CPU

```yaml
Architecture:          x86_64
CPU op-mode(s):        32-bit, 64-bit
Byte Order:            Little Endian
CPU(s):                16
On-line CPU(s) list:   0-15
Thread(s) per core:    1
Core(s) per socket:    16
Socket(s):             1
NUMA node(s):          1
Vendor ID:             GenuineIntel
CPU family:            6
Model:                 85
Model name:            Intel(R) Xeon(R) Platinum 8361HC CPU @ 2.60GHz
Stepping:              5
CPU MHz:               2593.902
BogoMIPS:              5187.80
Hypervisor vendor:     KVM
Virtualization type:   full
L1d cache:             32K
L1i cache:             32K
L2 cache:              4096K
L3 cache:              36608K
NUMA node0 CPU(s):     0-15
Flags:                 fpu vme de pse tsc msr pae mce cx8 apic sep mtrr pge mca cmov pat pse36 clflush mmx fxsr sse sse2 ss ht syscall nx pdpe1gb rdtscp lm constant_tsc rep_good nopl nonstop_tsc eagerfpu pni pclmulqdq ssse3 fma cx16 pcid sse4_1 sse4_2 x2apic movbe popcnt tsc_deadline_timer aes xsave avx f16c rdrand hypervisor lahf_lm abm 3dnowprefetch invpcid_single rsb_ctxsw fsgsbase bmi1 hle avx2 smep bmi2 erms invpcid rtm mpx avx512f avx512dq rdseed adx smap clflushopt clwb avx512cd avx512bw avx512vl xsaveopt xsavec xgetbv1 arat avx512_vnni
```

- memory

```json
#free -h
              total        used        free      shared  buff/cache   available
Mem:            30G        8.3G         12G        1.0M         10G         21G
Swap:            0B          0B          0B
```

- 磁盘

> *# 磁盘分区及使用情况*df -h
> Filesystem Size Used Avail Use% Mounted on
> devtmpfs 16G 20K 16G 1% /dev
> tmpfs 16G 156K 16G 1% /dev/shm
> tmpfs 16G 816K 16G 1% /run
> tmpfs 16G 0 16G 0% /sys/fs/cgroup
> /dev/vda1 50G 37G 11G 79% /
> tmpfs 3.1G 0 3.1G 0% /run/user/0

- 查看网络信息

```json
#ifconfig eth0

eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet 10.123.54.131  netmask 255.255.255.0  broadcast 10.123.54.255
        inet6 fe80::5054:ff:fe6e:c51  prefixlen 64  scopeid 0x20<link>
        ether 52:54:00:6e:0c:51  txqueuelen 1000  (Ethernet)
        RX packets 963826301  bytes 366621872789 (341.4 GiB)
        RX errors 0  dropped 0  overruns 0  frame 0
        TX packets 1736159114  bytes 1790073564777 (1.6 TiB)
        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0
```

- 查看操作系统版本与内核

```json
#发行信息 cat /etc/os-release

NAME="CentOS Linux"
VERSION="7 (Core)"
ID="centos"
ID_LIKE="rhel fedora"
VERSION_ID="7"
PRETTY_NAME="CentOS Linux 7 (Core)"
ANSI_COLOR="0;31"
CPE_NAME="cpe:/o:centos:centos:7"
HOME_URL="https://www.centos.org/"
BUG_REPORT_URL="https://bugs.centos.org/"

CENTOS_MANTISBT_PROJECT="CentOS-7"
CENTOS_MANTISBT_PROJECT_VERSION="7"
REDHAT_SUPPORT_PRODUCT="centos"
REDHAT_SUPPORT_PRODUCT_VERSION="7"
```

- 查看系统资源使用情况（当前）

```json
#htop
```

![...](/assets/images/jmeter/Jmeter业务实战.001.png)

## 2. 测试对象

- 寻车位置 /vehicle/v2/findCarLocation
- 获取车况数据 /vehicleCondition/getVehicleStatus
- 获取备车档案最近一次执行成功执行时间 /standbyVehicle/v1/user/oks/configs/lastExecute
- 获取ota升级信息 /vehicle/ota/upgrade/info
- 车辆详情信息 /personalCenter/getCarInfo
- 全局通知接口小红点 /globalNotice/v2/findAll
- 获取车辆能力集 /vehicleCondition/getCapability
- 查询banner列表 /v1/banner/selectList
- 查询车辆是否有告警信息 /vehicle/carWarnInfo
- 获取选装包订单列表 /invented/v1/order/getOptionalList
- 获取默认车辆信息 /vehicle/v1/queryDefaultCarByOneId
- 初始化sdkInit /sdk/init
- 查询用户协议状态 /agreement/selectReadAgreement
- 查询皮肤配置 /vehicleCondition/getSkinConfigure
- 车控挑战码V2 /vehicleControl/v2/challengeCode
- 根据vin查询车辆访问域名路由 /vehicle/v1/getRouteByVin
- PIN码校验 /personalCenter/verifyPinCode
- 获取A09DK-SDK插件登录凭证 /bluetooth/getUserTicket

## 3. 核心场景业务（to do）

**/sdk/init sdk初始化**

> 接口限制：
>
> 同一个用户请求，需要使用不同的用户。同一个用户我会加锁，service 回调速度下降。

## 4. 性能目标

### 4.1 QPS
**获取车辆位置 -/vehicle/v2/findCarLocation**

> 聚合报告 - Average 平均响应时间（单位毫秒） 355 ms
> **目标QPS：（生产峰值的3倍） 462 QPS**

**获取备车档案最近一次执行成功执行时间 /standbyVehicle/v1/user/oks/configs/lastExecute**

> 聚合报告 - Average 平均响应时间（单位毫秒） 313 ms
> **目标QPS：（生产峰值的3倍） 462 QPS**

**获取ota升级信息-/vehicle/ota/upgrade/info**

>  聚合报告 - Average 平均响应时间（单位毫秒） 510 ms
>  **目标QPS：（生产峰值的3倍） 150 QPS**

### 4.2 TPS

- 混合压测 春节 总QPS 峰值 2634 ，压测目标为7902

## 5. 脚本设计

> 压测公式：
>
> 假设：需要达到 QPS = 462，所需线程数的公式为：
>
> 并发连接数=目标 QPS×平均响应时间（秒）

**设计原则：**

- 单个接口响应时长久，避免线程数设置过大，导致 服务器 Socket close 接口请求数量少，QPS 过低。
### 5.1 单接口压测设计

### 5.2 混合压测设计
- 案例：线程数过多
  ![...](/assets/images/jmeter/Jmeter业务实战.002.png)

> 实际结果: 线程数过大,导致 socket closed 的请求数量剧增。采用轻量、缓和的递增策略

- 第二次脚本调整
  ![...](/assets/images/jmeter/Jmeter业务实战.003.png)

```text
性能目标 QPS = 7500
2026/3/27 2:39:31 ~ 2026/3/27 2:54:00
测试时长 14分钟
```

运维实际结果：
![...](/assets/images/jmeter/Jmeter业务实战.004.png)

## 6. 脚本压测执行及结果

> 执行参考语句
>
> jmeter -n -t uat_linux_sdkInit_test02.jmx
>
> -Jjmeter.save.saveservice.output_format=csv
>
> -l /tmp/result.jtl
>
> -e -o ./report_$(date +%Y%m%d_%H%M%S)
>
> - -n n = nonGUI ，不打开图形界面
>
> - -t t = test plan ，指定要运行的压测脚本文件
>
> - -J -J = 给 JMeter 传参数，压测结果保存格式 = CSV
>
> - **l = log** 把压测原始数据保存到：/tmp/result.jtl
>
> - -e e= generate report 压测结束后**自动生成 HTML 可视化报告**。
>
> - -o o=output,指定 HTML 报告输出目录，目录名带时间戳，例如：report_20251229_153022
>
> $(date +%Y%m%d_%H%M%S) 是 Linux 生成当前时间

### 6.1 查询皮肤配置

**第一次压测**

![查询皮肤配置第一次压测结果](/assets/images/jmeter/Jmeter业务实战.005.png)

压测时间：2026/04/01 14:08:21 ~ 2026/04/01 14:14:20

| 性能指标 | Jmeter 实际指标 | 华为云运维指标 | 分析 |
| :- | :- | :- | :- |
| 并发用户数 | 370 | 370 | - |
| 并发连接数 | 无 | 1071 | - |
| 请求次数 | 83917 | 83974 | 相对误差 0.03%，jmeter 聚合报告符合预期，运维指标符合预期 |
| 峰值 QPS | 16×3 = 48 QPS | 234.8/s | Jmeter TPS 指标符合预期 |
| 吞吐率 = 请求总数 / 总运行时间 | 234.8/s | 无 | jmeter 聚合报告符合预期 |
| 平均响应时长（ms） | 982ms | 982ms | - |

![华为云运维指标：并发连接数 1071](/assets/images/jmeter/Jmeter业务实战.006.png)

### 6.2 SDK 初始化

**压测（2026/03/31 10:56:52 - 2026/03/31 11:07:18）**

![SDK 初始化压测结果 1](/assets/images/jmeter/Jmeter业务实战.007.png)

![SDK 初始化压测结果 2](/assets/images/jmeter/Jmeter业务实战.008.png)

![SDK 初始化压测结果 3](/assets/images/jmeter/Jmeter业务实战.009.png)

**压测（2026/04/01 08:44:23 - 2026/04/01 08:54:32）**

![SDK 初始化压测结果 4](/assets/images/jmeter/Jmeter业务实战.010.png)

![SDK 初始化压测结果 5](/assets/images/jmeter/Jmeter业务实战.011.png)

**优化后的压测（2026/04/16 10:26 - 2026/04/16 10:30）**

执行上面的脚本 👇

**最终结果**

| 性能指标（目标&需求） | 第一次 jmeter | 第一次运维 | 第二次 jmeter | 第二次运维 | 第三次 jmeter | 第三次运维 | 分析 |
| :- | :- | :- | :- | :- | :- | :- | :- |
| 并发用户数 | 180 | 180 | 560 | 560 | 720 | 720 | - |
| 请求总次数 | 17418 | 17337（成功数） | 19793 | 19786（成功数） | 20880 | 20870（成功数） | 相对误差 0.03%，jmeter 聚合报告符合预期，运维指标符合预期 |
| 峰值 QPS（目标 36×3 = 108 QPS） | 43 | 无 | 83 | 无 | 61 | 无 | 参考 Jmeter TPS 指标 |
| 吞吐率 = 请求总数 / 总运行时间 | 28.9/s | 无 | 31.2/s | 无 | 20870/610s = 34.2% | 无 | jmeter 聚合报告符合预期 |
| 平均响应时长 | 2392ms | UAT 环境暂无指标 | 8545ms | UAT 环境暂无指标 | 10009ms | UAT 环境暂无指标 | - |

## 总结 & 复盘 & 分析

1. 线程数设置过大，导致服务器 Socket close 接口请求数量少，QPS 过低。