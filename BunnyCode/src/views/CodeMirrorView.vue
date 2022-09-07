<script setup>
import CodeMirrorComponent from "../components/CodeMirrorComponent.vue";
import TerminalComponent from "../components/TerminalComponent.vue";
import { ref } from "vue";

const atAlt = ref(false);
const atCtl = ref(false);
const jwt = localStorage.getItem("jwt");

const props = defineProps({
  socket: Object,
});

const folderInfo = ref([
  {
    fileNumber: 0,
    fileName: "oneSum.js",
    language: "JS",
    fileContent: "",
    index: 0,
    line: 0,
    codeRecords: [],
  },
]);

const terminalResult = ref([]);

function checkEventDown(e) {
  // console.log("event down: ", e.key);
}

function checkEventUp(e) {
  // console.log("event up: ", e);
}

//emit function
function updateCurrCodes(emitObject) {
  folderInfo.value[emitObject.fileNumber].fileContent = emitObject.code;
  console.log(
    "current codes: ",
    folderInfo.value[emitObject.fileNumber].fileContent
  );
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
          :socket="props.socket"
          @updateCurrCodes="updateCurrCodes"
          @updateCurrIndex="updateCurrIndex"
          @updateCurrLine="updateCurrLine"
          @pushCodeRecords="pushCodeRecords"
          @pushTerminal="pushTerminal"
        />
      </div>
      <TerminalComponent :terminalResult="terminalResult" />
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
