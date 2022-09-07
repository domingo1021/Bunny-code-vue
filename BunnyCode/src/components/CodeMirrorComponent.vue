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
import { onMounted } from "vue";

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
    editor
      .getDoc()
      .setCursor({ line: props.info.line, ch: props.info.index + 1 });
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
    code: allCode,
  });
}

function checkEventUp(e) {
  console.log(e.key);
  if (e.key === "Enter") {
    console.log("Enter");
    //1. change curr code (可以直接讀 Code mirror 的資訊);
    //2. push records
    //3. change line
    //4. change index
    let allCode = editor.getDoc().getValue();
    emit("updateCurrCodes", {
      fileNumber: props.info.fileNumber,
      code: allCode,
    });
    emit("pushCodeRecords", {
      fileNumber: props.info.fileNumber,
      newRecords: {
        action: "enter",
        line: props.info.line,
        index: props.info.index,
        code: "",
        timestamp: Date.now().toString() + "000000",
      },
    });
    emit("updateCurrLine", {
      fileNumber: props.info.fileNumber,
      line: props.info.line + 1,
    });
    emit("updateCurrIndex", {
      fileNumber: props.info.fileNumber,
      index: 0,
    });
  } else if (e.key === "Backspace") {
    // 1. 如果index=0 且 line>0 ，換行
    // 2. 其餘則直接修改當行 index, code;
    // 3. push records
    let deletedCode;
    let changeLineStatus = 0;
    if (props.info.index === 0 && props.info.line === 0) {
      return;
    } else if (props.info.index === 0 && props.info.line > 0) {
      deletedCode = "\n";
      changeLineStatus = 1;
    } else {
      deletedCode = props.info.fileContent
        .split("\n")
        [props.info.line].substring(props.info.index - 1, props.info.index);
    }
    emit("updateCurrCodes", {
      fileNumber: props.info.fileNumber,
      code: editor.getDoc().getValue(),
    });
    emit("pushCodeRecords", {
      fileNumber: props.info.fileNumber,
      newRecords: {
        action: "delete",
        line: props.info.line,
        index: props.info.index,
        code: deletedCode,
        timestamp: Date.now().toString() + "000000",
      },
    });
    if (changeLineStatus) {
      emit("updateCurrLine", {
        fileNumber: props.info.fileNumber,
        line: props.info.line - 1,
      });
      emit("updateCurrIndex", {
        fileNumber: props.info.fileNumber,
        index:
          editor.getDoc().getValue().split("\n")[props.info.line].length - 1,
      });
    } else {
      emit("updateCurrIndex", {
        fileNumber: props.info.fileNumber,
        index: props.info.index - 1,
      });
    }
  } else if (e.key === "ArrowLeft") {
    console.log("left");
    if (props.info.index === 0 && props.info.line === 0) {
      return;
    } else if (props.info.index === 0 && props.info.line > 0) {
      emit("pushCodeRecords", {
        fileNumber: props.info.fileNumber,
        newRecords: {
          action: "left",
          line: props.info.line,
          index: props.info.index,
          code: "",
          timestamp: Date.now().toString() + "000000",
        },
      });
      emit("updateCurrLine", {
        fileNumber: props.info.fileNumber,
        line: props.info.line - 1,
      });
      emit("updateCurrIndex", {
        fileNumber: props.info.fileNumber,
        index: props.info.fileContent.split("\n")[props.info.line].length - 1,
      });
    } else {
      emit("pushCodeRecords", {
        fileNumber: props.info.fileNumber,
        newRecords: {
          action: "left",
          line: props.info.line,
          index: props.info.index,
          code: "",
          timestamp: Date.now().toString() + "000000",
        },
      });
      emit("updateCurrIndex", {
        fileNumber: props.info.fileNumber,
        index: props.info.index - 1,
      });
    }
  } else if (e.key === "ArrowRight") {
    console.log("right");
    if (
      props.info.index ===
        props.info.fileContent.split("\n")[props.info.line].length - 1 &&
      props.info.line === props.info.fileContent.split("\n").length - 1
    ) {
      return;
    } else if (
      props.info.index ===
      props.info.fileContent.split("\n")[props.info.line].length - 1
    ) {
      emit("pushCodeRecords", {
        fileNumber: props.info.fileNumber,
        newRecords: {
          action: "right",
          line: props.info.line,
          index: props.info.index,
          code: "\n",
          timestamp: Date.now().toString() + "000000",
        },
      });
      emit("updateCurrLine", {
        fileNumber: props.info.fileNumber,
        line: props.info.line + 1,
      });
      emit("updateCurrIndex", {
        fileNumber: props.info.fileNumber,
        index: 0,
      });
    } else {
      emit("pushCodeRecords", {
        fileNumber: props.info.fileNumber,
        newRecords: {
          action: "right",
          line: props.info.line,
          index: props.info.index,
          code: "",
          timestamp: Date.now().toString() + "000000",
        },
      });
      emit("updateCurrIndex", {
        fileNumber: props.info.fileNumber,
        index: props.info.index + 1,
      });
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
