---
breadcrumbExclude: true
---

# JMeter 脚本结构详解

JMeter 的所有性能脚本，都以 **测试计划（Test Plan）** 为根节点组织和管理。

> 理解 Test Plan 的结构，等同于看懂整个 JMeter 脚本的“工程结构”，是学习 JMeter 的第一步。

了解 `.jmx` 文件格式类型，对 JMeter 二次开发与拓展有很大的帮助，当然也可以利用 Python 对其进行一些处理（生成一些测试用例，对 jmx 文件进行增删改查）。

一个完整用例的 `.jmx` 文件基本结构如下，类似于 XML 结构（树状结构）。Python 处理 XML 文件的模块有 `bs4`、`xml.dom`。

**jmx 文件的基础结构**：XML 是树形结构，JMeter 界面的树形结构就是 XML 的结构。

- 根目录：`jmeterTestPlan`
- 二级目录：`hashTree`
- 三级目录：`TestPlan`（测试计划）、`hashTree`（测试计划的配置）、`WorkBench`（工作台）、`hashTree`（工作台下面的配置）
- N 级目录：注意有些节点介绍后，后面会有一个标签

示例：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<jmeterTestPlan version="1.2" properties="5.0" jmeter="5.6.3">
  <hashTree>
    <!--测试计划配置-->
    <TestPlan guiclass="TestPlanGui" testclass="TestPlan" testname="北京雄安智慧园区平台-后端接口">
      <elementProp name="TestPlan.user_defined_variables" elementType="Arguments" guiclass="ArgumentsPanel" testclass="Arguments" testname="User Defined Variables">
        <collectionProp name="Arguments.arguments"/>
      </elementProp>
      <boolProp name="TestPlan.functional_mode">false</boolProp>
      <boolProp name="TestPlan.serialize_threadgroups">false</boolProp>
    </TestPlan>
    <!--http默认配置-->
    <hashTree>
      <HeaderManager guiclass="HeaderPanel" testclass="HeaderManager" testname="HTTP信息头管理器">
        <collectionProp name="HeaderManager.headers">
          <elementProp name="" elementType="Header">
            <stringProp name="Header.name">Authorization</stringProp>
            <stringProp name="Header.value">Bearer eyJ0eX...7X-8 </stringProp>
          </elementProp>
        </collectionProp>
      </HeaderManager>
      <hashTree/>
      <Arguments guiclass="ArgumentsPanel" testclass="Arguments" testname="用户定义的变量" enabled="true">
        <collectionProp name="Arguments.arguments">
          <elementProp name="ip" elementType="Argument">
            <stringProp name="Argument.name">ip</stringProp>
            <stringProp name="Argument.value">localhost</stringProp>
            <stringProp name="Argument.metadata">=</stringProp>
          </elementProp>
          <elementProp name="port" elementType="Argument">
            <stringProp name="Argument.name">port</stringProp>
            <stringProp name="Argument.value">15130</stringProp>
            <stringProp name="Argument.desc"></stringProp>
            <stringProp name="Argument.metadata">=</stringProp>
          </elementProp>
          <elementProp name="http" elementType="Argument">
            <stringProp name="Argument.name">http</stringProp>
            <stringProp name="Argument.value">http</stringProp>
            <stringProp name="Argument.metadata">=</stringProp>
          </elementProp>
          <elementProp name="influxToken" elementType="Argument">
            <stringProp name="Argument.name">influxToken</stringProp>
            <stringProp name="Argument.value">fzj2R1KQTYru9CMkBCYTqWuYN6v0jNjr-YgyZuTwHanr8r7L79tXEQs_678lB2oevnnaZVk5DONL4YrkHtFlYA==</stringProp>
            <stringProp name="Argument.metadata">=</stringProp>
          </elementProp>
        </collectionProp>
      </Arguments>
      <hashTree/>
      <PostThreadGroup guiclass="PostThreadGroupGui" testclass="PostThreadGroup" testname="上传Mp3文件">
        <intProp name="ThreadGroup.num_threads">50</intProp>
        <intProp name="ThreadGroup.ramp_time">1</intProp>
        <boolProp name="ThreadGroup.same_user_on_next_iteration">true</boolProp>
        <stringProp name="ThreadGroup.on_sample_error">continue</stringProp>
        <elementProp name="ThreadGroup.main_controller" elementType="LoopController" guiclass="LoopControlPanel" testclass="LoopController" testname="Loop Controller">
          <intProp name="LoopController.loops">-1</intProp>
          <boolProp name="LoopController.continue_forever">false</boolProp>
        </elementProp>
      </PostThreadGroup>
      <hashTree>
        <HTTPSamplerProxy guiclass="HttpTestSampleGui" testclass="HTTPSamplerProxy" testname="单节点50个文件/s并发" enabled="true">
          <stringProp name="HTTPSampler.domain">${ip}</stringProp>
          <stringProp name="HTTPSampler.port">${port}</stringProp>
          <stringProp name="HTTPSampler.protocol">${http}</stringProp>
          <stringProp name="HTTPSampler.path">/tech/contr/radioMediasAudio/addRadioMediasAudio</stringProp>
          <boolProp name="HTTPSampler.follow_redirects">true</boolProp>
          <stringProp name="HTTPSampler.method">POST</stringProp>
          <boolProp name="HTTPSampler.use_keepalive">true</boolProp>
          <boolProp name="HTTPSampler.DO_MULTIPART_POST">true</boolProp>
          <elementProp name="HTTPsampler.Files" elementType="HTTPFileArgs">
            <collectionProp name="HTTPFileArgs.files">
              <elementProp name="C:\Users\Administrator\Music\M500003wCRMm3X6LDd.mp3" elementType="HTTPFileArg">
                <stringProp name="File.mimetype">application/octet-stream</stringProp>
                <stringProp name="File.path">C:\Users\Administrator\Music\M500003wCRMm3X6LDd.mp3</stringProp>
                <stringProp name="File.paramname">file</stringProp>
              </elementProp>
            </collectionProp>
          </elementProp>
          <boolProp name="HTTPSampler.postBodyRaw">false</boolProp>
          <elementProp name="HTTPsampler.Arguments" elementType="Arguments" guiclass="HTTPArgumentsPanel" testclass="Arguments" testname="User Defined Variables">
            <collectionProp name="Arguments.arguments">
              <elementProp name="gid" elementType="HTTPArgument">
                <boolProp name="HTTPArgument.always_encode">false</boolProp>
                <stringProp name="Argument.value">1</stringProp>
                <stringProp name="Argument.metadata">=</stringProp>
                <boolProp name="HTTPArgument.use_equals">true</boolProp>
                <stringProp name="Argument.name">gid</stringProp>
              </elementProp>
            </collectionProp>
          </elementProp>
        </HTTPSamplerProxy>
        <hashTree>
          <ResultCollector guiclass="ViewResultsFullVisualizer" testclass="ResultCollector" testname="查看结果树" enabled="true">
            <boolProp name="ResultCollector.error_logging">false</boolProp>
            <objProp>
              <name>saveConfig</name>
              <value class="SampleSaveConfiguration">
                <time>true</time>
                <latency>true</latency>
                <timestamp>true</timestamp>
                <success>true</success>
                <label>true</label>
                <code>true</code>
                <message>true</message>
                <threadName>true</threadName>
                <dataType>true</dataType>
                <encoding>false</encoding>
                <assertions>true</assertions>
                <subresults>true</subresults>
                <responseData>false</responseData>
                <samplerData>false</samplerData>
                <xml>false</xml>
                <fieldNames>true</fieldNames>
                <responseHeaders>false</responseHeaders>
                <requestHeaders>false</requestHeaders>
                <responseDataOnError>false</responseDataOnError>
                <saveAssertionResultsFailureMessage>true</saveAssertionResultsFailureMessage>
                <assertionsResultsToSave>0</assertionsResultsToSave>
                <bytes>true</bytes>
                <sentBytes>true</sentBytes>
                <url>true</url>
                <threadCounts>true</threadCounts>
                <idleTime>true</idleTime>
                <connectTime>true</connectTime>
              </value>
            </objProp>
            <stringProp name="filename"></stringProp>
          </ResultCollector>
          <hashTree/>
          <ResultCollector guiclass="StatVisualizer" testclass="ResultCollector" testname="聚合报告" enabled="true">
            <boolProp name="ResultCollector.error_logging">false</boolProp>
            <objProp>
              <name>saveConfig</name>
              <value class="SampleSaveConfiguration">
                <time>true</time>
                <latency>true</latency>
                <timestamp>true</timestamp>
                <success>true</success>
                <label>true</label>
                <code>true</code>
                <message>true</message>
                <threadName>true</threadName>
                <dataType>true</dataType>
                <encoding>false</encoding>
                <assertions>true</assertions>
                <subresults>true</subresults>
                <responseData>false</responseData>
                <samplerData>false</samplerData>
                <xml>false</xml>
                <fieldNames>true</fieldNames>
                <responseHeaders>false</responseHeaders>
                <requestHeaders>false</requestHeaders>
                <responseDataOnError>false</responseDataOnError>
                <saveAssertionResultsFailureMessage>true</saveAssertionResultsFailureMessage>
                <assertionsResultsToSave>0</assertionsResultsToSave>
                <bytes>true</bytes>
                <sentBytes>true</sentBytes>
                <url>true</url>
                <threadCounts>true</threadCounts>
                <idleTime>true</idleTime>
                <connectTime>true</connectTime>
              </value>
            </objProp>
            <stringProp name="filename"></stringProp>
          </ResultCollector>
          <hashTree/>
        </hashTree>
        <HeaderManager guiclass="HeaderPanel" testclass="HeaderManager" testname="HTTP信息头管理器" enabled="true">
          <collectionProp name="HeaderManager.headers">
            <elementProp name="" elementType="Header">
              <stringProp name="Header.name">Content-Type</stringProp>
              <stringProp name="Header.value">multipart/form-data</stringProp>
            </elementProp>
          </collectionProp>
        </HeaderManager>
        <hashTree/>
        <BackendListener guiclass="BackendListenerGui" testclass="BackendListener" testname="后端监听器" enabled="true">
          <elementProp name="arguments" elementType="Arguments" guiclass="ArgumentsPanel" testclass="Arguments">
            <collectionProp name="Arguments.arguments">
              <elementProp name="testName" elementType="Argument">
                <stringProp name="Argument.name">testName</stringProp>
                <stringProp name="Argument.value">Test</stringProp>
                <stringProp name="Argument.metadata">=</stringProp>
              </elementProp>
              <elementProp name="nodeName" elementType="Argument">
                <stringProp name="Argument.name">nodeName</stringProp>
                <stringProp name="Argument.value">Test-Node</stringProp>
                <stringProp name="Argument.metadata">=</stringProp>
              </elementProp>
              <elementProp name="runId" elementType="Argument">
                <stringProp name="Argument.name">runId</stringProp>
                <stringProp name="Argument.value">R001</stringProp>
                <stringProp name="Argument.metadata">=</stringProp>
              </elementProp>
              <elementProp name="influxDBURL" elementType="Argument">
                <stringProp name="Argument.name">influxDBURL</stringProp>
                <stringProp name="Argument.value">http://localhost:8086/</stringProp>
                <stringProp name="Argument.metadata">=</stringProp>
              </elementProp>
              <elementProp name="influxDBToken" elementType="Argument">
                <stringProp name="Argument.name">influxDBToken</stringProp>
                <stringProp name="Argument.value">${influxToken}</stringProp>
                <stringProp name="Argument.metadata">=</stringProp>
              </elementProp>
              <elementProp name="influxDBOrganization" elementType="Argument">
                <stringProp name="Argument.name">influxDBOrganization</stringProp>
                <stringProp name="Argument.value">jmeter</stringProp>
                <stringProp name="Argument.metadata">=</stringProp>
              </elementProp>
              <elementProp name="influxDBBucket" elementType="Argument">
                <stringProp name="Argument.name">influxDBBucket</stringProp>
                <stringProp name="Argument.value">jmeter</stringProp>
                <stringProp name="Argument.metadata">=</stringProp>
              </elementProp>
              <elementProp name="influxDBFlushInterval" elementType="Argument">
                <stringProp name="Argument.name">influxDBFlushInterval</stringProp>
                <stringProp name="Argument.value">4000</stringProp>
                <stringProp name="Argument.metadata">=</stringProp>
              </elementProp>
              <elementProp name="influxDBMaxBatchSize" elementType="Argument">
                <stringProp name="Argument.name">influxDBMaxBatchSize</stringProp>
                <stringProp name="Argument.value">2000</stringProp>
                <stringProp name="Argument.metadata">=</stringProp>
              </elementProp>
              <elementProp name="influxDBThresholdError" elementType="Argument">
                <stringProp name="Argument.name">influxDBThresholdError</stringProp>
                <stringProp name="Argument.value">5</stringProp>
                <stringProp name="Argument.metadata">=</stringProp>
              </elementProp>
              <elementProp name="samplersList" elementType="Argument">
                <stringProp name="Argument.name">samplersList</stringProp>
                <stringProp name="Argument.value">.*</stringProp>
                <stringProp name="Argument.metadata">=</stringProp>
              </elementProp>
              <elementProp name="useRegexForSamplerList" elementType="Argument">
                <stringProp name="Argument.name">useRegexForSamplerList</stringProp>
                <stringProp name="Argument.value">true</stringProp>
                <stringProp name="Argument.metadata">=</stringProp>
              </elementProp>
              <elementProp name="recordSubSamples" elementType="Argument">
                <stringProp name="Argument.name">recordSubSamples</stringProp>
                <stringProp name="Argument.value">true</stringProp>
                <stringProp name="Argument.metadata">=</stringProp>
              </elementProp>
              <elementProp name="saveResponseBodyOfFailures" elementType="Argument">
                <stringProp name="Argument.name">saveResponseBodyOfFailures</stringProp>
                <stringProp name="Argument.value">true</stringProp>
                <stringProp name="Argument.metadata">=</stringProp>
              </elementProp>
              <elementProp name="responseBodyLength" elementType="Argument">
                <stringProp name="Argument.name">responseBodyLength</stringProp>
                <stringProp name="Argument.value">2000</stringProp>
                <stringProp name="Argument.metadata">=</stringProp>
              </elementProp>
            </collectionProp>
          </elementProp>
          <stringProp name="classname">io.github.mderevyankoaqa.influxdb2.visualizer.InfluxDatabaseBackendListenerClient</stringProp>
        </BackendListener>
        <hashTree/>
      </hashTree>
      <PostThreadGroup guiclass="PostThreadGroupGui" testclass="PostThreadGroup" testname="分页查询终端列表">
        <intProp name="ThreadGroup.num_threads">1</intProp>
        <intProp name="ThreadGroup.ramp_time">1</intProp>
        <boolProp name="ThreadGroup.same_user_on_next_iteration">true</boolProp>
        <stringProp name="ThreadGroup.on_sample_error">continue</stringProp>
        <elementProp name="ThreadGroup.main_controller" elementType="LoopController" guiclass="LoopControlPanel" testclass="LoopController" testname="循环控制器">
          <stringProp name="LoopController.loops">1</stringProp>
          <boolProp name="LoopController.continue_forever">false</boolProp>
        </elementProp>
      </PostThreadGroup>
      <hashTree>
        <HTTPSamplerProxy guiclass="HttpTestSampleGui" testclass="HTTPSamplerProxy" testname="分页查询终端列表">
          <stringProp name="HTTPSampler.domain">${ip}</stringProp>
          <stringProp name="HTTPSampler.port">${port}</stringProp>
          <stringProp name="HTTPSampler.protocol">http</stringProp>
          <stringProp name="HTTPSampler.path">/tech/radioTerminals/getListPageRadioTerminals</stringProp>
          <boolProp name="HTTPSampler.follow_redirects">true</boolProp>
          <stringProp name="HTTPSampler.method">POST</stringProp>
          <boolProp name="HTTPSampler.use_keepalive">true</boolProp>
          <boolProp name="HTTPSampler.postBodyRaw">true</boolProp>
          <elementProp name="HTTPsampler.Arguments" elementType="Arguments">
            <collectionProp name="Arguments.arguments">
              <elementProp name="" elementType="HTTPArgument">
                <boolProp name="HTTPArgument.always_encode">false</boolProp>
                <stringProp name="Argument.value">{&quot;current&quot;:1,&quot;size&quot;:10,&quot;param&quot;:{&quot;name&quot;:&quot;&quot;}}&#xd;
</stringProp>
                <stringProp name="Argument.metadata">=</stringProp>
              </elementProp>
            </collectionProp>
          </elementProp>
        </HTTPSamplerProxy>
        <hashTree>
          <ResultCollector guiclass="ViewResultsFullVisualizer" testclass="ResultCollector" testname="查看结果树" enabled="true">
            <boolProp name="ResultCollector.error_logging">false</boolProp>
            <objProp>
              <name>saveConfig</name>
              <value class="SampleSaveConfiguration">
                <time>true</time>
                <latency>true</latency>
                <timestamp>true</timestamp>
                <success>true</success>
                <label>true</label>
                <code>true</code>
                <message>true</message>
                <threadName>true</threadName>
                <dataType>true</dataType>
                <encoding>false</encoding>
                <assertions>true</assertions>
                <subresults>true</subresults>
                <responseData>false</responseData>
                <samplerData>false</samplerData>
                <xml>false</xml>
                <fieldNames>true</fieldNames>
                <responseHeaders>false</responseHeaders>
                <requestHeaders>false</requestHeaders>
                <responseDataOnError>false</responseDataOnError>
                <saveAssertionResultsFailureMessage>true</saveAssertionResultsFailureMessage>
                <assertionsResultsToSave>0</assertionsResultsToSave>
                <bytes>true</bytes>
                <sentBytes>true</sentBytes>
                <url>true</url>
                <threadCounts>true</threadCounts>
                <idleTime>true</idleTime>
                <connectTime>true</connectTime>
              </value>
            </objProp>
            <stringProp name="filename"></stringProp>
          </ResultCollector>
          <hashTree/>
          <ResultCollector guiclass="StatVisualizer" testclass="ResultCollector" testname="聚合报告" enabled="true">
            <boolProp name="ResultCollector.error_logging">false</boolProp>
            <objProp>
              <name>saveConfig</name>
              <value class="SampleSaveConfiguration">
                <time>true</time>
                <latency>true</latency>
                <timestamp>true</timestamp>
                <success>true</success>
                <label>true</label>
                <code>true</code>
                <message>true</message>
                <threadName>true</threadName>
                <dataType>true</dataType>
                <encoding>false</encoding>
                <assertions>true</assertions>
                <subresults>true</subresults>
                <responseData>false</responseData>
                <samplerData>false</samplerData>
                <xml>false</xml>
                <fieldNames>true</fieldNames>
                <responseHeaders>false</responseHeaders>
                <requestHeaders>false</requestHeaders>
                <responseDataOnError>false</responseDataOnError>
                <saveAssertionResultsFailureMessage>true</saveAssertionResultsFailureMessage>
                <assertionsResultsToSave>0</assertionsResultsToSave>
                <bytes>true</bytes>
                <sentBytes>true</sentBytes>
                <url>true</url>
                <threadCounts>true</threadCounts>
                <idleTime>true</idleTime>
                <connectTime>true</connectTime>
              </value>
            </objProp>
            <stringProp name="filename"></stringProp>
          </ResultCollector>
          <hashTree/>
          <HeaderManager guiclass="HeaderPanel" testclass="HeaderManager" testname="HTTP信息头管理器" enabled="true">
            <collectionProp name="HeaderManager.headers">
              <elementProp name="" elementType="Header">
                <stringProp name="Header.name">Content-typ</stringProp>
                <stringProp name="Header.value">application/json</stringProp>
              </elementProp>
            </collectionProp>
          </HeaderManager>
          <hashTree/>
        </hashTree>
      </hashTree>
    </hashTree>
  </hashTree>
</jmeterTestPlan>
```

**Jmx 标签大全**

JMeter API 文档：https://jmeter.apache.org/api/org/apache/jmeter/testelement/TestPlan.html

## 1. 根目录：`jmeterTestPlan`

```xml
<jmeterTestPlan version="1.2" properties="5.0" jmeter="5.6.3">
```

属性：

- `version`：版本
- `properties`：属性版本
- `jmeter`：JMeter 版本

## 2. `<hashTree>`

JMX 本质是 XML 文件，以 **递归嵌套** 的方式定义测试计划的父子关系。

典型结构：`jmeterTestPlan` → `hashTree` → `TestPlan` → `hashTree` → `ThreadGroup` → `hashTree` → `Sampler` → `hashTree` → `Listener` / `Assertion` ...

每个测试元素（线程组、取样器、监听器等）都被包裹在 `<hashTree>` 中，形成清晰的层级。

**原理：支撑 JMeter 引擎运行**

- JMeter 启动时，会将 JMX 解析为内存中的 HashTree 对象（底层由 ListedHashTree 实现）。
- JMeter 引擎通过 `traverse()` 遍历该树，按层级执行测试逻辑。
- 每个元素（TestPlan / ThreadGroup / HTTPSamplerProxy）后紧跟 `<hashTree>`，用于容纳其子元素。
- 无子元素时，写 `<hashTree/>` 闭合，保证结构完整。

```xml
<TestPlan ...>
  <hashTree>
    <ThreadGroup ...>
      <hashTree>
        <HTTPSamplerProxy ...>
          <hashTree>
            <ResponseAssertion .../>
            <hashTree/>
          </hashTree>
        </HTTPSamplerProxy>
        <hashTree>
          <ViewResultsTree .../>
          <hashTree/>
        </hashTree>
      </hashTree>
    </ThreadGroup>
    <hashTree/>
  </hashTree>
</TestPlan>
```

## 3. `<TestPlan>`

- `guiclass="TestPlanGui"`：指定在 JMeter GUI 中显示此元素时使用的界面类，这里是测试计划专用的 GUI 类。
- `testclass="TestPlan"`：声明该元素的类型为“测试计划”（Test Plan），JMeter 通过此属性识别元素种类。
- `testname="gacall-uat"`：测试计划的名称，在 GUI 中显示为“gacall-uat”，用于标识本次压测的场景（例如 UAT 环境下的广汽传祺相关压测）。
- `enabled="true"`：表示该测试计划当前为启用状态，执行时会被包含；若为 false 则跳过。

### 3.1 子属性配置

- `TestPlan.comments`（TestPlan 对象的注释，类型为 String）：对应测试计划的“注释”字段，通常用于填写说明文字。此处为空。
- `TestPlan.functional_mode`（类型为 boolean 的功能模式）：如果设为 true，JMeter 会保存每个请求的响应数据（用于录制/调试），但会极大增加内存消耗，性能测试时通常设为 false。
- `TestPlan.tearDown_on_shutdown`（关闭时运行 tearDown 线程组）：控制是否在测试计划正常结束后执行 tearDown 线程组。
  - `true`：即使测试被手动停止，也会执行 tearDown 线程组中的清理逻辑（如登出、删除数据）。
  - `false`：立即停止，不执行 tearDown。
- `TestPlan.serialize_threadgroups`：决定测试计划中的多个线程组是并行执行还是串行执行。
  - `true`：依次执行每个线程组（前一个结束后再启动下一个）。
  - `false`：所有线程组同时启动。
- `TestPlan.user_defined_variables`（elementProp 标签）：对应测试计划中的“用户定义的变量”配置块，允许在此定义全局变量（如服务器地址、端口等）。
  - `elementType="Arguments"` 表示这是一个参数列表。
  - `<collectionProp>` 是存放具体变量的容器，此处为空，表示未定义任何变量。
- `TestPlan.user_define_classpath`：用户定义的类路径，用于指定额外的 Java 类路径（如第三方库的路径），通常用于加载自定义函数或插件。此处为空。

```xml
<TestPlan guiclass="TestPlanGui" testclass="TestPlan" testname="测试计划" enabled="true">
  <!--字符串属性 tag-->
  <stringProp name="TestPlan.comments"></stringProp>
  <!--布尔属性 tag-->
  <boolProp name="TestPlan.functional_mode">false</boolProp>
  <boolProp name="TestPlan.serialize_threadgroups">false</boolProp>
  <elementProp name="TestPlan.user_defined_variables" elementType="Arguments" guiclass="ArgumentsPanel" testclass="Arguments" testname="用户定义的变量" enabled="true">
    <collectionProp name="Arguments.arguments"/>
  </elementProp>
  <stringProp name="TestPlan.user_define_classpath"></stringProp>
</TestPlan>
```

### 3.2 什么是 Test Plan（测试计划）？

> 将从 Test Plan 的概念 → 基础结构 → 运行机制 → 变量管理 → 示例结构图全面讲解。

Test Plan 是 JMeter 中所有测试组件的最顶层容器，相当于：

- 一个项目工程（Project）
- 一个完整的压测方案（Test Scenario）
- 一个脚本的执行入口（Execution Root）

它定义了：

- 执行哪些线程组
- 每个线程组怎么运行
- 使用什么取样器发送请求
- 用哪些定时器控制等待
- 用哪些断言判断正确性
- 用哪些监听器收集结果
- 用哪些配置元件提供参数或环境变量

**一句话：Test Plan = JMeter 脚本的根骨架。**

![JMeter 脚本结构图](/assets/images/jmeter/Jmeter脚本结构详解(持续更新).001.png)

### 3.3 Test Plan 的核心任务

Test Plan 主要承担 5 个核心职责：

**① 组织所有测试组件**

所有逻辑控制器、取样器、断言、定时器等都必须挂载在测试计划的树形结构中。

**② 管理运行方式**

包括：

- 是否循环运行
- 是否独立运行每个线程组（Run each Thread Group separately）
- 是否按顺序运行线程组

**③ 定义全局变量（User Variables）**

你可以在 Test Plan 中定义全局参数，例如：

![用户自定义变量配置](/assets/images/jmeter/Jmeter脚本结构详解(持续更新).002.jpeg)

**点击图片可查看完整电子表格**

这些变量可以通过 `${变量名}` 在整个脚本中使用。

**④ 管理脚本编码与保存方式**

Test Plan 为脚本保存提供设置：

- 脚本编码（UTF-8 强烈推荐）
- 在保存时是否删除结果（推荐开启）

**⑤ 管理插件加载与执行资源**

如 JMeter-Plugins、JDBC 驱动等，都依赖测试计划加载执行。

### 3.4 JMeter 脚本的标准结构

一个典型的 JMeter 测试计划包含如下结构：

```text
Test Plan
├── User Defined Variables（用户自定义变量）
├── Thread Group（线程组 1）
│   ├── Config Elements（配置元件）
│   ├── Logic Controllers（逻辑控制器）
│   │   ├── Sampler（取样器）
│   │   ├── Pre-Processor（前置处理器）
│   │   ├── Post-Processor（后置处理器）
│   │   └── Assertions（断言）
│   ├── Timers（定时器）
│   └── Listeners（监听器）
├── Thread Group（线程组 2）
│   └──（与线程组 1 结构类似）
└── Non-Test Elements（非测试组件，如 TCP Sampler 配置等）
```

这就是 **JMeter Test Plan 的标准树形结构**。

### 3.5 Test Plan 的属性详解

打开测试计划，右侧会出现一些基础属性，下面逐项解释。

![Test Plan 属性面板](/assets/images/jmeter/Jmeter脚本结构详解(持续更新).003.png)

#### 3.5.1 Name（名称）

脚本的名称，可以写成描述性文字，例如：

- “用户登录压测计划”
- “订单系统接口性能测试”

#### 3.5.2 User Defined Variables（用户自定义变量）

提供全局变量功能，例如：

```toml
host = 192.168.1.10
port = 8080
protocol = http
env = test
```

所有取样器可以通过 `${host}` 引用。

**推荐用途：**

- 环境切换（test / pre / prod）
- 全局超时时间
- 公共参数
- 公共 Header

#### 3.5.3 Run Thread Groups consecutively（按顺序执行线程组）

- 默认：并行（同一 Test Plan 下）
- 开启后：线程组按顺序串行执行

用途示例：

![按顺序执行线程组配置](/assets/images/jmeter/Jmeter脚本结构详解(持续更新).004.jpeg)

**点击图片可查看完整电子表格**

#### 3.5.4 Run tearDown Thread Groups after shutdown of main threads（关闭后执行回收线程组）

- shutdown 正常关闭 → teardown 执行
- stop 强制关闭 → teardown 不执行

用于：

- 清理测试数据
- 发送关闭请求
- 打印最终日志

#### 3.5.5 Functional Test Mode（功能测试模式）

不推荐用于性能压测。

开启后：

- 保存更多信息
- 显著降低性能

#### 3.5.6 Add directory or jar to classpath（扩展 classpath）

用于加载：

- JDBC 驱动
- 扩展插件
- 自定义 Java 代码

实际场景：**使用 JDBC Sampler 一定要加载数据库驱动（mysql-connector.jar）**。

### 3.6 TestPlan 脚本设计及原理

#### 3.6.1 JMeter 脚本的执行机制（重点）

理解执行顺序有助于正确设计脚本结构。

**执行顺序（组件优先级）**

一个取样器执行时，各组件按如下顺序运行：

> 逻辑控制器 → 前置处理器 → 定时器 → 取样器（Sampler） → 后置处理器 → 断言 → 监听器

> **必须记住的顺序：Pre → Timer → Sampler → Post → Assertion → Listener**

#### 3.6.2 一个完整测试计划示例（结构化展示）

```text
Test Plan: 电商系统下单性能测试
├── User Defined Variables
│   ├── host = api.shop.com
│   └── token = ABC123
├── Thread Group：用户登录 + 加载首页
│   ├── HTTP Header Manager
│   ├── Once Only Controller
│   │   └── HTTP Sampler：登录接口 /login
│   ├── Loop Controller（循环 10 次）
│   │   └── HTTP Sampler：访问首页 /index
│   ├── Regular Expression Extractor（提取 sessionId）
│   ├── JSON Assertion（判断响应 code=200）
│   ├── Constant Timer（500ms）
│   └── Aggregate Report
└── Thread Group：用户创建订单
    ├── CSV Data Set Config（读取商品 ID）
    ├── Transaction Controller（下单事务）
    │   ├── HTTP Sampler：加购物车 /cart/add
    │   └── HTTP Sampler：提交订单 /order/create
    ├── User Parameters（个性化参数）
    ├── JSR223 PostProcessor（输出日志）
    ├── Response Assertion
    └── Summary Report
```

#### 3.6.3 Test Plan 设计最佳实践

**① 脚本参数统一放在 Test Plan → User Variables**

避免分散 hardcode 参数。

**② 一个线程组只做一类场景**

例如：

- 登录场景
- 下单场景
- 商品浏览场景

便于调优和扩容。

**③ 避免在 Test Plan 顶层放取样器或监听器**

应放在线程组内部。

**④ 使用逻辑控制器分段管理脚本**

便于阅读和调试。

**⑤ 大规模压测不要加入过多监听器**

推荐仅保留：

- Summary Report
- Backend Listener（InfluxDB + Grafana）

## 4. `<ThreadGroup>` 核心线程组

**Ramping-Up**

> JMeter 将所有 users（threads，测试用户/线程）添加到测试执行所需的时间。

## 5. `<BeanShellPreProcessor>` BeanShell 程序预处理器

## 6. `<HeaderManager>` 请求头管理器

## 7. `<ResultCollector>` 查看结果树

```xml
<ResultCollector guiclass="ViewResultsFullVisualizer" testclass="ResultCollector" testname="察看结果树" enabled="false">
  <boolProp name="ResultCollector.error_logging">false</boolProp>
  <objProp>
    <name>saveConfig</name>
    <value class="SampleSaveConfiguration">
      <time>true</time>
      <latency>true</latency>
      <timestamp>true</timestamp>
      <success>true</success>
      <label>true</label>
      <code>true</code>
      <message>true</message>
      <threadName>true</threadName>
      <dataType>true</dataType>
      <encoding>false</encoding>
      <assertions>true</assertions>
      <subresults>true</subresults>
      <responseData>false</responseData>
      <samplerData>false</samplerData>
      <xml>false</xml>
      <fieldNames>true</fieldNames>
      <responseHeaders>false</responseHeaders>
      <requestHeaders>false</requestHeaders>
      <responseDataOnError>false</responseDataOnError>
      <saveAssertionResultsFailureMessage>true</saveAssertionResultsFailureMessage>
      <assertionsResultsToSave>0</assertionsResultsToSave>
      <bytes>true</bytes>
      <sentBytes>true</sentBytes>
      <url>true</url>
      <threadCounts>true</threadCounts>
      <idleTime>true</idleTime>
      <connectTime>true</connectTime>
    </value>
  </objProp>
  <stringProp name="filename">F:\personDocs\work_docs\DS\scripts\report\result_tree\tree2</stringProp>
</ResultCollector>
```

### 7.1 子属性配置

### 7.2 适用场景

## 8. `<ThroughputController>` 吞吐量控制器

执行模式：有两种控制模式，通过 Per User 复选框切换。

- **Total Executions**：所有线程（虚拟用户）共同统计，达到总执行次数后停止执行子元件。
  - 按总次数执行。Throughput 设为具体数值，如 5，表示在 Total 模式下所有用户总共执行 5 次子元件；如果勾选了 Per User 模式代表每个用户执行 5 次。
- **Percent Executions**：按百分比执行。当 Throughput 设为 50.0 时，表示有 50% 的迭代会执行子元件（在 Total 模式下全局有效，在 Per User 模式下每个用户独立概率）。
- **Per User（勾选 Per User）**：每个用户（线程）独立统计，每个用户最多执行指定次数或比例。

**适用场景**

- **混合负载**：在同一个测试计划中，通过多个 Throughput Controller 按比例分配不同业务请求（如 70% 浏览商品，20% 加入购物车，10% 支付）。混合负载比例（70% 高频，20% 中频，10% 低频）。

```text
# 每个用户 70% 浏览商品，20% 加入购物车，10% 支付
1) 在测试计划中，将高频/中频/低频请求分别放在 3 个 Throughput Controller 下方。
2) 设置 Throughput Controller 的属性：
   Style：选择 Percent Executions（比例模式）
   3 个 Throughput：填写 70、20、10
3) 勾选 Per User
4) 运行测试后，每个虚拟用户（线程）在整个测试过程中最多只会执行一次该登录请求。
```

- **控制登录次数**：避免所有用户同时登录，每个用户仅执行一次登录操作。

```text
# 配置步骤
1. 在测试计划中，将登录请求（如 HTTP 请求）放在一个 Throughput Controller 下方。
2. 设置 Throughput Controller 的属性：
   Style：选择 Total Executions（次数模式）
   Throughput：填写 1
3. 勾选 Per User
4. 运行测试后，每个虚拟用户（线程）在整个测试过程中最多只会执行一次该登录请求。
```

- **限流模拟**：控制某个接口总请求量不超过指定阈值。

> Style：Total Executions
> Throughput：50
> 不勾选 Per User
> 所有用户共享这 50 次执行机会，达到次数后该控制器下的请求不再执行

- **每个用户最多执行某操作 N 次**（如每个用户最多添加 5 次商品）

> Style：Total Executions
> Throughput：5
> 勾选 Per User

- **按概率执行**（每个用户每次迭代以 30% 概率执行某操作）

> Style：Percent Executions
> Throughput：30.0
> 勾选 Per User

**注意事项**

- 吞吐量控制器是基于迭代次数控制的，不是严格的时间间隔控制。如果需要精确控制每秒请求数（RPS），建议使用 Constant Throughput Timer。
- 在百分比模式下，实际比例会随着迭代次数增加逐渐逼近设定值，但短期可能波动较大。
- 当与其他逻辑控制器（如 Loop Controller）嵌套使用时，需要理解迭代统计的边界，通常每个“迭代”指外层循环的一次循环。

## 9. `<CSV Data Set Config>`

**常用插件：**

**Custom Thread Groups**

> Adds new Thread Groups:
>
> - [Stepping Thread Group](https://jmeter-plugins.org/wiki/SteppingThreadGroup)
> - [Ultimate Thread Group](https://jmeter-plugins.org/wiki/UltimateThreadGroup)
> - [Concurrency Thread Group](https://jmeter-plugins.org/wiki/ConcurrencyThreadGroup)
> - [Arrivals Thread Group](https://jmeter-plugins.org/wiki/ArrivalsThreadGroup)
> - [Free-Form Arrivals Thread Group](https://jmeter-plugins.org/wiki/FreeFormArrivalsThreadGroup)
>
> Documentation:

### 9.1 UltimateThreadGroup 步进负载加速

> https://jmeter-plugins.org/wiki/UltimateThreadGroup/
>
> "Ultimate" means there will be no need in further Thread Group plugins. The features that everyone needed in JMeter and they finally available:
>
> - infinite number of schedule records
> - separate ramp-up time, shutdown time, flight time for each schedule record（每个调度记录都有独立的启动时间、关闭时间和运行时间）
> - 支持阶梯加压、多个阶段
> - and, of course, trustworthy load preview graph（支持负载图形化）
> - 由于参数名是数字，需要映射到实际含义。UltimateThreadGroup 在 JMeter 插件中，每个阶段包含五个参数，通常顺序为：Start Threads Count（起始线程数）、Initial Delay（初始延迟，秒）、Startup Time（启动时间，秒）、Hold Time（保持时间，秒）、Shutdown Time（关闭时间，秒）
> - 阶梯负载对应：
>   - 前几个阶段（每个阶段 60 秒）：模拟活动预热期，用户缓慢增加，系统需要处理预热流量。
>   - 中间阶段：用户加速涌入，对应活动开始前的最后几分钟。
>   - 最后 1 分钟达到峰值：对应秒杀开始的瞬间，所有用户同时点击抢购。
>   - 测试目的：验证系统在瞬时高并发下的响应时间、成功率，以及资源（CPU/内存/数据库连接）能否承受住压力。

**特性**

1. Start Threads Count（起始线程数）
2. 初始延迟（Initial Delay，秒）——从测试开始到本阶段开始启动线程的等待时间
3. 启动时间（Startup Time，秒）——在多少秒内将线程数从 0 增加到设定值（约等于默认线程组的 Ramping-Up）

```text
# 假设
1000 个目标线程，Startup Time = 1000，即每秒添加一个用户。属于低并发。
```

4. 保持时间（Hold Time，秒）——达到目标线程数后持续运行的时间
5. 关闭时间（Shutdown Time，秒）——停止所有线程所用的时间

![Ultimate Thread Group 配置界面](/assets/images/jmeter/Jmeter脚本结构详解(持续更新).005.png)

```xml
<kg.apc.jmeter.threads.UltimateThreadGroup guiclass="kg.apc.jmeter.threads.UltimateThreadGroupGui" testclass="kg.apc.jmeter.threads.UltimateThreadGroup" testname="jp@gc - Ultimate Thread Group" enabled="false">
  <collectionProp name="ultimatethreadgroupdata">
    <collectionProp name="-465306421">
      <stringProp name="1691">50</stringProp>
      <stringProp name="48">0</stringProp>
      <stringProp name="1629">30</stringProp>
      <stringProp name="1722">60</stringProp>
      <stringProp name="10">10</stringProp>
    </collectionProp>
    <collectionProp name="86684654">
      <stringProp name="48780">150</stringProp>
      <stringProp name="1722">60</stringProp>
      <stringProp name="1629">30</stringProp>
      <stringProp name="1722">60</stringProp>
      <stringProp reference="../../collectionProp/stringProp[5]"/>
    </collectionProp>
    <collectionProp name="1422976023">
      <stringProp name="49586">200</stringProp>
      <stringProp name="48687">120</stringProp>
      <stringProp name="1629">30</stringProp>
      <stringProp name="1722">60</stringProp>
      <stringProp reference="../../collectionProp/stringProp[5]"/>
    </collectionProp>
    <collectionProp name="494437954">
      <stringProp name="49741">250</stringProp>
      <stringProp name="48873">180</stringProp>
      <stringProp name="1629">30</stringProp>
      <stringProp name="1722">60</stringProp>
      <stringProp reference="../../collectionProp/stringProp[5]"/>
    </collectionProp>
    <collectionProp name="1773865474">
      <stringProp name="50547">300</stringProp>
      <stringProp reference="../../collectionProp[4]/stringProp[2]"/>
      <stringProp name="1629">30</stringProp>
      <stringProp name="50547">300</stringProp>
      <stringProp reference="../../collectionProp/stringProp[5]"/>
    </collectionProp>
  </collectionProp>
  <elementProp name="ThreadGroup.main_controller" elementType="LoopController" guiclass="LoopControlPanel" testclass="LoopController" testname="循环控制器" enabled="true">
    <boolProp name="LoopController.continue_forever">false</boolProp>
    <intProp name="LoopController.loops">-1</intProp>
  </elementProp>
  <stringProp name="ThreadGroup.on_sample_error">continue</stringProp>
</kg.apc.jmeter.threads.UltimateThreadGroup>
```

**阶段一**

```xml
<collectionProp name="-465306421">
  <stringProp name="1691">50</stringProp>    <!-- 线程数：50 -->
  <stringProp name="48">0</stringProp>       <!-- 初始延迟：0 秒（立即开始） -->
  <stringProp name="1629">30</stringProp>    <!-- 启动时间：30 秒内启动 50 个线程 -->
  <stringProp name="1722">60</stringProp>    <!-- 保持时间：达到 50 线程后持续 60 秒 -->
  <stringProp name="10">10</stringProp>      <!-- 关闭时间：10 秒内停止线程 -->
</collectionProp>
```

行为：测试开始后立即启动线程，30 秒内达到 50 并发，保持 60 秒，然后花 10 秒关闭。阶段执行总时间为 0 + 30 + 60 + 10 = 100 秒。

**阶段二**

```xml
<collectionProp name="86684654">
  <stringProp name="48780">150</stringProp>  <!-- 线程数：150 -->
  <stringProp name="1722">60</stringProp>    <!-- 初始延迟：60 秒（测试开始后 60 秒才开始启动） -->
  <stringProp name="1629">30</stringProp>    <!-- 启动时间：30 秒内启动 150 线程 -->
  <stringProp name="1722">60</stringProp>    <!-- 保持时间：60 秒 -->
  <stringProp reference="../../collectionProp/stringProp[5]"/>  <!-- 关闭时间引用阶段 1 的第 5 个参数，即 10 秒 -->
</collectionProp>
```

行为：测试开始后等待 60 秒后启动线程，要在 30 秒内启动 150 线程，保持 60 秒，测试关闭时间 10 秒。阶段二总时间为 60 + 30 + 60 + 10 = 160 秒。

**阶段叠加效果**

由于阶段之间的初始延迟可能重叠，实际并发数是所有活跃阶段线程数的总和。根据上述时间线：

- 0~60 秒：仅阶段 1 运行（50 线程）。
- 60~100 秒：阶段 1（50） + 阶段 2 启动/保持（150） → 总并发 200（但阶段 2 启动期内线程数逐渐增加）。
- 100~120 秒：阶段 1 结束，仅阶段 2（150）运行。
- 120~160 秒：阶段 2（150） + 阶段 3 启动/保持（200） → 总并发 350。
- 160~180 秒：阶段 2 结束，仅阶段 3（200）。
- 180~220 秒：阶段 3（200） + 阶段 4 启动/保持（250） + 阶段 5 启动（300） → 总并发 750（但阶段 4/5 启动期内逐渐增加）。
- 220~280 秒：阶段 3 结束，阶段 4（250） + 阶段 5（300） → 总并发 550。
- 280~520 秒：阶段 4 结束，仅阶段 5（300）运行。

最终形成一个阶梯上升、部分重叠、最后长时保持的负载模型。

> 预览线程组计划运行的并发用户数曲线。
> 用户在多行配置中填写的“Start Threads Count”、“Initial Delay”、“Startup Time”、“Hold Load For”、“Shutdown Time”等参数，自动计算并动态展示整个测试期间预期会同时运行的线程数量随时间的变化。
> 通过这条曲线直观地确认你配置的负载模型是否符合预期。

**场景一：脉冲式/尖峰测试（Spike Testing）/波峰波谷压测（多场次秒杀/抢购，如电商平台一天内多波次秒杀）**

> 对应波形：每个波峰对应一场秒杀，波谷对应两场之间的间歇期，而波谷仍保留少量基础流量（如仍在浏览其他商品的用户）
>
> 设计要点：
>
> 要实现脉冲/尖峰测试：
>
> - 需要设置一个 Startup Time 很短（如 1-5 秒）的线程组，代表用户瞬间涌入。
> - Hold Load for 很短，代表持续时间很短【如 10s 后没抢到用户就离开了】。
> - 可以配置多个这样的脉冲组，并设置好 Initial Delay 来模拟多波冲击。

1. 电商秒杀/抢购预热活动

```text
单一时间秒杀
场景描述：某电商平台计划在 10:00 开启限时秒杀。活动开始前 5 分钟，用户陆续进入商品页面等待；临近开始，用户量急剧上升；秒杀瞬间，并发达到最高峰；之后随着库存减少，用户逐步退出。

多场次秒杀/抢购（如电商平台一天内多波次秒杀）
场景描述：
    平台在一天内设置多个整点秒杀场次（如 10:00、12:00、20:00）。
    每个场次开始前用户提前进入预热（并发攀升），秒杀瞬间达到峰值；秒杀结束后用户快速退出（并发骤降至基础流量）；下一场次开始前用户又开始涌入，再次形成新波峰。
```

2. 节日票务抢购（如春运火车票、演唱会门票）

```text
节日票务抢购（如春运火车票、演唱会门票）
场景描述：
    放票时间点前，大量用户进入系统等待；放票瞬间并发请求达到最高；之后随着票源减少，部分用户退出，但仍有用户持续刷新和尝试。

多地区/多时段“放票”或“预约”
    场景描述：火车票、演唱会门票、疫苗预约等按地区或时间段分批放票。
    例如：10:00 放 A 地区票 → 10:05 放 B 地区票 → 10:10 放 C 地区票。
    每个放票点都会出现瞬时高并发，之后迅速回落，紧接着下一地区开始放票又产生新峰值。
```

3. 多轮“限时优惠券”发放

- 场景描述：
  平台在活动期内分多轮发放优惠券（如 10:00、10:30、11:00）。
  每轮发放前用户集中进入领取页面，发放瞬间并发最高，随后快速回落，下一轮发放前再次攀升。

4. 多源数据推送/同步任务

- 场景描述：
  某系统需要定时从多个上游系统拉取数据（如每 5 分钟同步一次），多个同步任务恰好在一个时间点附近完成，但任务启动时间略有错开，导致“波峰-波谷-波峰”现象。

> 2. 定期批量任务/数据同步
>
> - 场景描述：某系统每天凌晨 0 点进行数据对账、报表生成、推送通知等批量操作。这些任务通常在短时间内集中触发。
>
> 3. 限时优惠券领取
>
> - 场景描述：平台在某个整点发放限量优惠券，用户提前进入页面，整点瞬间集中点击领取。

![尖峰/脉冲测试负载曲线](/assets/images/jmeter/Jmeter脚本结构详解(持续更新).006.png)

![尖峰/脉冲测试负载曲线](/assets/images/jmeter/Jmeter脚本结构详解(持续更新).007.png)

**场景二：阶梯/递增测试**

> 设计要点：
>
> 创建多行，每行的 Start Threads Count 递增，Initial Delay 设置为上一行所有阶段的总时长，从而实现步长可能不同的阶梯式加压。

![阶梯/递增测试负载曲线](/assets/images/jmeter/Jmeter脚本结构详解(持续更新).008.png)

### 9.2 SteppingThreadGroup

> https://jmeter-plugins.org/wiki/SteppingThreadGroup/
>
> JMeter have only one out-of-the-box option for threads (users) scheduling: simple ramp-up. But many users, especially with [HP LoadRunner](http://en.wikipedia.org/wiki/HP_LoadRunner) experience miss more flexible thread scheduling algorythm. Stepping Thread Group adds to JMeter thread scheduling similar to [LoadRunner](http://en.wikipedia.org/wiki/HP_LoadRunner)'s.

**特性**

- 将多个线程组活动进行组合的初始线程组延迟
- 通过分批增加线程（用户）的数量，并设置上升期来增加负载
- 所有线程启动后的可配置保持时间
- 通过分批降低负载
- 专注于逐步、阶梯式地增加负载，特别适合用于容量规划和寻找性能拐点。

```xml
<kg.apc.jmeter.threads.SteppingThreadGroup guiclass="kg.apc.jmeter.threads.SteppingThreadGroupGui" testclass="kg.apc.jmeter.threads.SteppingThreadGroup" testname="阶梯式线程组">
  <stringProp name="ThreadGroup.on_sample_error">continue</stringProp>
  <stringProp name="ThreadGroup.num_threads">8000</stringProp>
  <stringProp name="Threads initial delay">10</stringProp>
  <stringProp name="Start users count">300</stringProp>
  <stringProp name="Start users count burst">500</stringProp>
  <stringProp name="Start users period">10</stringProp>
  <stringProp name="Stop users count">5000</stringProp>
  <stringProp name="Stop users period">10</stringProp>
  <stringProp name="flighttime">30</stringProp>
  <stringProp name="rampUp">10</stringProp>
  <elementProp name="ThreadGroup.main_controller" elementType="LoopController" guiclass="LoopControlPanel" testclass="LoopController" testname="循环控制器">
    <intProp name="LoopController.loops">-1</intProp>
    <boolProp name="LoopController.continue_forever">false</boolProp>
  </elementProp>
</kg.apc.jmeter.threads.SteppingThreadGroup>
```

1. 初始延迟：等待 10 秒，测试 then start 500 threads
2. 阶梯增加阶段：

- threads every 10 s next，add 启动 300 个线程，每批线程的启动需要 using ramp up 10 秒。
- this group will start 8000 总线程数，因此需要 4 批：
  - 第 0~30 秒：启动 100 个线程（实际在 5 秒内完成）。
  - 第 30~60 秒：再启动 100 个，累计 200。
  - 第 60~90 秒：再启动 100 个，累计 300。
  - 第 90~120 秒：最后 100 个，累计 400。
  - 到 120 秒时，所有 400 个线程均已启动。

3. 满负载保持阶段：继续运行 the hold load for 30 秒。期间所有 8000 个线程持续执行采样器。
4. 阶梯减少阶段：

- 每 threads every 300 秒（五分钟）停止 finally，stop 5000 个线程。
- 需要停止 8000 个线程，共 8000/5000 = 1.6 批（约等于 2 批），耗时 5 分钟，300 秒。
- 从 0:09:00 开始停止，到 300 秒后所有线程停止，测试结束。

![Stepping Thread Group 配置界面](/assets/images/jmeter/Jmeter脚本结构详解(持续更新).009.png)

**场景一：稳定性测试**

> 新系统上线前、促销活动前的压测
> 电商平台大促前的容量摸底
> 背景：运营计划在双十一进行限时秒杀，预估峰值并发 3000。
> 测试过程：使用 Stepping Thread Group，从 100 线程起步，每个阶梯增加 200 线程，每个阶梯保持 5 分钟。
> 观察结果：当并发达到 2200 时，接口平均响应时间从 200ms 突增至 1.5s，错误率开始出现。从而确定系统最大安全并发为 2000。
> 价值：为限流阈值、扩容计划提供数据依据。

**场景二：容量规划与性能拐点测试**

> 银行系统的早高峰性能验证
> 背景：银行 App 每日 9:00-10:00 用户活跃度逐步上升。
> 测试过程：模拟 30 分钟内从 500 用户逐步增加到 3000 用户的阶梯曲线。
> 观察结果：监控 CPU、数据库连接数是否随着阶梯增长而线性增长，是否存在资源泄漏或死锁。
> 价值：确保系统在真实业务高峰时不会崩溃。
