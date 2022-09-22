<template>
  <div v-if="props.userID !== -1 && props.socket">
    <div style="text-align: right;">
      <button
        type="button"
        id="battle-btn"
        class="launch-btn"
        data-bs-toggle="modal"
        data-bs-target="#battleModal"
      >
      Launch battle
        <!-- <img
          id="battle-btn"
          src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSJJXoY_VjsNh2vhczR8q8KsHHmYucn6TbuVQ&usqp=CAU"
          alt=""
        /> -->
      </button>
    </div>
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
              style="position: absolute; right: 30px;"
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
  <main>
    <div id="project-content">
      <div>
        <div class="battle-field">
          <h3 class="battle-title">Finished</h3>
          <div id="flex-box">
            <div
              clsss="flex-item"
              style="margin: 1%"
              v-for="(finish, index) in finishBattles"
              :key="index"
            >
              <BattleCardComponent
                :battleObject="finish"
                @click="goBattle('finish', index)"
              />
            </div>
          </div>
        </div>
        <div class="battle-field">
          <h3 class="battle-title" style="width: 100vw">Still battling...</h3>
          <div id="flex-box">
            <div
              clsss="flex-item"
              style="margin: 1%"
              v-for="(still, index) in stillBattles"
              :key="index"
            >
              <BattleCardComponent
                :battleObject="still"
                @click="goBattle('still', index)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, onBeforeMount, watch } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import Socket from "../socket";
import BattleCardComponent from "../components/BattleCardComponent.vue";

const props = defineProps({
  userID: Number,
  socket: Socket,
});
const emits = defineEmits(["setUserID"]);
const productionServer = "https://domingoos.store"

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
  //TODO: update battle data. order by watch and question level ...
  // const allBattles = await axios.get("https://domingoos.store/api/1.0/battle");
  const allBattles = await axios.get(`${productionServer}/api/1.0/battle`);
  finishBattles.value = allBattles.data.data.finish;
  stillBattles.value = allBattles.data.data.still;
  console.log(finishBattles.value);
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
  margin-left: 5%;
  margin-right: 5%;
}
#flex-box {
  display: flex;
  margin: auto;
  margin-top: 3%;
  justify-content: center;
  flex-wrap: wrap;
  flex-direction: row;
  max-width: 90%;
  border-bottom: 1px solid rgb(142, 142, 142);
  padding-bottom: 3%;
  margin-bottom: 5%;
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

#battleModal{
  color: rgb(0,0,0);
}

.launch-btn{
  margin-top: 3%;
  padding-right: 1%;
  padding-left: 1%;
  background-color: rgb(97, 94, 94);
  border-radius: 3px;
  color: #f6f6f6;
  border: 0.5px solid #f6f6f6;
  right: 5%;
}

.launch-btn:hover{
  background-color: rgb(154, 143, 143);
  outline: none;
}
.launch-btn:focus{
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
</style>
