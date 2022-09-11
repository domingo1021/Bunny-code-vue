import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import axios from "axios";
import { BootstrapVue, BootstrapVueIcons } from 'bootstrap-vue'

import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'

import "./assets/main.css";

const app = createApp(App);

app.use(router, axios, BootstrapVue, BootstrapVueIcons);

app.mount("#app");