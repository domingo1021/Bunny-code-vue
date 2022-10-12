<template>
  <div
    style="margin: 0% 0% 1% 1%; display: flex; justify-content: space-between"
  >
    <div>
      Challenger #{{ info.battlerNumber + 1 }}: &nbsp;
      <strong>{{ info.userName }}</strong>
    </div>
    <div style="display: flex; margin-right:10px">
      <div>Chance remains:</div>
      <div id="remain-time">{{ info.compileChance }}</div>
    </div>
  </div>
  <div @input="updateContent" @keydown="checkEventDown">
    <textarea
      :value="props.info.fileContent"
      :id="`user-${info.userID}-editor`"
      cols="30"
      rows="10"
      hidden
    ></textarea>
  </div>
</template>

<script setup>
import * as CodeMirror from "codemirror";
import "codemirror/lib/codemirror.css";
import "codemirror/theme/dracula.css";
import "codemirror/mode/javascript/javascript.js";
import { nextTick, onUpdated, ref, watch } from "vue";
import { Swal } from "sweetalert2/dist/sweetalert2";

const props = defineProps({
  id: String,
  info: Object,
  atAlt: Boolean,
  atCtl: Boolean,
  readOnly: Boolean,
  message: Object,
  start: Boolean,
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
const autoComplete = ["[", "(", "{", '"', "'"];

function updateContent(e) {
  console.log("read only: ", props.readOnly);
  console.log("Data: ", e.data);
  if (props.readOnly) {
    editor.getDoc().setValue(props.info.fileContent);
    editor.getDoc().setCursor({ line: props.info.line, ch: props.info.index });
    return;
  }
  const { line, ch } = editor.getDoc().getCursor();
  let allCode = editor.getDoc().getValue();
  if (autoComplete.includes(e.data)) {
    let anotherPart = "";
    switch (e.data) {
      case "(":
        anotherPart = ")";
        break;
      case "[":
        anotherPart = "]";
        break;
      case "{":
        anotherPart = "}";
        break;
      case '"':
        anotherPart = '"';
        break;
      case "'":
        anotherPart = "'";
        break;
    }
    const splitCodes = allCode.split("\n");
    let lineCode = splitCodes[line];
    lineCode = lineCode.substring(0, ch) + anotherPart + lineCode.substring(ch);
    allCode = splitCodes.reduce((prev, curr, splitLine) => {
      if (splitLine === splitCodes.length - 1) {
        if (line === splitLine) {
          prev += lineCode;
        } else {
          prev += curr;
        }
      } else {
        if (line === splitLine) {
          prev += lineCode + "\n";
        } else {
          prev += curr + "\n";
        }
      }
      return prev;
    }, "");
    editor.getDoc().setValue(allCode);
    editor.getDoc().setCursor({ line: line, ch: ch });
  }
  emit("updateCurrCodes", {
    battlerNumber: props.info.battlerNumber,
    code: allCode,
  });
}

async function checkEventDown(e) {
  if (props.readOnly) {
    editor.getDoc().setValue(props.info.fileContent);
    editor.getDoc().setCursor({ line: props.info.line, ch: props.info.index });
    return;
  }
  if (e.ctrlKey && e.code === "KeyV") {
    e.preventDefault();
    if (!props.readOnly) {
      Swal.fire({
        icon: "error",
        title: "Warning !",
        text: "Cannot copy & paste during the battle.",
      });
    }
  } else if (e.metaKey && e.code === "KeyV") {
    e.preventDefault();
    if (!props.readOnly) {
      Swal.fire({
        icon: "error",
        title: "Warning !",
        text: "Cannot copy & paste during the battle.",
      });
    }
  } else {
    let allCode = editor.getDoc().getValue();
    emit("updateCurrCodes", {
      battlerNumber: props.info.battlerNumber,
      code: allCode,
    });
  }
}

watch(
  () => props.info.fileContent,
  (now, prev) => {
    if (prev === "") {
      if (editor === null) {
        return;
      }
      const splits = now.split("\n");
      const fileContentLength = splits.length;
      editor.getDoc().setValue(now);
      editor.getDoc().setCursor({
        line: fileContentLength - 1,
        ch: splits[fileContentLength - 1].length,
      });
    }
  }
);

watch(
  () => props.start,
  async (now, prev) => {
    await nextTick();
    if (editor === null) {
      return;
    }
    if (prev === false && now === true) {
      editor.getDoc().setValue(props.info.fileContent);
    }
  }
);

function initEditor(){
  console.log("read only: ", props.readOnly);
  if (!mirrorCreated.value) {
    let tmpReadOnly = props.readOnly;
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
}

// onMounted(async () => {
//   initEditor();
// })

onUpdated(async () => {
  initEditor();
});
</script>

<style>
#remain-time{
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 50%;
  margin-left: 10px; 
  background-color: rgb(200, 42, 42);
  width: 20px;
  height: 20px;
}
</style>