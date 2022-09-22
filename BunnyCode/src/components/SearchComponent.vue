<template>
  <div id="search-area" @keyup="enterSearch">
    <input id=input-area placeholder="Search or jump to ..." type="text" v-model="keywords" />
    <!-- <button id='search-btn' @click="searchProject()">search</button> -->
  </div>
</template>

<script setup>
import { onBeforeMount, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
let keywords = ref("");
const router = useRouter();
// const localhostServer = "http://localhost:3000";

async function searchProject() {
  router.push({ path: "/workspace", query: { keywords: `${keywords.value}` } });
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
  background-color: #161b22;
}

#input-area{
  border: 0.5px solid rgb(98, 100, 123);
  color: rgb(255, 255, 255);
  background-color: #161b22;
  width: 220px;
  padding: 2%;
  padding-left: 4%;
  margin: 0%;
  border-radius: 10px;
  font-size: 1rem;
}

#input-area:focus{
  outline: none;
  background: none;
}
</style>
