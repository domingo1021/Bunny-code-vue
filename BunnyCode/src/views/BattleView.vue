<template>
  <div id="battle-main-board">
    <div class="battle-editor" v-for="(info, index) in BattleInfo" :key="index">
      <BattleSpaceComponent
        :id="`user-${info.userID}`"
        :atAlt="atAlt"
        :atCtl="atCtl"
        :info="info"
        :readOnly="readOnlies[index]"
      />
    </div>
  </div>
</template>

<script setup>
import { onBeforeMount, ref } from "vue";
import io from "socket.io-client";
import BattleSpaceComponent from "../components/BattleSpaceComponent.vue";

//TODO: Sending codeing info (recordsing it in local as well) to Server with socket.
//TODO: Keyboard event (需要用到哪些)
//TODO: Emit 父層事件，只需要 Records? 假設要提供賽事重播，是不是 Index, Line 的變數也都要有
//TODO: 控制活動時間
//TODO: 如果要做 Recording，那要什麼時間送到後端 / 還是要每分每秒傳到後端的時候就塞 DB ?
//TODO: --> Enter 的時候偷偷將 Record 資料送到後端; 使用者按下 Run 程式碼查看 Console 的時候送到後端

//TODO: Receiving coding info from server with socket.
//TODO: "On" Socket room server send information -> 直接渲染整個 content.

const props = defineProps({
  battleID: String,
});

const CLIENT_CATEGORY = {
  visitor: 0,
  otherMember: 1,
  self: 2,
};

const readOnlies = ref([true, true]);
const userID = ref(-1);
//default visitor.
const authorization = ref(0);
const message = ref([1, 2, 3]);
const BattleInfo = ref([
  {
    battlerNumber: 0,
    fileContent: "",
    line: 0,
    index: 0,
    codeRecords: [],
    timeBetween: [],
  },
  {
    battlerNumber: 1,
    userID: 0,
    userName: "",
    fileContent: "",
    line: 0,
    index: 0,
    codeRecords: [],
    timeBetween: [],
  },
]);

const atAlt = ref(false);
const atCtl = ref(false);

const terminalResult = ref([]);

const localhostServer = "http://localhost:3000";
const productionServer = "wss://domingoos.store";

const socket = io(localhostServer, {
  auth: (cb) => {
    cb({ token: `Bearer ${localStorage.getItem("jwt")}` });
  },
  path: "/api/socket/",
});

socket.on("returnBattler", (responseObject) => {
  BattleInfo.value[0].userID = responseObject.battleResponse.firstUserID;
  BattleInfo.value[0].userName = responseObject.battleResponse.firstUserName;
  BattleInfo.value[1].userID = responseObject.battleResponse.secondUserID;
  BattleInfo.value[1].userName = responseObject.battleResponse.secondUserName;
  userID.value = responseObject.userID;
  authorization.value = responseObject.category;
  if (responseObject.category === 0) {
    readOnlies.value = [true, true];
  } else {
    readOnlies.value = BattleInfo.value.map((info) => {
      return info.userID !== responseObject.userID;
    });
  }
});

socket.on("in", (msg) => {
  message.value.push(msg);
});

onBeforeMount(() => {
  console.log(props.battleID);
  socket.emit("queryBattler", {
    battleID: props.battleID,
  });
});
// onMounted(async () => {
//   console.log(props.battleID);
//   socket.emit("queryBattler", {
//     battleID: props.battleID,
//   });
// });
// const socket = io(productionServer, { path: "/api/socket/" });
</script>

<style>
#battle-main-board {
  width: 100%;
  height: 200px;
  display: flex;
  justify-content: space-around;
  align-items: center;
  align-content: center;
}
.battle-editor {
  width: 40%;
  height: 200px;
  align-self: center;
}
</style>
