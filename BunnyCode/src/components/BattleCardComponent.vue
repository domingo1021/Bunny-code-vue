<template>
  <div class="card" style="width: 18rem">
    <div class="card-body">
      <h5 class="card-title">{{battleObject.battleName}}</h5>
      <div class="flex-box">
        <div class="win" v-if="battleObject.firstUserID === battleObject.winnerID">勝</div>
        <img :src="battleObject.firstUserPicture" alt="picture-1">
        <div>&nbsp;</div>
        <div class="win" v-if="battleObject.secondUserID === battleObject.winnerID">勝</div>
        <img :src="battleObject.secondUserPicture" alt="picture-1">
      </div>
      <div class="flex-box">
        <h6 class="card-subtitle mb-2">
          <div class="name">{{battleObject.firstUserName}}</div>
        </h6>
        <div>
          <div> v.s.</div>
        </div>
        <h6 class="card-subtitle mb-2">
          <div class="name">{{battleObject.secondUserName}}</div>
        </h6>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  battleObject: Object
})
</script>

<style scoped>
.card{
  background-color: #21262d;
  border: 0.3px solid #85888b;
  height: 100%
}
.card:hover{
  cursor: pointer;
  background-color: rgb(69, 75, 103);
}
.flex-box{
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  margin-right: 10%;
  margin-left: 10%;
}

.win{
  z-index: 99;
  position: absolute;
  left: 20%;
  background-color: rgb(228, 62, 62);
  padding: 2%;
  border-radius: 50%;
  height: 25px;
}

img{
  width: 50px;
  height: 50px;
  border-radius: 50%;
}
</style>