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
  "updatePrevCodes",
  "updateCurrCodes",
  "pushCodeRecords",
  "pushCurrCodes",
]);

const addCode = (e) => {
  if (props.variables.codeRecords.length > 50) {
    alert("記得儲存程式碼！");
  }
  emit("updateCurrCodes", {
    fileNumber: props.fileNumber,
    line: props.variables.targetLine,
    newCodes: e.target.value,
  });
  // Binary check the index of input code.
  let prev = props.variables.prevCodes.split("");
  const curr = props.variables.currCodes[props.variables.targetLine].split("");
  let result = {};
  if (prev.length > curr.length) {
    console.log("backspace");
    if (props.variables.prevCodes == "") {
      return;
    }
    for (let i = 0; i < curr.length; i++) {
      if (prev[i] !== curr[i]) {
        result = {
          index: i,
          keyword: prev[i],
        };
        console.log("prev: ", prev);
        console.log(i, result);
        break;
      }
    }
    if (!result.keyword) {
      result = {
        index: prev.length - 1,
        keyword: prev[prev.length - 1],
      };
    }
    emit("pushCodeRecords", {
      fileNumber: props.fileNumber,
      newRecords: {
        action: "delete",
        line: props.variables.targetLine,
        index: result.index,
        code: result.keyword,
        timestamp: Date.now().toString() + "000000",
      },
    });
  } else if (prev.length < curr.length) {
    for (let i = 0; i < prev.length; i++) {
      if (prev[i] !== curr[i]) {
        result = {
          index: i,
          keyword: curr[i],
        };
        break;
      }
    }
    if (!result.keyword) {
      result = {
        index: curr.length - 1,
        keyword: curr[curr.length - 1],
      };
    }
    emit("pushCodeRecords", {
      fileNumber: props.fileNumber,
      newRecords: {
        action: "create",
        line: props.variables.targetLine,
        index: result.index,
        code: result.keyword,
        timestamp: Date.now().toString() + "000000",
      },
    });
  }
  const currentValue = props.variables.currCodes[props.variables.targetLine];
  emit("updatePrevCodes", {
    fileNumber: props.fileNumber,
    newCodes: currentValue,
  });
};

const checkEvent = async (e) => {
  if (e.keyCode === 13) {
    console.log("enter");
    emit("updateTargetLine", {
      fileNumber: props.fileNumber,
      line: props.variables.targetLine + 1,
    });
    emit("pushCurrCodes", {
      fileNumber: props.fileNumber,
      line: props.variables.targetLine,
    });
    // emit("update")
    emit("updatePrevCodes", {
      fileNumber: props.fileNumber,
      newCodes: props.variables.currCodes[props.variables.targetLine],
    });
    emit("pushCodeRecords", {
      fileNumber: props.fileNumber,
      newRecords: {
        action: "enter",
        line: props.variables.targetLine,
        timestamp: Date.now().toString() + "000000",
      },
    });
  } else if (e.keyCode === 38) {
    console.log("up");
    if (props.variables.targetLine > 0) {
      emit("updateTargetLine", {
        fileNumber: props.fileNumber,
        line: props.variables.targetLine - 1,
      });
      emit("updatePrevCodes", {
        fileNumber: props.fileNumber,
        newCodes: props.variables.currCodes[props.variables.targetLine],
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
      emit("updatePrevCodes", {
        fileNumber: props.fileNumber,
        newCodes: props.variables.currCodes[props.variables.targetLine],
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
    console.log(allCodes);
    const submitForm = new FormData();
    const blob = new Blob([JSON.stringify(allCodes)], {
      type: "application/javascript",
    });
    submitForm.append("files", blob, props.fileName);
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
};

const changeTarget = (e) => {
  emit("updateTargetLine", {
    fileNumber: props.fileNumber,
    line: Number(e.target.id.split("-")[1]),
  });
  emit("updatePrevCodes", {
    fileNumber: props.fileNumber,
    newCodes: props.variables.currCodes[props.variables.targetLine],
  });
};

onMounted(async () => {
  //TODO: socket send msg to backend, update version writing status.
  console.log(props.fileNumber, props.variables.targetLine);
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
  <div id="code-area" @keydown="checkEvent">
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
