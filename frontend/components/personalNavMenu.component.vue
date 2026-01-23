<script setup>
import { authState } from "../utils/auth";

const auth = authState();
</script>

<template>
    <div v-if="!auth.isLogged">
        <h1>Estas en modo invitado... Inicia sesion para ver tu area personal.</h1>
        <RouterLink to="/login"
            ><button><h1>Iniciar Sesion</h1></button></RouterLink
        >
        <h2>o si no tienes una cuenta...</h2>
        <RouterLink to="/register"
            ><button><h1>Crear Cuenta</h1></button></RouterLink
        >
    </div>
    <div v-else>
        <RouterLink to="/torneos"
            ><button><h1>Torneos</h1></button></RouterLink
        >
        <!--Cambiar todo esto cuando haga las vistas del area personal-->
        <RouterLink to="/decklists"
            ><button><h1>Decklists</h1></button></RouterLink
        >
        <!--Cambiar todo esto cuando haga las vistas del area personal-->
        <RouterLink to="/commander-techs"
            ><button><h1>Commander Techs</h1></button></RouterLink
        >
        <!--Cambiar todo esto cuando haga las vistas del area personal-->
        <RouterLink to="/jugadores"
            ><button><h1>Jugadores</h1></button></RouterLink
        >
        <!--Cambiar todo esto cuando haga las vistas del area personal-->
    </div>
</template>
