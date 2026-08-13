<script setup lang="ts">
import { ref, onMounted } from "vue";

const hitokoto = ref("");
const from = ref("");
const show = ref(false);

const fetchHitokoto = async () => {
  try {
    const res = await fetch("https://v1.hitokoto.cn/?encode=json&charset=utf-8");
    if (!res.ok) throw new Error("network error");
    const data = await res.json();
    if (data && data.hitokoto) {
      hitokoto.value = data.hitokoto;
      from.value = data.from_who
        ? `${data.from_who}《${data.from || "佚名"}》`
        : data.from
          ? `《${data.from}》`
          : "";
      show.value = true;
    }
  } catch (e) {
    console.error("Hitokoto fetch error:", e);
    show.value = false;
  }
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
