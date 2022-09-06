<script setup>
import { onMounted, onUnmounted, onUpdated, ref } from "vue";
// import axios from "axios";
import TerminalComponent from "../components/TerminalComponent.vue";
import CodeBoardComponent from "@/components/CodeBoardComponent.vue";

const props = defineProps({
  socket: Object,
});
// const input = ref([]);
// let targetLine = ref(0);
// let prevCodes = [""];
// const currCodes = ref([""]);
// const codeRecords = ref([]);
const child = ref([]);
const jwt = localStorage.getItem("jwt");
const targetFileNum = ref(0);
const currentFile = ref(0);
const terminalResult = ref([]);
const files = ref([
  {
    filename: "oneSum.js",
    language: "JS",
    updated: true,
    localVariables: {
      input: [],
      targetLine: 0,
      currIndex: 0,
      prevCodes: "",
      currCodes: [""],
      codeRecords: [],
    },
  },
  {
    filename: "twoSum.js",
    language: "JS",
    updated: false,
    localVariables: {
      input: [],
      targetLine: 0,
      currIndex: 0,
      prevCodes: "",
      currCodes: [""],
      codeRecords: [],
    },
  },
]);

function changeCurrFile(targetFile, index) {
  currentFile.value = index;
  targetFileNum.value = index;
}

onUnmounted(() => {
  props.socket.emit("leave workspace", "hello");
});

function updateInput(emitObject) {
  // console.log(child.value[0].input[emitObject.line]);
  child.value[0].input[emitObject.line].focus();
}

function updateTargetLine(emitObject) {
  files.value[emitObject.fileNumber].localVariables.targetLine =
    emitObject.line;
}

function updateCurrCodes(emitObject) {
  files.value[emitObject.fileNumber].localVariables.currCodes[emitObject.line] =
    emitObject.newCodes;
}

function updateCurrIndex(emitObject) {
  files.value[emitObject.fileNumber].localVariables.currIndex =
    emitObject.index;
}

function pushCodeRecords(emitObject) {
  files.value[emitObject.fileNumber].localVariables.codeRecords.push(
    emitObject.newRecords
  );
  console.log("line: ", emitObject.newRecords.line, "index: ", emitObject.newRecords.index);
}

function pushCurrCodes(emitObject) {
  files.value[emitObject.fileNumber].localVariables.currCodes.splice(
    emitObject.line,
    0,
    emitObject.codes
  );
}

function pushTerminal(emitObject) {
  console.log(emitObject);
  terminalResult.value.push(...emitObject.result);
}

function deleteCurrCodes(emitObject) {
  files.value[emitObject.fileNumber].localVariables.currCodes.splice(
    emitObject.line,
    1
  );
}

function inputToFront(emitObject) {
  console.log(child.value[0].input, emitObject.line);
  // console.log(emitObject, child.value[0].input[0])
  child.value[0].input[emitObject.line].setSelectionRange(0, 0, "forward");
  // child.value[0].input[1].setSelectionRange(0, 0, "forward");
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
        v-for="(info, index) in files"
        :key="index"
        style="display: flex"
        @click="changeCurrFile(info.filename, index)"
      >
        <div style="color: yellow; margin-right: 10px">{{ info.language }}</div>
        <div>{{ info.filename }}</div>
      </div>
    </div>
    <div id="main-content">
      <div v-for="(info, index) in files" :key="index">
        <CodeBoardComponent
          v-if="currentFile == index"
          :socket="socket"
          :jwt="jwt"
          :fileNumber="index"
          :fileName="info.filename"
          :variables="info.localVariables"
          ref="child"
          @updateInput="updateInput"
          @updateTargetLine="updateTargetLine"
          @updateCurrIndex="updateCurrIndex"
          @updateCurrCodes="updateCurrCodes"
          @pushCodeRecords="pushCodeRecords"
          @pushCurrCodes="pushCurrCodes"
          @deleteCurrCodes="deleteCurrCodes"
          @inputToFront="inputToFront"
          @pushTerminal="pushTerminal"
        />
        <!-- <CodeBoardComponent v-else style="display: none;" :codes="info.codes" :socket="socket" :jwt="jwt"/> -->
      </div>
      <TerminalComponent :terminalResult="terminalResult" />
    </div>
  </div>
</template>

<style>
h1 {
  color: red;
}

/* footer{
  position: absolute;
  bottom: 200px;
  width: 100%;
  height: 50px;
} */

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
