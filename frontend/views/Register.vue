<template>
    <div id="mainContainer-register">
        <div id="loginFormBox">
            <h1>Crear Cuenta</h1>
            <form @submit.prevent="register">
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
                    <input placeholder="Username" type="text" v-model="username" required />
                </div>
                <div class="inputContainer">
                    <span class="icon">
                        <picture>
                            <source
                                srcset="../assets/images/email-darkmode.svg"
                                media="(prefers-color-scheme: dark)"
                            />
                            <source
                                srcset="../assets/images/email-lightmode.svg"
                                media="(prefers-color-scheme: light)"
                            />
                            <img src="../assets/images/email-lightmode.svg" alt="Email icon" />
                        </picture>
                    </span>
                    <input placeholder="Email" type="email" v-model="email" required />
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

                <button type="submit">REGISTRAR</button>
            </form>
        </div>
    </div>
</template>

<script setup>
import { ref } from "vue";
import axios from "axios";
import { authState } from "../utils/auth";

const username = ref("");
const email = ref("");
const password = ref("");
const auth = authState();

function register() {
    const backend_url = import.meta.env.VITE_BACKEND_URL;
    // Add shitty comprobations

    axios
        .post(`http://${backend_url}/api/auth/register`, {
            username: username.value,
            email: email.value,
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
