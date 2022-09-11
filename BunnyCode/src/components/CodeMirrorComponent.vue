<template>
  <div @input="updateContent" @keyup="checkEventUp">
    <textarea
      v-if="props.readOnly"
      :value="props.info.fileContent"
      id="editor"
      cols="30"
      rows="10"
      readonly
    ></textarea>
    <textarea
      v-else
      id="editor"
      :value="props.info.fileContent"
      cols="30"
      rows="10"
    ></textarea>
  </div>
  <button @click="playback">Playback</button>
  <button @click="runCode">Run code</button>
  <button @click="checkSame">click</button>
</template>

<script setup>
import * as CodeMirror from "codemirror";
import axios from "axios";
import "codemirror/lib/codemirror.css";
import "codemirror/theme/material-darker.css";
import "codemirror/mode/javascript/javascript.js";
import { onMounted } from "vue";

const props = defineProps({
  socket: Object,
  jwt: String,
  info: Object,
  atAlt: Boolean,
  atCtl: Boolean,
  readOnly: Boolean,
});

const emit = defineEmits([
  "updateCurrIndex",
  "updateCurrCodes",
  "updateCurrLine",
  "pushCodeRecords",
  "pushTerminal",
  "updateAllRecords",
  "updateTimeBetween",
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
    index: props.info.index + 1,
  });
  emit("updateCurrCodes", {
    fileNumber: props.info.fileNumber,
    code: allCode,
  });
}

async function checkEventUp(e) {
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
        index: editor.getDoc().getValue().split("\n")[props.info.line].length,
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
    // console.log("index: ",  props.info.index ,
    // props.info.fileContent.split("\n")[props.info.line].length - 1)
    // console.log("line: ",  props.info.line, props.info.fileContent.split("\n").length - 1)
    if (
      props.info.index ===
        props.info.fileContent.split("\n")[props.info.line].length &&
      props.info.line === props.info.fileContent.split("\n").length - 1
    ) {
      console.log("out");
      return;
    } else if (
      props.info.index ===
        props.info.fileContent.split("\n")[props.info.line].length &&
      props.info.fileContent.split("\n").length > 0
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
  } else if (e.ctrlKey && e.keyCode === 83) {
    console.log("Control + Save");
    const saveResponse = await axios.post(
      "https://domingoos.store/api/1.0/record",
      // "https://domingoos.store/api/1.0/record",
      {
        userID: 1,
        projectID: 1,
        versionID: 2,
        fileName: props.info.fileName,
        checkpointNumber: 1,
        batchData: JSON.stringify(props.info.codeRecords),
      }
    );
    console.log("save response: ", saveResponse);
    //Save code file.
    const allCodes = props.info.fileContent;
    console.log("entire code:", allCodes);
    const submitForm = new FormData();
    const blob = new Blob([JSON.stringify(allCodes)], {
      type: "application/javascript",
    });
    submitForm.append("files", blob, props.info.fileName);
    submitForm.append("projectID", 1);
    submitForm.append("versionID", 2);
    submitForm.append("reqCategory", "code_file");
    console.log("prepare to submit !");
    const response = await axios({
      method: "post",
      url: "https://domingoos.store/api/1.0/record/file",
      headers: {
        Authorization: `Bearer ${props.jwt}`,
      },
      data: submitForm,
    });
    console.log(response);
  }
}

async function runCode() {
  const allCodes = props.info.fileContent;
  let result;
  try {
    const compilerResult = await axios.post(
      "https://domingoos.store/api/1.0/compiler",
      {
        userID: 1,
        codes: allCodes,
        fileName: props.fileName,
      }
    );
    result = compilerResult.data.split("\n");
  } catch (error) {
    result = "QQ 好像有 bug";
  }
  emit("pushTerminal", {
    fileNumber: props.fileNumber,
    result: result,
  });
}

function checkSame() {
  console.log(props.info.codeRecords);
  editor.getDoc().setValue(props.info.fileContent);
}

async function playback() {
  //TODO: set 所有父層資料為初始值
  for (let i = 0; i < props.info.timeBetween.length; i++) {
    await new Promise((resolve, reject) => {
      setTimeout(() => {
        const currObject = props.info.codeRecords[i];
        triggerEvent(currObject);
        resolve();
      }, props.info.timeBetween[i]);
    });
  }
}

function triggerEvent(recordObject) {
  const action = recordObject.action;
  if (action === "create") {
    const prevCodes = editor.getDoc().getValue();
    const codes = prevCodes.split("\n");
    codes[recordObject.line] =
      codes[recordObject.line].substring(0, recordObject.index) +
      recordObject.code +
      codes[recordObject.line].substring(recordObject.index);
    let newCodes = "";
    codes.forEach((code, index) => {
      if (index !== codes.length - 1) {
        newCodes += code + "\n";
      } else {
        newCodes += code;
      }
    });
    editor.getDoc().setValue(newCodes);
    emit("updateCurrIndex", {
      fileNumber: props.info.fileNumber,
      index: props.info.index + recordObject.code.length,
    });
    emit("updateCurrCodes", {
      fileNumber: props.info.fileNumber,
      code: newCodes,
    });
  } else if (action === "delete") {
    const prevCodes = editor.getDoc().getValue();
    const codes = prevCodes.split("\n");
    let newCodes = "";
    let changeLineStatus = false;
    console.log(recordObject.code);
    if (recordObject.code === "\r\n") {
      changeLineStatus = true;
      codes[recordObject.line - 1] += codes[recordObject.line];
      codes.splice(recordObject.line, 1);
    } else {
      let lineCode = codes[recordObject.line];
      lineCode =
        lineCode.substring(0, recordObject.index - 1) +
        lineCode.substring(recordObject.index);
      codes[recordObject.line] = lineCode;
    }
    codes.forEach((code, index) => {
      if (index !== codes.length - 1) {
        newCodes += code + "\n";
      } else {
        newCodes += code;
      }
    });
    editor.getDoc().setValue(newCodes);
    emit("updateCurrCodes", {
      fileNumber: props.info.fileNumber,
      code: newCodes,
    });
    if (changeLineStatus) {
      emit("updateCurrLine", {
        fileNumber: props.info.fileNumber,
        line: props.info.line - 1,
      });
      emit("updateCurrIndex", {
        fileNumber: props.info.fileNumber,
        index: newCodes.split("\n")[props.info.line].length,
      });
      console.log(
        "update index at: ",
        newCodes.split("\n")[props.info.line].length
      );
    } else {
      emit("updateCurrIndex", {
        fileNumber: props.info.fileNumber,
        index: props.info.index - 1,
      });
    }
  } else if (action === "enter") {
    console.log("enter");
    const prevCodes = editor.getDoc().getValue();
    const codes = prevCodes.split("\n");
    let lineCode = codes[props.info.line];
    console.log(recordObject.index, props.info.index);
    codes.splice(
      props.info.line + 1,
      0,
      lineCode.substring(recordObject.index)
    );
    codes[props.info.line] = lineCode.substring(0, recordObject.index);
    const newCodes = codes.reduce((prev, curr, index) => {
      if (index !== codes.length - 1) {
        prev += curr + "\n";
      } else {
        prev += curr;
      }
      return prev;
    }, "");
    editor.getDoc().setValue(newCodes);
    emit("updateCurrCodes", {
      fileNumber: props.info.fileNumber,
      code: newCodes,
    });
    emit("updateCurrLine", {
      fileNumber: props.info.fileNumber,
      line: props.info.line + 1,
    });
    emit("updateCurrIndex", {
      fileNumber: props.info.fileNumber,
      index: 0,
    });
  }
}

onMounted(async () => {
  console.log("readOnly: ", props.readOnly);
  let tmpReadOnly = props.readOnly;
  if (tmpReadOnly) {
    tmpReadOnly = "nocursor";
  }
  editor = CodeMirror.fromTextArea(document.getElementById("editor"), {
    value: props.info.fileContent,
    lineNumbers: true,
    identUnit: 2,
    autofocus: true,
    readOnly: tmpReadOnly,
    indentWithTab: true,
    tabSize: 2,
    autocorrect: true,
    theme: "material-darker",
    mode: "javascript",
  });
  editor.getDoc().setCursor({ line: props.info.line, ch: props.info.index });
  if (props.readOnly) {
    let recordResponse = await axios.post(
      "https://domingoos.store/api/1.0/history/1",
      {
        projectID: 1,
        startTime: "2022-09-03T04:25:32.985Z",
        stopTime: "2022-09-10T04:25:32.985Z",
      }
    );
    recordResponse = recordResponse.data.data;
    console.log(props.info.fileNumber, recordResponse);
    emit("updateAllRecords", {
      fileNumber: props.info.fileNumber,
      codeRecords: recordResponse,
    });
    let tmpTimeBetween = [0];
    for (let i = 0; i < recordResponse.length; i++) {
      if (i == 0) {
        continue;
      }
      tmpTimeBetween.push(
        new Date(recordResponse[i].timestamp).getTime() -
          new Date(recordResponse[i - 1].timestamp).getTime()
      );
    }
    emit("updateTimeBetween", {
      fileNumber: props.info.fileNumber,
      timeBetween: tmpTimeBetween,
    });
    console.log("Time Between: ", props.info.timeBetween);
  }
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
