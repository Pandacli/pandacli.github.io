<script setup lang="ts">
import { Blog } from "vuepress-theme-hope/blog";
import Hitokoto from "../component/Hitokoto.vue";
</script>

<template>
  <Blog>
    <template #heroInfo>
      <Hitokoto />
    </template>
  </Blog>
</template>
