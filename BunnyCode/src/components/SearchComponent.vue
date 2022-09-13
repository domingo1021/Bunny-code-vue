<template>
  <div id="search-area" @keyup="enterSearch">
    <input type="text" v-model="keywords" />
    <button @click="searchProject()">search</button>
  </div>
</template>

<script setup>
import { ref } from "vue";
import axios from "axios";
import {useRouter} from "vue-router";

let keywords = ref("");
const router = useRouter();
const emit = defineEmits(["updateProjects"]);
const localhostServer = "http://localhost:3000";

async function searchProject() {
  router.push({path: '/', query: {keywords: `${keywords.value}`}})
  // let responseProjects = await axios.get(
  //   localhostServer + `/api/1.0/project/search?keywords=${keywords.value}`
  // );
  // emit("updateProjects", {
  //   ...responseProjects.data.data,
  // });
  // console.log(responseProjects.data.data);
  // }
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
