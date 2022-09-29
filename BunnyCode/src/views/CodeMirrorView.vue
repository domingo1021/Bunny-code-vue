<script setup>
import Socket from "../socket";
import CodeMirrorComponent from "../components/CodeMirrorComponent.vue";
import TerminalComponent from "../components/TerminalComponent.vue";
import { ref, onMounted, watch, onBeforeUnmount } from "vue";
import Swal from "sweetalert2";
// TODO: 如果是本人進入頁面（認為想要 edit）, 則建立 Socket, 並更動 edit 狀態，

const props = defineProps({
  socket: Socket,
  projectUserID: Number,
  userID: Number,
  projectID: Number,
  folderInfo: Object,
  recordInfo: Object,
  version: Object,
  readOnly: Boolean,
  authorization: Boolean,
  targetVersionIndex: Number,
  setEditStatus: Function,
});

const emit = defineEmits([
  "changeUserStatus",
  "pushSaveRecordsRoot",
  "setUserID",
  "updateParentVersionFile",
]);

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
  props.setEditStatus(1);
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

function updateParentVersionFile(emitObject) {
  emit("updateParentVersionFile", {
    targetVersionIndex: props.targetVersionIndex,
    fileURL: emitObject.fileURL,
  });
}

function changeEdit() {
  Swal.fire({
    title: "Do you want to forcely edit ?",
    text: "You may lose some codes on another existing workspace window.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Yes, edit !",
  }).then((result) => {
    if (result.isConfirmed) {
      props.socket.socketEmit("changeEdit", {
        projectID: props.projectID,
        versionID: props.version.versionID,
      });
      Swal.fire("Force edit success !", "Happy coding !", "success");
    }
  });
}

function socketInit() {
  console.log("Socket initing...", `${props.recordInfo.length}`);
  props.socket.socketOn("statusChecked", (responseObject) => {
    if (props.recordInfo.length !== 0) {
      responseObject.readOnly = true;
    }
    console.log(
      "responseObject after update: ",
      responseObject,
      props.recordInfo
    );
    emit("changeUserStatus", responseObject);
  });
  if (props.recordInfo.length === 0) {
    console.log("projectInfo: ", props.recordInfo.length);
    props.socket.socketEmit("checkProjectStatus", {
      projectID: props.projectID,
      versionID: props.version.versionID,
    });
  } else {
    emit("changeUserStatus", {
      readOnly: true,
      authorization: props.authorization,
    });
  }
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
  // check whether version is editing with version.versionID
  if (props.socket) {
    socketInit();
  }
});

onBeforeUnmount(() => {
  console.log("view unmount");
  if (props.socket) {
    props.socket.socketOff("statusChecked");
    console.log(props.readOnly, props.authorization);
    if (!props.readOnly || props.authorization) {
      props.socket.socketEmit("unEdit", {
        versionID: props.version.versionID,
      });
    }
  }
});
</script>

<template>
  <div v-if="folderInfo.length !== 0">
    <div>
      <!-- <div style="color: azure">ReadyOnly: {{ props.readOnly }}</div> -->
      <div
        style="margin-top: 5%"
        v-for="(fileInfo, index) in folderInfo"
        @input="updateContent"
        @keyup="checkEventUp"
        @keydown="checkEventDown"
        :key="index"
      >
        <CodeMirrorComponent
          :projectUserID="props.projectUserID"
          :userID="props.userID"
          :info="fileInfo"
          :records="props.recordInfo"
          :atAlt="atAlt"
          :atCtl="atCtl"
          :jwt="jwt"
          :readOnly="props.readOnly"
          :projectID="props.projectID"
          :authorization="props.authorization"
          :socket="props.socket"
          :changeEdit="changeEdit"
          @updateCurrCodes="updateCurrCodes"
          @updateCurrIndex="updateCurrIndex"
          @updateCurrLine="updateCurrLine"
          @pushCodeRecords="pushCodeRecords"
          @pushTerminal="pushTerminal"
          @updateAllRecords="updateAllRecords"
          @updateTimeBetween="updateTimeBetween"
          @pushSaveRecords="pushSaveRecords"
          @updateVersionFile="updateParentVersionFile"
        />
        <div id="terminal-header" style="background-color: rgb(36, 36, 36)">
          <div>&nbsp;</div>
          <div id="terminal-title">Terminal</div>
        </div>
        <TerminalComponent
          :terminalResult="terminalResult"
          style="top: 430px"
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
.code-input {
  padding-left: 20px;
  border-width: 0px;
  width: 100%;
  background-color: rgb(78, 78, 78);
  color: rgb(255, 255, 255);
}

#terminal-header {
  z-index: 99;
  position: relative;
  margin-top: 5%;
  background-color: rgb(36, 36, 36);
  height: 50px;
}

#terminal-title {
  font-size: 1.25rem;
  position: absolute;
  background-color: #555;
  right: 2%;
  top: 10px;
  display: inline-block;
  padding: 0.5% 1% 0.5% 1%;
  border-radius: 10px;
  margin-bottom: 1%;
}
</style>
