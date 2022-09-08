<template>
  Battle view
</template>

<script setup>
import {onMounted, ref} from 'vue';
import io from "socket.io-client";

const props = defineProps({
  battleID: String,
})

const localhostServer = "http://localhost:3000";
const productionServer = "wss://domingoos.store";

const CLIENT_CATEGORY = {
  visitor: 0,
  otherMember: 1,
  self: 2,
};

const battlers = ref([]);
const userID = ref(-1);
//default visitor.
const authorization = ref(0);

const socket = io(localhostServer, {
  auth: (cb) => {
    cb({ token: `Bearer ${localStorage.getItem("jwt")}` });
  },
  path: "/api/socket/",
});

socket.on("returnBattler", (responseObject) => {
  battlers.value = responseObject.battlers; 
  userID.value = responseObject.userID,
  authorization.value = responseObject.category;
})

onMounted(async () => {
  socket.emit("queryBattler", {
    battleID: props.battleID,
  })
})
// const socket = io(productionServer, { path: "/api/socket/" });
</script>