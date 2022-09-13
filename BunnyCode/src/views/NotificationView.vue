<template>
  <div id="notify-icon">+</div>
  <div id="notify-count">{{notificationCount}}</div>
</template>

<script setup>
import {ref, watch} from "vue"
const props = defineProps({
socket: Object,
});

const notificationCount = ref("");

watch(
  () => props.socket,
  (now, prev) => {
    console.log("socket change");
    if (props.socket) {
      props.socket.emit("getInvitations");
      props.socket.on("returnInvitations", (responseObject) => {
        notificationCount.value = `${responseObject.length}`;
        console.log("socket response: ", responseObject);
      });
    }
  }
);
</script>

<style scoped>
#notify-icon{
  left: 10px;
}
#notify-count{
  left: 10px;
  height: 25px;
  width: 25px;
  background-color: #bbb;
  border-radius: 50%;
  text-align: center;
}
</style>