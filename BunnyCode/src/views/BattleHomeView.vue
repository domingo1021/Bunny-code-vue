<template>
  <div v-if="props.userID !== -1 && props.socket">
    <div>Create battle</div>
    <button
      type="button"
      class="btn btn-primary"
      data-bs-toggle="modal"
      data-bs-target="#battleModal"
    >
      Create Battle
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
            <h4 class="modal-title w-100 font-weight-bold">Create Battle</h4>
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
            <div class="md-form mb-4" style="display: flex">
              <!-- <i class="fas fa-user prefix grey-text"></i> -->
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
                <label for="easy">簡單</label>
              </div>
              <div>
                <input
                  type="radio"
                  id="middle"
                  name="drone"
                  value="1"
                  v-model="battleLevel"
                />
                <label for="middle">中等</label>
              </div>
              <div>
                <input
                  type="radio"
                  id="hard"
                  name="drone"
                  value="2"
                  v-model="battleLevel"
                />
                <label for="hard">困難</label>
              </div>
            </div>
            <!-- <div class="md-form mb-4" style="display: flex">
              <div class="dropdown">
                <div id="myDropdown">
                  <label for="compotition-date" class="battle-title"
                    >Invite battler: &nbsp;</label
                  >
                  <input
                    type="text"
                    placeholder="Search.."
                    id="myInput"
                    v-model="searchBattler"
                    @keyup="filterFunction"
                  />
                </div>
              </div>
            </div> -->
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
  <div>
    <div>精彩回顧..</div>
    <div
      v-for="(finish, index) in finishBattles"
      :key="index"
      @click="goBattle('finish', index)"
    >
      {{ finish.battleName }}
    </div>
  </div>
  <div>
    <div>現正熱映中..</div>
    <div
      v-for="(still, index) in stillBattles"
      :key="index"
      @click="goBattle('still', index)"
    >
      {{ still.battleName }}
    </div>
  </div>
</template>

<script setup>
import { ref, onBeforeMount, watch } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import Socket from "../socket";

const props = defineProps({
  userID: Number,
  socket: Socket,
});

const router = useRouter();
const finishBattles = ref([]);
const stillBattles = ref([]);

const battleName = ref("");
const battleLevel = ref(0);

const buttonClickable = ref(false);

function inviteBattle() {
  if (!props.socket) {
    return;
  }
  //TODO: set 20 秒鐘 unclickable, 限制使用者頻繁送出請求
  props.socket.socketEmit("inviteBattle", {
    battleName: battleName.value,
    battleLevel: battleLevel.value,
  });
}

function goBattle(category, index) {
  if (category === "finish") {
    router.push({
      name: "battle_review",
      params: { battleID: finishBattles.value[index].battleID },
    });
  } else if (category === "still") {
    router.push({
      name: "battle",
      params: { battleID: stillBattles.value[index].battleID },
    });
  }
}

onBeforeMount(async () => {
  const allBattles = await axios.get("https://domingoos.store/api/1.0/battle");
  // const allBattles = await axios.get("http://localhost:3000/api/1.0/battle");
  finishBattles.value = allBattles.data.data.finish;
  stillBattles.value = allBattles.data.data.still;
});

watch(battleName, () => {
  if (battleName.value.length > 29 || battleName.value.length === 0) {
    buttonClickable.value = false;
  } else {
    buttonClickable.value = true;
  }
});
</script>

<style scoped>
#project-content {
  text-align: center;
  margin-left: 10%;
  margin-right: 10%;
}
#flex-box {
  display: flex;
  margin: auto;
  /* justify-content: center; */
  /* align-self: center; */
  flex-wrap: wrap;
  flex-direction: row;
  max-width: 1200px;
}

#valid-btn {
  background-color: rgb(225, 244, 204);
  color: rgb(36, 34, 34);
}

#invalid-btn {
  background-color: rgb(255, 100, 100);
  color: azure;
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
</style>
