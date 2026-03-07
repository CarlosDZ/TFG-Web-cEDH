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
            <RouterLink to="/login">
                <button><h1>Iniciar Sesion</h1></button>
            </RouterLink>
            <h2>o si no tienes una cuenta...</h2>
            <RouterLink to="/register">
                <button><h1>Crear Cuenta</h1></button>
            </RouterLink>
        </div>
        <div class="content2" v-else>
            <RouterLink to="/mis-decks">
                <button><h1>Mis Decks</h1></button>
            </RouterLink>
            <!--Cambiar todo esto cuando haga las vistas del area personal-->
            <RouterLink to="/mis-commandertech">
                <button><h1>Mis Commander Techs</h1></button>
            </RouterLink>
            <!--Cambiar todo esto cuando haga las vistas del area personal-->
            <RouterLink to="/mis-discusiones">
                <button><h1>Mis Discusiones</h1></button>
            </RouterLink>
            <!--Cambiar todo esto cuando haga las vistas del area personal-->
            <RouterLink to="/mis-torneos-pendientes">
                <button><h1>Proximos Torneos</h1></button>
            </RouterLink>
            <!--Cambiar todo esto cuando haga las vistas del area personal-->
        </div>
    </div>
</template>

<style scoped>
#mainContainer-personalNavMenu {
    height: 90%;
    width: 20vw;
    top: 50%;
    transform: translateY(-50%);
    right: 0;
    position: absolute;
    background: var(--background-color, #1e1e1e);
    border: 1px solid #333;
    transition:
        transform 0.7s ease,
        width 0.7s ease;
    display: flex;
    flex-direction: row;
    z-index: 999;
    border-radius: 30px 0 0 30px;
}

#mainContainer-personalNavMenu.open {
    transform: translateY(-50%) translateX(0);
    .content1,
    .content2 {
        transform: translateX(0);
    }
}
#mainContainer-personalNavMenu:not(.open) {
    transform: translateY(-50%) translateX(100%);
    .content1,
    .content2 {
        transform: translateX(200%);
    }
}

#mainContainer-personalNavMenu .tab {
    position: absolute;
    left: -32px;
    top: 50%;
    transform: translateY(-50%);
    width: 32px;
    height: 80px;
    background: var(--background-color, #1e1e1e);
    border: 1px solid #333;
    border-right: none;
    border-radius: 8px 0 0 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    user-select: none;
    color: var(--txt-color);
    font-weight: bolder;
}

#mainContainer-personalNavMenu .content1,
#mainContainer-personalNavMenu .content2 {
    overflow-y: auto;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    background-color: transparent;
    justify-content: center;
    transition: transform 0.7s ease;
}

#mainContainer-personalNavMenu .content1 {
    padding-left: 16px;
    padding-right: 16px;

    h1,
    h2 {
        color: var(--txt-color);
        margin-top: 20px;
        margin-bottom: 20px;
        text-align: center;
    }
    button {
        border-radius: 999px;
        padding-left: 10px;
        padding-right: 10px;
        border: solid 2px var(--txt-color);
        background-color: var(--background-color);
        transition:
            box-shadow 0.25s ease,
            transform 0.32s ease;
        cursor: pointer;
        h1 {
            color: var(--txt-color);
            text-align: center;
        }
    }
    button:hover {
        transform: scale(1.1);
        box-shadow: 0 0 12px var(--button-hover-light);
    }
    button:active {
        transform: scale(1);
    }
}

#mainContainer-personalNavMenu .content2 {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    position: relative;

    a {
        width: 100%;
        display: flex;
        justify-content: center;
        text-decoration: none;
    }

    button {
        border-radius: 999px;
        padding-left: 10px;
        padding-right: 10px;
        border: solid 2px var(--txt-color);
        background-color: var(--background-color);
        transition:
            box-shadow 0.25s ease,
            transform 0.32s ease;
        cursor: pointer;

        padding: 40px 20px;

        width: 80%;

        margin: 10% auto;

        h1 {
            color: var(--txt-color);
            text-align: center;
        }
    }

    button:hover {
        transform: scale(1.1);
        box-shadow: 0 0 12px var(--button-hover-light);
    }
    button:active {
        transform: scale(1);
    }
}
</style>
