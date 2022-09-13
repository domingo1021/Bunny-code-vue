<template>
  <header>
    <nav id="top-navbar">
      <div class="flex-container">
        <div class="flex-container-2">
          <div>Bunny code</div>
          <RouterLink to="/" class="nav-item" @click="updateView('home')"
            >Home</RouterLink
          >
          <RouterLink
            to="/code-mirror/bunny_code"
            class="nav-item"
            @click="updateView('code')"
          >
            Code Mirror
          </RouterLink>
          <RouterLink
            to="/battle/1"
            class="nav-item"
            @click="updateView('battle')"
            >Battle</RouterLink
          >
        </div>
        <div class="right-flex">
          <RouterLink class="nav-item" to="/login" @click="updateView('user')"
            >個人資訊</RouterLink
          >
          <NotificationView :socket="socket" />
          <!-- <div class="nav-item">個人資訊</div> -->
          <SearchComponent :socket="socket" />
        </div>
      </div>
    </nav>
  </header>
  <body>
    <RouterView :socket="socket" :key="view" />
  </body>
</template>

<script setup>
import { RouterLink, RouterView, useRouter } from "vue-router";
import SearchComponent from "./components/SearchComponent.vue";
import { onBeforeMount, ref } from "vue";
import axios from "axios";
import io from "socket.io-client";
import NotificationView from "./views/NotificationView.vue";

const localhostServer = "http://localhost:3000";
const productionServer = "wss://domingoos.store";
const jwt = localStorage.getItem("jwt");
const isLogin = ref(false);
const userID = ref(-1);

let socket = ref();
axios({
  method: "get",
  url: localhostServer + "/api/1.0/user/auth",
  headers: {
    Authorization: `Bearer ${jwt}`,
  },
})
  .then((response) => {
    isLogin.value = true;
    userID.value = response.data.data;
    socket.value = io(localhostServer, {
      auth: (cb) => {
        cb({ token: `Bearer ${jwt}` });
      },
      path: "/api/socket/",
    });
  })
  .catch((error) => {
    console.log("error message: ", error.response.data.msg);
    alert("Please log in !");
    isLogin.value = false;
  });

const view = ref("home");
const router = useRouter();

async function updateView(viewPage) {
  view.value = viewPage;
  if (view.value === "code") {
    await router.push({ name: "home" });
    await router.push({
      name: "code-mirror",
      params: { projectName: "bunny_code" },
    });
  }
}

onBeforeMount(async () => {
  try {
    console.log(localhostServer + "/api/1.0/user/auth");
    await axios({
      method: "get",
      url: localhostServer + "/api/1.0/user/auth",
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    });
    isLogin.value = true;
  } catch (error) {
    alert("Please log in !");
    isLogin.value = false;
  }
  console.log("login:", isLogin.value);
  if (isLogin.value) {
    socket = io(localhostServer, {
      auth: (cb) => {
        cb({ token: `Bearer ${jwt}` });
      },
      path: "/api/socket/",
    });
  }
});
</script>

<style scoped>
nav a.router-link-exact-active {
  color: var(--color-text);
}
nav a.router-link-exact-active:hover {
  background-color: transparent;
}
nav a {
  display: inline-block;
  padding: 0 1rem;
  border-left: 1px solid var(--color-border);
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
  height: 80px;
  background-color: rgb(255, 255, 255);
  border-bottom: 40px solid #2c2c2c;
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
  display: flex;
  flex-direction: row;
}

.right-flex {
  display: flex;
  flex-direction: row-reverse;
  margin-top: auto;
}

.nav-item {
  margin-left: 15px;
}

header + body {
  padding-top: 80px;
}
</style>
