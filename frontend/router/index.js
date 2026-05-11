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
import UsersView from "../views/UsersView.vue";
import ProfileSettingsView from "../views/ProfileSettingsView.vue";
import Tournaments from "../views/Tournaments.vue";
import MisDecks from "../views/MisDecks.vue";
import MisTechs from "../views/MisTechs.vue";
import TournamentManagement from "../views/management/TournamentManagement.vue";
import { authState } from "../utils/auth";
import VerifyEmail from "../views/VerifyEmail.vue";

const routes = [
  { path: "/", redirect: "/dashboard" },
  { path: "/dashboard", name: "Dashboard", component: Dashboard },
  { path: "/carta/:name", name: "CardView", component: CardView },
  {
    path: "/jugador/:id",
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
  { path: "/verificar-correo", name: "VerifyEmail", component: VerifyEmail },

  { path: "/torneos", name: "Tournaments", component: Tournaments },
  { path: "/decklists", name: "Decklists", component: Decklists },
  { path: "/decklists/:id", name: "DeckDetail", component: DeckDetail },
  {
    path: "/commander-techs",
    name: "CommanderTechs",
    component: CommanderTechs,
  },
  { path: "/jugadores", name: "Jugadores", component: UsersView },
  {
    path: "/ajustes-perfil",
    name: "ProfileSettings",
    component: ProfileSettingsView,
  },

  { path: "/mis-decks", name: "MisDecks", component: MisDecks },
  { path: "/mis-commandertech", name: "MisTechs", component: MisTechs },
  { path: "/mis-discusiones", redirect: "/dashboard" }, //Obviamente cambiar el redirect cuando la vista este hecha
  { path: "/mis-torneos-pendientes", redirect: "/torneos?filter=saved" },

  {
    path: "/management/tournaments",
    name: "TournamentManagement",
    component: TournamentManagement,
    meta: { requiresVerified: true },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, _from, next) => {
  if (!to.meta.requiresVerified) return next();

  const auth = authState();

  if (!auth.isLogged) return next("/login");
  if (!auth.user?.isVerified && !auth.user?.isAdmin) return next("/dashboard");
  next();
});

export default router;
