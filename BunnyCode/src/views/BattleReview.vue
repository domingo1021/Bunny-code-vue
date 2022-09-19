<template>
  <UserProfileComponent :userInfo="userInfo" />
  <Markdown id="mark-down" :source="questionContent" />
  <textarea
    :value="winnerCode"
    :id="`battle-editor`"
    cols="30"
    rows="10"
  ></textarea>
</template>

<script setup>
import Socket from "../socket";
import { onBeforeMount, onBeforeUnmount, onMounted, ref } from "vue";
import UserProfileComponent from "../components/UserProfileComponent.vue";
import * as CodeMirror from "codemirror";
import "codemirror/lib/codemirror.css";
import "codemirror/theme/dracula.css";
import "codemirror/mode/javascript/javascript.js";
import Markdown from "vue3-markdown-it";
import "highlight.js/styles/monokai.css";

const props = defineProps({
  battleID: String,
  socket: Socket,
  userID: Number,
});
const emits = defineEmits(["setUserID"]);

// winner profile (包含圖片...);
const userInfo = ref();

// winner code
const winnerCode = ref("console.log('hello world !')")

// question_name, question_url;
const questionContent = ref("Hello world !");

let editor = null;

onBeforeMount(() => {
  if (!props.socket) {
    return;
  }
  props.socket.socketEmit("getWinnerData");
  props.socket.socketOn("winnerData", () => {
    //TODO: set winner related data.
  });
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
})

onBeforeUnmount(() => {
  props.socket.socketOff("winnerData");
});
</script>

<style>
#mark-down {
  padding-left: 5%;
  padding-right: 5%;
  margin-left: 5%;
  margin-right: 5%;
  background-color: rgb(63, 61, 72);
}
</style>
