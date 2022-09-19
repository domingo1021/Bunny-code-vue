<template>
  <div id="notify-icon">+</div>
  <div id="notify-count">{{ notificationCount }}</div>
</template>

<script setup>
import Socket from "../socket";
import { onBeforeMount, onMounted, ref, watch } from "vue";
const props = defineProps({
  socket: Socket,
});
const emits = defineEmits(["setUserID"]);

const notificationCount = ref(0);

function initSocket() {
  if (props.socket) {
    console.log("socket init");
    props.socket.socketOn("returnInvitations", (responseObject) => {
      console.log("socket response: ", responseObject);
      notificationCount.value = responseObject.length;
    });
  }
}

watch(
  () => props.socket,
  (now, prev) => {
    console.log("socket change");
    if (props.socket) {
      initSocket();
      props.socket.socketEmit("getInvitations");
    }
  }
);
</script>

<style scoped>
#notify-icon {
  left: 10px;
}
#notify-count {
  left: 10px;
  height: 25px;
  width: 25px;
  background-color: #bbb;
  border-radius: 50%;
  text-align: center;
}
</style>
