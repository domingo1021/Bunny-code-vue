<script setup>
const props = defineProps({
  terminalResult: Array,
});
</script>
<template>
  <div id="terminal">
    <div>我是終端機</div>
    <div id="result" v-for="(result, index) in terminalResult" :key=index>
      {{result}}
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
  height: 180px;
}
</style>
