<template>
  <div style="display: flex; height: 100vh">
    <div id="left-bar">
      <div @click="updateTarget('Folder')">Folder</div>
      <div @click="updateTarget('Version')">Version</div>
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
        <div
          class="version-list"
          v-for="(version, index) in projectDetail?.version"
          :key="index"
        >
          第 {{ version.versionNumber }} 版 &nbsp; {{ version.versionName }}
        </div>
      </div>
    </div>
    <div id="main-content" v-if="targetFunction === 'Folder'">
      <div v-if="Object.keys(projectDetail).length !== 0">
        <div v-if="projectDetail.version.length !== 0">
          <button @click="changePath">Change Path</button>
          <CodeMirrorView
            v-if="Object.keys(projectDetail).length !== 0"
            :socket="props.socket"
            :readOnly="readOnly"
            :authorization="authorization"
            :projectID="projectDetail.projectID"
            :version="projectDetail?.version[targetVersionIndex]"
            :folderInfo="projectDetail?.version[targetVersionIndex]?.files"
            @changeUserStatus="changeUserStatus"
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
          :targetVersionIndex="targetVersionIndex"
          :version="projectDetail.version[targetVersionIndex]"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import Socket from "../socket";
import { useRouter } from "vue-router";
import { onBeforeMount, ref, watch } from "vue";
import axios from "axios";
import CodeMirrorView from "./CodeMirrorView.vue";
import FolderController from "./FolderController.vue";

const localhostServer = "http://localhost:3000";
const projectDetail = ref({});
const targetFunction = ref("Folder");
// default target version 為第一個 version, (之後根據使用者點選version 做修改)
const targetVersionIndex = ref(0);
const authorization = ref(false);
const readOnly = ref(true);

//TODO: debug: change route when user click header instead
const router = useRouter();
// const route = useRoute();

const props = defineProps({
  socket: Socket,
  projectName: String,
  versionName: String,
});

// console.log("full path: ", route.fullPath);

async function changePath() {
  await router.push({
    name: "code-mirror",
    params: { projectName: "bunny_code" },
  });
}

function updateTarget(target) {
  targetFunction.value = target;
}

function changeUserStatus(emitObject) {
  readOnly.value = emitObject.readOnly;
  authorization.value = emitObject.authorization;
}

async function updateProjectDetail() {
  // console.log("projectName: ", props.projectName);
  let projectResponse;
  try {
    projectResponse = await axios.get(
      localhostServer +
        `/api/1.0/project/detail?projectName=${props.projectName}`
    );
  } catch (error) {
    console.log(error);
    alert(error.response.data.msg);
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
  // console.log("detail:", projectDetail.value);
}

watch(
  () => props.projectName,
  async (newProjectName, prevProjectName) => {
    await updateProjectDetail();
  }
);

onBeforeMount(async () => {
  await updateProjectDetail();
});
</script>

<style scoped>
.version-list {
  font-size: 0.75rem;
}
#info-bar {
  border-left: 1px solid rgb(255, 255, 255);
  padding-left: 30px;
  padding-right: 20px;
  width: 250px;
  background-color: rgb(36, 36, 36);
  color: rgb(255, 255, 255);
}
#main-content {
  background-color: #2c2c2c;
  width: 100%;
}
#main-content-2 {
  width: 100%;
}
</style>
