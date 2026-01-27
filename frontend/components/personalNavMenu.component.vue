<script setup>
import { authState } from "../utils/auth";
import { ref } from "vue";
const auth = authState();

const isOpen = ref(true);

function togglePanel() {
    isOpen.value = !isOpen.value;
}
</script>

<template>
    <div id="mainContainer-personalNavMenu" :class="{ open: isOpen }">
        <div class="tab" @click="togglePanel">
            <span>{{ isOpen ? ">" : "<" }}</span>
        </div>

        <div class="content1" v-if="!auth.isLogged">
            <h1>Estas en modo invitado...</h1>
            <h1>Inicia sesion para ver tu area personal.</h1>
            <RouterLink to="/login"
                ><button><h1>Iniciar Sesion</h1></button></RouterLink
            >
            <h2>o si no tienes una cuenta...</h2>
            <RouterLink to="/register"
                ><button><h1>Crear Cuenta</h1></button></RouterLink
            >
        </div>
        <div class="content2" v-else>
            <RouterLink to="/mis-decks"
                ><button><h1>Mis Decks</h1></button></RouterLink
            >
            <!--Cambiar todo esto cuando haga las vistas del area personal-->
            <RouterLink to="/mis-commandertech"
                ><button><h1>Mis Commander Techs</h1></button></RouterLink
            >
            <!--Cambiar todo esto cuando haga las vistas del area personal-->
            <RouterLink to="/mis-discusiones"
                ><button><h1>Mis Discusiones</h1></button></RouterLink
            >
            <!--Cambiar todo esto cuando haga las vistas del area personal-->
            <RouterLink to="/mis-torneos-pendientes"
                ><button><h1>Proximos Torneos</h1></button></RouterLink
            >
            <!--Cambiar todo esto cuando haga las vistas del area personal-->
        </div>
    </div>
</template>
