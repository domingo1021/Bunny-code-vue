<template>
  <header>
    <nav id="top-navbar">
      <div class="flex-container">
        <div class="flex-container-2">
          <!-- <div>Bunny code</div> -->
          <RouterLink
            to="/"
            class="nav-item link left-item"
            @click="updateView('home')"
            >
            <img
              src="@/assets/logo4.png"
              alt="login-icon"
              style="width: 30px; margin-bottom: 5px"
            />
            </RouterLink
          >
          <RouterLink
            to="/workspace"
            class="nav-item link left-item"
            @click="updateView('code')"
          >
            Workspace
          </RouterLink>
          <RouterLink
            to="/battle"
            class="nav-item link left-item"
            @click="updateView('battle')"
            >Battle valleys</RouterLink
          >
        </div>
        <div class="right-flex">
          <RouterLink
            class="nav-item link"
            to="/login"
            @click="updateView('user')"
          >
            <img
              src="@/assets/login.png"
              alt="login-icon"
              style="width: 35px; margin-bottom: 5px"
            />
          </RouterLink>
          <!-- <NotificationView :socket="socket" /> -->
          <!-- <div class="nav-item">個人資訊</div> -->
          <SearchComponent :socket="socket" />
        </div>
      </div>
    </nav>
  </header>
  <body>
    <RouterView
      :userID="userID"
      :socket="socket"
      :key="view"
      @setUserID="setUserID"
    />
    <div id="battle-invitation">
      <div
        class="modal fade"
        id="exampleModal"
        ref="modalObject"
        tabindex="-1"
        role="dialog"
        aria-labelledby="myModalLabel"
        aria-hidden="false"
      >
        <div class="modal-dialog" role="document">
          <div class="modal-content">
            <div class="modal-header text-center">
              <h4 class="modal-title w-100 font-weight-bold">BATTLE BOOM !!</h4>
              <button
                type="button"
                class="close btn btn-indigo"
                data-bs-dismiss="modal"
                data-dismiss="modal"
                aria-label="Close"
              >
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div class="modal-body mx-3">
              <div>Battle Name: {{ modalBattleName }}</div>
              <div>Battle Level: {{ modalBattleLevel }}</div>
              <div>Battle Competitor: {{ modalFirstUserName }}</div>
            </div>
            <div class="modal-body mx-3" style="text-align: center">
              是否要接受挑戰？
            </div>
            <div style="display: flex; justify-content: center">
              <button class="confirm-btn" @click="acceptBattle">是</button>
              <button class="confirm-btn" @click="hideModal">否</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </body>
</template>

<script setup>
import Socket from "./socket";
import { RouterLink, RouterView, useRouter } from "vue-router";
import SearchComponent from "./components/SearchComponent.vue";
import { ref, onMounted, onUnmounted, watch } from "vue";
import axios from "axios";
import io from "socket.io-client";
import NotificationView from "./views/NotificationView.vue";
import { createToaster } from "@meforma/vue-toaster";
// import BattleLaunchComponent from "./components/BattleLaunchComponent.vue";
import { Modal } from "bootstrap";
import BattleLaunchComponent from "./components/BattleLaunchComponent.vue";

let myModal;
const modalObject = ref(null);
const localhostServer = "http://localhost:3000";
const productionServer = "https://domingoos.store";
const productionSocket = "wss://domingoos.store";
const jwt = localStorage.getItem("jwt");
const isLogin = ref(false);
const userID = ref(-1);
let socket = ref();
const view = ref("home");
const router = useRouter();
const battleName = ref();
const battleLevel = ref();
const firstUserID = ref();
const firstUserName = ref();
const targetSocketID = ref();
const modalBattleName = ref();
const modalBattleLevel = ref();
const modalFirstUserID = ref();
const modalFirstUserName = ref();
const modalTargetSocketID = ref();

const battleLevelConfig = {
  0: "Easy",
  1: "Medium",
  2: "Hard",
};

function showModal() {
  myModal.show();
}
function hideModal() {
  myModal.hide();
}

function setUserID(emitUserID) {
  userID.value = emitUserID;
}

const toaster = createToaster({
  position: "top-right",
  duration: 10000,
  maxToasts: 1,
  onClick: () => {
    alert("接受挑戰");
    modalBattleName.value = battleName.value;
    modalBattleLevel.value = battleLevel.value;
    modalFirstUserID.value = firstUserID.value;
    modalFirstUserName.value = firstUserName.value;
    modalTargetSocketID.value = targetSocketID.value;
    showModal();
  },
});

watch(userID, () => {
  initiateSocket();
});

axios({
  method: "get",
  url: productionServer + "/api/1.0/user/auth",
  // url: localhostServer + "/api/1.0/user/auth",
  headers: {
    Authorization: `Bearer ${jwt}`,
  },
})
  .then((response) => {
    isLogin.value = true;
    userID.value = response.data.data;
    initiateSocket();
  })
  .catch((error) => {
    console.log("error message: ", error.response.data.msg);
    isLogin.value = false;
  });

function initiateSocket() {
  socket.value = new Socket(
    io(productionSocket, {
      // io(localhostServer, {
      auth: (cb) => {
        cb({ token: `Bearer ${jwt}` });
      },
      path: "/api/socket/",
    })
  );
  socket.value.socketOn("userInvite", (emitObject) => {
    console.log("invite user: ", emitObject);
    battleName.value = emitObject.name;
    battleLevel.value = battleLevelConfig[emitObject.level];
    firstUserID.value = emitObject.firstUserID;
    firstUserName.value = emitObject.firstUserName;
    targetSocketID.value = emitObject.socketID;
    toaster.success(
      `<div>!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!</div>
        <div>User ${emitObject.firstUserName} launch ${emitObject.name}</div>
        <div>!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!</div>`
    );
  });
  socket.value.socketOn("battleFailed", (msg) => {
    alert(msg);
  });
  socket.value.socketOn("battleCreated", (emitObject) => {
    router.push({
      name: "battle",
      params: { battleID: emitObject.battleID },
    });
  });
  socket.value.socketOn("disconnect", (reason) => {
    console.log(`Disconnecting with reason: ${reason}`);
    alert("disconnected");
    router.push("/login");
  });
}

async function updateView(viewPage) {
  view.value = viewPage;
}

function acceptBattle() {
  if (socket.value) {
    socket.value.socketEmit("acceptBattle", {
      socketID: modalTargetSocketID.value,
      firstUserID: modalFirstUserID.value,
    });
  }
  myModal.hide();
}

onMounted(() => {
  myModal = new Modal(modalObject.value, {});
});

onUnmounted(() => {
  if (!socket.value) {
    return;
  }
  socket.value.socketOff("userInvite");
});
</script>

<style scoped>
/* nav a.router-link-exact-active {
  color: var(--color-text);
} */
/* nav a.router-link-exact-active:hover {
  background-color: transparent;
}
nav a {
  display: inline-block;
  padding: 0 1rem;
  border-left: 1px solid var(--color-border);
} */

.link {
  color: rgb(255, 255, 255);
}

nav a:first-of-type {
  border: 0;
}

#top-navbar {
  top: 0;
  left: 0;
  position: fixed;
  z-index: 99;
  width: 100vw;
  height: 50px;
  background-color: #161b22;
  /* border-bottom: 40px solid #2c2c2c; */
}
.flex-container {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  padding-top: 8px;
  padding-left: 30px;
  padding-right: 50px;
}

.flex-container-2 {
  margin-top: 5px;
  display: flex;
  flex-direction: row;
}

.flex-container-2:hover {
  cursor: pointer;
}

.right-flex {
  display: flex;
  flex-direction: row-reverse;
  margin-top: auto;
}

.nav-item {
  padding-left: 15px;
}

.left-item {
  padding-right: 10px;
  border-right: 0.5px solid rgb(255, 255, 255);
}

header + body {
  padding-top: 50px;
}

#battle-invitation {
  left: 100px;
  background-color: aliceblue;
  color: rgb(18, 18, 18);
  position: absolute;
  top: 50px;
  height: 500px;
}

.confirm-btn {
  margin: 5%;
}
</style>
