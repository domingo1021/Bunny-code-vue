<script setup>
import { onMounted, onUnmounted, onUpdated, ref } from "vue";
// import axios from "axios";
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
console.log(jwt);
const currentFile = ref("test.js");
const files = ref([
  {
    filename: "test.js",
    language: "JS",
    updated: true,
    localVariables: {
      input: [],
      targetLine: 0,
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
      input: ref([]),
      targetLine: ref(0),
      prevCodes: "",
      currCodes: ref([""]),
      codeRecords: ref([]),
    },
  },
]);

function changeCurrFile(targetFile, index) {
  currentFile.value = targetFile;
  targetFileNum.value = index
}

onUnmounted(() => {
  props.socket.emit("leave workspace", "hello");
});

function updateInput(emitObject){
  child.value[0].input[emitObject.line].focus();
}

function updateTargetLine(fileNumber, line){
  // files.value[fileNumber].localVariables.targetLine = line;
}

function updatePrevCodes(emitObject){
files.value[emitObject.fileNumber].localVariables.prevCodes = emitObject.newCodes;
}

function updateCurrCodes(emitObject){
  files.value[emitObject.fileNumber].localVariables.currCodes[emitObject.line] = emitObject.newCodes;
}

function pushCodeRecords(fileNumber, newRecords){
  // files.value[fileNumber].localVariables.codeRecords.value.push(newRecords);
}

function pushCurrCodes(fileNumber){
  // files.value[fileNumber].localVariables.currCodes.value.push("");
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
        v-for="(info,index) in files"
        :key=index
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
          v-if="currentFile == info.filename"
          :variables="info.localVariables"
          :socket="socket"
          :jwt="jwt"
          :fileNumber="index"
          ref="child"
          @updateInput="updateInput"
          @updateTargetLine= "updateTargetLine"
          @updatePrevCodes="updatePrevCodes"
          @updateCurrCodes="updateCurrCodes"
          @pushCodeRecords="pushCodeRecords"
          @pushCurrCodes="pushCurrCodes"
        />
        <!-- <CodeBoardComponent v-else style="display: none;" :codes="info.codes" :socket="socket" :jwt="jwt"/> -->
      </div>
    </div>
  </div>
</template>

<style>
h1 {
  color: red;
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
