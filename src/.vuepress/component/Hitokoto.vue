<script setup lang="ts">
import { ref, onMounted } from "vue";

const hitokoto = ref("");
const from = ref("");
const show = ref(false);

const FALLBACK_QUOTES = [
  { text: "我们是独立的个体，却不是孤独的存在。", from: "千里共良宵" },
  { text: "今人不见古时月，今月曾经照古人。", from: "李白《把酒问月》" },
  { text: "生活明朗，万物可爱，人间值得，未来可期。", from: "佚名" },
  { text: "愿你的世界阳光温柔，冬天快乐。", from: "佚名" },
];

// v1 为主站，international 为海外镜像；两者都不可用时回退到本地句子。
const API_ENDPOINTS = [
  "https://v1.hitokoto.cn/?encode=json&charset=utf-8",
  "https://international.v1.hitokoto.cn/?encode=json&charset=utf-8",
];

const apply = (text: string, fromText: string) => {
  hitokoto.value = text;
  from.value = fromText;
  show.value = true;
};

const applyFallback = () => {
  const q = FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)];
  apply(q.text, `《${q.from}》`);
};

const fetchHitokoto = async () => {
  for (const url of API_ENDPOINTS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) continue;
      const data = await res.json();
      if (data && data.hitokoto) {
        const fromText = data.from_who
          ? `${data.from_who}《${data.from || "佚名"}》`
          : data.from
            ? `《${data.from}》`
            : "";
        apply(data.hitokoto, fromText);
        return;
      }
    } catch (e) {
      // 该端点失败，尝试下一个
    } finally {
      clearTimeout(timer);
    }
  }
  applyFallback();
};

onMounted(fetchHitokoto);
</script>

<template>
  <div v-if="show" class="hitokoto-wrapper">
    <span class="hitokoto-quote">"</span>
    <p class="hitokoto-text" title="点击换一句" @click="fetchHitokoto">
      {{ hitokoto }}
    </p>
    <p v-if="from" class="hitokoto-from">—— {{ from }}</p>
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
