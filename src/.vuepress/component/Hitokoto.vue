<script setup lang="ts">
import { ref, onMounted } from "vue";

/**
 * 一言（Hitokoto）组件
 *
 * 功能：
 * 1. 页面挂载后自动从「一言」API 获取一句随机句子并展示；
 * 2. 点击句子可以刷新换一句；
 * 3. 内置本地备用句子，当所有 API 端点请求失败时兜底展示，
 *    保证页面在任何网络环境下都有内容可看。
 */

/**
 * 声明 HitokotoResponse interface  一言 API 返回信息的 数据结构。
 * 仅声明本组件实际使用到的字段，其余字段忽略。
 * 参考文档：https://developer.hitokoto.cn/sentence/
 */
interface HitokotoResponse {
  /** 定义string类型 句子内容（必选，缺失时视为请求无效） */
  hitokoto?: string;
  /** 句子出处，如「把酒问月」 */
  from?: string;
  /** 句子作者/说话人，如「李白」，可为空 */
  from_who?: string | null;
}

/**声明 本地备用句子结构 */
interface FallbackQuote {
  /** 句子正文 */
  readonly text: string;
  /** 句子出处 */
  readonly from: string;
}

/** 当前展示的句子内容，初始为空字符串 */
const hitokoto = ref("");
/** 当前句子的出处（作者《作品》），初始为空字符串 */
const source = ref("");
/** 是否展示组件,默认为false；仅在成功获取到句子后才为 true，避免渲染空白区域 */
const show = ref(false);

/**
 * 备用句子列表。
 * 所有远程 API 均请求失败时，随机从中取一句兜底展示。
 * 使用 readonly 数组，防止运行时被意外修改。
 */
const FALLBACK_QUOTES: readonly FallbackQuote[] = [
  { text: "我们是独立的个体，却不是孤独的存在。", from: "千里共良宵" },
  { text: "今人不见古时月，今月曾经照古人。", from: "李白《把酒问月》" },
  { text: "生活明朗，万物可爱，人间值得，未来可期。", from: "佚名" },
  { text: "愿你的世界阳光温柔，冬天快乐。", from: "佚名" },
];

/**
 * 远程 API 端点列表，按优先级排列：
 * - v1.hitokoto.cn：主站，通常首选；
 * - international.v1.hitokoto.cn：海外镜像，主站不可达时的备选。
 * 遍历按序尝试，成功即返回；全部失败则回退到本地备用句子。
 * 使用 `as const` 固化字面量类型，避免被推断为宽泛的 string。
 */
const API_ENDPOINTS = [
  "https://v1.hitokoto.cn/?encode=json&charset=utf-8",
  "https://international.v1.hitokoto.cn/?encode=json&charset=utf-8",
] as const;

/** 单次请求超时时间（毫秒）。超过则中断该请求，继续尝试下一个端点。 */
const REQUEST_TIMEOUT = 5000;

/**
 * 将获取到的句子写入响应式状态并展示。
 *
 * @param text 句子正文
 * @param sourceText 句子出处文本，可为空字符串
 */
const apply = (text: string, sourceText: string): void => {
  hitokoto.value = text;
  source.value = sourceText;
  show.value = true;
};

/**
 * 从本地备用句子中随机取一条兜底展示。
 * 出处统一包裹书名号，格式为《出处》。
 */
const applyFallback = (): void => {
  const { text, from } = FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)];
  apply(text, `《${from}》`);
};

/**
 * 依次请求「一言」API 获取随机句子。
 *
 * 流程：
 * 1. 按序遍历 API_ENDPOINTS，为每个端点创建独立的 AbortController 与超时计时器；
 * 2. 请求成功且响应包含句子内容时，格式化出处并展示后立即返回；
 * 3. 请求失败（HTTP 错误、网络异常或超时）则继续尝试下一个端点；
 * 4. 所有端点均失败时，回退到本地备用句子。
 *
 * 该函数同时被 onMounted 与模板的点击事件复用，点击即可刷新句子。
 */
const fetchHitokoto = async (): Promise<void> => {
  for (const url of API_ENDPOINTS) {
    // 每个端点使用独立的 AbortController，超时或失败时不影响后续请求
    const controller = new AbortController();
    // 超时计时器：到达 REQUEST_TIMEOUT 后主动中断当前请求
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
    try {
      const res = await fetch(url, { signal: controller.signal });
      // 非 2xx 响应视为该端点不可用，跳过并尝试下一个
      if (!res.ok) continue;
      const data = (await res.json()) as HitokotoResponse;
      // 响应中没有句子内容也视为无效数据
      if (data.hitokoto) {
        // 出处格式化：有作者时拼接为「作者《作品》」，否则仅保留《作品》或为空
        const sourceText = data.from_who
          ? `${data.from_who}《${data.from || "佚名"}》`
          : data.from
            ? `《${data.from}》`
            : "";
        apply(data.hitokoto, sourceText);
        return;
      }
    } catch {
      // 网络异常 / 超时等错误：静默忽略，继续尝试下一个端点
    } finally {
      // 无论成功与否都清除计时器，防止内存泄漏
      clearTimeout(timer);
    }
  }
  // 所有端点均失败，使用本地备用句子兜底
  applyFallback();
};

// 组件挂载完成后自动获取并展示第一句
onMounted(fetchHitokoto);
</script>

<template>
  <div v-if="show" class="hitokoto-wrapper">
    <span class="hitokoto-quote">"</span>
    <p class="hitokoto-text" title="点击换一句" @click="fetchHitokoto">
      {{ hitokoto }}
    </p>
    <p v-if="source" class="hitokoto-from">—— {{ source }}</p>
  </div>
</template>

<style scoped>
.hitokoto-wrapper {
  margin: 1.2rem auto 0;
  max-width: 640px;
  padding: 0 16px;
  position: relative;
  text-align: center;
}

.hitokoto-quote {
  position: absolute;
  top: -8px;
  left: 0;
  font-family: Georgia, serif;
  font-size: 3rem;
  line-height: 1;
  color: var(--theme-color, #3eaf7c);
  opacity: 0.35;
  user-select: none;
}

.hitokoto-text {
  margin: 0 auto 0.35rem;
  font-size: 1.15rem;
  line-height: 1.6;
  color: inherit;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
  cursor: pointer;
  transition: opacity 0.3s;
}

.hitokoto-text:hover {
  opacity: 0.75;
}

.hitokoto-from {
  margin: 0;
  font-size: 0.9rem;
  color: inherit;
  opacity: 0.65;
}
</style>
