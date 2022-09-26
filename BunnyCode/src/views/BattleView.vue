<script setup>
import { onBeforeMount, onBeforeUnmount, ref } from "vue";
import axios from "axios";
import Markdown from "vue3-markdown-it";
import BattleSpaceComponent from "../components/BattleSpaceComponent.vue";
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
    testCases: [],
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
    testCases: [],
  },
]);

const testCase_title = {
  "Test case": "Expected answer",
  "Compile result": "Compiler result",
};
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
  battleInfo.value[emitObject.battlerNumber].codeRecords.push(
    emitObject.newRecords
  );
}

function pushTerminal(battlerNumber, result) {
  battleInfo.value[battlerNumber].terminalResult.push(result);
}

function pushTestCase(battlerNumber, testCases) {
  console.log("testCases: ", testCases);
  battleInfo.value[battlerNumber].testCases = testCases;
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
    questionName: questionName.value,
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
    console.log("URL: ", responseObject.battleResponse.baseURL);
    const baseContent = await axios.get(responseObject.battleResponse.baseURL);
    battleInfo.value.forEach((info) => {
      info.fileContent = baseContent.data;
      console.log(info.fileContent);
    });
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
    pushTestCase(responseObject.battlerNumber, responseObject.testCase);
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
    setTimeout(() => {
      Swal.fire({
        icon: "success",
        title: "Winner code uploaded successfully.",
        showConfirmButton: false,
        timer: 1500,
      });
    }, 4000);
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
      <div style="display: flex; margin-top: 1%">
        <div v-if="!start">
          <button
            v-if="!ready[index] && !readOnlies[index]"
            class="run-btn"
            type="button"
            @click="setReady(index)"
            style="margin-top: 3%; width: 140px;"
          >
            Click to ready
          </button>
          <div
            v-else-if="!ready[index] && readOnlies[index]"
            style="margin-top: 3%"
          >
            Waiting for user ready...
          </div>
          <div v-else style="margin-top: 3%">{{ battleInfo[index].userName }} Ready !</div>
        </div>
        <div v-else-if="start">
          <div style="margin-top: 3%">Battle start !</div>
        </div>
        <button
          class="run-btn"
          v-if="!readOnlies[index] && start && !battleOver"
          @click="runCode(index)"
        >
          Run code
        </button>
      </div>
      <div id="terminal-2" style="color: azure">
        <div
          id="battle-terminal-header"
          class="battle-terminal-content"
          style="text-align: center"
        >
          <div class="test-case content-detail">
            {{ Object.keys(testCase_title)[0] }}
          </div>
          <div class="expect-answer content-detail">
            {{ Object.values(testCase_title)[0] }}
          </div>
          <div class="compile-result">
            {{ testCase_title["Compile result"] }}
          </div>
        </div>
        <div
          id="battl-eterminal-body"
          class="battle-terminal-content"
          v-for="(test, testIndex) in info.testCases"
          :key="testIndex"
        >
          <div class="test-case content-detail return-value">
            {{ Object.keys(test)[0] }}
          </div>
          <div class="expect-answer content-detail return-value">
            {{ Object.values(test)[0] }}
          </div>
          <div class="compile-result return-value">
            {{ test["Compile result"] }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.battle-terminal-content {
  padding: 5px 5px 5px 5px;
  margin: 0px 0px 0px 0px;
  border-bottom: 1px solid rgb(190, 190, 190);
}
.content-detail {
  border-right: 0.5px solid rgb(190, 190, 190);
}
.run-btn {
  border-radius: 8px;
  margin-left: 2%;
}
#battle-terminal-header {
  display: flex;
}
#battl-eterminal-body {
  display: flex;
}
#battl-eterminal-body:nth-child(odd) {
  background-color: rgb(37, 36, 36);
}
#battl-eterminal-body:nth-child(even) {
  background-color: rgb(66, 66, 66);
}
.test-case {
  width: 50%;
}
.expect-answer {
  width: 25%;
}
.compile-result {
  width: 25%;
}
.return-value {
  padding-left: 10px;
}

#mark-down {
  padding: 1% 5% 1% 5%;
  padding-left: 5%;
  padding-right: 5%;
  margin: 2% 5% 0% 5%;
  margin-left: 5%;
  margin-right: 5%;
  background-color: rgb(63, 61, 72);
}
#battle-main-board {
  margin-top: 1%;
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
#terminal-2 {
  background-color: rgb(36, 36, 36);
  color: white;
  position: absolute;
  bottom: 0px;
  width: 100%;
  height: 180px;
  overflow-y: auto;
  top: 380px;
}
</style>
