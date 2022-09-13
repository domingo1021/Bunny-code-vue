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
    userAuth.value = authResponse.data.data.clientCategory;
  } catch (error) {
    userAuth.value = 0;
  }
  console.log("User auth value: ", userAuth.value);
});

onMounted(() => {
  // deleteModal = new bootstrap.Modal(deleteModalRef.value, {});
});

</script>

<template>
  <main>
    <button
      type="button"
      class="btn btn-primary"
      data-bs-toggle="modal"
      data-bs-target="#exampleModal"
      @click="handleOpenModal"
    >
      按下去顯示Modal
    </button>

    <!-- Modal -->
    <div
      class="modal fade"
      id="exampleModal"
      tabindex="-1"
      aria-labelledby="exampleModalLabel"
      aria-hidden="true"
    >
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="exampleModalLabel">UserID: {{userID}}</h5>
            <button
              type="button"
              class="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            ></button>
          </div>
          <div class="modal-body">User auth: {{userAuth}}</div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-secondary"
              data-bs-dismiss="modal"
            >
              關閉
            </button>
            <button type="button" class="btn btn-primary">確定</button>
          </div>
        </div>
      </div>
    </div>
  </main>
  <!-- <main> -->
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
  <!-- </main> -->
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
