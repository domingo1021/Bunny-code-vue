<script setup>
import { nextTick, onBeforeMount, onMounted, ref } from "vue";
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
const message = ref([]);
const battleInfo = ref([
  {
    battlerNumber: 0,
    userID: 0,
    userName: "",
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
const childEditor = ref([]);
const localhostServer = "http://localhost:3000";
const productionServer = "wss://domingoos.store";

const socket = io(productionServer, {
  auth: (cb) => {
    cb({ token: `Bearer ${localStorage.getItem("jwt")}` });
  },
  path: "/api/socket/",
});

socket.on("returnBattler", (responseObject) => {
  battleInfo.value[0].userID = responseObject.battleResponse.firstUserID;
  battleInfo.value[0].userName = responseObject.battleResponse.firstUserName;
  battleInfo.value[1].userID = responseObject.battleResponse.secondUserID;
  battleInfo.value[1].userName = responseObject.battleResponse.secondUserName;
  userID.value = responseObject.userID;
  authorization.value = responseObject.category;
  if (responseObject.category === 0) {
    readOnlies.value = [true, true];
  } else {
    readOnlies.value = battleInfo.value.map((info) => {
      return info.userID !== responseObject.userID;
    });
  }
});

socket.on("in", (msg) => {
  message.value.push(msg);
  console.log(message.value);
  console.log(childEditor.value);
});

socket.on("newCodes", (recordObject) => {
  battleInfo.value.forEach((info)=>{
    if (
      info.userID == recordObject.userID &&
      userID.value !== recordObject.userID
    ) {
      info.fileContent = recordObject.newCodes;
    }
  });
});

//emit function
function updateCurrCodes(emitObject) {
  battleInfo.value[emitObject.battlerNumber].fileContent = emitObject.code;
  socket.emit("newCodes", {
    battleID: props.battleID,
    userID: userID.value,
    newCodes: emitObject.code,
  });
}

function updateCurrIndex(emitObject) {
  battleInfo.value[emitObject.battlerNumber].index = emitObject.index;
}

function updateCurrLine(emitObject) {
  battleInfo.value[emitObject.battlerNumber].line = emitObject.line;
}

function pushCodeRecords(emitObject) {
  // console.log(battleInfo.value, emitObject.battlerNumber);
  battleInfo.value[emitObject.battlerNumber].codeRecords.push(
    emitObject.newRecords
  );
  // emit to socket.
  // console.log(battleInfo.value[emitObject.battlerNumber].codeRecords);
}

function pushTerminal(emitObject) {
  terminalResult.value.push(...emitObject.result);
}

function updateAllRecords(emitObject) {
  battleInfo.value[emitObject.battlerNumber].codeRecords =
    emitObject.codeRecords;
}

function updateTimeBetween(emitObject) {
  battleInfo.value[emitObject.battlerNumber].timeBetween =
    emitObject.timeBetween;
}

onBeforeMount(() => {
  // console.log(props.battleID);
  socket.emit("queryBattler", {
    battleID: props.battleID,
  });
});
</script>

<template>
  <div id="battle-main-board">
    <div class="battle-editor" v-for="(info, index) in battleInfo" :key="index">
      <BattleSpaceComponent
        :id="`user-${info.userID}`"
        :atAlt="atAlt"
        :atCtl="atCtl"
        :info="info"
        :message="message"
        :readOnly="readOnlies[index]"
        :ref="childEditor"
        @updateCurrCodes="updateCurrCodes"
        @updateCurrIndex="updateCurrIndex"
        @updateCurrLine="updateCurrLine"
        @pushCodeRecords="pushCodeRecords"
        @pushTerminal="pushTerminal"
        @updateAllRecords="updateAllRecords"
        @updateTimeBetween="updateTimeBetween"
      />
    </div>
  </div>
</template>

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
