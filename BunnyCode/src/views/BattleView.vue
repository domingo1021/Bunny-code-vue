<script setup>
import { onBeforeRouteLeave } from "vue-router";
import { onBeforeMount, onBeforeUnmount, ref } from "vue";
import axios from "axios";
import Markdown from "vue3-markdown-it";
import BattleSpaceComponent from "../components/BattleSpaceComponent.vue";
import "highlight.js/styles/monokai.css";
import Socket from "../socket";
import Swal from "sweetalert2";
import router from "../router";

const props = defineProps({
  userID: Number,
  battleID: String,
  socket: Socket,
  terminateSocket: Function,
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
const countDown = ref(2.5);
const userID = ref(-1);
const questionName = ref();
const questionURL = ref();
const questionContent = ref("");
const boardContent = ref("");
const baseContent = ref("");
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
    compileRunning: false,
    codeRecords: [],
    timeBetween: [],
    terminalResult: [],
    testCases: [],
    compileChance: 3,
  },
  {
    battlerNumber: 1,
    userID: 0,
    userName: "",
    fileContent: "",
    line: 0,
    index: 0,
    compileRunning: false,
    codeRecords: [],
    timeBetween: [],
    terminalResult: [],
    testCases: [],
    compileChance: 3,
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

//emit function
function updateCurrCodes(emitObject) {
  battleInfo.value[emitObject.battlerNumber].fileContent = emitObject.code;
  if (!start.value) {
    return;
  }
  console.log(battleInfo.value[emitObject.battlerNumber].fileContent);
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

function countDownTimer() {
  if (countDown.value > 0) {
    setTimeout(() => {
      countDown.value = countDown.value - 0.5;
      countDownTimer();
    }, 500);
  }
}

async function runCode(battlerNumber) {
  compiledCode.value = battleInfo.value[battlerNumber].fileContent;
  battleInfo.value[battlerNumber].compileRunning = true;
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
    console.log("response object: ", responseObject);
    battleName.value = responseObject.battleResponse.battleName;
    battleInfo.value[0].userID = responseObject.battleResponse.firstUserID;
    battleInfo.value[0].userName = responseObject.battleResponse.firstUserName;
    battleInfo.value[0].fileContent = responseObject.firstUserObject.codes;
    battleInfo.value[0].compileChance = responseObject.firstUserObject.chance;
    battleInfo.value[1].userID = responseObject.battleResponse.secondUserID;
    battleInfo.value[1].userName = responseObject.battleResponse.secondUserName;
    battleInfo.value[1].fileContent = responseObject.secondUserObject.codes;
    battleInfo.value[1].compileChance = responseObject.secondUserObject.chance;
    questionName.value = responseObject.battleResponse.questionName;
    questionURL.value = responseObject.battleResponse.questionURL;
    userID.value = responseObject.userID;
    authorization.value = responseObject.category;
    if (responseObject.firstUserObject.ready === 0) {
      ready.value[0] = false;
    } else {
      ready.value[0] = true;
    }
    if (responseObject.secondUserObject.ready === 0) {
      ready.value[1] = false;
    } else {
      ready.value[1] = true;
    }
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
    const questionBaseContent = await axios.get(
      responseObject.battleResponse.baseURL
    );
    baseContent.value = questionBaseContent.data;
    const question = await axios.get(questionURL.value);
    questionContent.value = question.data;
    if (ready.value[0] && ready.value[1] && readOnlies.value !== [true, true]) {
      boardContent.value = questionContent.value;
      battleInfo.value.forEach((info, index) => {
        if (readOnlies.value[index]) {
          return;
        }
        info.fileContent = baseContent.value;
        props.socket.socketEmit("newCodes", {
          battleID: props.battleID,
          userID: userID.value,
          newCodes: info.fileContent,
        });
      });
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
    battleInfo.value[responseObject.battlerNumber].compileRunning = false;
    battleInfo.value[responseObject.battlerNumber].compileChance =
      responseObject.compileChance;
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
    countDownTimer();
    setTimeout(() => {
      battleInfo.value.forEach((info) => {
        info.fileContent = baseContent.value;
      });
      start.value = true;
    }, 2500);
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
    await new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve();
      }, 100);
    });
    Swal.fire(
      `<div>${responseObject.winnerName} win the game !!</div> 
      <div>${responseObject.reason}</div>`
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

  props.socket.socketOn("battleTerminate", async (responseObject) => {
    await new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve();
      }, 100);
    });
    Swal.fire(
      `<div>Battle terminated</div><div>${responseObject.reason}</div>`
    );
    battleOver.value = true;
  });

  props.socket.socketOn("battleNotFound", () => {
    router.push({
      name: "battle_review",
      params: {
        battleID: props.battleID,
      },
    });
  });
});

onBeforeRouteLeave((to, from, next) => {
  const readOnly = readOnlies.value[0] && readOnlies.value[1];
  if (start.value === true && !readOnly && props.socket !== undefined) {
    Swal.fire({
      title: "Leaving battle will make you lose the game !",
      text: "You won't be able to revert this !",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, leave the battle",
    }).then((result) => {
      if (result.isConfirmed) {
        next();
      } else {
        next(false);
      }
    });
  } else {
    next();
  }
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
  props.socket.socketOff("battleNotFound");
  props.socket.socketOff("battleTerminate");
});
</script>

<template>
  <div
    class="demo"
    v-if="ready[0] && ready[1] && countDown > 0 && !start"
    style="z-index: 99"
  >
    <div class="demo__colored-blocks">
      <div class="demo__colored-blocks-rotater">
        <div class="demo__colored-block"></div>
        <div class="demo__colored-block"></div>
        <div class="demo__colored-block"></div>
      </div>
      <div class="demo__colored-blocks-inner"></div>
      <div class="demo__text">Ready</div>
    </div>
    <div class="demo__inner">
      <svg class="demo__numbers" viewBox="0 0 100 100">
        <defs>
          <path class="demo__num-path-1" d="M40,28 55,22 55,78" />
          <path
            class="demo__num-join-1-2"
            d="M55,78 55,83 a17,17 0 1,0 34,0 a20,10 0 0,0 -20,-10"
          />
          <path
            class="demo__num-path-2"
            d="M69,73 l-35,0 l30,-30 a16,16 0 0,0 -22.6,-22.6 l-7,7"
          />
          <path class="demo__num-join-2-3" d="M28,69 Q25,44 34.4,27.4" />
          <path
            class="demo__num-path-3"
            d="M30,20 60,20 40,50 a18,15 0 1,1 -12,19"
          />
        </defs>
        <path
          class="demo__numbers-path"
          d="M-10,20 60,20 40,50 a18,15 0 1,1 -12,19 
               Q25,44 34.4,27.4
               l7,-7 a16,16 0 0,1 22.6,22.6 l-30,30 l35,0 L69,73 
               a20,10 0 0,1 20,10 a17,17 0 0,1 -34,0 L55,83 
               l0,-61 L40,28"
        />
      </svg>
    </div>
  </div>
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
        :start="start"
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
            style="margin-top: 3%; width: 140px"
          >
            Click to ready
          </button>
          <div
            v-else-if="!ready[index] && readOnlies[index]"
            style="margin-top: 3%"
          >
            Waiting for user ready...
          </div>
          <div v-else style="margin-top: 3%">
            {{ battleInfo[index].userName }} Ready !
          </div>
        </div>
        <div v-else-if="start && !battleOver">
          <div style="margin-top: 3%">Battle start !</div>
        </div>
        <div v-else-if="battleOver">
          <div style="margin-top: 3%">Battle Over !</div>
        </div>
        <button
          class="run-btn"
          v-if="
            !readOnlies[index] && start && !battleOver && !info.compileRunning
          "
          @click="runCode(index)"
        >
          Run code
        </button>
        <button
          class="run-btn"
          style="background-color: azure"
          v-else-if="
            !readOnlies[index] && start && !battleOver && info.compileRunning
          "
          disabled
        >
          <div
            class="spinner-border text-success"
            role="status"
            style="height: 16px; width: 16px"
          >
            <span class="visually-hidden">Loading...</span>
          </div>
        </button>
      </div>
      <div id="terminal-2" style="color: azure; max-width: 100%">
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
          id="battle-terminal-body"
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

<style scoped>
.battle-terminal-content {
  padding: 5px 5px 5px 5px;
  margin: 0px 0px 0px 0px;
  border-bottom: 1px solid rgb(190, 190, 190);
}
.content-detail {
  border-right: 0.5px solid rgb(190, 190, 190);
}
.run-btn {
  width: 90px;
  border-radius: 8px;
  margin-left: 2%;
}
#battle-terminal-header {
  display: flex;
}
#battle-terminal-body {
  display: flex;
}
#battle-terminal-body:nth-child(odd) {
  background-color: rgb(37, 36, 36);
}
#battle-terminal-body:nth-child(even) {
  background-color: rgb(66, 66, 66);
}
.test-case {
  width: 50%;
}
.expect-answer {
  width: 25%;
}
.compile-result {
  word-break: break-all;
  width: 25%;
  max-width: 25%;
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
  overflow-x: hidden;
  top: 380px;
}

.demo {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 140px;
  height: 140px;
  margin-top: -70px;
  padding: 10px;
  border-radius: 20px;
  transform: translateX(-50%);
}
.demo__colored-blocks {
  overflow: hidden;
  position: absolute;
  left: 50%;
  top: 0;
  width: 140px;
  height: 100%;
  margin-left: -250px;
  padding: 10px;
  border-radius: 20px;
  perspective: 1000px;
  -webkit-animation: demoAnim 4s -1s ease-in-out infinite,
    contAnim 4s -1s infinite;
  animation: demoAnim 4s -1s ease-in-out infinite, contAnim 4s -1s infinite;
}
.demo__colored-blocks-rotater {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  border-radius: inherit;
  -webkit-animation: rotation 1.3s linear infinite;
  animation: rotation 1.3s linear infinite;
}
.demo__colored-blocks-inner {
  overflow: hidden;
  position: relative;
  height: 100%;
  background: #32386d;
  border-radius: inherit;
}
.demo__colored-block {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 300%;
  height: 300%;
  transform-origin: 0 0;
}
.demo__colored-block:nth-child(1) {
  transform: rotate(0deg) skewX(-30deg);
  background-color: #fd3359;
}
.demo__colored-block:nth-child(2) {
  transform: rotate(120deg) skewX(-30deg);
  background-color: #f4d302;
}
.demo__colored-block:nth-child(3) {
  transform: rotate(240deg) skewX(-30deg);
  background-color: #21bdff;
}
.demo__inner {
  overflow: hidden;
  position: relative;
  width: 100%;
  height: 100%;
}

.demo__numbers {
  overflow: visible;
  position: absolute;
  left: 50%;
  top: 50%;
  width: 100px;
  height: 100px;
  margin-left: -50px;
  margin-top: -50px;
}
.demo__numbers-path {
  fill: none;
  stroke-width: 10px;
  stroke: #fff;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 0, 518.055065155;
  stroke-dashoffset: 0;
  -webkit-animation: numAnim 4s -1s ease-in-out infinite;
  animation: numAnim 4s -1s ease-in-out infinite;
  opacity: 0;
}
.demo__text {
  position: absolute;
  left: 50%;
  top: 0;
  width: 500px;
  height: 100%;
  margin-left: -250px;
  text-align: center;
  line-height: 140px;
  font-size: 100px;
  color: #fff;
  text-transform: uppercase;
  letter-spacing: 15px;
  transform: translateX(10px);
  opacity: 0;
  -webkit-animation: hideText 4s -1s 4s infinite;
  animation: hideText 4s -1s 4s infinite;
}
@-webkit-keyframes contAnim {
  0% {
    margin-left: -70px;
    width: 140px;
  }
  100% {
    margin-left: -70px;
    width: 140px;
  }
}

@keyframes contAnim {
  0% {
    margin-left: -70px;
    width: 140px;
  }
  100% {
    margin-left: -70px;
    width: 140px;
  }
}
@-webkit-keyframes numAnim {
  15% {
    stroke-dasharray: 0, 518.055065155;
    stroke-dashoffset: 0;
    opacity: 0;
  }
  25%,
  41% {
    opacity: 1;
    stroke-dasharray: 144.4256591797, 518.055065155;
    stroke-dashoffset: -40;
  }
  53%,
  66% {
    stroke-dasharray: 136.0216217041, 518.055065155;
    stroke-dashoffset: -227.238697052;
  }
  76% {
    stroke-dasharray: 113.4751205444, 518.055065155;
    stroke-dashoffset: -445.8995704651;
  }
  88%,
  100% {
    stroke-dasharray: 72.1554946899, 518.055065155;
    stroke-dashoffset: -445.8995704651;
  }
  92% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}

@keyframes numAnim {
  15% {
    stroke-dasharray: 0, 518.055065155;
    stroke-dashoffset: 0;
    opacity: 0;
  }
  25%,
  41% {
    opacity: 1;
    stroke-dasharray: 144.4256591797, 518.055065155;
    stroke-dashoffset: -40;
  }
  53%,
  66% {
    stroke-dasharray: 136.0216217041, 518.055065155;
    stroke-dashoffset: -227.238697052;
  }
  76% {
    stroke-dasharray: 113.4751205444, 518.055065155;
    stroke-dashoffset: -445.8995704651;
  }
  88%,
  100% {
    stroke-dasharray: 72.1554946899, 518.055065155;
    stroke-dashoffset: -445.8995704651;
  }
  92% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}
@-webkit-keyframes rotation {
  to {
    transform: rotate(360deg);
  }
}
@keyframes rotation {
  to {
    transform: rotate(360deg);
  }
}
@-webkit-keyframes demoAnim {
  0%,
  43% {
    opacity: 1;
    display: block;
    border-radius: 50%;
    transform: rotate(360deg);
  }
  52%,
  65% {
    opacity: 1;
    border-radius: 0;
    transform: rotate(720deg);
  }
  78%,
  90% {
    opacity: 1;
    border-radius: 50%;
    transform: rotate(1080deg);
  }
  92% {
    opacity: 0;
  }
}
@keyframes demoAnim {
  0%,
  43% {
    opacity: 1;
    display: block;
    border-radius: 50%;
    transform: rotate(360deg);
  }
  52%,
  65% {
    opacity: 1;
    border-radius: 0;
    transform: rotate(720deg);
  }
  78%,
  90% {
    opacity: 1;
    border-radius: 50%;
    transform: rotate(1080deg);
  }
  92% {
    opacity: 0;
  }
}
@-webkit-keyframes hideText {
  15%,
  100% {
    opacity: 1;
  }
  20% {
    opacity: 0;
  }
}
@keyframes hideText {
  15%,
  100% {
    opacity: 1;
  }
  20% {
    opacity: 0;
  }
}
</style>
