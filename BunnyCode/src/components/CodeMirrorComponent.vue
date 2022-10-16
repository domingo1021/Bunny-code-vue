<script setup>
import * as CodeMirror from "codemirror";
import axios from "axios";
import "codemirror/lib/codemirror.css";
import "codemirror/theme/dracula.css";
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
  changeEdit: Function,
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
const autoComplete = ["(", "[", "{", '"', "'"];
let playIndex = 0;
let keepPlay = ref(false);
let baseContent;
let baseLine;
let baseIndex;
let codeRunning = ref(false);
let redo = [];
let undo = [];
let playSpeed = ref([0.25, 0.5, 0.75, 1, 1.25, 1.5, 2]);
let speedIndex = ref(3);

function updateContent(e) {
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
      case "'":
        anotherPart = "'";
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
    return;
  }
  if (e.key === "Enter") {
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
  } else if (e.shiftKey && e.altKey && e.keyCode === 40) {
    const { line } = editor.getDoc().getCursor();
    const splitContents = props.info.fileContent.split("\n");
    const lineContent = splitContents[line];
    const allCodes = splitContents.reduce((prev, curr, lineIndex) => {
      if (lineIndex === line) {
        if (lineIndex !== splitContents.length - 1) {
          prev = prev + curr + "\n" + curr + "\n";
        } else {
          prev = prev + curr + "\n" + curr;
        }
      } else if (lineIndex !== splitContents.length - 1) {
        prev = prev + curr + "\n";
      } else {
        prev = prev + curr;
      }
      return prev;
    }, "");
    editor.getDoc().setValue(allCodes);
    emit("updateCurrCodes", {
      fileNumber: props.info.fileNumber,
      code: allCodes,
    });
    emit("pushCodeRecords", {
      fileNumber: props.info.fileNumber,
      newRecords: {
        action: "CopyLine",
        line: props.info.line,
        index: props.info.index,
        code: "",
        timestamp: Date.now().toString() + "000000",
      },
    });
    emit("updateCurrLine", {
      fileNumber: props.info.fileNumber,
      line: line + 1,
    });
    emit("updateCurrIndex", {
      fileNumber: props.info.fileNumber,
      index: lineContent.length,
    });
    editor.getDoc().setCursor({ line: props.info.line, ch: props.info.index });
  } else if (e.metaKey && e.key === "x") {
    e.preventDefault();
    const splitContents = editor.getDoc().getValue().split("\n");
    if (props.info.fileContent === "") {
      return;
    }
    if (splitContents.length === 1) {
      emit("updateCurrCodes", {
        fileNumber: props.info.fileNumber,
        code: "",
      });
      emit("pushCodeRecords", {
        fileNumber: props.info.fileNumber,
        newRecords: {
          action: "DeleteLine",
          line: props.info.line,
          index: props.info.index,
          code: "",
          timestamp: Date.now().toString() + "000000",
        },
      });
      emit("updateCurrLine", {
        fileNumber: props.info.fileNumber,
        line: 0,
      });
      emit("updateCurrIndex", {
        fileNumber: props.info.fileNumber,
        index: 0,
      });
      editor.getDoc().setValue("");
      editor.getDoc().setCursor({ line: 0, ch: 0 });
      return;
    }
    const { line } = editor.getDoc().getCursor();
    const allCodes = splitContents.reduce((prev, curr, lineIndex) => {
      if (lineIndex === line) {
        return prev;
      }
      if (lineIndex !== splitContents.length - 1) {
        if (
          line === splitContents.length - 1 &&
          lineIndex === splitContents.length - 2
        ) {
          prev = prev + curr;
        } else {
          prev = prev + curr + "\n";
        }
      } else {
        prev = prev + curr;
      }
      return prev;
    }, "");
    if (line === splitContents.length - 1) {
      // 代表在最後一行刪除整行
      emit("updateCurrCodes", {
        fileNumber: props.info.fileNumber,
        code: allCodes,
      });
      emit("pushCodeRecords", {
        fileNumber: props.info.fileNumber,
        newRecords: {
          action: "DeleteLine",
          line: props.info.line,
          index: props.info.index,
          code: "",
          timestamp: Date.now().toString() + "000000",
        },
      });
      emit("updateCurrLine", {
        fileNumber: props.info.fileNumber,
        line: line - 1,
      });
      emit("updateCurrIndex", {
        fileNumber: props.info.fileNumber,
        index: splitContents[line - 1].length,
      });
      editor.getDoc().setValue(allCodes);
      editor
        .getDoc()
        .setCursor({ line: line - 1, ch: splitContents[line - 1].length });
      return;
    }
    emit("updateCurrCodes", {
      fileNumber: props.info.fileNumber,
      code: allCodes,
    });
    emit("pushCodeRecords", {
      fileNumber: props.info.fileNumber,
      newRecords: {
        action: "DeleteLine",
        line: props.info.line,
        index: props.info.index,
        code: "",
        timestamp: Date.now().toString() + "000000",
      },
    });
    emit("updateCurrIndex", {
      fileNumber: props.info.fileNumber,
      index: 0,
    });
    editor.getDoc().setValue(allCodes);
    editor.getDoc().setCursor({ line: line, ch: 0 });
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
    e.preventDefault();
    if (props.records.length !== 0) {
      return;
    }
    showSaveModal();
  } else if (e.ctrlKey && e.keyCode === 65) {
    if (e.repeat) {
      return;
    }
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
  emit("pushSaveRecords", saveResponse.data);
  // Save code file.
  const allCodes = props.info.fileContent;
  const submitForm = new FormData();
  const blob = new Blob([JSON.stringify(allCodes)], {
    type: "application/javascript",
  });
  submitForm.append("files", blob, props.info.fileName);
  submitForm.append("projectID", props.projectID);
  submitForm.append("versionID", props.info.versionID);
  submitForm.append("reqCategory", "code_file");
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
  codeRunning.value = true;
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
    result = compilerResult.data;
    codeRunning.value = false;
  } catch (error) {
    result = error.response.data.msg;
    codeRunning.value = false;
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
  }
}
function playSlower() {
  if (speedIndex.value > 0) {
    speedIndex.value -= 1;
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
    emit("updateCurrCodes", {
      fileNumber: props.info.fileNumber,
      code: baseContent,
    });
  }
  editor.getDoc().setValue(baseContent);
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
      try {
        await new Promise((resolve, reject) => {
          let myTimeout = setTimeout(() => {
            if (!keepPlay.value) {
              editor.options.readOnly = props.readOnly;
              editor.options.cursorHeight = 0;
              editor.execCommand("goLineEnd");
              clearTimeout(myTimeout);
              return reject();
            }
            const currObject = props.info.codeRecords[playIndex];
            currObject.line = Number(currObject.line);
            currObject.index = Number(currObject.index);
            playIndex += 1;
            triggerEvent(currObject);
            baseContent = props.info.fileContent;
            return resolve();
          }, props.info.timeBetween[playIndex] / playSpeed.value[speedIndex.value]);
        });
      } catch (error) {
        return;
      }
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
      recordObject.code = '"';
    }
    if (recordObject.code === '""""') {
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
    // check the fist character that is not space.
    const checkSpace = lineCode.substring(props.info.index).match(/[^-\s]/);
    let lineSplit = "";
    if (checkSpace !== null) {
      lineSplit = lineCode
        .substring(props.info.index)
        .substring(checkSpace.index);
    }
    if (targetIndex > 1) {
      tmpCodes.push(" ".repeat(targetIndex) + lineSplit);
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
    action === "end" ||
    action === "click"
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
  } else if (action === "DeleteLine") {
    const splitContents = editor.getDoc().getValue().split("\n");
    if (props.info.fileContent === "") {
      return;
    }
    if (splitContents.length === 1) {
      emit("updateCurrCodes", {
        fileNumber: props.info.fileNumber,
        code: "",
      });
      emit("updateCurrLine", {
        fileNumber: props.info.fileNumber,
        line: 0,
      });
      emit("updateCurrIndex", {
        fileNumber: props.info.fileNumber,
        index: 0,
      });
      editor.getDoc().setValue("");
      editor.getDoc().setCursor({ line: 0, ch: 0 });
      return;
    }
    const { line } = editor.getDoc().getCursor();
    const allCodes = splitContents.reduce((prev, curr, lineIndex) => {
      if (lineIndex === line) {
        return prev;
      }
      if (lineIndex !== splitContents.length - 1) {
        if (
          line === splitContents.length - 1 &&
          lineIndex === splitContents.length - 2
        ) {
          prev = prev + curr;
        } else {
          prev = prev + curr + "\n";
        }
      } else {
        prev = prev + curr;
      }
      return prev;
    }, "");
    if (line === splitContents.length - 1) {
      // 代表在最後一行刪除整行
      emit("updateCurrCodes", {
        fileNumber: props.info.fileNumber,
        code: allCodes,
      });
      emit("updateCurrLine", {
        fileNumber: props.info.fileNumber,
        line: line - 1,
      });
      emit("updateCurrIndex", {
        fileNumber: props.info.fileNumber,
        index: splitContents[line - 1].length,
      });
      editor.getDoc().setValue(allCodes);
      editor
        .getDoc()
        .setCursor({ line: line - 1, ch: splitContents[line - 1].length });
      return;
    }
    emit("updateCurrCodes", {
      fileNumber: props.info.fileNumber,
      code: allCodes,
    });
    emit("updateCurrIndex", {
      fileNumber: props.info.fileNumber,
      index: 0,
    });
    editor.getDoc().setValue(allCodes);
    editor.getDoc().setCursor({ line: line, ch: 0 });
  } else if (action === "CopyLine") {
    const { line } = editor.getDoc().getCursor();
    const splitContents = props.info.fileContent.split("\n");
    const lineContent = splitContents[line];
    const allCodes = splitContents.reduce((prev, curr, lineIndex) => {
      if (lineIndex === line) {
        if (lineIndex !== splitContents.length - 1) {
          prev = prev + curr + "\n" + curr + "\n";
        } else {
          prev = prev + curr + "\n" + curr;
        }
      } else if (lineIndex !== splitContents.length - 1) {
        prev = prev + curr + "\n";
      } else {
        prev = prev + curr;
      }
      return prev;
    }, "");
    editor.getDoc().setValue(allCodes);
    emit("updateCurrCodes", {
      fileNumber: props.info.fileNumber,
      code: allCodes,
    });
    emit("updateCurrLine", {
      fileNumber: props.info.fileNumber,
      line: line + 1,
    });
    emit("updateCurrIndex", {
      fileNumber: props.info.fileNumber,
      index: lineContent.length,
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
    recordResponse = await axios.post(
      `https://domingoos.store/api/1.0/history/${props.projectID}`,
      {
        versionID: props.info.versionID,
        startTime: props.records[0].startTime,
        stopTime: props.records[0].endTime,
      }
    );
  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "Warning !",
      text: error.msg,
    });
  }
  recordResponse = recordResponse.data.data;
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
    return;
  }
  if (tmpReadOnly) {
    // tmpReadOnly = "nocursor";
    cursorHeight = 0;
  }
  const editors = document.getElementsByClassName("CodeMirror");
  if (editors.length !== 0) {
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
    // readOnly: false,
    cursorHeight: cursorHeight,
    indentWithTab: true,
    tabSize: 2,
    autocorrect: true,
    theme: "dracula",
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
    await nextTick();
    await initCodeMirror();
  }
);

watch(
  () => props.records,
  async (newRecords, prevRecords) => {
    await initSaveRecords();
  }
);

function userClick() {
  if (props.readOnly) {
    return;
  }
  const { line, ch } = editor.getDoc().getCursor();
  if (line === props.info.line && ch === props.info.index) {
    return;
  }
  emit("updateCurrLine", {
    fileNumber: props.info.fileNumber,
    line,
  });
  emit("updateCurrIndex", {
    fileNumber: props.info.fileNumber,
    index: ch,
  });
  emit("pushCodeRecords", {
    fileNumber: props.info.fileNumber,
    newRecords: {
      action: "click",
      line: line,
      index: ch,
      code: "",
      timestamp: Date.now().toString() + "000000",
    },
  });
}

const prevIntroStatus = localStorage.getItem("stopIntro");

const stopIntro = ref(true);

if (prevIntroStatus === "0" || prevIntroStatus === null) {
  stopIntro.value = false;
} else {
  stopIntro.value = true;
}

watch(stopIntro, () => {
  if (stopIntro.value) {
    localStorage.setItem("stopIntro", "1");
  } else {
    localStorage.setItem("stopIntro", "0");
  }
});

let modalSave;
const modalSaveObject = ref(null);
let modalIntro;
const modalIntroObject = ref(null);

function showSaveModal() {
  if (props.readOnly) {
    return;
  }
  modalSave.show();
}

function hideSaveModal() {
  modalSave.hide();
}

function showIntroModal() {
  modalIntro.show();
}

function hideIntroModal() {
  modalIntro.hide();
}

onBeforeMount(async () => {
  await initCodeMirror();
});

onMounted(() => {
  modalSave = new Modal(modalSaveObject.value, {});
  modalIntro = new Modal(modalIntroObject.value, {});
  if (!stopIntro.value) {
    showIntroModal();
  }
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
  modalIntro.hide();
});
</script>

<template>
  <div id="tool-bar">
    <button
      v-if="!readOnly"
      class="tool-btn"
      @click="showSaveModal"
      style="margin-left: 1%"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        fill="currentColor"
        class="bi bi-save"
        viewBox="0 0 16 16"
      >
        <path
          d="M2 1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H9.5a1 1 0 0 0-1 1v7.293l2.646-2.647a.5.5 0 0 1 .708.708l-3.5 3.5a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L7.5 9.293V2a2 2 0 0 1 2-2H14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h2.5a.5.5 0 0 1 0 1H2z"
        />
      </svg>
    </button>
    <button
      class="tool-btn"
      style="margin-left: 1%; width: 35px; border-radius: 5px"
      @click="showIntroModal"
    >
      <div style="font-size: 1.25rem; font-weight: bold">?</div>
    </button>
    <!-- <button class="tool-btn">
      <img src="@/assets/undo.png" alt="uedo" width="25" height="25" />
    </button>
    <button class="tool-btn">
      <img src="@/assets/redo.png" alt="redo" width="25" height="25" />
    </button> -->
    <div
      v-if="
        props.authorization &&
        props.socket !== undefined &&
        props.records.length === 0
      "
    >
      <button
        class="tool-btn"
        style="width: 35px; height: 37px; margin-left: 8px"
        @click="props.changeEdit"
        v-if="props.readOnly"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          fill="currentColor"
          class="bi bi-pencil-square"
          viewBox="0 0 16 16"
        >
          <path
            d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"
          />
          <path
            fill-rule="evenodd"
            d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z"
          />
        </svg>
      </button>
    </div>
  </div>
  <div id="intro-alert">
    <div
      class="modal fade"
      id="introModal"
      ref="modalIntroObject"
      tabindex="-1"
      role="dialog"
      aria-labelledby="myModalLabel"
      aria-hidden="false"
      style="overflow-y: scroll"
    >
      <div id="intro-board" class="modal-dialog" role="document">
        <div id="intro-content" class="modal-content">
          <div
            id="intro-header"
            class="modal-header text-center"
            style="justify-content: right"
          >
            <button
              id="intro-close-btn"
              type="button"
              class="close btn btn-indigo"
              data-bs-dismiss="modal"
              data-dismiss="modal"
              aria-label="Close"
              @click="hideIntroModal"
            >
              <span aria-hidden="true">&times;</span>
            </button>
            <div></div>
          </div>
          <div id="command-header">
            <div class="shortcut-detail-1">Command</div>
            <div class="shortcut-detail-2" style="left: -2%">Shortcut</div>
          </div>

          <div class="shortcut">
            <div class="shortcut-detail-1">Cursor left</div>
            <div class="shortcut-detail-2">←</div>
          </div>
          <div class="shortcut">
            <div class="shortcut-detail-1">Cursor right</div>
            <div class="shortcut-detail-2">→</div>
          </div>
          <div class="shortcut">
            <div class="shortcut-detail-1">Cursor Up</div>
            <div class="shortcut-detail-2">↑</div>
          </div>
          <div class="shortcut">
            <div class="shortcut-detail-1">Cursor Down</div>
            <div class="shortcut-detail-2">↓</div>
          </div>
          <div class="shortcut">
            <div class="shortcut-detail-1">Move a word left</div>
            <div class="shortcut-detail-2">⌥ + ←</div>
          </div>
          <div class="shortcut">
            <div class="shortcut-detail-1">Move a word Right</div>
            <div class="shortcut-detail-2">⌥ + →</div>
          </div>
          <div class="shortcut">
            <div class="shortcut-detail-1">To line start</div>
            <div class="shortcut-detail-2">⌃ + a</div>
          </div>
          <div class="shortcut">
            <div class="shortcut-detail-1">To line end</div>
            <div class="shortcut-detail-2">⌃ + e</div>
          </div>
          <div class="shortcut">
            <div class="shortcut-detail-1">New Line</div>
            <div class="shortcut-detail-2">Enter</div>
          </div>
          <div class="shortcut">
            <div class="shortcut-detail-1">Delete left</div>
            <div class="shortcut-detail-2">Backspace</div>
          </div>
          <div class="shortcut">
            <div class="shortcut-detail-1">Save coding record</div>
            <div class="shortcut-detail-2">⌘ + s</div>
          </div>
          <!-- <div class="shortcut">
            <div class="shortcut-detail-1">
              Restart and initiate from base content
            </div>
            <div class="shortcut-detail-2">⌘ + i</div>
          </div> -->
          <!-- <div class="shortcut">
            <div class="shortcut-detail-1">Undo</div>
            <div class="shortcut-detail-2">⌘ + z</div>
          </div>
          <div class="shortcut">
            <div class="shortcut-detail-1">Redo</div>
            <div class="shortcut-detail-2">⇧ + ⌘ + z</div>
          </div> -->
          <div class="shortcut">
            <div class="shortcut-detail-1">Remove current line</div>
            <div class="shortcut-detail-2">⌘ + x</div>
          </div>
          <div class="shortcut">
            <div class="shortcut-detail-1">Copy a line down</div>
            <div class="shortcut-detail-2">⇧ + ⌥ + ↓</div>
          </div>
          <div style="display: flex; justify-content: left; margin-top: 5%">
            <div>
              <input
                type="checkbox"
                v-model="stopIntro"
                name=""
                id="intro-notify"
              />
            </div>
            <label style="margin-left: 2%">Stop notification </label>
            <div>&nbsp;</div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div @input="updateContent" @keydown="checkEventUp">
    <div v-if="props.readOnly" @click="userClick">
      <div id="read-only-tag">Read only</div>
      <textarea
        :value="fileContent"
        id="editor"
        cols="30"
        rows="10"
        hidden
      ></textarea>
    </div>
    <div v-else @click="userClick">
      <textarea
        id="editor"
        :value="fileContent"
        cols="30"
        rows="12"
        style="pointer-events: none"
        hidden
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
      style="margin-top:8%"
    >
      <div class="modal-dialog" role="document">
        <div class="modal-content">
          <div class="modal-header text-center">
            <h4 class="modal-title w-100 font-weight-bold">Project save</h4>
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
    <div v-if="props.readOnly" style="display: flex">
      <button
        class="tool-btn play-btn"
        @click="playSlower"
        v-if="speedIndex > 0 && props.info.timeBetween.length !== 0"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="30"
          height="30"
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
      <button
        class="tool-btn play-btn"
        v-if="speedIndex <= 0 || props.info.timeBetween.length === 0"
        style="background-color: white"
        disabled
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="30"
          height="30"
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
      <button
        class="tool-btn play-btn"
        @click="playback"
        v-if="props.info.timeBetween.length !== 0"
      >
        <div id="play-speed">x{{ playSpeed[speedIndex] }}</div>
        <div v-if="!keepPlay" id="play">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="30"
            height="30"
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
            width="30"
            height="30"
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
      <button
        class="tool-btn play-btn"
        v-else
        style="background-color: white"
        disabled
      >
        <div id="play-speed">x{{ playSpeed[speedIndex] }}</div>
        <div v-if="!keepPlay" id="play">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="30"
            height="30"
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
            width="30"
            height="30"
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
      <button
        class="tool-btn play-btn"
        @click="playFaster"
        v-if="speedIndex < 6 && props.info.timeBetween.length !== 0"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="30"
          height="30"
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
      <button
        class="tool-btn play-btn"
        @click="playFaster"
        v-else
        style="background-color: white"
        disabled
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="30"
          height="30"
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
  <div id="run-btn" class="tool-btn">
    <button
      v-if="!codeRunning"
      id="terminal-btn"
      @click="runCode"
      style="margin-top: 5px"
    >
      Run code
    </button>
    <button
      v-else
      id="terminal-btn"
      @click="runCode"
      style="background-color: azure"
      disabled
    >
      <div
        class="spinner-border text-success"
        role="status"
        style="height: 16px; width: 16px"
      >
        <span class="visually-hidden">Loading...</span>
      </div>
    </button>
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
  font-size: 1rem;
  font-weight: bold;
}

#save-alert {
  left: 100px;
  background-color: aliceblue;
  color: black;
  position: absolute;
  top: 50px;
  height: 500px;
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
  font-size: 1.25rem;
  border-radius: 5px;
}

.tool-btn {
  margin-left: 0.5%;
  border-radius: 5px;
}

#run-btn {
  z-index: 99;
  position: absolute;
  bottom: 4%;
  left: 1%;
}
button:hover {
  background-color: rgb(180, 180, 180);
}

#play-speed {
  position: absolute;
  font-weight: bold;
  left: 120px;
  bottom: 5px;
  font-size: 1.25rem;
  color: aliceblue;
  width: 25px;
  height: 25px;
  border-radius: 50%;
}

#intro-board {
  height: 60vh;
  top: 5%;
}

#intro-header {
  height: 1%;
  border: 0px;
  padding-bottom: 0%;
}

#command-header {
  font-size: 0.9rem;
  font-weight: bold;
  display: flex;
  border-bottom: 1.5px solid rgb(74, 74, 74);
  padding-left: 4%;
  padding-bottom: 2%;
  border-bottom: 2px solid rgb(20, 20, 20);
}

#intro-content {
  width: 100%;
  padding-bottom: 10%;
  padding-left: 5%;
  padding-right: 5%;
  background-color: rgb(41, 41, 41);
}

.shortcut-detail-1 {
  /* text-align: left; */
  width: 75%;
}

.shortcut-detail-2 {
  width: 50%;
}

#intro-close-btn {
  margin-right: -2%;
  color: azure;
}

#intro-notify {
  height: 20px;
  width: 20px;
}

.shortcut {
  display: flex;
  justify-content: left;
  padding-left: 5%;
  padding-right: 2%;
  padding-top: 0.5%;
  padding-bottom: 0.5%;
  font-size: 0.75rem;
}

.shortcut:nth-child(even) {
  background-color: rgb(41, 41, 41);
}
.shortcut:nth-child(odd) {
  background-color: rgb(87, 87, 87);
}

.confirm-btn {
  background-color: rgb(205, 204, 203);
  color: black;
  border-radius: 10px;
  margin: 8%;
}

::-webkit-scrollbar {
  width: 10px;
}

::-webkit-scrollbar-track {
}

::-webkit-scrollbar-thumb {
  background: rgb(94, 94, 94, 0.7);
}

::-webkit-scrollbar-thumb:hover {
  background: #555;
}
::-webkit-scrollbar-button {
  height: 10px;
}
</style>
