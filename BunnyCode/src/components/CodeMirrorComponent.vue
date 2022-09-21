<script setup>
import * as CodeMirror from "codemirror";
import axios from "axios";
import "codemirror/lib/codemirror.css";
import "codemirror/theme/material-darker.css";
import "codemirror/mode/javascript/javascript.js";
import {
  nextTick,
  onBeforeMount,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import { Modal } from "bootstrap";

// TODO: check user agent for keyword.

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
const autoComplete = ["(", "[", "{", '"'];
let playIndex = 0;
let keepPlay = false;
let baseContent;
let baseLine;
let baseIndex;
let redo = [];
let undo = [];

function updateContent(e) {
  if (props.readOnly) {
    editor.getDoc().setValue(props.info.fileContent);
    editor.getDoc().setCursor({ line: props.info.line, ch: props.info.index });
    return;
  }
  console.log("Input key: ", e.data);
  let addCode = e.data;
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
    }
    const splitCodes = allCode.split("\n");
    let lineCode = splitCodes[props.info.line];
    lineCode =
      lineCode.substring(0, props.info.index + 1) +
      anotherPart +
      lineCode.substring(props.info.index + 1);
    allCode = splitCodes.reduce((prev, curr, line) => {
      if (line === splitCodes.length - 1) {
        if (props.info.line === line) {
          prev += lineCode;
        } else {
          prev += curr;
        }
      } else {
        if (props.info.line === line) {
          prev += lineCode + "\n";
        } else {
          prev += curr + "\n";
        }
      }
      return prev;
    }, "");
    editor.getDoc().setValue(allCode);
    addCode += anotherPart;
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
  if (props.readOnly) {
    editor.getDoc().setValue(props.info.fileContent);
    editor.getDoc().setCursor({ line: props.info.line, ch: props.info.index });
    return;
  }
  console.log("key: ", e.key, e.keyCode, e.metaKey);
  if (e.key === "Enter") {
    console.log("Enter");
    let allCode = editor.getDoc().getValue();
    emit("updateCurrCodes", {
      fileNumber: props.info.fileNumber,
      code: allCode,
    });
    const currentCursor = editor.getDoc().getCursor();
    emit("pushCodeRecords", {
      fileNumber: props.info.fileNumber,
      newRecords: {
        action: "enter",
        line: currentCursor.line,
        index: currentCursor.ch,
        code: "",
        timestamp: Date.now().toString() + "000000",
      },
    });
    emit("updateCurrLine", {
      fileNumber: props.info.fileNumber,
      line: currentCursor.line,
    });
    emit("updateCurrIndex", {
      fileNumber: props.info.fileNumber,
      index: currentCursor.ch,
    });
  } else if (e.key === "Backspace") {
    // 1. 如果index=0 且 line>0 ，換行
    // 2. 其餘則直接修改當行 index, code;
    // 3. push records
    let deletedCode;
    if (props.info.index === 0 && props.info.line === 0) {
      return;
    } else if (props.info.index === 0 && props.info.line > 0) {
      deletedCode = "\n";
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
    const currentCursor = editor.getDoc().getCursor();
    emit("updateCurrLine", {
      fileNumber: props.info.fileNumber,
      line: currentCursor.line,
    });
    emit("updateCurrIndex", {
      fileNumber: props.info.fileNumber,
      index: currentCursor.ch,
    });
  } else if (
    e.keyCode === 40 ||
    e.keyCode === 38 ||
    e.key === "ArrowRight" ||
    e.key === "ArrowLeft"
  ) {
    const currentCursor = editor.getDoc().getCursor();
    const currentLine = currentCursor.line;
    const currentIndex = currentCursor.ch;
    if (e.keyCode === 40) {
      emit("pushCodeRecords", {
        fileNumber: props.info.fileNumber,
        newRecords: {
          action: "down",
          line: currentLine,
          index: currentIndex,
          code: "",
          timestamp: Date.now().toString() + "000000",
        },
      });
    } else if (e.keyCode === 38) {
      emit("pushCodeRecords", {
        fileNumber: props.info.fileNumber,
        newRecords: {
          action: "up",
          line: currentLine,
          index: currentIndex,
          code: "",
          timestamp: Date.now().toString() + "000000",
        },
      });
    } else if (e.key === "ArrowRight") {
      emit("pushCodeRecords", {
        fileNumber: props.info.fileNumber,
        newRecords: {
          action: "right",
          line: currentLine,
          index: currentIndex,
          code: "",
          timestamp: Date.now().toString() + "000000",
        },
      });
    } else if (e.key === "ArrowLeft") {
      emit("pushCodeRecords", {
        fileNumber: props.info.fileNumber,
        newRecords: {
          action: "left",
          line: currentLine,
          index: currentIndex,
          code: "",
          timestamp: Date.now().toString() + "000000",
        },
      });
    }
    emit("updateCurrLine", {
      fileNumber: props.info.fileNumber,
      line: currentLine,
    });
    emit("updateCurrIndex", {
      fileNumber: props.info.fileNumber,
      index: currentIndex,
    });
  } else if (e.metaKey && e.keyCode === 83) {
    console.log("Command + Save");
    e.preventDefault();
    if (props.records.length !== 0) {
      return;
    }
    showModal();
  } else if (e.ctrlKey && e.keyCode === 65) {
    if (e.repeat) {
      return;
    }
    console.log("To Front");
    const currentCursor = editor.getDoc().getCursor();
    const currentLine = currentCursor.line;
    const currentIndex = currentCursor.ch;
    emit("pushCodeRecords", {
      fileNumber: props.info.fileNumber,
      newRecords: {
        action: "front",
        line: currentLine,
        index: currentIndex,
        code: "",
        timestamp: Date.now().toString() + "000000",
      },
    });
    emit("updateCurrLine", {
      fileNumber: props.info.fileNumber,
      line: currentLine,
    });
    emit("updateCurrIndex", {
      fileNumber: props.info.fileNumber,
      index: currentIndex,
    });
  } else if (e.ctrlKey && e.keyCode === 69) {
    if (e.repeat) {
      return;
    }
    console.log("To end");
    const currentCursor = editor.getDoc().getCursor();
    const currentLine = currentCursor.line;
    const currentIndex = currentCursor.ch;
    emit("pushCodeRecords", {
      fileNumber: props.info.fileNumber,
      newRecords: {
        action: "end",
        line: currentLine,
        index: currentIndex,
        code: "",
        timestamp: Date.now().toString() + "000000",
      },
    });
    emit("updateCurrLine", {
      fileNumber: props.info.fileNumber,
      line: currentLine,
    });
    emit("updateCurrIndex", {
      fileNumber: props.info.fileNumber,
      index: currentIndex,
    });
  } else if (e.keyCode === 9) {
    // user press tab
    const tabCode = "  ";
    const splitCodes = props.info.fileContent.split("\n");
    let lineCode = splitCodes[props.info.line];
    lineCode =
      lineCode.substring(0, props.info.index) +
      tabCode +
      lineCode.substring(props.info.index);
    const allCode = splitCodes.reduce((prev, curr, line) => {
      if (line === splitCodes.length - 1) {
        if (props.info.line === line) {
          prev += lineCode;
        } else {
          prev += curr;
        }
      } else {
        if (props.info.line === line) {
          prev += lineCode + "\n";
        } else {
          prev += curr + "\n";
        }
      }
      return prev;
    }, "");
    editor.getDoc().setValue(allCode);
    editor
      .getDoc()
      .setCursor({ line: props.info.line, ch: props.info.index + 2 });
    emit("updateCurrCodes", {
      fileNumber: props.info.fileNumber,
      code: allCode,
    });
    emit("pushCodeRecords", {
      fileNumber: props.info.fileNumber,
      newRecords: {
        action: "tab",
        line: props.info.line,
        index: props.info.index,
        code: tabCode,
        timestamp: Date.now().toString() + "000000",
      },
    });
    emit("updateCurrLine", {
      fileNumber: props.info.fileNumber,
      line: props.info.line,
    });
    emit("updateCurrIndex", {
      fileNumber: props.info.fileNumber,
      index: props.info.index + 2,
    });
  } else if (e.metaKey && e.keyCode === 90) {
    // undo
    // TODO: push content to redo
    // emit("pushCodeRecords", {
    //   fileNumber: props.info.fileNumber,
    //   newRecords: {
    //     action: "tab",
    //     line: props.info.line,
    //     index: props.info.index,
    //     code: tabCode,
    //     timestamp: Date.now().toString() + "000000",
    //   },
    // });
    // emit("updateCurrLine", {
    //   fileNumber: props.info.fileNumber,
    //   line: props.info.line,
    // });
    // emit("updateCurrIndex", {
    //   fileNumber: props.info.fileNumber,
    //   index: props.info.index + 2,
    // });
    // redo.pop();
  } else {
    if (e.ctrlKey || e.shiftKey || e.metaKey || e.altKey) {
      e.preventDefault();
      editor.getDoc().setValue(props.info.fileContent);
      editor
        .getDoc()
        .setCursor({ line: props.info.line, ch: props.info.index });
    }
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
  // console.log(saveResponse.data);
  emit("pushSaveRecords", saveResponse.data);
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
  emit("updateVersionFile", {
    fileURL: response.data.data,
  });
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

function clickPlay() {
  if (keepPlay) {
    keepPlay = false;
  } else {
    keepPlay = true;
  }
}

async function playback() {
  // setValue 所有上一個版本的 Code 作為初始值
  clickPlay();
  if (playIndex === 0) {
    const baseResponse = await axios.get(props.records[0].baseURL);
    baseContent = baseResponse.data;
    baseLine = baseContent.split("\n").length - 1;
    baseIndex = baseContent.split("\n")[baseLine].length;
    emit("updateCurrLine", {
      fileNumber: props.info.fileNumber,
      line: baseLine,
    });
    emit("updateCurrIndex", {
      fileNumber: props.info.fileNumber,
      index: baseIndex,
    });
  }
  // console.log("all records: ", props.info.codeRecords);
  editor.getDoc().setValue(baseContent);
  // editor.getDoc().setCursor({ line: props.info.line, ch: props.info.index });
  editor.options.readOnly = false;
  editor.options.cursorHeight = 0.85;
  editor.focus();
  editor.getDoc().setCursor({ line: props.info.line, ch: props.info.index });
  for (let i = playIndex; i < props.info.timeBetween.length; i++) {
    if (!keepPlay) {
      editor.options.readOnly = props.readOnly;
      editor.options.cursorHeight = 0;
      editor.execCommand("goLineEnd");
      return;
    } else {
      console.log("in");
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          if (!keepPlay) {
            editor.options.readOnly = props.readOnly;
            editor.options.cursorHeight = 0;
            editor.execCommand("goLineEnd");
            return resolve();
          }
          const currObject = props.info.codeRecords[i];
          currObject.line = Number(currObject.line);
          currObject.index = Number(currObject.index);
          triggerEvent(currObject);
          baseContent = props.info.fileContent;
          playIndex += 1;
          return resolve();
        }, props.info.timeBetween[i]);
      });
    }
  }
  playIndex = 0;
  keepPlay = false;
  editor.options.readOnly = props.readOnly;
  editor.options.cursorHeight = 0;
  editor.execCommand("goLineEnd");
}

function triggerEvent(recordObject) {
  // editor.setCursor({line: recordObject.line})
  const action = recordObject.action;
  if (action === "create") {
    if (recordObject.code === '""') {
      console.log("triggered !");
      recordObject.code = '"';
    }
    if (recordObject.code === '""""') {
      console.log("double triggered !");
      recordObject.code = '""';
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
      index: props.info.index + 1,
      // index: props.info.index + recordObject.code.length,
    });
    emit("updateCurrCodes", {
      fileNumber: props.info.fileNumber,
      code: newCodes,
    });
    editor.getDoc().setCursor({ line: props.info.line, ch: props.info.index });
  } else if (action === "delete") {
    const prevCodes = editor.getDoc().getValue();
    const codes = prevCodes.split("\n");
    let newCodes = "";
    let changeLineStatus = false;
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
    } else {
      emit("updateCurrIndex", {
        fileNumber: props.info.fileNumber,
        index: props.info.index - 1,
      });
    }
    editor.getDoc().setCursor({ line: props.info.line, ch: props.info.index });
  } else if (action === "enter") {
    const targetLine = recordObject.line;
    const targetIndex = recordObject.index;
    const prevCodes = editor.getDoc().getValue();
    let codes = prevCodes.split("\n");
    let lineCode = codes[props.info.line];
    let tmpCodes = [...codes.slice(0, props.info.line)];
    tmpCodes.push(lineCode.substring(0, props.info.index));
    if (targetIndex > 1) {
      tmpCodes.push(
        " ".repeat(targetIndex) + lineCode.substring(props.info.index)
      );
    } else {
      tmpCodes.push(lineCode.substring(props.info.index));
    }
    const remains = codes.filter((element, index) => index > props.info.line);
    tmpCodes = [...tmpCodes, ...remains];
    const newCodes = tmpCodes.reduce((prev, curr, index) => {
      if (index !== tmpCodes.length - 1) {
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
      line: targetLine,
    });
    emit("updateCurrIndex", {
      fileNumber: props.info.fileNumber,
      index: targetIndex,
    });
    editor.getDoc().setCursor({ line: props.info.line, ch: props.info.index });
  } else if (
    action === "left" ||
    action === "right" ||
    action === "up" ||
    action === "down" ||
    action === "front" ||
    action === "end"
  ) {
    emit("updateCurrLine", {
      fileNumber: props.info.fileNumber,
      line: recordObject.line,
    });
    emit("updateCurrIndex", {
      fileNumber: props.info.fileNumber,
      index: recordObject.index,
    });
    editor.getDoc().setCursor({ line: props.info.line, ch: props.info.index });
  } else if (action === "tab") {
    const prevCodes = editor.getDoc().getValue();
    const splitCodes = prevCodes.split("\n");
    let lineCode = splitCodes[recordObject.line];
    lineCode =
      lineCode.substring(0, recordObject.index) +
      recordObject.code +
      lineCode.substring(recordObject.index);
    const allCode = splitCodes.reduce((prev, curr, line) => {
      if (line === splitCodes.length - 1) {
        if (props.info.line === line) {
          prev += lineCode;
        } else {
          prev += curr;
        }
      } else {
        if (props.info.line === line) {
          prev += lineCode + "\n";
        } else {
          prev += curr + "\n";
        }
      }
      return prev;
    }, "");
    editor.getDoc().setValue(allCode);
    emit("updateCurrIndex", {
      fileNumber: props.info.fileNumber,
      index: props.info.index + 2,
      // index: props.info.index + recordObject.code.length,
    });
    emit("updateCurrCodes", {
      fileNumber: props.info.fileNumber,
      code: allCode,
    });
    editor.getDoc().setCursor({ line: props.info.line, ch: props.info.index });
  } else {
    editor.getDoc().setValue(props.info.fileContent);
    editor.getDoc().setCursor({ line: props.info.line, ch: props.info.index });
    return;
  }
}

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
  console.log("line at init: ", props.info.line);
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
  const commands = {
    ...CodeMirror.commands,
  };
  const shortcuts = [
    "newlineAndIndent",
    "delCharBefore",
    "goCharLeft",
    "goCharRight",
    "goLineUp",
    "goLineDown",
    "goGroupLeft",
    "goGroupRight",
    "goLineStart",
    "goLineEnd",
    // "undo",
    // "redo",
    // "insertTab",
    // "defaultTab",
  ];
  Object.keys(CodeMirror.commands).forEach((commandKey) => {
    if (shortcuts.includes(commandKey)) {
      CodeMirror.commands[commandKey] = commands[commandKey];
      return;
    }
    CodeMirror.commands[commandKey] = () => {
      // alert(commandKey);
    };
  });
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
  editor.getDoc().setCursor({ line: props.info.line, ch: props.info.index });
}

let myModal;
onMounted(() => {
  myModal = new Modal(modalObject.value, {});
});

const modalObject = ref(null);
function showModal() {
  if (props.readOnly) {
    return;
  }
  myModal.show();
}
function hideModal() {
  myModal.hide();
}

onBeforeUnmount(() => {
  keepPlay = false;
});
</script>

<template>
  <div @input="updateContent" @keydown="checkEventUp">
    <div v-if="props.readOnly" @click="userClick">
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
  <!-- <button v-if="!props.readOnly" @click="showModal">show modal</button> -->
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
  <button @click="playback" v-if="props.readOnly">Playback</button>
  <button v-if="props.authorization" @click="runCode">Run code</button>
</template>

<style scoped>
/* .CodeMirror{ */
/* max-width: 70vw; */
/* } */
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
