<template>
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
    />
  </div>
</template>

<script setup>
import CodeMirrorComponent from "../components/CodeMirrorComponent.vue";
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
    fileContent: "",
    index: 0,
    line: 0,
    codeRecords: [],
  },
]);

function checkEventDown(e) {
  // console.log("event down: ", e.key);
}

function checkEventUp(e) {
  // console.log("event up: ", e);
}

//emit function
function updateCurrCodes(emitObject) {
  folderInfo.value[emitObject.fileNumber].fileContent = emitObject.code;
  console.log("current codes: ", folderInfo.value[emitObject.fileNumber].fileContent);
  // let prevCodes =
  //   folderInfo.value[emitObject.fileNumber].fileContent.split("\n");

  // folderInfo.value[emitObject.fileNumber].fileContent =
  //   prevCodes[emitObject.line].substring(0, emitObject.index) +
  //   emitObject.code +
  //   prevCodes[emitObject.line].substring(emitObject.index);
}

function updateCurrIndex(emitObject) {
  folderInfo.value[emitObject.fileNumber].index = emitObject.index;
}

function updateCurrLine(emitObject){
  folderInfo.value[emitObject.fileNumber].line = emitObject.line;
}

function pushCodeRecords(emitObject) {
  folderInfo.value[emitObject.fileNumber].codeRecords.push(emitObject.newRecords);
  console.log(folderInfo.value[emitObject.fileNumber].codeRecords)
}
</script>

<style scoped>
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
</style>
