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
const topThreeProejct = [
  {
    projectName: "hello",
    watchCount: 0,
  },
  {
    projectName: "hello2",
    watchCount: 0,
  },
  {
    projectName: "hello2",
    watchCount: 0,
  },
];

function renderPath(index) {
  router.push(
    `/workspace/${projectsDisplayed.value.projects[index].projectName}`
  );
}

function updateProjects(emitObject) {
  projectsDisplayed.value = emitObject;
  console.log(projectsDisplayed.value);
}

async function queryProjects() {
  const { keywords } = route.query;
  const paging = route.query.paging || 0;
  if (keywords) {
    let responseProjects = await axios.get(
      productionServer +
        `/api/1.0/project/search?keywords=${keywords}&paging=${paging}`
    );
    console.log(responseProjects.data.data);
    projectsDisplayed.value = responseProjects.data.data;
    return;
  }
  let responseProjects = await axios.get(
    productionServer + `/api/1.0/project/all?paging=${paging}`
  );
  projectsDisplayed.value = responseProjects.data.data;
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
      <div id="flex-box">
        <div
          clsss="flex-item"
          style="margin: 1%"
          v-for="(project, index) in projectsDisplayed.projects"
          :key="index"
        >
          <ProjectCardComponent
            :projectObject="project"
            @click="renderPath(index)"
          />
        </div>
      </div>
      <div>Current page: {{ projectsDisplayed.page }}</div>
      <div>All page: {{ projectsDisplayed.allPage }}</div>
    </div>
  </main>
</template>

<style scoped>
#project-content {
  text-align: center;
  margin-left: 10%;
  margin-right: 10%;
}
#flex-box {
  display: flex;
  margin: auto;
  /* justify-content: center; */
  /* align-self: center; */
  flex-wrap: wrap;
  flex-direction: row;
  max-width: 1200px;
}
.flex-item {
  background-color: rgb(161, 180, 201);
  flex-grow: 1;
  flex-basis: 40%;
  height: 30%;
  padding-top: 10px;
}
</style>
