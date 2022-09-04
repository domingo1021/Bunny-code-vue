<script setup>
import { onMounted, onUnmounted, onUpdated, ref } from 'vue'
import axios from 'axios'

const props = defineProps({
  socket: Object,
})

const input = ref([])
let targetLine = ref(0)
let prevCodes = ['']
const currCodes = ref([''])
const codeRecords = ref([])
const jwt = localStorage.getItem('jwt');
console.log(jwt);
props.socket.on('return', (msg) => {
  console.log(msg)
})

const addCode = (e) => {
  if (codeRecords.value.length > 50) {
    alert('記得儲存程式碼！')
  }

  // Binary check the index of input code.
  let prev = prevCodes.split('')
  const curr = currCodes.value[targetLine.value].split('')
  let result = {}
  if (prev.length > curr.length) {
    console.log('backspace')
    if (prevCodes == '') {
      return
    }
    for (let i = 0; i < curr.length; i++) {
      if (prev[i] !== curr[i]) {
        result = {
          index: i,
          keyword: prev[i],
        }
        console.log('prev: ', prev)
        console.log(i, result)
        break
      }
    }
    if (!result.keyword) {
      result = {
        index: prev.length - 1,
        keyword: prev[prev.length - 1],
      }
    }
    codeRecords.value.push({
      action: 'delete',
      line: targetLine.value,
      index: result.index,
      code: result.keyword,
      timestamp: Date.now().toString() + '000000',
    })
  } else if (prev.length < curr.length) {
    for (let i = 0; i < prev.length; i++) {
      if (prev[i] !== curr[i]) {
        result = {
          index: i,
          keyword: curr[i],
        }
        break
      }
    }
    if (!result.keyword) {
      result = {
        index: curr.length - 1,
        keyword: curr[curr.length - 1],
      }
    }
    codeRecords.value.push({
      action: 'create',
      line: targetLine.value,
      index: result.index,
      code: result.keyword,
      timestamp: Date.now().toString() + '000000',
    })
  }
  const currentValue = currCodes.value[targetLine.value]
  console.log(codeRecords.value)
  prevCodes = currentValue
}

const checkEvent = async (e) => {
  if (e.keyCode === 13) {
    console.log('enter')
    currCodes.value.push('')
    targetLine.value = currCodes.value.length - 1
    prevCodes = currCodes.value[targetLine.value]
    codeRecords.value.push({
      action: 'enter',
      line: targetLine.value,
      timestamp: Date.now().toString() + '000000',
    })
  } else if (e.keyCode === 38) {
    console.log('up')
    if (targetLine.value > 0) {
      targetLine.value = targetLine.value - 1
      prevCodes = currCodes.value[targetLine.value]
      codeRecords.value.push({
        action: 'up',
        line: targetLine.value,
        timestamp: Date.now().toString() + '000000',
      })
      input.value[targetLine.value].focus()
    }
  } else if (e.keyCode === 40) {
    console.log('down')
    if (targetLine.value < currCodes.value.length - 1) {
      targetLine.value = targetLine.value + 1
      prevCodes = currCodes.value[targetLine.value]
      codeRecords.value.push({
        action: 'down',
        line: targetLine.value,
        timestamp: Date.now().toString() + '000000',
      })
      input.value[targetLine.value].focus()
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
    console.log('Control + Save')
    const allCodes = currCodes.value.reduce((prev, curr) => {
      return prev + curr + "\n";
    }, "")
    console.log(allCodes);
    const submitForm = new FormData();
    const blob = new Blob([JSON.stringify(allCodes)], {type: 'application/javascript'})
    submitForm.append('files', blob, "test.js")
    submitForm.append('projectID', 1);
    submitForm.append('versionID', 2);
    submitForm.append('reqCategory', 'code_file');
    const response = await axios({ 
      method: "post",
      url: "https://domingoos.store/api/1.0/record/file",
      headers: {
        "Authorization": `Bearer ${jwt}`
      },
      data: submitForm,
    })
    console.log(response);
  }
}

const changeTarget = (e) => {
  targetLine.value = Number(e.target.id.split('-')[1])
  prevCodes = currCodes.value[targetLine.value]
  console.log(targetLine.value)
}

onMounted(async () => {
  //TODO: socket send msg to backend, update version writing status.
  input.value[targetLine.value].focus()
})

onUpdated(() => {
  input.value[targetLine.value].focus()
})

onUnmounted(() => {
  props.socket.emit('leave workspace', 'hello')
})

//TODO: Event: When user add ctrl+s (keyboard event), send axios to backend
</script>

<template>
  <div style="display: flex; height: 100vh;">
    <div
      id="left-bar"
      style="
        padding-left: 10px;
        padding-right: 20px;
        background-color: rgb(36, 36, 36);
        color: rgb(255, 255, 255);
      "
    >
      <div>File</div>
      <div>Code</div>
      <div>Fork</div>
      <div>Message</div>
    </div>
    <div id="main-content" style="width: 100vw;">
      <form id="code-area" @keydown="checkEvent">
        <div v-for="(code, index) in currCodes" style="display: flex;">
          <div class="code-index">{{ index }}</div>
          <input
            :id="`code-${index.toString()}`"
            class="code-input"
            ref="input"
            v-model="currCodes[index]"
            type="text"
            @input="addCode"
            @click="changeTarget"
          />
        </div>
      </form>
      <ul>
        <li v-for="code in codeRecords">{{ code.action }} - {{ code.code }}</li>
      </ul>
    </div>
  </div>
</template>

<style>
h1 {
  color: red;
}
#code-area {
  border: 1px solid;
  background-color: rgb(36, 36, 36);
  color: rgb(255, 255, 255);
}
.code-index {
  width: 50px;
  padding-right: 20px;
  padding-left: 20px;
  border-right: 1px solid rgb(255, 255, 255);
}
.code-input {
  padding-left: 20px;
  border-width: 0px;
  width: 100%;
  background-color: rgb(36, 36, 36);
  color: rgb(255, 255, 255);
}
</style>
