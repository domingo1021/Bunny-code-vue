<template>
  <div style="display: flex;">
    <div id="files-bar" v-if="props.version">
      <div class="files" v-for="(file, index) in props.version.files" :key="index">
        <div class="language">{{file.language.toUpperCase()}} </div> 
        <div>  &nbsp;  </div>
        <div>{{file.fileName}}</div>
      </div>
    </div>
    <div style="width: 100%">
      <textarea name="" v-model="text" id="editor" cols="20" rows="10"></textarea>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from "vue";
import * as CodeMirror from "codemirror";
import "codemirror/lib/codemirror.css";
import "codemirror/theme/material-darker.css";
import "codemirror/mode/javascript/javascript.js";
import axios from "axios";

const props = defineProps({
  targetVersionIndex: Number,
  version: Object,
});

const text = "console.log(123)";

let editor = null;

onMounted(async () => {
  console.log(props.version);
  // await Promise.all(
    // props.version.files.map(async (file) => {
    //   let cloudFrontResult = await axios.get(file.fileURL);
    //   fileContent = cloudFrontResult.data;
    // })
  // );
  editor = CodeMirror.fromTextArea(document.getElementById("editor"), {
    lineNumbers: true,
    identUnit: 2,
    autofocus: true,
    readOnly: "nocursor",
    indentWithTab: true,
    tabSize: 2,
    autocorrect: true,
    theme: "material-darker",
    mode: "javascript",
  });
});
</script>

<style scoped>
#files-bar{
  margin-left: 1px;
  padding-left: 20px;
  width: 250px;
  height: 100vh;
  background-color: rgb(36, 36, 36);
  color: rgb(255, 255, 255);
}

.language{
  color: rgb(248, 255, 53);
}

.files{
  display: flex;
}
.files:hover{
  background-color: rgb(102, 102, 102);
}
.files:active{
  background-color: rgb(187, 187, 187);
}

#editor{
  width: 100vw;
}
</style>
