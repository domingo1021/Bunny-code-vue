<script setup>
import { nextTick, ref, watch } from "vue";
const props = defineProps({
  terminalResult: Array,
});

const terminalScroll = ref(null);

watch(
  () => props.terminalResult.length,
  async (now, prev) => {
    await nextTick();
    terminalScroll.value.scrollTo(0, terminalScroll.value.scrollHeight);
  }
);
</script>
<template>
  <div id="terminal" ref="terminalScroll">
    <div id="result-area">
      <div v-for="(result, index) in terminalResult" :key="index">
        <div>
          {{ result }}
        </div>
      </div>
    </div>
  </div>
</template>

<style>
#terminal {
  background-color: rgb(36, 36, 36);
  color: white;
  position: absolute;
  bottom: 0px;
  width: 100%;
  height: 300px;
  overflow-y: auto;
  padding: 1% 0% 0% 2%;
}

#result-area{
  font-size: 1.25rem;
  margin-top:5%;
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
