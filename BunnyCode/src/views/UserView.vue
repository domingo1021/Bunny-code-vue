<script setup>
import axios from "axios";
import {
  nextTick,
  onBeforeMount,
  onBeforeUnmount,
  onMounted,
  onUpdated,
  ref,
  watch,
} from "vue";
import { useRouter, useRoute } from "vue-router";
import UserProfileComponent from "../components/UserProfileComponent.vue";
import Swal from "sweetalert2";

const props = defineProps({
  socket: Object,
  pageUserID: String,
  userID: Number,
  terminateSocket: Function,
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
const currentPage = ref(1);
if (+route.query.paging) {
  currentPage.value = +route.query.paging;
}

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
    `${productionServer}/api/1.0/user/${props.pageUserID}/project?keyword=${userKeyword.value}`
  );
  projectsDisplayed.value = userProjectsInfo.data.data;
}

function prevPage() {
  router.push({
    name: "user",
    params: {
      pageUserID: props.pageUserID,
    },
    query: {
      paging: `${currentPage.value - 1}`,
    },
  });
}
async function nextPage() {
  router.push({
    name: "user",
    params: {
      pageUserID: props.pageUserID,
    },
    query: {
      paging: `${currentPage.value + 1}`,
    },
  });
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
    Swal.fire({
      icon: "error",
      title: "Oops...",
      text: error.response.data.msg,
    });
  }
  if (responseProjects) {
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

async function getUserProject() {
  try {
    let responseProjects = await axios({
      method: "get",
      // url: productionServer + `/api/1.0/user/${route.params.userID}/project`,
      url:
        productionServer +
        `/api/1.0/user/${route.params.pageUserID}/project?paging=${
          currentPage.value - 1
        }`,
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    });
    projectsDisplayed.value = responseProjects.data.data;
  } catch (error) {
    projectsDisplayed.value = [];
  }
}

function logOut() {
  localStorage.removeItem("jwt");
  props.terminateSocket();
  router.push({ name: "login" });
}

onUpdated(() => {
  if (
    projectName.value.length > 19 ||
    projectDescription.value.length > 29 ||
    versionName.value.length > 19 ||
    fileName.value.length > 19
  ) {
    buttonClickable.value = false;
  } else {
    buttonClickable.value = true;
  }
});

watch(
  () => route.query.paging,
  async () => {
    currentPage.value = +route.query.paging;
    await getUserProject();
  }
);

onBeforeMount(async () => {
  const userDetail = await axios.get(
    `${productionServer}/api/1.0/user/${props.pageUserID}/detail`
  );
  userInfo.value = userDetail.data.data;
  console.log("User Info: ", userInfo.value);
});

onMounted(async () => {
  // onBeforeMount(async () => {
  await nextTick();
  await getUserProject();
  console.log("All project item: ", projectsDisplayed.value);
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
  // if (props.socket) {
  //   initSocket();
  // }
});

onBeforeUnmount(() => {
  // props.socket.socketOff("responseUsers");
});
</script>

<template>
  <main style="display: flex">
    <div id="user-profile-component">
      <UserProfileComponent :userInfo="userInfo" />
      <button id="logout-btn" @click="logOut()">Log out</button>
    </div>
    <div id="user-project-detail">
      <div
        id="search-project-area"
        @keyup.enter="searchUserProject"
        style="display: flex !important"
      >
        <input id="search-input-area" type="text" v-model="userKeyword" />
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
            <div style="margin-left: 5%; font-weight: bold; margin-bottom: 2px">
              New
            </div>
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
                    <span
                      aria-hidden="true"
                      style="position: absolute; top: -5px; right: 30px"
                      >&times;</span
                    >
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
                  <div class="warning" v-if="projectName.length > 19">
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
                  <div class="warning" v-if="projectDescription.length > 29">
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
                      <label class="new-project-label" for="huey">Public</label>
                    </div>
                    <div>
                      <input
                        type="radio"
                        id="Private"
                        name="drone"
                        value="0"
                        v-model="projectPublic"
                      />
                      <label class="new-project-label" for="Private"
                        >Private</label
                      >
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
                  <div class="warning" v-if="versionName.length > 19">
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
                  <div class="warning" v-if="fileName.length > 19">
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
                  <button
                    id="invalid-btn"
                    class="btn btn-indigo"
                    disabled
                    v-else
                  >
                    Submit
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div id="project-card-long" v-if="projectsDisplayed.length !== 0">
        <div
          clsss="card"
          v-for="(project, index) in projectsDisplayed"
          :key="index"
        >
          <div class="card-body project-card-detail">
            <h5 class="card-title" style="display: flex">
              <div id="project-title" @click="renderPath(index)">
                {{ project.projectName }}
              </div>
              <div
                id="project-status"
                style="
                  margin-left: 3%;
                  padding: 0% 1.5% 0% 1.5%;
                  border: 0.5px solid rgb(100, 100, 100);
                  border-radius: 20px;
                "
              >
                <span v-if="project.isPublic" class="project-status-span"
                  >Public</span
                >
                <span v-else class="project-status-span">Private</span>
              </div>
            </h5>
            <p id="project-description" class="card-text">
              {{ project.projectDescription }}
            </p>
            <div style="display: flex">
              <svg
                id="watch-icon"
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                fill="currentColor"
                class="bi bi-eye-fill"
                viewBox="0 0 16 16"
              >
                <path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z" />
                <path
                  d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8zm8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z"
                />
              </svg>
              <div style="margin-left: 10px; bottom: 2px">
                {{ project.watchCount }}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div id="project-card-long" v-if="projectsDisplayed.length === 0">
        <div id="no-projects">No more projects ...</div>
      </div>
      <div id="page-render" style="display: flex; justify-content: center">
        <button
          id="page-previous-btn"
          class="user-page-btn"
          type="button"
          @click="prevPage()"
          v-if="currentPage > 1"
        >
          previous
        </button>
        <button
          id="page-previous-btn"
          class="user-page-btn"
          type="button"
          style="color: rgb(100, 100, 100)"
          v-else
        >
          previous
        </button>
        <button
          id="page-next-btn"
          class="user-page-btn"
          type="button"
          @click="nextPage()"
          v-if="projectsDisplayed.length === 6"
        >
          next
        </button>
        <button
          id="page-next-btn"
          class="user-page-btn"
          type="button"
          style="color: rgb(100, 100, 100)"
          v-else
        >
          next
        </button>
      </div>
    </div>
  </main>
</template>

<style scoped>
#user-profile-component {
  display: inline-block !important;
  margin: 8% 3% 0% 3%;
  height: 30%;
  width: 40%;
}
#user-project-detail {
  margin: 5% 10% 5% 5%;
  width: 90%;
}
#logout-btn{
  width: 100%;
  height:50px;
  font-size: 1.5rem;
  border-radius: 10px;
  color: azure;
  background-color: rgb(95, 90, 110);
}
#logout-btn:hover{
  background-color: rgba(139, 110, 163);
}

#project-card-long {
  width: 100%;
}
.project-card-detail {
  /* background-color: rgb(35, 35, 35); */
  /* border-bottom: 1px solid rgb(189, 189, 189); */
  margin: 3% 0% 2% 0%;
  padding: 4% 2% 2% 2%;

  border-top: 1px solid rgba(189, 189, 189, 0.5);
  /* border-bottom: 1px solid rgba(189, 189, 189, 0.5); */
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
  height: 60px;
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
  width: 35%;
  height: 40px;
  margin-left: 3%;
  color: rgb(36, 34, 34);
}

#new-project-btn {
  font-size: 1.25rem;
  font-weight: bold;
  height: 100%;
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

#new-project-btn:hover {
  background-color: #389645;
}

#project-title {
  color: #58a6ff;
  font-size: 1.8rem;
  font-weight: bold;
  /* text-decoration: underline; */
  bottom: 4px;
  padding-bottom: 2px;
  border-bottom: 2px solid #58a6ff;
}

#project-title:hover {
  cursor: pointer;
}

#project-status {
  display: flex;
}

#watch-icon {
  filter: invert(20%) sepia(93%) saturate(1847%) hue-rotate(196deg)
    brightness(105%) contrast(101%);
}

.project-status-span {
  align-self: center;
  color: rgb(173, 173, 173);
  font-size: 1rem;
  text-align: center;
  font-weight: bold;
  width: 50px;
  margin-left: 3%;
}

#project-description {
  margin-top: 1%;
  font-size: 1.25rem;
  color: rgb(150, 150, 150);
}

#exampleModal {
  margin-top: 5%;
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

#page-render {
  font-size: 1.5rem;
  margin: -5px 0px 30px 0px;
}

.user-page-btn {
  cursor: pointer;
  color: rgb(255, 255, 255);
  background: none;
  border: 0px;
  margin-right: 3%;
}

.user-page-btn:hover {
  border: 1px solid #ddd;
  border-radius: 10px;
}

.new-project-label {
  margin-left: 5px;
}

#no-projects {
  text-align: center;
  font-size: 2rem;
  color: rgb(148, 147, 147);
  margin: 25px 0px 50px 0px;
}
</style>
