<template>
    <div id="mainContainer-login">
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
                                srcset="../assets/images/user-lightmode.svg"
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
                                srcset="../assets/images/lock-lightmode.svg"
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
import axios from "axios";
import { authState } from "../utils/auth";

const username = ref("");
const password = ref("");
const backend_url = import.meta.env.VITE_BACKEND_URL;
const auth = authState();

function login() {
    // Add shitty comprobations

    axios
        .post(`http://${backend_url}/api/auth/login`, {
            nameOrMail: username.value,
            password: password.value,
        })
        .then(function (response) {
            console.log(response);
            if (response.data.user) {
                auth.setUser(response.data.user);
            }
            //ahora navegamos a home
        })
        .catch(function (error) {
            alert(error.response.data.error);
        });
}
</script>
