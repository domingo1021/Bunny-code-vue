<script setup>
import CodeMirrorComponent from "../components/CodeMirrorComponent.vue";
import TerminalComponent from "../components/TerminalComponent.vue";
import { ref, onMounted, onUpdated } from "vue";
import axios from "axios";
import io from "socket.io-client";

// TODO: 如果是本人進入頁面（認為想要 edit）, 則建立 Socket, 並更動 edit 狀態，

const props = defineProps({
  projectID: String,
  folderInfo: Object,
  version: Object,
});

const emit = defineEmits(["updateFolderInfo"]);

const atAlt = ref(false);
const atCtl = ref(false);
const jwt = localStorage.getItem("jwt");
const readOnly = ref();
const authorization = ref();
// const ifSelf = ref(true);
// const editStatus = ref(true);

const folderInfo = ref(props.folderInfo);

const terminalResult = ref([]);

//emit function
function updateCurrCodes(emitObject) {
  folderInfo.value[emitObject.fileNumber].fileContent = emitObject.code;
  // 比較：props.folderInfo[emitObject.fileNumber].fileContent = emitObject.code;
}

function updateCurrIndex(emitObject) {
  folderInfo.value[emitObject.fileNumber].index = emitObject.index;
}

function updateCurrLine(emitObject) {
  folderInfo.value[emitObject.fileNumber].line = emitObject.line;
}

function pushCodeRecords(emitObject) {
  folderInfo.value[emitObject.fileNumber].codeRecords.push(
    emitObject.newRecords
  );
  console.log(folderInfo.value[emitObject.fileNumber].codeRecords);
}

function pushTerminal(emitObject) {
  terminalResult.value.push(...emitObject.result);
}

function updateAllRecords(emitObject) {
  folderInfo.value[emitObject.fileNumber].codeRecords = emitObject.codeRecords;
}

function updateTimeBetween(emitObject) {
  folderInfo.value[emitObject.fileNumber].timeBetween = emitObject.timeBetween;
}

function changeEdit(){
  socket.emit('changeEdit', {
    projectID: props.projectID,
    versionID: props.version.versionID,
  });
}

const localhostServer = "http://localhost:3000";
const productionServer = "wss://domingoos.store";

const socket = io(localhostServer, {
  auth: (cb) => {
    cb({ token: `Bearer ${localStorage.getItem("jwt")}` });
  },
  path: "/api/socket/",
});

socket.on('statusChecked', (responseObject) => {
  readOnly.value = responseObject.readOnly;
  authorization.value = responseObject.authorization;
  console.log(responseObject);
})


onMounted(() => {
  // check whether version is editing with version.versionID
  console.log("VersionID: ", props.version.versionID);
  socket.emit("checkProjectStatus", {
    projectID: props.projectID,
    versionID: props.version.versionID,
  });
});

onUpdated(() => {
  emit("updateFolderInfo", folderInfo.value);
});
</script>

<template>
  <!-- <button type="button" @click="changeSelf">Change user auth</button> -->
  <!-- <button type="button" @click="changeEdit">Change edit status</button> -->
  <!-- <div>User auth: {{ ifSelf }}</div> -->
  <!-- <div>Edit status: {{ editStatus }}</div> -->
  <div v-if="authorization">
    <button @click="changeEdit">Edit</button>
  </div>
  <div v-if="folderInfo.length !== 0">
    <div v-if="!readOnly">
      <div style="color:azure">可編輯的 div</div>
      <div v-for="(fileInfo, index) in folderInfo" :key="index">
        <CodeMirrorComponent
          :info="fileInfo"
          :atAlt="atAlt"
          :atCtl="atCtl"
          :jwt="jwt"
          :readOnly="false"
          @updateCurrCodes="updateCurrCodes"
          @updateCurrIndex="updateCurrIndex"
          @updateCurrLine="updateCurrLine"
          @pushCodeRecords="pushCodeRecords"
          @pushTerminal="pushTerminal"
        />
      </div>
    </div>
    <div v-else>
      <div style="color:azure">不可編輯的 div</div>
      <div
        v-for="(fileInfo, index) in folderInfo"
        @input="updateContent"
        @keyup="checkEventUp"
        @keydown="checkEventDown"
        :key="index"
      >
        <CodeMirrorComponent
          :info="fileInfo"
          :atAlt="atAlt"
          :atCtl="atCtl"
          :jwt="jwt"
          :readOnly="true"
          @updateCurrCodes="updateCurrCodes"
          @updateCurrIndex="updateCurrIndex"
          @updateCurrLine="updateCurrLine"
          @pushCodeRecords="pushCodeRecords"
          @pushTerminal="pushTerminal"
          @updateAllRecords="updateAllRecords"
          @updateTimeBetween="updateTimeBetween"
        />
        <!-- <TerminalComponent :terminalResult="terminalResult" /> -->
      </div>
    </div>
  </div>
  <div v-else>
    <h1>歡迎加入 Bunny Code</h1>
  </div>
</template>

<style>
h1 {
  color: red;
}

h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}

#code-area {
  border: 1px solid;
  background-color: rgb(36, 36, 36);
  color: rgb(255, 255, 255);
}

#left-bar {
  padding-left: 10px;
  padding-right: 20px;
  background-color: #2c2c2c;
  color: rgb(255, 255, 255);
}

#info-bar {
  border-left: 1px solid rgb(255, 255, 255);
  padding-left: 30px;
  padding-right: 20px;
  width: 200px;
  background-color: rgb(36, 36, 36);
  color: rgb(255, 255, 255);
}

.code-index {
  width: 50px;
  padding-right: 20px;
  padding-left: 20px;
  border-right: 1px solid rgb(255, 255, 255);
}

#main-content {
  background-color: #2c2c2c;
  width: 100%;
}
.code-input {
  padding-left: 20px;
  border-width: 0px;
  width: 100%;
  background-color: rgb(78, 78, 78);
  color: rgb(255, 255, 255);
}
</style>
