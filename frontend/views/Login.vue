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
                        id="username"
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
                    <input
                        placeholder="Password"
                        type="password"
                        v-model="password"
                        id="password"
                        required
                    />
                </div>

                <button type="submit">ENTRAR</button>
            </form>
        </div>
    </div>
</template>

<script setup>
import { ref } from "vue";
import axios from "axios";
import dotenv from "dotenv";
function login() {
    let username = document.getElementById("username").value;
    let password = document.getElementById("password").value;
    const backend_url = import.meta.env.VITE_BACKEND_URL;
    // Add shitty comprobations

    axios
        .post(`http://${backend_url}/api/auth/login`, {
            nameOrMail: username,
            password: password,
        })
        .then(function (response) {
            console.log(response);
        })
        .catch(function (error) {
            console.log(error);
        });
}
</script>
