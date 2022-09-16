<script setup>
import axios from "axios";
import {
  onBeforeMount,
  onBeforeUnmount,
  onMounted,
  onUnmounted,
  onUpdated,
  ref,
  watch,
} from "vue";
import { useRouter, useRoute } from "vue-router";
import ProjectCardComponent from "../components/ProjectCardComponent.vue";

const props = defineProps({
  socket: Object,
  userID: String,
});
const localhostServer = "http://localhost:3000";
const router = useRouter();
const route = useRoute();
const jwt = localStorage.getItem("jwt");
const projectsDisplayed = ref([]);
const userAuth = ref(0);
const projectName = ref("");
const projectDescription = ref("");
const versionName = ref("");
const fileName = ref("");
const projectPublic = ref(1);
const buttonClickable = ref(false);

const CLIENT_CATEGORY = {
  visitor: 0,
  otherMember: 1,
  self: 2,
};

async function createProject() {
  console.log("Is public: ", +projectPublic.value);
  let responseProjects;
  try {
    if (!fileName.value.includes(".js")) {
      fileName.value += ".js";
    }
    responseProjects = await axios({
      method: "post",
      url: localhostServer + `/api/1.0/user/${props.userID}/project`,
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
      data: {
        projectName: projectName.value,
        projectDescription: projectDescription.value,
        isPublic: +projectPublic.value,
        userID: +props.userID,
        versionName: versionName.value,
        fileName: fileName.value,
      },
    });
  } catch (error) {
    console.log(error);
    alert(error.response.data.msg);
  }
  console.log(responseProjects);
  if (responseProjects) {
    alert(JSON.stringify(responseProjects.data.data));
    projectsDisplayed.value.unshift({
      projectID: responseProjects.data.data.projectID,
      projectName: projectName.value,
      isPublic: projectPublic.value,
      projectDescription: projectDescription.value,
      versionName: versionName.value,
      starCount: 0,
      watchCount: 0,
    });
  }
  projectName.value = "";
  projectDescription.value = "";
  projectPublic.value = 1;
  versionName.value = "";
  fileName.value = "";
}

function initSocket() {
  if (props.socket) {
    props.socket.socketOn("responseUsers", (responseObject) => {
      console.log("hello: ", responseObject);
    });
  }
}

// async function filterFunction() {
//   if (props.socket) {
//     props.socket.socketEmit("searchUsers", searchBattler.value);
//   }
// }

onUpdated(() => {
  if (
    projectName.value.length > 29 ||
    projectDescription.value.length > 49 ||
    versionName.value.length > 29 ||
    fileName.value.length > 29
  ) {
    buttonClickable.value = false;
  } else {
    buttonClickable.value = true;
  }
});

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
  console.log(projectsDisplayed.value);
  console.log("User auth value: ", userAuth.value);
  if (props.socket) {
    initSocket();
  }
});

onBeforeUnmount(() => {
  props.socket.socketOff("responseUsers");
});
</script>

<template>
  <div id="create-project" v-if="userAuth === CLIENT_CATEGORY.self">
    <button
      type="button"
      class="btn btn-primary"
      data-bs-toggle="modal"
      data-bs-target="#exampleModal"
    >
      Create Project
    </button>
    <div
      class="modal fade"
      id="exampleModal"
      tabindex="-1"
      role="dialog"
      aria-labelledby="myModalLabel"
      aria-hidden="true"
    >
      <div class="modal-dialog" role="document">
        <div class="modal-content">
          <div class="modal-header text-center">
            <h4 class="modal-title w-100 font-weight-bold">Create Project</h4>
            <button
              type="button"
              class="close btn btn-indigo"
              data-bs-dismiss="modal"
              data-dismiss="modal"
              aria-label="Close"
            >
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div class="modal-body mx-3">
            <div class="md-form mb-4" style="display: flex">
              <!-- <i class="fas fa-user prefix grey-text"></i> -->
              <label
                class="label-header"
                data-error="wrong"
                data-success="right"
                for="form3"
                >Project name</label
              >
              <input
                type="text"
                id="form3"
                class="form-control validate"
                v-model="projectName"
              />
            </div>
            <div class="warning" v-if="projectName.length > 29">
              Project name length too long.
            </div>
            <!-- projectName, projectDescription, isPublic, userID, versionName, fileName -->
            <div class="md-form mb-4" style="display: flex">
              <i class="fas fa-envelope prefix grey-text"></i>
              <label
                class="label-header"
                data-error="wrong"
                data-success="right"
                for="form2"
                >Project description</label
              >
              <input
                type="email"
                id="form2"
                class="form-control validate"
                v-model="projectDescription"
              />
            </div>
            <div class="warning" v-if="projectDescription.length > 49">
              Project description length too long.
            </div>
            <div class="md-form mb-4" style="display: flex">
              <i class="fas fa-envelope prefix grey-text"></i>
              <div style="margin-right: 15px">
                <input
                  type="radio"
                  id="Public"
                  name="drone"
                  value="1"
                  v-model="projectPublic"
                />
                <label for="huey">Public</label>
              </div>
              <div>
                <input
                  type="radio"
                  id="Private"
                  name="drone"
                  value="0"
                  v-model="projectPublic"
                />
                <label for="Private">Private</label>
              </div>
            </div>
            <div class="md-form mb-4" style="display: flex">
              <i class="fas fa-envelope prefix grey-text"></i>
              <label
                class="label-header"
                data-error="wrong"
                data-success="right"
                for="form2"
                >Version name</label
              >
              <input
                type="email"
                id="form2"
                class="form-control validate"
                v-model="versionName"
              />
            </div>
            <div class="warning" v-if="versionName.length > 29">
              Version name length too long.
            </div>
            <div class="md-form mb-4" style="display: flex">
              <i class="fas fa-envelope prefix grey-text"></i>
              <label
                class="label-header"
                data-error="wrong"
                data-success="right"
                for="form2"
                >File name</label
              >
              <input
                type="email"
                id="form2"
                class="form-control validate"
                v-model="fileName"
              />
            </div>
            <div class="warning" v-if="fileName.length > 29">
              File name length too long.
            </div>
          </div>
          <div class="modal-footer d-flex justify-content-center">
            <button
              id="valid-btn"
              class="btn btn-indigo"
              data-bs-dismiss="modal"
              @click="createProject"
              v-if="buttonClickable"
            >
              Submit <i class="fas fa-paper-plane-o ml-1"></i>
            </button>
            <button id="invalid-btn" class="btn btn-indigo" v-else>
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
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

#valid-btn {
  background-color: rgb(225, 244, 204);
  color: rgb(36, 34, 34);
}

#invalid-btn {
  background-color: rgb(255, 100, 100);
  color: azure;
}

.flex-item {
  background-color: rgb(161, 180, 201);
  flex-grow: 1;
  flex-basis: 40%;
  height: 30%;
  padding-top: 10px;
}
.label-header {
  width: 200px;
  top: 5px;
}

.warning {
  top: -20px;
  color: rgb(255, 100, 100);
}

.battle-title {
  width: 150px;
}

/* The search field */
#myInput {
  box-sizing: border-box;
  background-image: url("searchicon.png");
  background-position: 14px 12px;
  background-repeat: no-repeat;
  font-size: 16px;
  padding: 14px 20px 12px 45px;
  border: none;
  border-bottom: 1px solid #ddd;
}

#myInput:focus {
  outline: 1px solid #ddd;
}

/* The container <div> - needed to position the dropdown content */
.dropdown {
  display: flex;
}

/* Dropdown Content (Hidden by Default) */
.dropdown-content {
  display: block;
  position: absolute;
  background-color: #f6f6f6;
  min-width: 230px;
  border: 1px solid #ddd;
  z-index: 1;
}

/* Links inside the dropdown */
.dropdown-content a {
  color: black;
  padding: 12px 16px;
  text-decoration: none;
  display: block;
}

/* Change color of dropdown links on hover */
.dropdown-content a:hover {
  background-color: #f1f1f1;
}
</style>
