<template>
  <main>
    <div id="user-battle-detail">
      <div
        id="search-battle-area"
        @keyup.enter="searchBattle"
        style="display: flex !important"
      >
        <input
          id="search-input-area"
          type="text"
          placeholder="Search battle .."
          v-model="battleKeyword"
        />
        <select name="" id="type-selector" v-model="searchType">
          <option value="" disabled selected>Search by</option>
          <option :value="'battle'">Battle name</option>
          <option :value="'user'">User name</option>
          <option :value="'question'">Battle question</option>
        </select>
        <select name="" id="status-selector" v-model="currentStatus">
          <option value="" disabled selected>Battle status</option>
          <option :value="'still'">Still battling</option>
          <option :value="'finished'">Finished</option>
        </select>
        <div id="new-battle" v-if="props.userID !== -1 && props.socket">
          <button
            type="button"
            id="new-battle-btn"
            class="launch-btn"
            data-bs-toggle="modal"
            data-bs-target="#battleModal"
          >
            <svg
              aria-hidden="true"
              height="20"
              viewBox="0 0 16 16"
              version="1.1"
              width="20"
              data-view-component="true"
              class="octicon octicon-repo"
              style="
                filter: invert(98%) sepia(4%) saturate(737%) hue-rotate(258deg)
                  brightness(117%) contrast(100%);
              "
            >
              <path
                fill-rule="evenodd"
                d="M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 110-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.495 2.495 0 012 11.5v-9zm10.5-1V9h-8c-.356 0-.694.074-1 .208V2.5a1 1 0 011-1h8zM5 12.25v3.25a.25.25 0 00.4.2l1.45-1.087a.25.25 0 01.3 0L8.6 15.7a.25.25 0 00.4-.2v-3.25a.25.25 0 00-.25-.25h-3.5a.25.25 0 00-.25.25z"
              ></path>
            </svg>
            <div style="margin-left: 5%; font-weight: bold; margin-bottom: 2px">
              New
            </div>
          </button>
          <div
            class="modal fade"
            id="battleModal"
            tabindex="-1"
            role="dialog"
            aria-labelledby="myModalLabel"
            aria-hidden="true"
          >
            <div class="modal-dialog" role="document">
              <div class="modal-content">
                <div class="modal-header text-center">
                  <h4 class="modal-title w-100 font-weight-bold">
                    Create Battle
                  </h4>
                  <button
                    type="button"
                    class="close btn btn-indigo"
                    data-bs-dismiss="modal"
                    data-dismiss="modal"
                    aria-label="Close"
                    style="position: absolute; right: 30px"
                  >
                    <span aria-hidden="true">&times;</span>
                  </button>
                </div>
                <div class="modal-body mx-3">
                  <div class="md-form mb-4" style="display: flex">
                    <label
                      class="label-header"
                      data-error="wrong"
                      data-success="right"
                      for="form3"
                      >Battle name</label
                    >
                    <input
                      type="text"
                      id="form3"
                      class="form-control validate"
                      v-model="battleName"
                    />
                  </div>
                  <div class="warning" v-if="battleName.length > 29">
                    battle name length too long.
                  </div>
                  <div class="md-form mb-4" style="display: flex">
                    <i class="fas fa-envelope prefix grey-text"></i>
                    <div style="margin-right: 15px">
                      <input
                        type="radio"
                        id="easy"
                        name="drone"
                        value="0"
                        v-model="battleLevel"
                      />
                      <label for="easy">Easy</label>
                    </div>
                    <div>
                      <input
                        type="radio"
                        id="middle"
                        name="drone"
                        value="1"
                        v-model="battleLevel"
                      />
                      <label for="middle">Medium</label>
                    </div>
                    <div>
                      <input
                        type="radio"
                        id="hard"
                        name="drone"
                        value="2"
                        v-model="battleLevel"
                      />
                      <label for="hard">Hard</label>
                    </div>
                  </div>
                </div>
                <div class="modal-footer d-flex justify-content-center">
                  <button
                    id="valid-btn"
                    class="btn btn-indigo"
                    data-bs-dismiss="modal"
                    @click="inviteBattle"
                    v-if="buttonClickable"
                  >
                    Submit <i class="fas fa-paper-plane-o ml-1"></i>
                  </button>
                  <button id="invalid-btn" class="btn btn-indigo" v-else>
                    Submit
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div id="battle-card-long" v-if="battleDisplayed.length !== 0">
        <div
          clsss="card"
          style="
            display: flex;
            border-top: 1px solid rgba(189, 189, 189, 0.5);
            padding: 4% 2% 5% 2%;
          "
          v-for="(battle, index) in battleDisplayed"
          :key="index"
        >
          <div class="card-body battle-card-detail" style="width: 40%">
            <h5 class="card-title" style="display: flex">
              <div id="battle-title" @click="renderPath(index)">
                {{ battle.battleName }}
              </div>
              <div
                id="battle-status"
                style="
                  margin-left: 7%;
                  padding: 0% 1.5% 0% 1.5%;
                  border: 0.5px solid rgb(100, 100, 100);
                  border-radius: 20px;
                "
              >
                <span
                  v-if="battle.isFinish"
                  id="finish-battle-span"
                  class="battle-status-span"
                  >Finished</span
                >
                <span v-else id="still-battling-span" class="battle-status-span"
                  >Still battling</span
                >
              </div>
            </h5>
            <p id="battle-description" class="card-text">
              {{ battle.questionName }}
            </p>
            <div style="display: flex; margin-top: 2%">
              <svg
                id="watch-icon"
                xmlns="http://www.w3.org/2000/svg"
                width="23"
                height="23"
                fill="currentColor"
                class="bi bi-eye-fill"
                viewBox="0 0 16 16"
              >
                <path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z" />
                <path
                  d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8zm8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z"
                />
              </svg>
              <div style="margin: 0px 0px 0px 10px; font-size: 1rem">
                {{ battle.watchCount }}
              </div>
            </div>
          </div>
          <div id="battle-content" style="height: 0px">
            <div>
              <div class="flex-box">
                <div>
                  <div style="position: relative; width: 0; height: 0">
                    <div
                      class="first-win"
                      v-if="battle.firstUserID === battle.winnerID"
                    >
                      勝
                    </div>
                  </div>
                  <img :src="battle.firstUserPicture" alt="picture-1" />
                  <div class="name">{{ battle.firstUserName }}</div>
                </div>
                <div style="align-self: center; font-size: 1.5rem">v.s.</div>
                <div>
                  <div style="position: relative; width: 0; height: 0">
                    <div
                      class="second-win"
                      v-if="battle.secondUserID === battle.winnerID"
                    >
                      勝
                    </div>
                  </div>
                  <img :src="battle.secondUserPicture" alt="picture-1" />
                  <div class="name">{{ battle.secondUserName }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, onBeforeMount, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import axios from "axios";
import Socket from "../socket";
import BattleCardComponent from "../components/BattleCardComponent.vue";
import Swal from "sweetalert2";

const props = defineProps({
  userID: Number,
  socket: Socket,
});
const emits = defineEmits(["setUserID"]);
const productionServer = "https://domingoos.store";
const localhostServer = "http://localhost:3000";

const router = useRouter();
const route = useRoute();
// the battles.
const finishBattles = ref([]);
const stillBattles = ref([]);
const battleDisplayed = ref([]);

// search battle
const battleKeyword = ref("");
const searchType = ref("");
const currentStatus = ref("");
const currentPage = ref(1);
if (+route.query.paging) {
  currentPage.value = +route.query.paging;
}

// create battle
const battleName = ref("");
const battleLevel = ref(0);
const buttonClickable = ref(false);

function inviteBattle() {
  if (!props.socket) {
    return;
  }
  axios
    .get(`${productionServer}/api/1.0/battle/${battleName.value}`)
    .then(() => {
      props.socket.socketEmit("inviteBattle", {
        battleName: battleName.value,
        battleLevel: battleLevel.value,
      });
    })
    .catch((error) => {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: error.response.data.msg,
      });
    });
  //TODO: set 20 秒鐘 unclickable, 限制使用者頻繁送出請求
}

function goBattle(status, index) {
  if (status === "finished") {
    router.push({
      name: "battle_review",
      params: { battleID: finishBattles.value[index].battleID },
    });
  } else if (status === "still") {
    router.push({
      name: "battle",
      params: { battleID: stillBattles.value[index].battleID },
    });
  }
}

async function searchBattle() {
  const battleResponse = await axios.get(
    `${productionServer}/api/1.0/battle?keyword=${battleKeyword.value}&status=${
      currentStatus.value
    }&type=${searchType.value}&paging=${currentPage.value - 1}`
  );
  battleDisplayed.value = battleResponse.data.data;
  console.log("Search response: ", battleDisplayed.value);
}

function renderPath(index) {
  if (currentStatus.value === "finished") {
    router.push({
      name: "battle_review",
      params: { battleID: battleDisplayed.value[index].battleID },
    });
  } else {
    router.push({
      name: "battle",
      params: { battleID: battleDisplayed.value[index].battleID },
    });
  }
}

function prevPage() {
  router.push({
    name: "battle_home",
    query: {
      paging: `${currentPage.value - 1}`,
    },
  });
}
async function nextPage() {
  router.push({
    name: "battle_home",
    query: {
      paging: `${currentPage.value + 1}`,
    },
  });
}

onBeforeMount(async () => {
  await searchBattle();
});

watch(battleName, () => {
  if (battleName.value.length > 29 || battleName.value.length === 0) {
    buttonClickable.value = false;
  } else {
    buttonClickable.value = true;
  }
});

watch(
  () => route.query.paging,
  async () => {
    currentPage.value = +route.query.paging;
    await searchBattle();
  }
);
</script>

<style scoped>
.flex-box {
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  margin-right: 8%;
  margin-left: 10%;
}

#valid-btn {
  background-color: rgb(225, 244, 204);
  color: rgb(36, 34, 34);
}

#invalid-btn {
  background-color: rgb(255, 100, 100);
  color: azure;
}

.battle-title {
  margin-left: 5%;
  padding-right: 5%;
  margin-right: 5%;
  font-weight: bold;
  font-size: 2rem;
  width: 100vw;
  text-align: left;
}

.flex-item {
  background-color: rgb(161, 180, 201);
  flex-grow: 1;
  flex-basis: 40%;
  height: 30%;
  padding-top: 10px;
}

.label-header {
  width: 200px;
  top: 5px;
}

#battleModal {
  color: rgb(0, 0, 0);
}

.launch-btn {
  margin-top: 3%;
  padding-right: 1%;
  padding-left: 1%;
  background-color: rgb(97, 94, 94);
  border-radius: 3px;
  color: #f6f6f6;
  border: 0.5px solid #f6f6f6;
  right: 5%;
}

.launch-btn:hover {
  background-color: rgb(154, 143, 143);
  outline: none;
}
.launch-btn:focus {
  outline: none;
}

.warning {
  top: -20px;
  color: rgb(255, 100, 100);
}

.battle-title {
  width: 150px;
}

/* The search field */
#myInput {
  box-sizing: border-box;
  background-image: url("searchicon.png");
  background-position: 14px 12px;
  background-repeat: no-repeat;
  font-size: 16px;
  padding: 14px 20px 12px 45px;
  border: none;
  border-bottom: 1px solid #ddd;
}

#myInput:focus {
  outline: 1px solid #ddd;
}

/* The container <div> - needed to position the dropdown content */
.dropdown {
  display: flex;
}

/* Dropdown Content (Hidden by Default) */
.dropdown-content {
  display: block;
  position: absolute;
  background-color: #f6f6f6;
  min-width: 230px;
  border: 1px solid #ddd;
  z-index: 1;
}

/* Links inside the dropdown */
.dropdown-content a {
  color: black;
  padding: 12px 16px;
  text-decoration: none;
  display: block;
}

/* Change color of dropdown links on hover */
.dropdown-content a:hover {
  background-color: #f1f1f1;
}

#user-battle-detail {
  margin: 5% 10% 5% 5%;
  width: 90%;
}

#battle-card-long {
  width: 100%;
}

#battle-content {
  width: 50%;
  text-align: left;
  margin-left: 5%;
  margin-right: 5%;
}

#valid-btn {
  background-color: rgb(225, 244, 204);
  color: rgb(36, 34, 34);
}

#invalid-btn {
  background-color: rgb(255, 100, 100);
  color: azure;
}

.label-header {
  width: 200px;
  top: 5px;
}

.warning {
  top: -20px;
  color: rgb(255, 100, 100);
}

#search-battle-area {
  display: flex;
  height: 60px;
  margin-bottom: 3%;
}

#search-input-area {
  border: 0.5px solid rgb(98, 100, 123);
  color: rgb(255, 255, 255);
  background-color: #161b22;
  width: 50%;
  padding: 2%;
  padding-left: 3%;
  margin-bottom: 2%;
  border-radius: 10px;
  font-size: 1.25rem;
}

#search-input-area:focus {
  outline: none;
  background: none;
}

select {
  width: 150px;
  height: 50px;
  margin-left: 15px;
  color: rgb(255, 255, 255);
  background-color: #6a6b6c;
  font-weight: bold;
  font-size: 1rem;
  text-align: center;
  border: 0px;
  border-radius: 10px;
}
select:focus {
  outline: none;
}

#new-battle {
  position: relative;
  display: flex;
  width: 25%;
  height: 50px;
  margin-left: 3.5%;
  right: 15px;
  bottom: 9px;
  margin-bottom: 5px;
  color: rgb(36, 34, 34);
}

#new-battle-btn {
  font-size: 1.25rem;
  font-weight: bold;
  height: 100%;
  display: flex;
  justify-content: center;
  text-align: center;
  align-items: center;
  border-radius: 10px;
  width: 40%;
  color: #f1f1f1;
  background-color: #30813b;
  border: 0px;
  font-weight: 500;
  line-height: 20px;
}

#new-battle-btn:hover {
  background-color: #389645;
}

#battle-title {
  color: #58a6ff;
  font-size: 2.2rem;
  font-weight: bold;
  /* text-decoration: underline; */
  bottom: 4px;
  padding-bottom: 2px;
  border-bottom: 2px solid #58a6ff;
}

#battle-title:hover {
  cursor: pointer;
}

#battle-status {
  display: flex;
}

#watch-icon {
  filter: invert(20%) sepia(93%) saturate(1847%) hue-rotate(196deg)
    brightness(105%) contrast(101%);
}

.battle-status-span {
  align-self: center;
  color: rgb(173, 173, 173);
  font-size: 1rem;
  text-align: center;
  font-weight: bold;
  margin-left: 4%;
}
#still-battling-span {
  width: 110px;
}
#finish-battle-span {
  width: 70px;
}

#battle-description {
  margin-top: 2%;
  font-size: 1.3rem;
  color: rgb(150, 150, 150);
}

#page-render {
  font-size: 1.5rem;
  margin: -5px 0px 30px 0px;
}

.user-page-btn {
  cursor: pointer;
  color: rgb(255, 255, 255);
  background: none;
  border: 0px;
  margin-right: 3%;
}

.user-page-btn:hover {
  border: 1px solid #ddd;
  border-radius: 10px;
}

.new-battle-label {
  margin-left: 5px;
}

#no-battles {
  text-align: center;
  font-size: 2rem;
  color: rgb(148, 147, 147);
  margin: 25px 0px 50px 0px;
}

#name-flex {
  display: flex;
  justify-content: center;
  /* padding-left:30px */
}
.name{
  margin-top: 5%;
  text-align: center;
  font-size: 1.5rem;
}

.first-win {
  z-index: 99;
  position: absolute;
  top: 5px;
  left: 150px;
  background-color: rgb(228, 62, 62);
  padding: 2%;
  border-radius: 50%;
  height: 25px;
  width: 25px;
  text-align: center;
}

.second-win {
  z-index: 99;
  position: absolute;
  top: 5px;
  left: 150px;
  background-color: rgb(228, 62, 62);
  padding: 2%;
  border-radius: 50%;
  height: 25px;
  width: 25px;
  text-align: center;
}
</style>
