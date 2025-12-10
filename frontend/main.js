import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import dotenv from "dotenv";

import "./assets/styles/global.css";

createApp(App).use(router).mount("#app");
