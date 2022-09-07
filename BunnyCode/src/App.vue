<template>
  <header>
    <nav id="top-navbar">
      <div class="flex-container">
        <div class="flex-container-2">
          <div>Bunny code</div>
          <RouterLink to="/" class="nav-item">Home</RouterLink>
          <RouterLink to="/about" class="nav-item">About</RouterLink>
          <RouterLink to="/workspace" class="nav-item">Workspace</RouterLink>
          <RouterLink to="/playback" class="nav-item">
            Playback (tmp)
          </RouterLink>
          <RouterLink to="/code-mirror" class="nav-item">Code Mirror</RouterLink>
          <RouterLink to="/code-mirror-playback" class="nav-item">Playback 2.0</RouterLink>
        </div>
        <div class="right-flex">
          <div class="nav-item">123</div>
          <div class="nav-item">223</div>
          <div class="nav-item">333</div>
        </div>
      </div>
    </nav>
  </header>
  <body>
    <main>
      <!-- <textarea v-model="content" id="editor"></textarea> -->
      <router-view :socket="socket"></router-view>
    </main>
  </body>
</template>


<script setup>
import {  RouterLink, RouterView } from "vue-router";
import io from "socket.io-client";

const socket = io("wss://domingoos.store", { path: "/api/socket/" });

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
