<script setup>
import { nextTick, onBeforeMount, onUpdated, ref, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import ProjectCardComponent from "../components/ProjectCardComponent.vue";
import Socket from "../socket";
import axios from "axios";

const propes = {
  socket: Socket,
  userID: Number,
  terminateSocket: Function,
};

const router = useRouter();
const route = useRoute();
const projectsDisplayed = ref([]);
const productionServer = "https://domingoos.store";
const emits = defineEmits(["setUserID"]);
const topThreeProejct = ref();
const projectPageArray = ref([]);
const keywords = ref(route.query.keywords);

function updateProjects(emitObject) {
  projectsDisplayed.value = emitObject;
  console.log(projectsDisplayed.value);
}

function searchProjectPage(pageing) {
  if (keywords.value) {
    router.push({
      path: "/workspace",
      query: { keywords: `${keywords.value}`, paging: `${pageing}` },
    });
  } else {
    router.push({ path: "/workspace", query: { paging: `${pageing}` } });
  }
}

async function queryProjects() {
  await nextTick();
  let paging = +route.query.paging - 1;
  if (!paging || +paging < 0) {
    paging = 0;
  }
  let responseProjects;
  if (keywords.value) {
    responseProjects = await axios.get(
      productionServer +
        `/api/1.0/project/search?keywords=${keywords.value}&paging=${paging}`
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

watch(
  () => route.query.keywords,
  (now, prev) => {
    console.log("keyword change: ", now, prev);
    keywords.value = now;
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
      <div id="top-three" class="projects-display" style="padding-bottom: 0%">
        <div
          clsss="flex-item"
          style="margin: 1%"
          v-for="(project, index) in topThreeProejct"
          :key="index"
        >
          <ProjectCardComponent :projectObject="project" />
        </div>
        <div style="display: flex; padding-top: 3%; padding-bottom: 1%">
          <div id="did-you-know">DID YOU KNOW: &nbsp;</div>
          <div>
            Users can create their <strong>awesome project</strong> on their
            user page !
          </div>
        </div>
      </div>
      <div style="display: flex">
        <div v-if="keywords !== undefined" class="projects-title">
          Search keywords: &nbsp;{{ keywords }}
        </div>
        <div v-else class="projects-title">Project you may like</div>
      </div>
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
#did-you-know {
  /* display:inline; */
  font-weight: bold;
  color: rgb(192, 124, 219);
  font-size: 1.25rem;
  bottom: 6px;
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
