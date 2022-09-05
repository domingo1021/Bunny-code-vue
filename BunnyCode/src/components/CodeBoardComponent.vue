<script setup>
import { onMounted, onUnmounted, onUpdated, ref } from "vue";
import axios from "axios";

const props = defineProps({
  socket: Object,
  jwt: String,
  fileNumber: Number,
  fileName: String,
  variables: Object,
});

const input = ref([]);

const emit = defineEmits([
  "updateInput",
  "updateTargetLine",
  "updateCurrIndex",
  "updateCurrCodes",
  "pushCodeRecords",
  "pushCurrCodes",
  "deleteCurrCodes",
]);

const addCode = (e) => {
  // if (props.variables.codeRecords.length > 50) {
  //   alert("記得儲存程式碼！");
  // }
  let action;
  let newCode;
  if (e.inputType == "deleteContentBackward") {
    newCode = props.variables.currCodes[props.variables.targetLine].substring(
      props.variables.currIndex - 1,
      props.variables.currIndex
    );
    action = "delete";
  } else if (e.inputType == "insertText") {
    newCode = e.data;
    // if (e.data == "(") {
    //   newCode = "()";
    // } else if (e.data == "[") {
    //   newCode = "[]";
    // } else if (e.data == "{") {
    //   newCode = "{}";
    // }
    // console.log(props.variables.currCodes[props.variables.targetLine].substring(0, props.variables.currIndex));
    // e.target.value = props.variables.currCodes[props.variables.targetLine].substring(0, props.variables.currIndex) + newCode + props.variables.currCodes[props.variables.targetLine].substring(props.variables.currIndex);
    action = "create";
  }
  emit("updateCurrCodes", {
    fileNumber: props.fileNumber,
    line: props.variables.targetLine,
    newCodes: e.target.value,
  });
  emit("pushCodeRecords", {
    fileNumber: props.fileNumber,
    newRecords: {
      action: action,
      line: props.variables.targetLine,
      index: props.variables.currIndex,
      code: newCode,
      timestamp: Date.now().toString() + "000000",
    },
  });
  console.log(props.variables.currIndex, e.target.value.length);
  if (
    // props.variables.currIndex < e.target.value.length &&
    action === "create"
  ) {
    emit("updateCurrIndex", {
      fileNumber: props.fileNumber,
      index: props.variables.currIndex + newCode.length,
    });
  } else if (action === "delete") {
    emit("updateCurrIndex", {
      fileNumber: props.fileNumber,
      index: props.variables.currIndex - 1,
    });
  }
};

const checkEvent = async (e) => {
  if (e.keyCode === 13) {
    console.log("enter");
    let lineCode = props.variables.currCodes[props.variables.targetLine];
    let nextLine = lineCode.substring(props.variables.currIndex);
    lineCode = lineCode.substring(0, props.variables.currIndex);
    emit("updateCurrCodes", {
      fileNumber: props.fileNumber,
      line: props.variables.targetLine,
      newCodes: lineCode,
    });
    emit("updateTargetLine", {
      fileNumber: props.fileNumber,
      line: props.variables.targetLine + 1,
    });
    emit("pushCurrCodes", {
      fileNumber: props.fileNumber,
      line: props.variables.targetLine,
      codes: nextLine,
    });
    emit("pushCodeRecords", {
      fileNumber: props.fileNumber,
      newRecords: {
        action: "enter",
        index: props.variables.currIndex,
        line: props.variables.targetLine,
        timestamp: Date.now().toString() + "000000",
      },
    });
    emit("updateCurrIndex", {
      fileNumber: props.fileNumber,
      index: props.variables.currCodes[props.variables.targetLine].length,
    });
  } else if (e.keyCode === 8) {
    console.log(`delete at ${props.variables.currIndex}`);
    if (props.variables.currIndex === 0 && props.variables.targetLine > 0) {
      let codeAfter = props.variables.currCodes[props.variables.targetLine];
      console.log(codeAfter);
      emit("deleteCurrCodes", {
        fileNumber: props.fileNumber,
        line: props.variables.targetLine,
      });
      emit("updateTargetLine", {
        fileNumber: props.fileNumber,
        line: props.variables.targetLine - 1,
      });
      emit("updateCurrCodes", {
        fileNumber: props.fileNumber,
        line: props.variables.targetLine,
        newCodes:
          props.variables.currCodes[props.variables.targetLine] + codeAfter,
      });
      emit("updateCurrIndex", {
        fileNumber: props.fileNumber,
        index: props.variables.currCodes[props.variables.targetLine].length,
      });
      emit("updateInput", {
        line: props.variables.targetLine,
      });
      emit("pushCodeRecords", {
        fileNumber: props.fileNumber,
        newRecords: {
          action: "delete",
          line: props.variables.targetLine + 1,
          index: 0,
          code: "",
          timestamp: Date.now().toString() + "000000",
        },
      });
    }
  } else if (e.keyCode === 38) {
    console.log("up");
    if (props.variables.targetLine > 0) {
      emit("updateTargetLine", {
        fileNumber: props.fileNumber,
        line: props.variables.targetLine - 1,
      });
      emit("updateCurrIndex", {
        fileNumber: props.fileNumber,
        index: 0,
      });
      emit("pushCodeRecords", {
        fileNumber: props.fileNumber,
        newRecords: {
          action: "up",
          line: props.variables.targetLine.value,
          timestamp: Date.now().toString() + "000000",
        },
      });
      emit("updateInput", {
        line: props.variables.targetLine,
      });
    }
  } else if (e.keyCode === 40) {
    console.log("down");
    if (props.variables.targetLine < props.variables.currCodes.length - 1) {
      emit("updateTargetLine", {
        fileNumber: props.fileNumber,
        line: props.variables.targetLine + 1,
      });
      emit("updateCurrIndex", {
        fileNumber: props.fileNumber,
        index: props.variables.currCodes[props.variables.targetLine].length,
      });
      emit("pushCodeRecords", {
        fileNumber: props.fileNumber,
        newRecords: {
          action: "down",
          line: props.variables.targetLine.value,
          timestamp: Date.now().toString() + "000000",
        },
      });
      emit("updateInput", {
        line: props.variables.targetLine,
      });
    }
  } else if (e.keyCode === 37) {
    console.log("left");
    if (props.variables.currIndex > 0) {
      emit("updateCurrIndex", {
        fileNumber: props.fileNumber,
        index: props.variables.currIndex - 1,
      });
    }
  } else if (e.keyCode === 39) {
    console.log("right");
    if (
      props.variables.currIndex <
      props.variables.currCodes[props.variables.targetLine].length
    ) {
      emit("updateCurrIndex", {
        fileNumber: props.fileNumber,
        index: props.variables.currIndex + 1,
      });
    }
  } else if (e.ctrlKey && e.keyCode === 83) {
    // const saveResponse = await axios.post(
    //   'http://localhost:3000/api/1.0/record',
    //   {
    //     userID: 1,
    //     projectID: 1,
    //     batchData: JSON.stringify(codeRecords.value),
    //   },
    // )
    console.log("Control + Save");
    const allCodes = props.variables.currCodes.reduce((prev, curr) => {
      return prev + curr + "\n";
    }, "");
    console.log("entire code:", allCodes);
    const submitForm = new FormData();
    const blob = new Blob([JSON.stringify(allCodes)], {
      type: "application/javascript",
    });
    submitForm.append("files", blob, props.fileName);
    submitForm.append("projectID", 1);
    submitForm.append("versionID", 2);
    submitForm.append("reqCategory", "code_file");
    console.log("prepare to submit !");
    // const response = await axios({
    //   method: "post",
    //   url: "https://domingoos.store/api/1.0/record/file",
    //   headers: {
    //     Authorization: `Bearer ${props.jwt}`,
    //   },
    //   data: submitForm,
    // });
    // console.log(response);
  }
};

const changeTarget = (e) => {
  emit("updateTargetLine", {
    fileNumber: props.fileNumber,
    line: Number(e.target.id.split("-")[1]),
  });
  // emit("updatePrevCodes", {
  //   fileNumber: props.fileNumber,
  //   newCodes: props.variables.currCodes[props.variables.targetLine],
  // });
};

onMounted(async () => {
  //TODO: socket send msg to backend, update version writing status.
  emit("updateInput", {
    fileNumber: props.fileNumber,
    line: props.variables.targetLine,
  });
});

onUpdated(() => {
  emit("updateInput", {
    line: props.variables.targetLine,
  });
});

onUnmounted(() => {
  props.socket.emit("leave workspace", "hello");
});

defineExpose({
  input,
});
</script>

<template>
  <div id="code-area" @keyup="checkEvent">
    <div
      v-for="(code, index) in props.variables.currCodes"
      style="display: flex"
    >
      <div class="code-index">{{ index }}</div>
      <input
        :id="`code-${index.toString()}`"
        class="code-input"
        ref="input"
        type="text"
        :value="props.variables.currCodes[index]"
        @input="addCode"
        @click="changeTarget"
        autocomplete="off"
      />
    </div>
  </div>
  <ul>
    <li v-for="code in props.variables.codeRecords">
      {{ code.action }} - {{ code.code }}
    </li>
  </ul>
</template>
