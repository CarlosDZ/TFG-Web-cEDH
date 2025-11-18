const { createRouter, createWebHistory } = require("vue-router");

const Home = require("../views/Home.vue").default;

const routes = [
    // {path: "/", component: Home},
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

module.exports = router;
