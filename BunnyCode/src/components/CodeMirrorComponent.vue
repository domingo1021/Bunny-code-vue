<template>
  <div @input="updateContent" @keyup="checkEventUp">
    <textarea id="editor" cols="30" rows="10"></textarea>
  </div>
  <button @click="checkSame">click</button>
</template>

<script setup>
import * as CodeMirror from "codemirror";
import "codemirror/lib/codemirror.css";
import "codemirror/theme/dracula.css";
import "codemirror/mode/javascript/javascript.js";
import { onMounted, onUpdated, ref } from "vue";

const props = defineProps({
  socket: Object,
  jwt: String,
  info: Object,
  atAlt: Boolean,
  atCtl: Boolean,
});

const emit = defineEmits([
  "updateCurrIndex",
  "updateCurrCodes",
  "updateCurrLine",
  "pushCodeRecords",
]);

let editor = null;

function updateContent(e) {
  console.log("input: ", e.data);
  let addCode = e.data;
  let allCode = editor.getDoc().getValue();
  if (e.data === "(") {
    editor.getDoc().setValue(editor.getDoc().getValue() + ")");
    addCode += ")";
    editor.getDoc().setCursor({ line: props.info.line, ch: props.info.index + 1 });
  }
  emit("pushCodeRecords", {
    fileNumber: props.info.fileNumber,
    newRecords: {
      action: "create",
      line: props.info.line,
      index: props.info.index,
      //length: addCode.length --> 拉出來的時候再去取得就可以了
      code: addCode,
      timestamp: Date.now().toString() + "000000",
    },
  });

  emit("updateCurrIndex", {
    fileNumber: props.info.fileNumber,
    index: props.info.index + addCode.length,
  });
  emit("updateCurrCodes", {
    fileNumber: props.info.fileNumber,
    line: props.info.line,
    index: props.info.index,
    code: allCode,
  });
}

function checkEventUp(e) {
  console.log(e.key)
  if (e.key === "Backspace") {
    let deletedCode;
    if(props.index === 0){
      return
    } else if (props.index === 0 && props.index > 0){
      deletedCode = "\n";
    } else {
      deletedCode = props.info.fileContent.split("\n")[props.fileContent.line].substring(props.info.index - 1, props.info.index)
      emit("updateCurrCodes", {
        fileNumber: props.info.fileNumber,
        line: props.info.line,
        index: props.info.index,
        code: editor.getDoc().getValue(),
      });
    emit("pushCurrCodes", {
      fileNumber: props.info.fileNumber,
      newRecords: {
        action: "delete",
        line: props.info.line,
        index: props.info.index,
        code: deletedCode,
        timestamp: Date.now().toString() + "000000",
      },
    })
  }
    // emit("")
  } else if (e.key === "ArrowLeft"){
    console.log("left");
    if(props.info.index === 0 && props.info.line > 0){
      emit("updateCurrLine", {
        fileNumber: props.fileNumber,
        line: props.info.fileContent - 1,
      });
      emit("updateCurrIndex", {
        fileNumber: props.fileNumber,
        index: props.info.fileContent.split("\n")[props.info.line].length - 1,
      });
      emit("pushCodeRecords", {
        fileNumber: props.info.fileNumber,
        newRecords: {
          action: "left",
          line: props.info.line,
          index: props.info.index,
          //length: addCode.length --> 拉出來的時候再去取得就可以了
          code: "",
          timestamp: Date.now().toString() + "000000",
        },
      })
    }
  }
}

function checkSame() {
  console.log(props.info.codeRecords);
  editor.getDoc().setValue(props.info.fileContent);
}

// function newLine() {
//   console.log("clicked");
//   content.value += "123\n";
//   console.log(content.value);
//   editor.getDoc().setValue(content.value);
// }

onMounted(() => {
  editor = CodeMirror.fromTextArea(document.getElementById("editor"), {
    lineNumbers: true,
    identUnit: 2,
    autofocus: true,
    disabled: false,
    indentWithTab: true,
    tabSize: 2,
    autocorrect: true,
    theme: "dracula",
    mode: "javascript",
  });
});

onUpdated(() => {
  console.log("Content at update:", content.value);
});
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
