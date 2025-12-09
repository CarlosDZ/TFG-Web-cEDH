<template>
    <div id="mainContainer">
        <div id="loginFormBox">
            <h1>Iniciar sesión</h1>
            <form @submit.prevent="login">
                <input placeholder="Username or Email" type="text" v-model="username" required />

                <input placeholder="Password" type="password" v-model="password" required />

                <button type="submit">ENTRAR</button>
            </form>
        </div>
    </div>
</template>

<script setup>
import { ref } from "vue";

const username = ref("");
const password = ref("");

function login() {
    // Process data and call backend
}
</script>
