<template>
  <div style="display: flex; height: 100vh">
    <div id="left-bar">
      <div @click="updateTarget('Folder')">Folder</div>
      <div @click="updateTarget('Version')">Version</div>
    </div>
    <div id="info-bar">
      <div
        v-for="(info, index) in folderInfo"
        :key="index"
        style="display: flex"
        @click="changeCurrFile(info.fileName, index)"
      >
        <div style="color: yellow; margin-right: 10px">{{ info.language }}</div>
        <div>{{ info.fileName }}</div>
      </div>
    </div>
    <div id="main-content" v-if="targetFunction === 'Folder'">
      <CodeMirrorView @updateFolderInfo="updateFolderInfo" />
    </div>
    <div id="main-content-2" v-else-if="targetFunction === 'Version'">
      <FolderController />
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import axios from "axios";
import CodeMirrorView from "./CodeMirrorView.vue";
import FolderController from "./FolderController.vue";

const localhostServer = "http://localhost:3000";
const projectDetail = ref();
const targetFunction = ref("Folder");
// const targetVersion

const props = defineProps({
  projectID: String,
});

function updateTarget(target){
  targetFunction.value = target;
}

function updateFolderInfo(emitObject) {
  //TODO: 變更選取的 project, version, 相對應的 folder 資料;
}

onMounted(async () => {
  let projectResponse = await axios.get(
    localhostServer + `/api/1.0/project/detail?id=${props.projectID}`
  );
  projectDetail.value = projectResponse.data.data;
  console.log("detail:", projectDetail.value);
  projectDetail.value.version.forEach((version) => {
    if (version.files.length !== 0) {
      version.files.forEach((file, index) => {
        file.fileNumber = index;
        let tmpArray = file.fileName.split(".");
        if (tmpArray.length > 0) {
          file.language = tmpArray.pop();
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
  console.log(projectDetail.value);
});
</script>

<style scoped>
#info-bar {
  border-left: 1px solid rgb(255, 255, 255);
  padding-left: 30px;
  padding-right: 20px;
  width: 200px;
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
