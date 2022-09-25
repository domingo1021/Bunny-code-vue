import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap";
import Toaster from "@meforma/vue-toaster";
import "./assets/main.css";
import Markdown from "vue3-markdown-it";
import VueSweetalert2 from "vue-sweetalert2";
import 'sweetalert2/dist/sweetalert2.min.css'

const app = createApp(App);

/* import font awesome icon component */
app.use(router, axios, Toaster, Markdown, VueSweetalert2);

app.mount("#app");
