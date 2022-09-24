<script setup>
import { onBeforeMount, onUpdated, ref, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import ProjectCardComponent from "../components/ProjectCardComponent.vue";
import axios from "axios";

const router = useRouter();
const route = useRoute();
const projectsDisplayed = ref([]);
const localhostServer = "http://localhost:3000";
const productionServer = "https://domingoos.store";
const emits = defineEmits(["setUserID"]);
const topThreeProejct = ref();
const projectPageArray = ref([]);

// function renderPath(index) {
//   router.push(
//     `/workspace/${projectsDisplayed.value.projects[index].projectName}`
//   );
// }

function updateProjects(emitObject) {
  projectsDisplayed.value = emitObject;
  console.log(projectsDisplayed.value);
}

function searchProjectPage(pageing) {
  const { keywords } = route.query;
  if (keywords) {
    router.push({
      path: "/workspace",
      query: { keywords: `${keywords}`, paging: `${pageing}` },
    });
  } else {
    router.push({ path: "/workspace", query: { paging: `${pageing}` } });
  }
}

async function queryProjects() {
  const { keywords } = route.query;
  let paging = +route.query.paging - 1;
  if (!paging || +paging < 0) {
    paging = 0;
  }
  let responseProjects;
  if (keywords) {
    responseProjects = await axios.get(
      productionServer +
        `/api/1.0/project/search?keywords=${keywords}&paging=${paging}`
    );
    console.log("responseData: ", responseProjects.data.data);
    projectsDisplayed.value = responseProjects.data.data;
  } else {
    responseProjects = await axios.get(
      productionServer + `/api/1.0/project/all?paging=${paging}`
    );
    projectsDisplayed.value = responseProjects.data.data;
  }
  projectPageArray.value = [];
  for (let i = 1; i <= responseProjects.data.data.allPage; i++) {
    console.log("push");
    projectPageArray.value.push(i);
  }
  let topThreeResponse = await axios.get(
    `${productionServer}/api/1.0/project/top`
  );
  console.log(topThreeResponse.data.data);
  topThreeProejct.value = topThreeResponse.data.data;
  if (projectsDisplayed.value.projects.length === 0) {
    console.log("search 1");
    searchProjectPage(1);
  }
}
watch(
  () => route.fullPath,
  async (newRoute, prevRoute) => {
    console.log("route change");
    await queryProjects();
  }
);

onBeforeMount(async () => {
  await queryProjects();
});

defineExpose({
  updateProjects,
});
</script>

<template>
  <main>
    <div id="project-content">
      <div class="projects-title">Top three projects</div>
      <div id="top-three" class="projects-display">
        <div
          clsss="flex-item"
          style="margin: 1%"
          v-for="(project, index) in topThreeProejct"
          :key="index"
        >
          <ProjectCardComponent :projectObject="project" />
        </div>
      </div>
      <div class="projects-title">Project you may like</div>
      <div id="search-result" class="projects-display">
        <div
          class="project-component"
          style="margin: 1%"
          v-for="(project, index) in projectsDisplayed.projects"
          :key="index"
        >
          <ProjectCardComponent :projectObject="project" />
        </div>
      </div>
      <div id="search-project-page">
        <div
          class="page-detail"
          v-for="(pageIndex, index) in projectPageArray"
          :key="index"
          @click="searchProjectPage(pageIndex)"
        >
          <div id="current-page" v-if="pageIndex === projectsDisplayed.page">
            {{ pageIndex }}
          </div>
          <div v-else>{{ pageIndex }}</div>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
#top-three {
  border-bottom: 1px solid rgb(142, 142, 142);
  margin-bottom: 7%;
}

#search-result {
  padding-bottom: 0%;
  margin-bottom: 2%;
}

#project-content {
  margin: 3% 5% 3% 5%;
  padding-bottom: 2%;
  border-bottom: 1px solid rgb(142, 142, 142);
}

.projects-title {
  margin-left: 5%;
  font-weight: bold;
  font-size: 2rem;
  width: 100vw;
  text-align: left;
}

.projects-display {
  display: flex;
  margin: auto;
  margin-top: 3%;
  justify-content: center;
  flex-wrap: wrap;
  flex-direction: row;
  max-width: 90%;
  padding-bottom: 3%;
  text-align: center;
}
.flex-item {
  background-color: rgb(161, 180, 201);
  flex-grow: 1;
  flex-basis: 40%;
  height: 30%;
  padding-top: 10px;
}

#search-project-page {
  display: flex;
  justify-content: end;
}

.page-detail {
  margin-right: 3%;
}

.page-detail:hover {
  cursor: pointer;
}

#current-page {
  width: 30px;
  height: 30px;
  text-align: center;
  font-size: 1.25rem;
  font-weight: bold;
  bottom: 0.25rem;
  background-color: rgb(218, 218, 218);
  color: rgb(30, 30, 30);
  border-radius: 50%;
}
</style>
