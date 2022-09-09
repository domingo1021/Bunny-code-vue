<template>
  <div id="battle-main-board">
    <div
      class="battle-editor"
      v-for="(battler, index) in battlers"
      :key="index"
    >
      <BattleSpaceComponent
        :id="`user-${battler.userID}`"
        :atAlt="atAlt"
        :atCtl="atCtl"
        :battler="battler"
        :content="contents[index]"
        :readOnly="readOnlies[index]"
      />
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import io from "socket.io-client";
import BattleSpaceComponent from "../components/BattleSpaceComponent.vue";

const props = defineProps({
  battleID: String,
});

const CLIENT_CATEGORY = {
  visitor: 0,
  otherMember: 1,
  self: 2,
};

const battlers = ref([]);
const readOnlies = ref([true, true]);
const userID = ref(-1);
//default visitor.
const authorization = ref(0);
const message = ref([1, 2, 3]);
const contents = ref([
  {
    fileContent: "",
    codeRecords: [],
  },
  {
    fileContent: "",
    codeRecords: [],
  },
]);

const atAlt = ref(false);
const atCtl = ref(false);

const folderInfo = ref([
  {
    fileNumber: 0,
    fileName: "oneSum.js",
    language: "JS",
    fileContent: "",
    index: 0,
    line: 0,
    codeRecords: [],
    timeBetween: [],
  },
]);

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
  battlers.value = [
    {
      userID: responseObject.battleResponse.irstUserID,
      userName: responseObject.battleResponse.firstUserName,
    },
    {
      userID: responseObject.battleResponse.secondUserID,
      userName: responseObject.battleResponse.secondUserName,
    },
  ];
  userID.value = responseObject.userID;
  authorization.value = responseObject.category;
  if (responseObject.category === 0) {
    readOnlies.value = [true, true];
  } else {
    readOnlies.value = battlers.value.map((battler) => {
      return battler.userID !== responseObject.userID;
    });
  }
  console.log(battlers.value);
});

socket.on("in", (msg) => {
  // console.log("Message", msg)
  message.value.push(msg);
});

onMounted(async () => {
  socket.emit("queryBattler", {
    battleID: props.battleID,
  });
});
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
