<script setup>
import { onMounted, onUpdated, ref } from "vue";

defineProps({
  socket: Object,
});

//TODO: create a space for user to input data (a list of input data) --> v-model + v-for
// const input = ref([null]);
const input = ref([]);
let targetLine = ref(0);
let prevCodes = [""];
const currCodes = ref([""]);
const codeRecords = ref([]);

const addCode = (e) => {
  if(codeRecords.value.length > 50){
    alert("記得儲存程式碼！");
  }

  // Binary check the index of input code.
  let prev = prevCodes[targetLine.value].split("");
  const curr = currCodes.value[targetLine.value].split("");
  let result = {};
  for(let i = 0; i < prev.length; i++){
    if(prev[i] !== curr[i]){
      result = {
        index: i,
        keyword: curr[i],
      };
      break;
    }
  }
  if(!result.keyword){
    result = {
      index: curr.length-1,
      keyword: curr[curr.length - 1],
    }
  }

  codeRecords.value.push({
    index: result.index,
    code: result.keyword,
    timestamp: Date.now().toString() + "000000",
  });
  const currentValue = currCodes.value[targetLine];
  prevCodes[targetLine] = currentValue;
}

const checkEvent = (e) => {
  if(e.keyCode === 13){
    console.log("enter");
    currCodes.value.push("");
    targetLine.value = currCodes.value.length - 1;
  }
}

const changeTarget = (e) => {
  targetLine.value = Number(e.target.id.split("-")[1]);
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
//TODO: 紀錄輸入在該行的位置

//TODO: 紀錄輸入在的行數

//TODO: Watch currCodes, when user add enter (keyboard event), list of input +1

//TODO: Event: when user add enter, add new input html tag.

//TODO: Event: When user add ctrl+s (keyboard event), send axios to backend
</script>

<template>
  <ul>
    <li v-for="(code) in codeRecords">{{code.code}}</li>
  </ul>
  <input v-for="(code, index) in currCodes" :id="`code-${index.toString()}`" ref="input" v-model="currCodes[index]" type="text" @keydown="checkEvent" @input="addCode" @click="changeTarget">
</template>


<style>
h1 {
  color: red;
}

</style>
