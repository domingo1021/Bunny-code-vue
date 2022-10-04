<template>
  <div style="display: flex; height: 100vh">
    <div id="left-bar" >
      <div style="width: 110%;">
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
          <div style="width: 35%">N.O.{{ version.versionNumber }} &nbsp;</div>
          <div style="width: 65%">
            {{ version.versionName }}
          </div>
        </div>
      </div>
    </div>
    <div id="main-content" v-if="targetFunction === 'Folder'">
      <div v-if="Object.keys(projectDetail).length !== 0">
        <div v-if="projectDetail.version.length !== 0">
          <CodeMirrorView
            v-if="Object.keys(projectDetail).length !== 0"
            :projectName="props.projectName"
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
            :setEditStatus="setEditStatus"
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
const editing = ref(0);
const targetVersionIndex = ref(0);
const previewVersionIndex = ref(0);
if (props.versionNumber !== "") {
  targetVersionIndex.value = Number(props.versionNumber) - 1;
}
const authorization = ref(false);
const readOnly = ref(true);
const emits = defineEmits(["setUserID"]);

const router = useRouter();
const route = useRoute();

// set for set 5 sec increase watch count by 1.
let watchCountTimeout;

function setEditStatus(status) {
  editing.value = status;
}

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
  editing.value = 0;
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

onMounted(() => {
  console.log("autorization: ", authorization.value);
  watchCountTimeout = setTimeout(async () => {
    if (props.userID !== projectDetail.value.userID) {
      console.log("add project view count");
      await axios.put(
        `${productionServer}/api/1.0/project/watch?projectID=${projectDetail.value.projectID}`
      );
    }
  }, 5000);
  console.log("Mounted: ", route.fullPath);
});

watch(editing, () => {
  console.log("editing change to: ", editing.value);
});

onUnmounted(() => {
  clearTimeout(watchCountTimeout);
});

onBeforeRouteLeave((to, from, next) => {
  if (editing.value === 1 && props.socket !== undefined) {
    Swal.fire({
      title: "Make sure you have save the latest version !",
      text: "You won't be able to revert this !",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, leave workspace",
    }).then((result) => {
      if (result.isConfirmed) {
        next();
      } else {
        next(false);
      }
    });
  } else {
    next();
  }
});
</script>

<style scoped>
.workspace-func:hover {
  width: 100%;
  background-color: #555;
  cursor: pointer;
}
.version-list {
  display: flex;
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
  display: flex;
  flex-direction: column;
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
button:hover {
  background-color: #555;
}
</style>
