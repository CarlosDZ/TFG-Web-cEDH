require("./assets/tailwind.css");
const { createApp } = require("vue");
const App = require("./App.vue").default;
const router = require("./router").default;

createApp(App).use(router).mount("#app");