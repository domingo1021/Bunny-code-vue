<script setup>
import { onBeforeMount, ref } from "vue";
import { useRouter } from "vue-router";
import ProjectCardComponent from "../components/ProjectCardComponent.vue";
import axios from "axios";

const router = useRouter();
const projectsDisplayed = ref([]);
const localhostServer = "http://localhost:3000";

function renderPath(index){
  router.push(`/code-mirror/${projectsDisplayed.projects[index].projectName}`);
}

function updateProjects(emitObject) {
  projectsDisplayed.value = emitObject;
  console.log(projectsDisplayed.value);
}

onBeforeMount(async () => {
  let responseProjects = await axios.get(
    localhostServer + `/api/1.0/project/all`
  );
  projectsDisplayed.value = responseProjects.data.data;
});

defineExpose({
  updateProjects,
})

</script>

<template>
  <main>
    <div id="project-content">
      <div id="flex-box">
        <div clsss="flex-item" v-for="(project, index) in projectsDisplayed.projects" :key="index">
          <ProjectCardComponent :projectObject="project" @click="renderPath(index)"/>
        </div>
      </div>
      <div>Current page: {{projectsDisplayed.page}}</div>
        <div>All page: {{projectsDisplayed.allPage}}</div>
    </div>
  </main>
</template>

<style scoped>
#project-content{
  text-align: center;
  margin-left: 10%;
  margin-right: 10%;
}
#flex-box{
  display: flex;
  margin: auto;
  /* justify-content: center; */
  /* align-self: center; */
  flex-wrap: wrap;
  flex-direction: row;
  max-width: 1200px;
}
.flex-item{
  background-color: rgb(161, 180, 201);
  flex-grow: 1;
  flex-basis: 40%;
  height: 30%;
  padding-top: 10px;
}
</style>
