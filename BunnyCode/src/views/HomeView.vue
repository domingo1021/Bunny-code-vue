<script setup>
import { useRouter } from "vue-router";
import ProjectCardComponent from "../components/ProjectCardComponent.vue";
// import { ref } from 'vue';

const router = useRouter();

const props = defineProps({
  projectsDisplayed: Object,
});

function renderPath(index){
  router.push(`/code-mirror/${props.projectsDisplayed[index].projectID}`);
}
</script>

<template>
  <main>
    <div id="project-content">
      <div id="flex-box">
        <div clsss="flex-item" v-for="(project, index) in projectsDisplayed" :key="index" @click="renderPath(index)">
          <ProjectCardComponent :projectObject="project"/>
        </div>
      </div>
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
