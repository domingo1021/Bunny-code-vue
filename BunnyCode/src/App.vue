<template>
  <header>
    <nav id="top-navbar">
      <div class="flex-container">
        <div class="flex-container-2">
          <div>Bunny code</div>
          <RouterLink to="/" class="nav-item" @click="updateView('home')"
            >Home</RouterLink
          >
          <div
            to="/code-mirror/bunny_code"
            class="nav-item"
            @click="updateView('code')"
          >
            Code Mirror
          </div>
          <RouterLink
            to="/battle/1"
            class="nav-item"
            @click="updateView('battle')"
            >Battle</RouterLink
          >
        </div>
        <div class="right-flex">
          <div class="nav-item">個人資訊</div>
          <SearchComponent @updateProjects="updateProjects" />
        </div>
      </div>
    </nav>
  </header>
  <body>
    <main v-if="view === 'home'">
      <RouterView :projectsDisplayed="projectsDisplayed" />
    </main>
    <main v-else-if="view === 'code'">
      <RouterView />
    </main>
    <main v-else>
      <RouterView />
    </main>
  </body>
</template>

<script setup>
import { RouterLink, RouterView, useRouter } from "vue-router";
import SearchComponent from "./components/SearchComponent.vue";
import { ref, onMounted } from "vue";
import axios from "axios";

const view = ref("home");
const router = useRouter();
const projectsDisplayed = ref([]);
const localhostServer = "http://localhost:3000";
const text = ref("");


function updateProjects(emitObject) {
  projectsDisplayed.value = emitObject;
  console.log(projectsDisplayed.value);
}

async function updateView(viewPage) {
  view.value = viewPage;
  if (view.value === "code") {
    await router.push({name:"home"});
    await router.push({ name: "code-mirror", params: { projectName: "bunny_code" } });
  }
}

onMounted(async () => {
  let responseProjects = await axios.get(
    localhostServer + `/api/1.0/project/all`
  );
  projectsDisplayed.value = responseProjects.data.data;
});
</script>

<style scoped>
nav a.router-link-exact-active {
  color: var(--color-text);
}
nav a.router-link-exact-active:hover {
  background-color: transparent;
}
nav a {
  display: inline-block;
  padding: 0 1rem;
  border-left: 1px solid var(--color-border);
}
nav a:first-of-type {
  border: 0;
}

#top-navbar {
  top: 0;
  left: 0;
  position: fixed;
  z-index: 99;
  width: 100vw;
  height: 80px;
  background-color: rgb(255, 255, 255);
  border-bottom: 40px solid #2c2c2c;
}
.flex-container {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  padding-top: 8px;
  padding-left: 30px;
  padding-right: 50px;
}

.flex-container-2 {
  display: flex;
  flex-direction: row;
}

.right-flex {
  display: flex;
  flex-direction: row-reverse;
  margin-top: auto;
}

.nav-item {
  margin-left: 15px;
}

header + body {
  padding-top: 80px;
}
</style>
