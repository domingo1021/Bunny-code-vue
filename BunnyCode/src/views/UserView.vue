<script setup>
import axios from "axios";
import { onBeforeMount, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import ProjectCardComponent from "../components/ProjectCardComponent.vue";

const localhostServer = "http://localhost:3000";

const props = defineProps({
  userID: String,
});
const router = useRouter();
const jwt = localStorage.getItem("jwt");
const projectsDisplayed = ref([]);
const userAuth = ref(0);
const CLIENT_CATEGORY = {
  visitor: 0,
  otherMember: 1,
  self: 2,
};

onBeforeMount(async () => {
  let responseProjects = await axios({
    method: "get",
    url: localhostServer + `/api/1.0/user/${props.userID}/project`,
    headers: {
      Authorization: `Bearer ${jwt}`,
    },
  });
  projectsDisplayed.value = responseProjects.data.data;
  try {
    const authResponse = await axios({
      method: "get",
      url: localhostServer + `/api/1.0/user/${props.userID}/auth`,
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    });
    userAuth.value = authResponse.data.data; 
  } catch (error) {
    userAuth.value = 0;
  }
});
</script>

<template>
  <main>
    <div id="project-content">
      <div id="flex-box">
        <div
          clsss="flex-item"
          v-for="(project, index) in projectsDisplayed"
          :key="index"
          @click="renderPath(index)"
        >
          <ProjectCardComponent :projectObject="project" />
        </div>
      </div>
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
