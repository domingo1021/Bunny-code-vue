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
import Swal from "sweetalert2";
import Socket from "../socket";
import router from "../router";

// TODO: check user agent for keyword.

const props = defineProps({
  socket: Socket,
  projectUserID: Number,
  userID: Number,
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
let keepPlay = ref(false);
let baseContent;
let baseLine;
let baseIndex;
let redo = [];
let undo = [];
let playSpeed = ref([0.25, 0.5, 0.75, 1, 1.25, 1.5, 2]);
let speedIndex = ref(3);

function updateContent(e) {
  console.log(props.info.line, props.info.index);
  console.log("input: ", e.data);
  if (props.readOnly) {
    editor.getDoc().setValue(props.info.fileContent);
    editor.getDoc().setCursor({ line: props.info.line, ch: props.info.index });
    return;
  }
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
    showSaveModal();
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
    if (e.ctrlKey || e.metaKey || e.altKey) {
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
    Swal.fire({
      icon: "error",
      title: "Oops...",
      text: error.response.data.msg,
    });
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
  hideSaveModal();
  Swal.fire(
    "Save code success !",
    "Let's replay the codes to see your amazing contribution !",
    "success"
  );
}

async function runCode() {
  const allCodes = props.info.fileContent;
  if (allCodes === "") {
    Swal.fire({
      icon: "error",
      title: "Oops...",
      text: "Why not write some code ? happy codding !",
    });
    return;
  }
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
    return;
  }
  emit("pushTerminal", {
    fileNumber: props.fileNumber,
    result: result,
  });
}

function clickPlay() {
  if (keepPlay.value) {
    keepPlay.value = false;
  } else {
    keepPlay.value = true;
  }
}

function playFaster() {
  if (speedIndex.value < 6) {
    speedIndex.value += 1;
    console.log("speed: ", playSpeed.value[speedIndex.value]);
  }
}
function playSlower() {
  if (speedIndex.value > 0) {
    speedIndex.value -= 1;
    console.log("speed: ", playSpeed.value[speedIndex.value]);
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
    if (!keepPlay.value) {
      editor.options.readOnly = props.readOnly;
      editor.options.cursorHeight = 0;
      editor.execCommand("goLineEnd");
      return;
    } else {
      console.log("in");
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          if (!keepPlay.value) {
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
        }, props.info.timeBetween[i] / playSpeed.value[speedIndex.value]);
      });
    }
  }
  playIndex = 0;
  keepPlay.value = false;
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
  await nextTick();
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
    index: props.info.fileContent.split("\n")[props.info.line].length,
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
    CodeMirror.commands[commandKey] = () => {};
  });
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

function userClick() {
  editor.getDoc().setCursor({ line: props.info.line, ch: props.info.index });
}

let modalSave;
const modalSaveObject = ref(null);

function showSaveModal() {
  if (props.readOnly) {
    return;
  }
  modalSave.show();
}

function hideSaveModal() {
  modalSave.hide();
}

onBeforeMount(async () => {
  await initCodeMirror();
});

onMounted(() => {
  modalSave = new Modal(modalSaveObject.value, {});
});

onBeforeUnmount(() => {
  keepPlay = false;
  if (!props.socket) {
    return;
  }
  if (!props.readOnly || props.authorization) {
    props.socket.socketEmit("unEdit", {
      versionID: props.info.versionID,
    });
  }
});
</script>

<template>
  <div id="tool-bar">
    <button class="tool-btn">
      <img src="@/assets/undo.png" alt="uedo" width="20" height="20" />
    </button>
    <button class="tool-btn">
      <img src="@/assets/redo.png" alt="redo" width="20" height="20" />
    </button>
  </div>
  <!-- <div id="tool-bar" v-else-if="!props.readOnly">
    <div class="tool-btn" style="height: 20px !important">&nbsp;</div>
  </div> -->
  <div @input="updateContent" @keydown="checkEventUp">
    <div v-if="props.readOnly" @click="userClick">
      <div id="read-only-tag">Read only</div>
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
  <div id="save-alert">
    <div
      class="modal fade"
      id="exampleModal"
      ref="modalSaveObject"
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
            <button class="confirm-btn" @click="hideSaveModal">否</button>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div id="play-bar">
    <div v-if="speedIndex > 0">
      <button
        class="tool-btn play-btn"
        @click="playSlower"
        v-if="props.readOnly && props.info.timeBetween.length !== 0"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          fill="currentColor"
          class="bi bi-rewind"
          viewBox="0 0 16 16"
        >
          <path
            d="M9.196 8 15 4.633v6.734L9.196 8Zm-.792-.696a.802.802 0 0 0 0 1.392l6.363 3.692c.52.302 1.233-.043 1.233-.696V4.308c0-.653-.713-.998-1.233-.696L8.404 7.304Z"
          />
          <path
            d="M1.196 8 7 4.633v6.734L1.196 8Zm-.792-.696a.802.802 0 0 0 0 1.392l6.363 3.692c.52.302 1.233-.043 1.233-.696V4.308c0-.653-.713-.998-1.233-.696L.404 7.304Z"
          />
        </svg>
      </button>
    </div>
    <div v-else>
      <button
        class="tool-btn play-btn"
        @click="playSlower"
        v-if="props.readOnly && props.info.timeBetween.length !== 0"
        disabled
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          fill="currentColor"
          class="bi bi-rewind"
          viewBox="0 0 16 16"
        >
          <path
            d="M9.196 8 15 4.633v6.734L9.196 8Zm-.792-.696a.802.802 0 0 0 0 1.392l6.363 3.692c.52.302 1.233-.043 1.233-.696V4.308c0-.653-.713-.998-1.233-.696L8.404 7.304Z"
          />
          <path
            d="M1.196 8 7 4.633v6.734L1.196 8Zm-.792-.696a.802.802 0 0 0 0 1.392l6.363 3.692c.52.302 1.233-.043 1.233-.696V4.308c0-.653-.713-.998-1.233-.696L.404 7.304Z"
          />
        </svg>
      </button>
    </div>
    <button
      class="tool-btn play-btn"
      @click="playback"
      v-if="props.readOnly && props.info.timeBetween.length !== 0"
    >
      <div id="play-speed">x{{playSpeed[speedIndex]}}</div>
      <div v-if="!keepPlay" id="play">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          fill="currentColor"
          class="bi bi-play"
          viewBox="0 0 16 16"
          style="top: -1px"
        >
          <path
            d="M10.804 8 5 4.633v6.734L10.804 8zm.792-.696a.802.802 0 0 1 0 1.392l-6.363 3.692C4.713 12.69 4 12.345 4 11.692V4.308c0-.653.713-.998 1.233-.696l6.363 3.692z"
          />
        </svg>
      </div>
      <div v-else-if="keepPlay" id="stop-play">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          fill="currentColor"
          class="bi bi-pause-fill"
          viewBox="0 0 16 16"
        >
          <path
            d="M5.5 3.5A1.5 1.5 0 0 1 7 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5zm5 0A1.5 1.5 0 0 1 12 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5z"
          />
        </svg>
      </div>
    </button>
    <div v-if="speedIndex < 6">
      <button
        class="tool-btn play-btn"
        @click="playFaster"
        v-if="props.readOnly && props.info.timeBetween.length !== 0"
        style="margin-left: 5px"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          fill="currentColor"
          class="bi bi-fast-forward"
          viewBox="0 0 16 16"
        >
          <path
            d="M6.804 8 1 4.633v6.734L6.804 8Zm.792-.696a.802.802 0 0 1 0 1.392l-6.363 3.692C.713 12.69 0 12.345 0 11.692V4.308c0-.653.713-.998 1.233-.696l6.363 3.692Z"
          />
          <path
            d="M14.804 8 9 4.633v6.734L14.804 8Zm.792-.696a.802.802 0 0 1 0 1.392l-6.363 3.692C8.713 12.69 8 12.345 8 11.692V4.308c0-.653.713-.998 1.233-.696l6.363 3.692Z"
          />
        </svg>
      </button>
    </div>
    <div v-else>
      <button
        class="tool-btn play-btn"
        @click="playFaster"
        v-if="props.readOnly && props.info.timeBetween.length !== 0"
        style="margin-left: 5px"
        disabled
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          fill="currentColor"
          class="bi bi-fast-forward"
          viewBox="0 0 16 16"
        >
          <path
            d="M6.804 8 1 4.633v6.734L6.804 8Zm.792-.696a.802.802 0 0 1 0 1.392l-6.363 3.692C.713 12.69 0 12.345 0 11.692V4.308c0-.653.713-.998 1.233-.696l6.363 3.692Z"
          />
          <path
            d="M14.804 8 9 4.633v6.734L14.804 8Zm.792-.696a.802.802 0 0 1 0 1.392l-6.363 3.692C8.713 12.69 8 12.345 8 11.692V4.308c0-.653.713-.998 1.233-.696l6.363 3.692Z"
          />
        </svg>
      </button>
    </div>
  </div>
  <div id="run-btn" class="tool-btn" v-if="props.userID === projectUserID">
    <button id="terminal-btn" @click="runCode">Run code</button>
  </div>
</template>

<style scoped>
#read-only-tag {
  position: absolute;
  padding: 0.5% 1% 0.5% 1%;
  border-radius: 5px;
  color: rgb(0, 0, 0);
  background-color: rgb(169, 78, 78);
  z-index: 98;
  margin: 1% 2% 0px 5px;
  top: 1%;
  right: 2%;
  font-size: 0.75rem;
  font-weight: bold;
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

#tool-bar {
  padding-top: 1%;
  padding-bottom: 0.5%;
  display: flex;
}

#play-bar {
  padding-top: 0.5%;
  display: flex;
  width: 100%;
  justify-content: center;
}

.play-btn {
  margin: 2px 5px 0px 5px;
}

#terminal-btn {
  border-radius: 5px;
}

.tool-btn {
  margin-left: 0.5%;
  border-radius: 5px;
}

#run-btn {
  z-index: 100;
  position: absolute;
  bottom: 2%;
  left: 1%;
}
button:hover {
  background-color: rgb(180, 180, 180);
}

#play-speed{
  position: absolute;
  font-weight: bold;
  left: 90px;
  bottom: -3px;
  font-size: 1rem;
  color:aliceblue;
  width: 25px;
  height: 25px;
  border-radius: 50%;
}
</style>
