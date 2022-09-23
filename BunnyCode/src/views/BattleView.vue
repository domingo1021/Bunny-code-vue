<script setup>
import { onBeforeMount, onBeforeUnmount, ref } from "vue";
import axios from "axios";
import Markdown from "vue3-markdown-it";
import BattleSpaceComponent from "../components/BattleSpaceComponent.vue";
import TerminalComponent from "../components/TerminalComponent.vue";
import "highlight.js/styles/monokai.css";
import Socket from "../socket";
import Swal from "sweetalert2";

const props = defineProps({
  userID: Number,
  battleID: String,
  socket: Socket,
});
const emits = defineEmits(["setUserID"]);

const CLIENT_CATEGORY = {
  visitor: 0,
  otherMember: 1,
  self: 2,
};

const jwt = localStorage.getItem("jwt");
const readOnlies = ref([true, true]);
const ready = ref([false, false]);
const start = ref(false);
const battleOver = ref(false);
const userID = ref(-1);
const questionName = ref();
const questionURL = ref();
const questionContent = ref("");
const boardContent = ref("");
//default visitor.
const authorization = ref(0);
const message = ref([]);
const battleName = ref("");
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
    terminalResult: [],
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
    terminalResult: [],
  },
]);
const compiledCode = ref("");

const atAlt = ref(false);
const atCtl = ref(false);
const childEditor = ref([]);
// const localhostServer = "http://localhost:3000";
// const productionServer = "wss://domingoos.store";

// const socket = io(productionServer, {
//   auth: (cb) => {
//     cb({ token: `Bearer ${localStorage.getItem("jwt")}` });
//   },
//   path: "/api/socket/",
// });

//emit function
function updateCurrCodes(emitObject) {
  battleInfo.value[emitObject.battlerNumber].fileContent = emitObject.code;
  if (!start.value) {
    return;
  }
  props.socket.socketEmit("newCodes", {
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

function pushTerminal(battlerNumber, result) {
  battleInfo.value[battlerNumber].terminalResult.push(result);
}

function updateAllRecords(emitObject) {
  battleInfo.value[emitObject.battlerNumber].codeRecords =
    emitObject.codeRecords;
}

function updateTimeBetween(emitObject) {
  battleInfo.value[emitObject.battlerNumber].timeBetween =
    emitObject.timeBetween;
}

function setReady(index) {
  let anotherUserIndex = 1;
  if (index === 1) {
    anotherUserIndex = 0;
  }
  props.socket.socketEmit("setReady", {
    battleID: props.battleID,
    currentUserID: battleInfo.value[index].userID,
    anotherUserID: battleInfo.value[anotherUserIndex].userID,
  });
}

async function runCode(battlerNumber) {
  console.log(battlerNumber);
  compiledCode.value = battleInfo.value[battlerNumber].fileContent;
  props.socket.socketEmit("compile", {
    battlerNumber: battlerNumber,
    battleID: props.battleID,
    codes: compiledCode.value,
  });
}

onBeforeMount(async () => {
  if (!props.socket) {
    return;
  }
  const welcome = await axios.get(
    "https://d1vj6hotf8ce5i.cloudfront.net/question/battlerContent.md"
  );
  boardContent.value = welcome.data;
  props.socket.socketEmit("queryBattler", {
    battleID: props.battleID,
  });
  props.socket.socketOn("returnBattler", async (responseObject) => {
    battleName.value = responseObject.battleResponse.battleName;
    battleInfo.value[0].userID = responseObject.battleResponse.firstUserID;
    battleInfo.value[0].userName = responseObject.battleResponse.firstUserName;
    battleInfo.value[1].userID = responseObject.battleResponse.secondUserID;
    battleInfo.value[1].userName = responseObject.battleResponse.secondUserName;
    questionName.value = responseObject.battleResponse.questionName;
    questionURL.value = responseObject.battleResponse.questionURL;
    userID.value = responseObject.userID;
    authorization.value = responseObject.category;
    if (responseObject.firstUserReady === 0) {
      ready.value[0] = false;
    } else {
      ready.value[0] = true;
    }
    if (responseObject.secondUserReady === 0) {
      ready.value[1] = false;
    } else {
      ready.value[1] = true;
    }
    console.log(ready.value[0], ready.value[1]);
    if (ready.value[0] && ready.value[1]) {
      start.value = true;
    }
    if (responseObject.category === 0) {
      readOnlies.value = [true, true];
    } else {
      readOnlies.value = battleInfo.value.map((info) => {
        return info.userID !== responseObject.userID;
      });
    }
    const question = await axios.get(questionURL.value);
    questionContent.value = question.data;
    if (ready.value[0] && ready.value[1]) {
      boardContent.value = questionContent.value;
    }
  });

  props.socket.socketOn("in", (msg) => {
    message.value.push(msg);
  });

  props.socket.socketOn("newCodes", (recordObject) => {
    battleInfo.value.forEach((info) => {
      if (
        info.userID == recordObject.userID &&
        userID.value !== recordObject.userID
      ) {
        info.fileContent = recordObject.newCodes;
      }
    });
  });

  props.socket.socketOn("compileDone", (responseObject) => {
    console.log("responseObject: ", responseObject);
    pushTerminal(responseObject.battlerNumber, responseObject.compilerResult);
  });

  props.socket.socketOn("userReady", (emitObject) => {
    battleInfo.value.forEach((battler, index) => {
      if (battler.userID === emitObject.readyUserID) {
        ready.value[index] = true;
      }
    });
  });

  props.socket.socketOn("battleStart", () => {
    boardContent.value = questionContent.value;
    //TODO: 倒數特效
    Swal.fire("5 秒鐘後活動開始");
    setTimeout(() => {
      start.value = true;
    }, 5000);
  });

  props.socket.socketOn("readyFailed", (responseObject) => {
    if (responseObject.failedUserID === props.userID) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: responseObject.reason,
      });
    }
  });

  props.socket.socketOn("battleOver", async (responseObject) => {
    Swal.fire(
      `${responseObject.winnerName} win the game !! ${responseObject.reason}`
    );
    if (responseObject.winnerID === props.userID) {
      // TODO: upload...
      const submitForm = new FormData();
      const blob = new Blob([JSON.stringify(compiledCode.value)], {
        type: "application/javascript",
      });
      submitForm.append("files", blob, `${responseObject.winnerID}.js`);
      submitForm.append("battleID", props.battleID);
      submitForm.append("reqCategory", "battle_file");
      const response = await axios({
        method: "post",
        url: "https://domingoos.store/api/1.0/record/battle",
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
        data: submitForm,
      });
    }
    battleOver.value = true;
    Swal.fire({
      position: "top-end",
      icon: "success",
      title: "Winner code uploaded successfully.",
      showConfirmButton: false,
      timer: 1500,
    });
  });
});

onBeforeUnmount(() => {
  props.socket.socketOff("returnBattler");
  props.socket.socketOff("in");
  props.socket.socketOff("newCodes");
  props.socket.socketOff("compileDone");
  props.socket.socketOff("userReady");
  props.socket.socketOff("battleStart");
  props.socket.socketOff("readyFailed");
  props.socket.socketOff("battleOver");
});
</script>

<template>
  <Markdown id="mark-down" :source="boardContent" />
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
      <div style="display: flex">
        <div v-if="!start">
          <button
            v-if="!ready[index] && !readOnlies[index]"
            type="button"
            @click="setReady(index)"
          >
            準備開始
          </button>
          <div v-else-if="!ready[index] && readOnlies[index]">
            挑戰者準備中..
          </div>
          <div v-else>{{ battleInfo[index].userName }} 已經準備好了！</div>
        </div>
        <div v-else-if="start">
          <div>遊戲開始！</div>
        </div>
        <button
          v-if="!readOnlies[index] && start && !battleOver"
          @click="runCode(index)"
        >
          Run code
        </button>
      </div>
      <TerminalComponent id="terminal" :terminalResult="info.terminalResult" />
    </div>
  </div>
</template>

<style>
#mark-down {
  padding-left: 5%;
  padding-right: 5%;
  margin-left: 5%;
  margin-right: 5%;
  background-color: rgb(63, 61, 72);
}
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
#terminal {
  top: 350px;
}
</style>
