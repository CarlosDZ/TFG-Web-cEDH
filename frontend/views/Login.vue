<template>
    <div id="mainContainer">
        <div id="loginFormBox">
            <h1>Iniciar sesión</h1>
            <form @submit.prevent="login">
                <div class="inputContainer">
                    <span class="icon">
                        <picture>
                            <source
                                srcset="../assets/images/user-darkmode.svg"
                                media="(prefers-color-scheme: dark)"
                            />
                            <source
                                srcset="../icons/user-light.svg"
                                media="(prefers-color-scheme: light)"
                            />
                            <img src="../assets/images/user-lightmode.svg" alt="User icon" />
                        </picture>
                    </span>
                    <input
                        placeholder="Username or Email"
                        type="text"
                        v-model="username"
                        required
                    />
                </div>
                <div class="inputContainer">
                    <span class="icon">
                        <picture>
                            <source
                                srcset="../assets/images/lock-darkmode.svg"
                                media="(prefers-color-scheme: dark)"
                            />
                            <source
                                srcset="../icons/user-light.svg"
                                media="(prefers-color-scheme: light)"
                            />
                            <img src="../assets/images/lock-lightmode.svg" alt="User icon" />
                        </picture>
                    </span>
                    <input placeholder="Password" type="password" v-model="password" required />
                </div>

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
