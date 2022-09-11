<template>
  <div id="search-area">
    <input type="text" v-model="keywords" @keydown.enter="searchProject" />
    <button @click="searchProject()">search</button>
  </div>
</template>

<script setup>
import { ref } from "vue";
import axios from "axios";
const keywords = ref("");

const emit = defineEmits(["updateProjects"]);
const localhostServer = "http://localhost:3000";

async function searchProject() {
  let responseProjects = await axios.get(
    localhostServer + `/api/1.0/project/search?keywords=${keywords.value}`
  );
  emit("updateProjects", {
    ...responseProjects.data.data,
  });
  console.log(responseProjects.data.data);
}
</script>

<style scoped>
#search-area {
  display: flex;
}
</style>
