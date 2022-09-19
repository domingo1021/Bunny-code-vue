<template>
  <div id="battle-review">
    <Markdown id="mark-down" :source="questionContent" />
    <div>
      <div id="winner-profile">
        <UserProfileComponent :userInfo="userInfo" />
      </div>
      <div id="winner-editor">
        <textarea
          :value="winnerCode"
          :id="`battle-editor`"
          cols="30"
          rows="10"
        ></textarea>
      </div>
    </div>
 
  </div>
</template>

<script setup>
import Socket from "../socket";
import { onBeforeMount, onBeforeUnmount, onMounted, ref, watch } from "vue";
import UserProfileComponent from "../components/UserProfileComponent.vue";
import * as CodeMirror from "codemirror";
import "codemirror/lib/codemirror.css";
import "codemirror/theme/dracula.css";
import "codemirror/mode/javascript/javascript.js";
import Markdown from "vue3-markdown-it";
import "highlight.js/styles/monokai.css";
import axios from "axios";

const props = defineProps({
  battleID: String,
  socket: Socket,
  userID: Number,
});
const emits = defineEmits(["setUserID"]);

const battleName = ref("");
const watchCount = ref(0);

// winner profile (包含圖片...);
const userInfo = ref({});

// winner code
const winnerCode = ref("");

// question_name, question_url;
const questionName = ref("");
const questionContent = ref("");
const questionLevel = ref(0);
const answer = ref("");
const questionConfig = {
  0: "簡單",
  1: "中等",
  2: "困難",
};

let editor = null;

onBeforeMount(() => {
  if (!props.socket) {
    return;
  }
  props.socket.socketEmit("getWinnerData", {
    battleID: props.battleID,
  });
  props.socket.socketOn("winnerData", async (winnerData) => {
    console.log("Winner data: ", winnerData);
    battleName.value = winnerData.battleName;
    watchCount.value = winnerData.watchCount;
    const winnerCodeResponse = await axios.get(winnerData.winnerURL);
    winnerCode.value = winnerCodeResponse.data;
    const questionContentResponse = await axios.get(winnerData.questionURL);
    questionContent.value = questionContentResponse.data;
    questionLevel.value = questionConfig[winnerData.level];
    questionName.value = winnerData.questionName;
    answer.value = winnerData.answer;
    userInfo.value = {
      userID: winnerData.winnerID,
      userName: winnerData.userName,
      email: winnerData.email,
      profile: winnerData.profile,
      picture: winnerData.picture,
      userLevel: winnerData.userLevel,
    };
    //TODO: set question content and question title;
    //TODO: set winner User Info data.
    //TODO: set winner code.
  });
});

watch(winnerCode, () => {
  editor.getDoc().setValue(winnerCode.value);
});

onMounted(() => {
  editor = CodeMirror.fromTextArea(document.getElementById(`battle-editor`), {
    value: winnerCode.value,
    lineNumbers: true,
    identUnit: 2,
    autofocus: true,
    readOnly: true,
    indentWithTab: true,
    cursorHeight: 0,
    tabSize: 2,
    autocorrect: true,
    theme: "dracula",
    mode: "javascript",
  });
});

onBeforeUnmount(() => {
  props.socket.socketOff("winnerData");
});
</script>

<style>
#mark-down {
  padding-top: 3vh;
  padding-left: 5%;
  padding-right: 5%;
  margin-left: 5%;
  margin-right: 5%;
  font-size: 0.8rem;
  min-height: 100px;
  overflow: hidden;
  /* height: 60vh; */
  /* width: 30vw; */
  background-color: rgb(63, 61, 72);
}
#winner-profile {
  margin-top: 3%;
  left: -30vw;
}
#winner-editor{
  position: absolute;
  top: 0%;
  right: 5%;
  width: 600px;
}
</style>
