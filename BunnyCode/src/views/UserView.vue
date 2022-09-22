<script setup>
import axios from "axios";
import {
  nextTick,
  onBeforeMount,
  onBeforeUnmount,
  onMounted,
  onUpdated,
  ref,
} from "vue";
import { useRouter, useRoute } from "vue-router";
import UserProfileComponent from "../components/UserProfileComponent.vue";

const props = defineProps({
  socket: Object,
  pageUserID: String,
  userID: Number,
});
const emits = defineEmits(["setUserID"]);
const localhostServer = "http://localhost:3000";
const productionServer = "https://domingoos.store";
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
const userInfo = ref({});
const userKeyword = ref("");

const CLIENT_CATEGORY = {
  visitor: 0,
  otherMember: 1,
  self: 2,
};

function renderPath(index) {
  router.push(`/workspace/${projectsDisplayed.value[index].projectName}`);
}

async function searchUserProject() {
  const userProjectsInfo = await axios.get(
    `${localhostServer}/api/1.0/user/${props.pageUserID}/project?keyword=${userKeyword.value}`
  );
  projectsDisplayed.value = userProjectsInfo.data.data;
}

async function createProject() {
  console.log("Is public: ", +projectPublic.value);
  let responseProjects;
  try {
    if (!fileName.value.includes(".js")) {
      fileName.value += ".js";
    }
    responseProjects = await axios({
      method: "post",
      url: productionServer + `/api/1.0/user/${props.userID}/project`,
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
  const userDetail = await axios.get(
    `${localhostServer}/api/1.0/user/${props.userID}/detail`
  );
  userInfo.value = userDetail.data.data;
});

onMounted(async () => {
  // onBeforeMount(async () => {
  await nextTick();
  let responseProjects = await axios({
    method: "get",
    // url: productionServer + `/api/1.0/user/${route.params.userID}/project`,
    url: localhostServer + `/api/1.0/user/${route.params.pageUserID}/project`,
    headers: {
      Authorization: `Bearer ${jwt}`,
    },
  });
  projectsDisplayed.value = responseProjects.data.data;
  try {
    const authResponse = await axios({
      method: "get",
      url: productionServer + `/api/1.0/user/${route.params.pageUserID}/auth`,
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    });
    userAuth.value = authResponse.data.data.clientCategory;
  } catch (error) {
    userAuth.value = 0;
  }
  if (props.socket) {
    initSocket();
  }
});

onBeforeUnmount(() => {
  props.socket.socketOff("responseUsers");
});
</script>

<template>
  <main style="display: flex">
    <div id="user-profile-component">
      <UserProfileComponent :userInfo="userInfo" />
    </div>
    <div id="user-project-detail">
      <div
        id="search-project-area"
        @keyup.enter="searchUserProject"
        style="display: flex !important"
      >
        <!-- <div style="display: block;"> -->
        <input id="search-input-area" type="text" v-model="userKeyword" />
        <!-- </div> -->
        <div id="new-project" v-if="userAuth === CLIENT_CATEGORY.self">
          <button
            id="new-project-btn"
            type="button"
            data-bs-toggle="modal"
            data-bs-target="#exampleModal"
          >
            <svg
              aria-hidden="true"
              height="20"
              viewBox="0 0 16 16"
              version="1.1"
              width="20"
              data-view-component="true"
              class="octicon octicon-repo"
              style="
                filter: invert(98%) sepia(4%) saturate(737%) hue-rotate(258deg)
                  brightness(117%) contrast(100%);
              "
            >
              <path
                fill-rule="evenodd"
                d="M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 110-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.495 2.495 0 012 11.5v-9zm10.5-1V9h-8c-.356 0-.694.074-1 .208V2.5a1 1 0 011-1h8zM5 12.25v3.25a.25.25 0 00.4.2l1.45-1.087a.25.25 0 01.3 0L8.6 15.7a.25.25 0 00.4-.2v-3.25a.25.25 0 00-.25-.25h-3.5a.25.25 0 00-.25.25z"
              ></path>
            </svg>
            <div style="margin-left: 5%; font-weight:bold; margin-bottom: 2px;">New</div>
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
                  <h4 class="modal-title w-100 font-weight-bold">
                    Create Project
                  </h4>
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
      </div>
      <div id="project-card-long">
        <div
          clsss="card"
          v-for="(project, index) in projectsDisplayed"
          :key="index"
          @click="renderPath(index)"
        >
          <div class="card-body project-card-detail">
            <h5 class="card-title">Card title</h5>
            <p class="card-text">
              {{ project.projectName }}
            </p>
            <a href="#" class="btn btn-primary">Go somewhere</a>
          </div>
          <!-- </div> -->
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
#user-profile-component {
  display: inline-block !important;
  margin: 8% 3% 0% 3%;
  height: 30%;
  width: 30%;
}
#user-project-detail {
  margin: 5% 5% 5% 10%;
  width: 50%;
}

#project-card-long {
  width: 100%;
}
.project-card-detail {
  border: 3px solid rgb(166, 47, 47);
}

#valid-btn {
  background-color: rgb(225, 244, 204);
  color: rgb(36, 34, 34);
}

#invalid-btn {
  background-color: rgb(255, 100, 100);
  color: azure;
}

.label-header {
  width: 200px;
  top: 5px;
}

.warning {
  top: -20px;
  color: rgb(255, 100, 100);
}

#search-project-area {
  display: flex;
  height: 8%;
}

#search-input-area {
  border: 0.5px solid rgb(98, 100, 123);
  color: rgb(255, 255, 255);
  background-color: #161b22;
  width: 50%;
  padding: 2%;
  padding-left: 4%;
  margin-bottom: 2%;
  border-radius: 10px;
  font-size: 1rem;
}

#search-input-area:focus {
  outline: none;
  background: none;
}

#new-project {
  display: flex;
  /* height: 100%; */
  width: 35%;
  height: 92%;
  margin-left: 3%;
  /* justify-content: right; */
}

#new-project-btn {
  font-size: 1.25rem;
  font-weight: bold;
  height: 80%;
  display: flex;
  justify-content: center;
  text-align: center;
  align-items: center;
  border-radius: 10px;
  width: 40%;
  color: #f1f1f1;
  background-color: #30813b;
  border: 0px;
  font-weight: 500;
  line-height: 20px;
}

#new-project-btn:hover{
  background-color: #389645;
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
