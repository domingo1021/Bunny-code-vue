<template>
  <div id="user-card" class="card">
    <div id="user-level">
      <div>Level: &nbsp;</div>
      <div>{{ userInfo.userLevel }}</div>
    </div>
    <img id="user-picture" :src="userInfo.picture" alt="User picture" />
    <div id="user-name" @click="goProfile">{{ userInfo.userName }}</div>
    <div id="user-profile">
      <div v-if="userInfo.profile !== null">
        {{ userInfo.profile }}
      </div>
      <div v-else>Hello everyone ~</div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from "vue-router";

const props = defineProps({
  userInfo: Object,
});

const router = useRouter();

function goProfile() {
  router.push({ name: "user", params: { pageUserID: props.userInfo.userID } });
}
</script>

<style scoped>
#user-card {
  background-color: rgb(31, 31, 31);
  margin-bottom: 5%;
}
#user-name {
  color: rgb(222, 222, 222);
  font-size: 2rem;
}
#user-name:hover {
  cursor: pointer;
}
#user-picture {
  border-radius: 10px;
}
#user-level {
  z-index: 99;
  position: absolute;
  background-color: rgb(148, 34, 230);
  display: flex;
  color: rgb(249, 247, 247);
  top: 10px;
  right: 20px;
  width: 90px;
  border-radius: 10px;
  justify-content: center;
}

#user-profile {
  font-size: 1rem;
  text-align: center;
  padding-bottom: 5%;
  color: rgb(195, 187, 187);
}
.card {
  box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2);
  max-width: 500px;
  margin: auto;
  text-align: center;
}

.title {
  color: grey;
  font-size: 18px;
}

button {
  border: none;
  outline: 0;
  display: inline-block;
  padding: 8px;
  color: white;
  background-color: #000;
  text-align: center;
  cursor: pointer;
  width: 100%;
  font-size: 18px;
}

button:hover,
a:hover {
  opacity: 0.7;
}
</style>
