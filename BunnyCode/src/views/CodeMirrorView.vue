<script setup>
import CodeMirrorComponent from "../components/CodeMirrorComponent.vue";
import TerminalComponent from "../components/TerminalComponent.vue";
import { ref } from "vue";

const atAlt = ref(false);
const atCtl = ref(false);
const jwt = localStorage.getItem("jwt");
const ifSelf = ref(true);
const editStatus = ref(true);

const folderInfo = ref([
  {
    fileNumber: 0,
    fileName: "oneSum.js",
    language: "JS",
    fileContent: "",
    index: 0,
    line: 0,
    codeRecords: [],
    timeBetween: [],
  },
]);

const terminalResult = ref([]);

//emit function
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

function changeSelf() {
  if (ifSelf.value) {
    ifSelf.value = false;
    editStatus.value = false;
  } else {
    ifSelf.value = true;
  }
}

function changeEdit() {
  if (ifSelf.value && editStatus.value) {
    editStatus.value = false;
  } else if (ifSelf.value && !editStatus.value) {
    editStatus.value = true;
  }
}
</script>
<template>
  <div style="display: flex; height: 100vh">
    <div id="left-bar">
      <div>File</div>
      <div>Code</div>
      <div>Fork</div>
      <div>Message</div>
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
    <div id="main-content">
      <button type="button" @click="changeSelf">Change user auth</button>
      <button type="button" @click="changeEdit">Change edit status</button>
      <div>User auth: {{ ifSelf }}</div>
      <div>Edit status: {{ editStatus }}</div>
      <div v-if="ifSelf && editStatus">
        <div>可編輯的 div</div>
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
        <div>不可編輯的 div</div>
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
        </div>
      </div>
      <!-- <TerminalComponent :terminalResult="terminalResult" /> -->
    </div>
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
