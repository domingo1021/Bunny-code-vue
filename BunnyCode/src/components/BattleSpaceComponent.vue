<template>
  <div style="margin: 0% 0% 1% 1%">
    Challenger #{{ info.battlerNumber + 1 }}: &nbsp;
    <strong>{{ info.userName }}</strong>
  </div>
  <div @input="updateContent" @keyup="checkEventUp">
    <textarea
      :value="props.info.fileContent"
      :id="`user-${info.userID}-editor`"
      cols="30"
      rows="10"
    ></textarea>
  </div>
  <!-- <div v-for="(msg, index) in message" :key="index">{{ msg }}</div> -->
</template>

<script setup>
// import axios from "axios";
import * as CodeMirror from "codemirror";
import "codemirror/lib/codemirror.css";
import "codemirror/theme/dracula.css";
import "codemirror/mode/javascript/javascript.js";
import { nextTick, onUpdated, ref, watch } from "vue";

const props = defineProps({
  id: String,
  info: Object,
  atAlt: Boolean,
  atCtl: Boolean,
  readOnly: Boolean,
  message: Object,
});

const emit = defineEmits([
  "updateCurrIndex",
  "updateCurrLine",
  "updateCurrCodes",
  "pushCodeRecords",
  "pushTerminal",
  "updateAllRecords",
  "updateTimeBetween",
]);

let editor = null;

const mirrorCreated = ref(false);

function updateContent(e) {
  console.log(props.info.line, props.info.index);
  console.log("input: ", e.data);
  if (props.readOnly) {
    editor.getDoc().setValue(props.info.fileContent);
    editor.getDoc().setCursor({ line: props.info.line, ch: props.info.index });
    return;
  }
  let allCode = editor.getDoc().getValue();
  console.log("Battler number: ", props.info.battlerNumber);
  emit("updateCurrCodes", {
    battlerNumber: props.info.battlerNumber,
    code: allCode,
  });
}

watch(
  () => props.info.fileContent,
  (now, prev) => {
    if (prev === "") {
      editor.getDoc().setValue(now);
    }
  }
);

onUpdated(async () => {
  if (!mirrorCreated.value) {
    let tmpReadOnly = props.readOnly;
    await nextTick();
    if (tmpReadOnly) {
      tmpReadOnly = "nocursor";
    }
    editor = CodeMirror.fromTextArea(
      document.getElementById(`user-${props.info.userID}-editor`),
      {
        value: props.info.fileContent,
        lineNumbers: true,
        identUnit: 2,
        autofocus: true,
        readOnly: tmpReadOnly,
        indentWithTab: true,
        tabSize: 2,
        autocorrect: true,
        theme: "dracula",
        mode: "javascript",
      }
    );
    mirrorCreated.value = true;
  }
  if (props.readOnly) {
    console.log("updated");
    editor.getDoc().setValue(props.info.fileContent);
    editor.getDoc().setCursor({ line: props.info.line, ch: props.info.index });
  }
});

</script>
