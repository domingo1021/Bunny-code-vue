<template>
  <div style="display: flex; height: 100vh">
    <div id="left-bar">
      <div
        id="folder-control"
        class="workspace-func"
        @click="updateTarget('Folder')"
      >
        Folder
      </div>
      <div
        id="version-control"
        class="workspace-func"
        @click="updateTarget('Version')"
      >
        Version
      </div>
      <div id="shortcuts" class="workspace-func">
        <div @click="showIntroModal">Shortcuts</div>
      </div>
    </div>
    <div id="info-bar">
      <div
        v-if="
          Object.keys(projectDetail).length !== 0 && targetFunction === 'Folder'
        "
      >
        <div
          v-for="(info, index) in projectDetail?.version[targetVersionIndex]
            ?.files"
          :key="index"
          style="display: flex"
          @click="changeCurrFile(info.fileName, index)"
        >
          <div style="color: yellow; margin-right: 10px">
            {{ info.language }}
          </div>
          <div>{{ info.fileName }}</div>
        </div>
      </div>
      <div
        v-else-if="
          Object.keys(projectDetail).length !== 0 &&
          targetFunction === 'Version'
        "
      >
        <CreateVersionComponent
          v-if="props.userID === projectDetail.userID"
          :projectID="projectDetail.projectID"
          :currentVersionLength="projectDetail.version.length"
          @updateTargetVersion="updateTargetVersion"
          @updateTarget="updateTarget"
          @pushVersionObject="pushVersionObject"
        />
        <div
          class="version-list"
          v-for="(version, index) in projectDetail?.version"
          @click="updatePreviewVersion(index)"
          :key="index"
        >
          第 {{ version.versionNumber }} 版 &nbsp; {{ version.versionName }}
        </div>
      </div>
    </div>
    <div id="main-content" v-if="targetFunction === 'Folder'">
      <div v-if="Object.keys(projectDetail).length !== 0">
        <div v-if="projectDetail.version.length !== 0">
          <CodeMirrorView
            v-if="Object.keys(projectDetail).length !== 0"
            :projectUserID="projectDetail.userID"
            :userID="props.userID"
            :socket="props.socket"
            :readOnly="readOnly"
            :authorization="authorization"
            :projectID="projectDetail.projectID"
            :targetVersionIndex="targetVersionIndex"
            :version="projectDetail?.version[targetVersionIndex]"
            :recordInfo="projectDetail?.version[targetVersionIndex]?.records"
            :folderInfo="projectDetail?.version[targetVersionIndex]?.files"
            @changeUserStatus="changeUserStatus"
            @pushSaveRecordsRoot="pushSaveRecordsRoot"
            @updateParentVersionFile="updateParentVersionFile"
          />
          <div v-else></div>
        </div>
        <div v-else></div>
      </div>
      <div v-else></div>
    </div>
    <div id="main-content-2" v-else-if="targetFunction === 'Version'">
      <div v-if="Object.keys(projectDetail).length !== 0">
        <FolderController
          :targetVersionIndex="previewVersionIndex"
          :version="projectDetail.version[previewVersionIndex]"
          @updateTarget="updateTarget"
          @syncVersion="syncVersion"
        />
      </div>
    </div>
  </div>
  <div id="intro-alert">
    <div
      class="modal fade"
      id="introModal"
      ref="modalIntroObject"
      tabindex="-1"
      role="dialog"
      aria-labelledby="myModalLabel"
      aria-hidden="false"
    >
      <div
        id="intro-board"
        class="modal-dialog"
        role="document"
        style="overflow-y: auto"
      >
        <div id="intro-content" class="modal-content">
          <div
            id="intro-header"
            class="modal-header text-center"
            style="justify-content: right"
          >
            <button
              id="intro-close-btn"
              type="button"
              class="close btn btn-indigo"
              data-bs-dismiss="modal"
              data-dismiss="modal"
              aria-label="Close"
              @click="hideIntroModal"
            >
              <span aria-hidden="true">&times;</span>
            </button>
            <div></div>
          </div>
          <div id="command-header">
            <div class="shortcut-detail-1">Command</div>
            <div class="shortcut-detail-2" style="left: -2%">Shortcut</div>
          </div>

          <div class="shortcut">
            <div class="shortcut-detail-1">Cursor left</div>
            <div class="shortcut-detail-2">←</div>
          </div>
          <div class="shortcut">
            <div class="shortcut-detail-1">Cursor right</div>
            <div class="shortcut-detail-2">→</div>
          </div>
          <div class="shortcut">
            <div class="shortcut-detail-1">Cursor Up</div>
            <div class="shortcut-detail-2">↑</div>
          </div>
          <div class="shortcut">
            <div class="shortcut-detail-1">Cursor Down</div>
            <div class="shortcut-detail-2">↓</div>
          </div>
          <div class="shortcut">
            <div class="shortcut-detail-1">Move a word left</div>
            <div class="shortcut-detail-2">⌥ + ←</div>
          </div>
          <div class="shortcut">
            <div class="shortcut-detail-1">Move a word Right</div>
            <div class="shortcut-detail-2">⌥ + →</div>
          </div>
          <div class="shortcut">
            <div class="shortcut-detail-1">To line start</div>
            <div class="shortcut-detail-2">⌃ + a</div>
          </div>
          <div class="shortcut">
            <div class="shortcut-detail-1">To line end</div>
            <div class="shortcut-detail-2">⌃ + e</div>
          </div>
          <div class="shortcut">
            <div class="shortcut-detail-1">New Line</div>
            <div class="shortcut-detail-2">Enter</div>
          </div>
          <div class="shortcut">
            <div class="shortcut-detail-1">Delete left</div>
            <div class="shortcut-detail-2">Backspace</div>
          </div>
          <div class="shortcut">
            <div class="shortcut-detail-1">Save coding record</div>
            <div class="shortcut-detail-2">⌘ + s</div>
          </div>
          <div class="shortcut">
            <div class="shortcut-detail-1">
              Restart and initiate from base content
            </div>
            <div class="shortcut-detail-2">⌘ + i</div>
          </div>
          <div class="shortcut">
            <div class="shortcut-detail-1">Undo</div>
            <div class="shortcut-detail-2">⌘ + z</div>
          </div>
          <div class="shortcut">
            <div class="shortcut-detail-1">Redo</div>
            <div class="shortcut-detail-2">⇧ + ⌘ + z</div>
          </div>
          <div class="shortcut">
            <div class="shortcut-detail-1">Remove current line</div>
            <div class="shortcut-detail-2">⌘ + x</div>
          </div>
          <div class="shortcut">
            <div class="shortcut-detail-1">Copy a line down</div>
            <div class="shortcut-detail-2">⇧ + ⌥ + ↓</div>
          </div>
          <div style="display: flex; justify-content: left; margin-top: 5%">
            <div>
              <input
                type="checkbox"
                v-model="stopIntro"
                name=""
                id="intro-notify"
              />
            </div>
            <label style="margin-left: 2%">Stop notification </label>
            <div>&nbsp;</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import Socket from "../socket";
import { onBeforeRouteLeave, useRoute, useRouter } from "vue-router";
import { onBeforeMount, onMounted, onUnmounted, ref, watch } from "vue";
import axios from "axios";
import CodeMirrorView from "./CodeMirrorView.vue";
import FolderController from "./FolderController.vue";
import CreateVersionComponent from "../components/CreateVersionComponent.vue";
import { Modal } from "bootstrap";
import Swal from "sweetalert2";

const localhostServer = "http://localhost:3000";
const productionServer = "https://domingoos.store";
const projectDetail = ref({});
const targetFunction = ref("Folder");
// default target version 為第一個 version, (之後根據使用者點選version 做修改)
const props = defineProps({
  userID: Number,
  socket: Socket,
  projectName: String,
  versionNumber: String,
  terminateSocket: Function,
});

let modalIntro;
const modalIntroObject = ref(null);
const targetVersionIndex = ref(0);
const previewVersionIndex = ref(0);
if (props.versionNumber !== "") {
  targetVersionIndex.value = Number(props.versionNumber) - 1;
}
const authorization = ref(false);
const readOnly = ref(true);
const emits = defineEmits(["setUserID"]);

const router = useRouter();

const prevIntroStatus = localStorage.getItem("stopIntro");

console.log(prevIntroStatus);

const stopIntro = ref(true);

if (prevIntroStatus === "0" || prevIntroStatus === null) {
  stopIntro.value = false;
} else {
  stopIntro.value = true;
}

watch(stopIntro, () => {
  console.log("stopIntro changed. ");
  if (stopIntro.value) {
    localStorage.setItem("stopIntro", "1");
  } else {
    localStorage.setItem("stopIntro", "0");
  }
});

function updateTarget(target) {
  // 跳到 File or 跳到 version.
  targetFunction.value = target;
}

function updateTargetVersion(versionIndex) {
  console.log("updateTargetVersion:", versionIndex);
  targetVersionIndex.value = versionIndex;
}

function updatePreviewVersion(versionIndex) {
  console.log("updatePreviewVersion:", versionIndex);
  previewVersionIndex.value = versionIndex;
}
function syncVersion() {
  targetVersionIndex.value = previewVersionIndex.value;
}

function pushVersionObject(versionObject) {
  projectDetail.value.version.push(versionObject);
  targetFunction.value = "Folder";
  targetVersionIndex.value = projectDetail.value.version.length - 1;
  console.log(projectDetail.value.version[targetVersionIndex.value].files);
}

function changeUserStatus(emitObject) {
  readOnly.value = emitObject.readOnly;
  authorization.value = emitObject.authorization;
}

function pushSaveRecordsRoot(emitObject) {
  projectDetail.value.version[emitObject.targetVersionIndex].records.push(
    emitObject.newSaveRecords
  );
  readOnly.value = true;
}

function updateParentVersionFile(emitObject) {
  projectDetail.value.version[emitObject.targetVersionIndex].files[0].fileURL =
    emitObject.fileURL;
}

async function updateProjectDetail() {
  let projectResponse;
  try {
    projectResponse = await axios.get(
      productionServer +
        // localhostServer +
        `/api/1.0/project/detail?projectName=${props.projectName}`
    );
  } catch (error) {
    console.log(error);
    Swal.fire({
      icon: "error",
      title: "Oops...",
      text: error.response.data.msg,
      footer: '<a href="">Why do I have this issue?</a>',
    });
    return;
  }
  projectDetail.value = projectResponse.data.data;
  projectDetail.value.version.forEach((version) => {
    if (version.files.length !== 0) {
      version.files.forEach((file, index) => {
        file.fileNumber = index;
        let tmpArray = file.fileName.split(".");
        if (tmpArray.length > 0) {
          file.language = tmpArray.pop().toUpperCase();
        } else {
          file.language = "";
        }
        file.fileContent = "";
        file.index = 0;
        file.line = 0;
        file.codeRecords = [];
        file.timeBetween = [];
      });
    }
  });
  if (
    targetVersionIndex.value > projectDetail.value.version.length - 1 ||
    targetVersionIndex.value < 0
  ) {
    Swal.fire({
      icon: "error",
      title: "Oops...",
      text: "版本不存在",
      footer: '<a href="">Why do I have this issue?</a>',
    });
    targetVersionIndex.value = 0;
  }
  console.log("Project content: ", projectDetail.value);
}

function showIntroModal() {
  modalIntro.show();
}

function hideIntroModal() {
  modalIntro.hide();
}

watch(
  () => props.projectName,
  async (newProjectName, prevProjectName) => {
    await updateProjectDetail();
  }
);

watch(
  () => props.versionNumber,
  async (newVersionNumber, prevVersionNumber) => {
    targetVersionIndex.value = 0;
    if (props.versionNumber !== "") {
      targetVersionIndex.value = Number(props.versionNumber) - 1;
    }
    // await updateProjectDetail();
  }
);

watch(targetVersionIndex, () => {
  router.push({
    name: "workspace",
    params: {
      projectName: props.projectName,
      versionNumber: `${targetVersionIndex.value + 1}`,
    },
  });
});

onBeforeMount(async () => {
  await updateProjectDetail();
});

const route = useRoute();

onMounted(() => {
  console.log("autorization: ", authorization.value);
  setTimeout(async () => {
    if (props.userID !== projectDetail.value.userID) {
      console.log("add project view count");
      await axios.put(
        `${productionServer}/api/1.0/project/watch?projectID=${projectDetail.value.projectID}`
        // `http://localhost:3000/api/1.0/project/watch?projectID=${projectDetail.value.projectID}`,
      );
    }
  }, 5000);
  console.log("Mounted: ", route.fullPath);
  modalIntro = new Modal(modalIntroObject.value, {});
  if (!stopIntro.value) {
    showIntroModal();
  }
});

onUnmounted(() => {
  modalIntro.hide();
});

//TODO: make sure the user who have edit, have to confirm the leaving action.
const test = true;
if (test) {
  onBeforeRouteLeave((to, from, next) => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        next();
      } else {
        next(false);
      }
    });
  });
}
</script>

<style scoped>
.workspace-func:hover {
  width: 100%;
  background-color: #555;
  cursor: pointer;
}
.version-list {
  margin-left: 4%;
  font-size: 1rem;
}
.version-list:hover {
  background-color: #555;
  cursor: pointer;
}
#folder-control {
  margin-top: 10px;
  margin-bottom: 4%;
  padding: 5% 5% 5% 1%;
}

#shortcuts {
  margin-top: 9%;
}

#left-bar {
  padding-left: 2%;
  padding-right: 2%;
  font-size: 1.3rem;
  background-color: #2a2a2a;
}
#info-bar {
  font-size: 1.3rem;
  border-left: 1px solid rgb(255, 255, 255);
  padding: 1% 0% 0% 2%;
  width: 250px;
  background-color: rgb(25, 25, 25);
  color: rgb(255, 255, 255);
}
#main-content {
  margin-top: -30px;
  background-color: #161515;
  width: 100%;
}
#main-content-2 {
  width: 100%;
}

#intro-board {
  height: 60vh;
  top: 10%;
}

#intro-header {
  height: 1%;
  border: 0px;
  padding-bottom: 0%;
}

#command-header {
  font-size: 0.9rem;
  font-weight: bold;
  display: flex;
  border-bottom: 1.5px solid rgb(74, 74, 74);
  padding-left: 4%;
  padding-bottom: 2%;
  border-bottom: 2px solid rgb(20, 20, 20);
}

#intro-content {
  width: 100%;
  padding-bottom: 10%;
  padding-left: 5%;
  padding-right: 5%;
  background-color: rgb(41, 41, 41);
}

.shortcut-detail-1 {
  /* text-align: left; */
  width: 75%;
}

.shortcut-detail-2 {
  width: 50%;
}

#intro-close-btn {
  margin-right: -2%;
  color: azure;
}

#intro-notify {
  height: 20px;
  width: 20px;
}

.shortcut {
  display: flex;
  justify-content: left;
  padding-left: 5%;
  padding-right: 2%;
  padding-top: 0.5%;
  padding-bottom: 0.5%;
  font-size: 0.75rem;
}

.shortcut:nth-child(even) {
  background-color: rgb(41, 41, 41);
}
.shortcut:nth-child(odd) {
  background-color: rgb(87, 87, 87);
}

.confirm-btn {
  background-color: rgb(205, 204, 203);
  color: azure;
  border-radius: 10px;
  margin: 5%;
}

::-webkit-scrollbar {
  width: 10px;
  /* height: 10%; */
}

::-webkit-scrollbar-track {
  /* margin-top: 50px;
  margin-bottom: 100px; */
  /* background: #f1f1f1;  */
}

::-webkit-scrollbar-thumb {
  background: rgb(94, 94, 94, 0.7);
  /* height: 10%; */
}

::-webkit-scrollbar-thumb:hover {
  background: #555;
  /* height: 10%; */
}
::-webkit-scrollbar-button {
  height: 10px;
}
button:hover {
  background-color: #555;
}
</style>
