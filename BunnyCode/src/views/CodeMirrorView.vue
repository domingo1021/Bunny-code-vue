<script setup>
import Socket from "../socket";
import CodeMirrorComponent from "../components/CodeMirrorComponent.vue";
import TerminalComponent from "../components/TerminalComponent.vue";
import { ref, onMounted, watch, onBeforeUnmount } from "vue";

// TODO: 如果是本人進入頁面（認為想要 edit）, 則建立 Socket, 並更動 edit 狀態，

const props = defineProps({
  socket: Socket,
  projectID: Number,
  folderInfo: Object,
  recordInfo: Object,
  version: Object,
  readOnly: Boolean,
  authorization: Boolean,
  targetVersionIndex: Number,
});

const emit = defineEmits(["changeUserStatus", "pushSaveRecordsRoot"]);

const atAlt = ref(false);
const atCtl = ref(false);
const jwt = localStorage.getItem("jwt");

const folderInfo = ref(props.folderInfo);

const terminalResult = ref([]);

function updateCurrCodes(emitObject) {
  folderInfo.value[emitObject.fileNumber].fileContent = emitObject.code;
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

function pushSaveRecords(emitObject) {
  emit("pushSaveRecordsRoot", {
    targetVersionIndex: props.targetVersionIndex,
    newSaveRecords: emitObject,
  });
}

function changeEdit() {
  props.socket.socketEmit("changeEdit", {
    projectID: props.projectID,
    versionID: props.version.versionID,
  });
}

function socketInit() {
  props.socket.socketOn("statusChecked", (responseObject) => {
    if (props.recordInfo.length !== 0) {
      responseObject.readOnly = true;
    }
    emit("changeUserStatus", responseObject);
  });
  props.socket.socketEmit("checkProjectStatus", {
    projectID: props.projectID,
    versionID: props.version.versionID,
  });
}

watch(
  () => props.socket,
  (now, prev) => {
    if (props.socket) {
      socketInit();
    }
  }
);

onMounted(() => {
  console.log("mounted !!!");
  // check whether version is editing with version.versionID
  if (props.socket) {
    socketInit();
  }
});

onBeforeUnmount(() => {
  if (props.socket) {
    props.socket.socketEmit("changeEdit", {
      projectID: props.projectID,
      versionID: props.version.versionID,
    });
    props.socket.socketOff("statusChecked");
  }
});
</script>

<template>
  <div
    v-if="
      authorization && props.socket !== undefined && recordInfo.length === 0
    "
  >
    <button @click="changeEdit">Edit</button>
  </div>
  <div v-if="folderInfo.length !== 0">
    <div>
      <div style="color: azure">ReadyOnly: {{ props.readOnly }}</div>
      <div
        v-for="(fileInfo, index) in folderInfo"
        @input="updateContent"
        @keyup="checkEventUp"
        @keydown="checkEventDown"
        :key="index"
      >
        <CodeMirrorComponent
          :info="fileInfo"
          :records="props.recordInfo"
          :atAlt="atAlt"
          :atCtl="atCtl"
          :jwt="jwt"
          :readOnly="props.readOnly"
          :projectID="props.projectID"
          @updateCurrCodes="updateCurrCodes"
          @updateCurrIndex="updateCurrIndex"
          @updateCurrLine="updateCurrLine"
          @pushCodeRecords="pushCodeRecords"
          @pushTerminal="pushTerminal"
          @updateAllRecords="updateAllRecords"
          @updateTimeBetween="updateTimeBetween"
          @pushSaveRecords="pushSaveRecords"
        />
        <TerminalComponent
          :terminalResult="terminalResult"
          style="top: 350px"
        />
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
