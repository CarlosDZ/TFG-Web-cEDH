import { createRouter, createWebHistory } from "vue-router";
import Login from "../views/Login.vue";
import Register from "../views/Register.vue";
import Dashboard from "../views/Dashboard.vue";
import Decklists from "../views/Decklists.vue";
import CardView from "../views/CardView.vue";
import UserProfileView from "../views/UserProfileView.vue";
import SearchResultsView from "../views/SearchResultsView.vue";
import DeckDetail from "../views/DeckDetail.vue";
import CommanderTechs from "../views/CommanderTechs.vue";

const routes = [
    { path: "/", redirect: "/dashboard" },
    { path: "/dashboard", name: "Dashboard", component: Dashboard },
    { path: "/carta/:name", name: "CardView", component: CardView },
    {
        path: "/jugador/:username",
        name: "UserProfile",
        component: UserProfileView,
    },
    {
        path: "/busqueda/:type",
        name: "SearchResults",
        component: SearchResultsView,
    },

    { path: "/login", name: "Login", component: Login },
    { path: "/register", name: "Registro", component: Register },

    { path: "/torneos", redirect: "/dashboard" }, //Obviamente cambiar el redirect cuando la vista este hecha
    { path: "/decklists", name: "Decklists", component: Decklists },
    { path: "/decklists/:id", name: "DeckDetail", component: DeckDetail },
    { path: "/commander-techs", redirect: "/dashboard" }, //Obviamente cambiar el redirect cuando la vista este hecha
    { path: "/jugadores", redirect: "/dashboard" }, //Obviamente cambiar el redirect cuando la vista este hecha
    { path: "/torneos", redirect: "/dashboard" }, //Obviamente cambiar el redirect cuando la vista este hecha
    { path: "/decklists", name: "Decklists", component: Decklists },
    {
        path: "/commander-techs",
        name: "CommanderTechs",
        component: CommanderTechs,
    },
    { path: "/jugadores", redirect: "/dashboard" }, //Obviamente cambiar el redirect cuando la vista este hecha

    { path: "/mis-decks", redirect: "/dashboard" }, //Obviamente cambiar el redirect cuando la vista este hecha
    { path: "/mis-commandertech", redirect: "/dashboard" }, //Obviamente cambiar el redirect cuando la vista este hecha
    { path: "/mis-discusiones", redirect: "/dashboard" }, //Obviamente cambiar el redirect cuando la vista este hecha
    { path: "/mis-torneos-pendientes", redirect: "/dashboard" }, //Obviamente cambiar el redirect cuando la vista este hecha
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
