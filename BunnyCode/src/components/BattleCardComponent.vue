<template>
  <div class="card" style="width: 18rem">
    <div class="card-body">
      <h5 class="card-title">{{ battleObject.battleName }}</h5>
      <div class="flex-box">
        <div
          class="first-win"
          v-if="battleObject.firstUserID === battleObject.winnerID"
        >
          勝
        </div>
        <img :src="battleObject.firstUserPicture" alt="picture-1" />
        <div>&nbsp;</div>
        <div
          class="second-win"
          v-if="battleObject.secondUserID === battleObject.winnerID"
        >
          勝
        </div>
        <img :src="battleObject.secondUserPicture" alt="picture-1" />
      </div>
      <div class="flex-box">
        <h6 class="card-subtitle mb-2">
          <div class="name">{{ battleObject.firstUserName }}</div>
        </h6>
        <div>
          <div>v.s.</div>
        </div>
        <h6 class="card-subtitle mb-2">
          <div class="name">{{ battleObject.secondUserName }}</div>
        </h6>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  battleObject: Object,
});
</script>

<style scoped>
.card {
  background: none;
  height: 100%;
}
.card:hover {
  cursor: pointer;
}
.name {
  margin-top: 10px;
}
.flex-box {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  margin-right: 8%;
  margin-left: 10%;
}

.first-win {
  z-index: 99;
  position: absolute;
  left: 20%;
  background-color: rgb(228, 62, 62);
  padding: 2%;
  border-radius: 50%;
  height: 25px;
}

.second-win {
  z-index: 99;
  position: absolute;
  left: 93%;
  background-color: rgb(228, 62, 62);
  padding: 2%;
  border-radius: 50%;
  height: 25px;
}

img {
  width: 50px;
  height: 50px;
  border-radius: 50%;
}
</style>
