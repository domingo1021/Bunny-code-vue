import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap";
import Toaster from "@meforma/vue-toaster";
import "./assets/main.css";
import Markdown from 'vue3-markdown-it';

const app = createApp(App);

app.use(router, axios, Toaster, Markdown);

app.mount("#app");
