<script setup>
import axios from 'axios'
import { ref, onMounted, onUpdated } from 'vue'

const props = defineProps({
  socket: Object,
})
const input = ref([])
let targetLine = ref(0)
let recordData = ref([])
const currCodes = ref([''])
const timeBetween = ref([0])

onMounted(async () => {
  input.value[targetLine.value].focus()
  const recordResponse = await axios.get('http://localhost:3000/api/1.0/record')
  recordData.value = recordResponse.data.data
  for (let i = 0; i < recordData.value.length; i++) {
    if (i == 0) {
      continue
    }
    timeBetween.value.push(
      new Date(recordData.value[i].timestamp).getTime() -
        new Date(recordData.value[i - 1].timestamp).getTime(),
    )
  }
})

const startVideo = async () => {
  for (let i = 0; i < timeBetween.value.length; i++) {
    await new Promise((resolve, reject) => {
      setTimeout(() => {
        const currObject = recordData.value[i]
        triggerEvent(currObject)
        console.log(targetLine.value, currObject.code, currObject.line)
        resolve()
      }, timeBetween.value[i])
    })
  }
}

const triggerEvent = (recordObject) => {
  const action = recordObject.action
  if (action === 'create') {
    currCodes.value[recordObject.line] =
      currCodes.value[recordObject.line].substring(0, +recordObject.index) +
      recordObject.code +
      currCodes.value[recordObject.line].substring(
        +recordObject.index,
        currCodes.value[recordObject.line].length,
      )
  } else if (action === 'delete') {
    currCodes.value[recordObject.line] =
      currCodes.value[recordObject.line].substring(0, +recordObject.index) +
      currCodes.value[recordObject.line].substring(
        +recordObject.index + 1,
        currCodes.value[recordObject.line].length,
      )
  } else if (action === 'up') {
    targetLine.value = targetLine.value - 1
    input.value[targetLine.value].focus()
  } else if (action === 'down') {
    targetLine.value = targetLine.value + 1
    input.value[targetLine.value].focus()
  } else if (action === 'enter') {
    currCodes.value.push('')
    targetLine.value = currCodes.value.length - 1
  }
}

onUpdated(() => {
  input.value[targetLine.value].focus()
})

//TODO: 根據時間差，加入input
</script>

<template>
  <h1>Playback</h1>
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
        <!-- <div v-for="(code, index) in currCodes" style="display: flex;">
          <div class="code-index">{{ index }}</div>
          <div
            :id="`code-${index.toString()}`"
            class="code-input"
            ref="input"
            @input="addCode"
            @click="changeTarget"
            style="display: flex;"
          >
            <div v-for="word in currCodes[index]">
              {{ word }}
            </div>
          </div>
        </div> -->
        <div v-for="(code, index) in currCodes" style="display: flex;">
          <div class="code-index">{{ index }}</div>
          <input
            :id="`code-${index.toString()}`"
            class="code-input"
            ref="input"
            v-model="currCodes[index]"
            @input="addCode"
            @click="changeTarget"
            style="display: flex;"
          />
        </div>
      </form>
      <button @click="startVideo">Start</button>
      <ul>
        <li v-for="(code, index) in recordData">
          {{ code.action }} - {{ code.code }} - {{ timeBetween[index] }}
        </li>
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
