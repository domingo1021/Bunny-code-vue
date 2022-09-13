<template>
  <div id="search-area" @keyup="enterSearch">
    <input type="text" v-model="keywords" />
    <button @click="searchProject()">search</button>
  </div>
</template>

<script setup>
import { onBeforeMount, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
let keywords = ref("");
const router = useRouter();
// const localhostServer = "http://localhost:3000";

async function searchProject() {
  router.push({ path: "/", query: { keywords: `${keywords.value}` } });
}

async function enterSearch(e) {
  if (e.key === "Enter") {
    await searchProject();
  }
}
</script>

<style scoped>
#search-area {
  display: flex;
}
</style>
