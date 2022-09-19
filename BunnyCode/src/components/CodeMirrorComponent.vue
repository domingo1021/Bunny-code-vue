<!-- eslint-disable prettier/prettier -->
<script setup>
import * as CodeMirror from "codemirror";
import axios from "axios";
import "codemirror/lib/codemirror.css";
import "codemirror/theme/material-darker.css";
import "codemirror/mode/javascript/javascript.js";
import { nextTick, onBeforeMount, onMounted, ref, watch } from "vue";
import { Modal } from "bootstrap";

const props = defineProps({
  projectID: Number,
  jwt: String,
  info: Object,
  records: Object,
  atAlt: Boolean,
  atCtl: Boolean,
  readOnly: Boolean,
  authorization: Boolean,
});

const emit = defineEmits([
  "updateCurrIndex",
  "updateCurrCodes",
  "updateCurrLine",
  "pushCodeRecords",
  "pushTerminal",
  "updateAllRecords",
  "updateTimeBetween",
  "pushSaveRecords",
  "updateVersionFile",
]);

let editor = null;

const fileContent = ref(props.info.fileContent);

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
  console.log("file content: ", props.info.fileContent);
  console.log("file line: ", props.info.line);
  console.log("file index: ", props.info.index);
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
      console.log("content", props.info.fileContent);
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
    if (props.records.length !== 0) {
      return;
    }
    showModal();
  }
}

async function saveFileRecord() {
  let saveResponse;
  try {
    saveResponse = await axios.post(
      "https://domingoos.store/api/1.0/record",
      // "http://localhost:3000/api/1.0/record",
      {
        projectID: props.projectID,
        versionID: props.info.versionID,
        fileID: props.info.fileID,
        baseURL: props.info.fileURL,
        batchData: JSON.stringify(props.info.codeRecords),
      }
    );
  } catch (error) {
    alert(error.response.data.msg);
    return;
  }
  console.log(saveResponse.data);
  emit("pushSaveRecords", saveResponse.data);
  // SaveResponse.data.data
  // Save code file.
  const allCodes = props.info.fileContent;
  console.log("entire code:", allCodes);
  const submitForm = new FormData();
  const blob = new Blob([JSON.stringify(allCodes)], {
    type: "application/javascript",
  });
  submitForm.append("files", blob, props.info.fileName);
  submitForm.append("projectID", props.projectID);
  submitForm.append("versionID", props.info.versionID);
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
  // //TODO: get new Detail
  emit("updateVersionFile", {
    fileURL: response.data.data,
  })
  console.log(response)
  myModal.hide();
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
        fileName: props.info.fileName,
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

async function playback() {
  //TODO: setValue 所有上一個版本的 Code 作為初始值
  const baseContent = await axios.get(props.records[0].baseURL);
  const currentLine = baseContent.data.split("\n").length - 1;
  const currentIndex = baseContent.data.split("\n")[currentLine].length;
  emit("updateCurrIndex", {
    fileNumber: props.info.fileNumber,
    index: currentIndex,
  });
  emit("updateCurrLine", {
    fileNumber: props.info.fileNumber,
    line: currentLine,
  });
  editor.getDoc().setValue(baseContent.data);
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
    if(recordObject.code === "\"\""){
      recordObject.code = '"';
    }
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
// onBeforeMount(async () => {
//   console.log("Finding records: ", props.info);
//   const fileUrlContent = await axios.get(props.info.fileURL);
//   fileContent.value = fileUrlContent.data;
//   emit("updateCurrCodes", {
//     fileNumber: props.info.fileNumber,
//     code: fileContent.value,
//   });
// });

async function initSaveRecords() {
  let recordResponse;
  if (props.records.length === 0) {
    return;
  }
  try {
    console.log("start time: ", props.records[0].startTime);
    console.log(`stopTime: ${props.records[0].endTime}`);
    recordResponse = await axios.post(
      // `http://localhost:3000/api/1.0/history/${props.projectID}`,
      `https://domingoos.store/api/1.0/history/${props.projectID}`,
      {
        versionID: props.info.versionID,
        startTime: props.records[0].startTime,
        stopTime: props.records[0].endTime,
      }
    );
  } catch (error) {
    console.log(error);
  }
  recordResponse = recordResponse.data.data;
  console.log("records", props.info.fileNumber, recordResponse);
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
}

async function initCodeMirror() {
  console.log("init index: ", props.info.index);
  console.log("init line: ", props.info.line);
  console.log("prepare to initial");
  console.log("code mirror file URL: ", props.info.fileURL);
  const fileUrlContent = await axios.get(props.info.fileURL);
  if (props.info.fileContent === "") {
    emit("updateCurrCodes", {
      fileNumber: props.info.fileNumber,
      code: fileUrlContent.data,
    });
  }
  emit("updateCurrLine", {
    fileNumber: props.info.fileNumber,
    line: props.info.fileContent.split("\n").length - 1,
  });
  emit("updateCurrIndex", {
    fileNumber: props.info.fileNumber,
    index: props.info.fileContent.length,
  });
  let tmpReadOnly = props.readOnly;
  let cursorHeight = 0.85;
  if (tmpReadOnly === undefined) {
    console.log("props.readOnly: ", props.readOnly);
    return;
  }
  if (tmpReadOnly) {
    // tmpReadOnly = "nocursor";
    cursorHeight = 0;
  }
  console.log("read only: ", props.readOnly);
  const editors = document.getElementsByClassName("CodeMirror");
  console.log("Editor length: ", Array.from(editors).length);
  if (editors.length !== 0) {
    console.log("in");
    Array.from(editors).forEach((element) => {
      element.remove();
    });
  }
  console.log("file content:", props.info.fileContent);
  editor = CodeMirror.fromTextArea(document.getElementById("editor"), {
    value: props.info.fileContent,
    lineNumbers: true,
    identUnit: 2,
    autofocus: true,
    readOnly: tmpReadOnly,
    cursorHeight: cursorHeight,
    indentWithTab: true,
    tabSize: 2,
    autocorrect: true,
    theme: "material-darker",
    mode: "javascript",
  });
  editor.getDoc().setValue(props.info.fileContent);
  console.log(editor.getDoc().getCursor());
  editor.getDoc().setCursor({ line: props.info.line, ch: props.info.index });
  if (props.readOnly) {
    await initSaveRecords();
  }
}

watch(
  () => props.readOnly,
  async (newReadOnly, prevReadOnly) => {
    console.log("readOnly change: ", newReadOnly);
    await nextTick();
    await initCodeMirror();
  }
);

watch(
  () => props.records,
  async (newRecords, prevRecords) => {
    console.log("records updated");
    await initSaveRecords();
  }
);

onBeforeMount(async () => {
  await initCodeMirror();
});

function userClick() {
  alert("僅提供鍵盤輸入功能");
  editor.getDoc().setCursor({ line: props.info.line, ch: props.info.index });
}
let myModal;
onMounted(() => {
  myModal = new Modal(modalObject.value, {});
});

const modalObject = ref(null);
function showModal() {
  myModal.show();
}
function hideModal() {
  myModal.hide();
}
</script>

<template>
  <div @input="updateContent" @keyup="checkEventUp">
    <div v-if="props.readOnly">
      <textarea :value="fileContent" id="editor" cols="30" rows="10"></textarea>
    </div>
    <div v-else @click="userClick">
      <textarea
        id="editor"
        :value="fileContent"
        cols="30"
        rows="10"
        style="pointer-events: none"
      ></textarea>
    </div>
  </div>
  <button v-if="!props.readOnly" @click="showModal">show modal</button>
  <div id="save-alert">
    <div
      class="modal fade"
      id="exampleModal"
      ref="modalObject"
      tabindex="-1"
      role="dialog"
      aria-labelledby="myModalLabel"
      aria-hidden="false"
    >
      <div class="modal-dialog" role="document">
        <div class="modal-content">
          <div class="modal-header text-center">
            <h4 class="modal-title w-100 font-weight-bold">Create Version</h4>
            <button
              type="button"
              class="close btn btn-indigo"
              data-bs-dismiss="modal"
              data-dismiss="modal"
              aria-label="Close"
            >
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div class="modal-body mx-3">是否要儲存？</div>
          <div style="display: flex; justify-content: center">
            <button class="confirm-btn" @click="saveFileRecord">是</button>
            <button class="confirm-btn" @click="hideModal">否</button>
          </div>
        </div>
      </div>
    </div>
  </div>
  <button @click="playback">Playback</button>
  <button v-if="props.authorization" @click="runCode">Run code</button>
</template>

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

#save-alert {
  left: 100px;
  background-color: aliceblue;
  position: absolute;
  top: 50px;
  height: 500px;
}

.confirm-btn {
  margin: 5%;
}
</style>
