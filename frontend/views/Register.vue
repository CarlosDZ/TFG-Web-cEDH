<template>
    <div id="mainContainer-register">
        <div id="loginFormBox-container">
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
                <hr />
                <a href="/login">Iniciar sesion</a>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from "vue";
import axios from "axios";
import { authState } from "../utils/auth";
import { useRouter } from "vue-router";

const username = ref("");
const email = ref("");
const password = ref("");
const auth = authState();
const router = useRouter();

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
            router.push("/dashboard");
        })
        .catch(function (error) {
            alert(error.response.data.error);
        });
}
</script>

<style scoped>
#mainContainer-register {
    overflow: hidden;
    width: 100%;
    height: 100vh;
    display: flex;
    align-items: center;
}

/*Styles regarding screeen sizes*/
@media (min-width: 850px) {
    #mainContainer-register {
        background-image:
            linear-gradient(
                105deg,
                var(--login-bg-color-1) var(--login-bg-color-percent),
                rgba(0, 0, 0, 0.36)
            ),
            url("../assets/images/kenrith_returned_king.jpg");
        background-size:
            cover,
            auto 100%;
        background-position:
            center,
            calc(100% + 80px) center;
        background-repeat: no-repeat, no-repeat;
        /*I would really like to make a image carrusel with thrasios sisay kinnan etc but i dont have the time right now*/
    }
}
@media (max-width: 849px) {
    #mainContainer-register {
        background-color: var(--login-bg-color-1);
    }
}

/* All the css that's not here comes from login_form.css (Recicled classes)*/
</style>
