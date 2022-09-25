<template>
  <div style="display: flex">
    <div id="files-bar" v-if="props.version">
      <div
        class="files"
        v-for="(file, index) in props.version.files"
        :key="index"
      >
        <div class="language">{{ file.language.toUpperCase() }}</div>
        <div>&nbsp;</div>
        <div>{{ file.fileName }}</div>
      </div>
    </div>
    <div style="width: 100%; background-color: rgb(36, 36, 36)">
      <textarea
        name=""
        :value="text"
        id="version"
        cols="20"
        rows="10"
      ></textarea>
      <div style="display: flex; width: 100%; justify-content: right">
        <button @click="intoFolder" style="margin-right: 5%; border-radius: 5px;">
          Go to version
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { nextTick, onBeforeMount, ref, watch } from "vue";
import * as CodeMirror from "codemirror";
import "codemirror/lib/codemirror.css";
import "codemirror/theme/night.css";
import "codemirror/theme/material-darker.css";
import "codemirror/mode/javascript/javascript.js";
import axios from "axios";

const props = defineProps({
  targetVersionIndex: Number,
  version: Object,
});

const emit = defineEmits(["updateTarget", "setUserID", "syncVersion"]);

//TODO: set text default value = "";
const text = ref("123");

let editor = null;

async function initVersionContent() {
  const fileContent = await axios.get(props.version.files[0].fileURL);
  text.value = fileContent.data;
  const editors = Array.from(document.getElementsByClassName("CodeMirror"));
  editors.forEach((element) => {
    console.log("removeing...");
    element.remove();
  });
  editor = CodeMirror.fromTextArea(document.getElementById("version"), {
    value: text.value,
    lineNumbers: true,
    identUnit: 2,
    autofocus: true,
    readOnly: true,
    cursorHeight: 0,
    indentWithTab: true,
    tabSize: 2,
    autocorrect: true,
    theme: "material-darker",
    mode: "javascript",
  });
  editor.getDoc().setValue(text.value);
}

async function intoFolder() {
  emit("syncVersion");
  await nextTick();
  emit("updateTarget", "Folder");
}

watch(
  () => props.targetVersionIndex,
  async (newIndex, prevIndex) => {
    await initVersionContent();
  }
);

onBeforeMount(async () => {
  await initVersionContent();
});
</script>

<style scoped>
#files-bar {
  margin-left: 1px;
  padding-left: 20px;
  width: 250px;
  height: 100vh;
  background-color: rgb(36, 36, 36);
  color: rgb(255, 255, 255);
}

.language {
  color: rgb(248, 255, 53);
}

.files {
  display: flex;
}
.files:hover {
  background-color: rgb(102, 102, 102);
}
.files:active {
  background-color: rgb(187, 187, 187);
}

#editor {
  width: 100vw;
}
</style>
