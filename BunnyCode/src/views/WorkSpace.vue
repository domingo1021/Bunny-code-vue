<script setup>
import { onMounted, onUpdated, ref } from "vue";

const props = defineProps({
  socket: Object,
});

const input = ref([]);
let targetLine = ref(0);
let prevCodes = [""];
const currCodes = ref([""]);
const codeRecords = ref([]);

const addCode = (e) => {
  if (codeRecords.value.length > 50) {
    alert("記得儲存程式碼！");
  }

  // Binary check the index of input code.
  let prev = prevCodes.split("");
  const curr = currCodes.value[targetLine.value].split("");
  let result = {};
  if (prev.length > curr.length) {
    console.log("backspace");
    if (prevCodes == "") {
      return;
    }
    for (let i = 0; i < curr.length; i++) {
      if (prev[i] !== curr[i]) {
        result = {
          index: i,
          keyword: prev[i],
        };
        break;
      }
    }
    if (!result.keyword) {
      result = {
        index: prev.length - 1,
        keyword: prev[prev.length - 1],
      }
    }
    codeRecords.value.push({
      type: "delete",
      line: targetLine.value,
      index: result.index,
      code: result.keyword,
      timestamp: Date.now().toString() + "000000",
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
        index: curr.length-1,
        keyword: curr[curr.length - 1],
      }
    }
    codeRecords.value.push({
      type: "create",
      line: targetLine.value,
      index: result.index,
      code: result.keyword,
      timestamp: Date.now().toString() + "000000",
    });
  }
  const currentValue = currCodes.value[targetLine.value];
  console.log(codeRecords.value);
  prevCodes = currentValue;
}

const checkEvent = (e) => {
  if (e.keyCode === 13) {
    console.log("enter");
    currCodes.value.push("");
    targetLine.value = currCodes.value.length - 1;
    prevCodes = currCodes.value[targetLine.value];
    codeRecords.value.push({
      type: "enter",
      line: targetLine.value,
      timestamp: Date.now().toString() + "000000",
    });
  } else if (e.keyCode === 38) {
    console.log("up");
    if (targetLine.value > 0) {
      targetLine.value = targetLine.value - 1;
      codeRecords.value.push({
        type: "up",
        line: targetLine.value,
        timestamp: Date.now().toString() + "000000",
      });
      input.value[targetLine.value].focus();
    }
  } else if (e.keyCode === 40) {
    console.log("down");
    if (targetLine.value < currCodes.value.length - 1) {
      targetLine.value = targetLine.value + 1;
      codeRecords.value.push({
        type: "down",
        line: targetLine.value,
        timestamp: Date.now().toString() + "000000",
      });
      input.value[targetLine.value].focus();
    }
  } else if (e.ctrlKey && e.keyCode === 83) {
    props.socket.emit("save", `Saving data ${JSON.stringify(codeRecords.value)}`)
    console.log("Control + Save")
  }
};

const changeTarget = (e) => {
  targetLine.value = Number(e.target.id.split("-")[1]);
  prevCodes = currCodes.value[targetLine.value];
  console.log(targetLine.value);
}

onMounted(() => {
  input.value[targetLine.value].focus();
  // console.log(currCodes.value.length - 1)
  // input.value[currCodes.value.length - 1].focus();
})

onUpdated(() => {
  input.value[targetLine.value].focus()
})

//TODO: Event: When user add ctrl+s (keyboard event), send axios to backend
</script>

<template>
  <ul>
    <li v-for="(code) in codeRecords">{{code.type}} - {{code.code}}</li>
  </ul>
  <div v-for="(code, index) in currCodes">
    <input :id="`code-${index.toString()}`" ref="input" v-model="currCodes[index]" type="text" @keydown="checkEvent" @input="addCode" @click="changeTarget">
  </div>
</template>


<style>
h1 {
  color: red;
}

</style>
