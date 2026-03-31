<template>
    <div id="mainContainer-login">
        <div class="lg-img-panel"></div>
        <div class="lg-bg-panel"></div>

        <div class="lg-form-side">
            <div class="lg-box-outer">
                <div class="lg-box">
                    <h1 class="lg-title">Iniciar sesión</h1>
                    <p class="lg-subtitle">Spain cEDH Community</p>

                    <form @submit.prevent="login">
                        <div class="lg-field">
                            <label class="lg-label">Usuario o email</label>
                            <div class="lg-input-wrap">
                                <span class="lg-input-icon">
                                    <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="1.5"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                    >
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                        <circle cx="12" cy="7" r="4" />
                                    </svg>
                                </span>
                                <input
                                    class="lg-input"
                                    type="text"
                                    placeholder="Tu nombre de usuario"
                                    v-model="username"
                                    required
                                />
                            </div>
                        </div>

                        <div class="lg-field">
                            <label class="lg-label">Contraseña</label>
                            <div class="lg-input-wrap">
                                <span class="lg-input-icon">
                                    <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="1.5"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                    >
                                        <rect x="3" y="11" width="18" height="11" />
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                    </svg>
                                </span>
                                <input
                                    class="lg-input"
                                    type="password"
                                    placeholder="••••••••"
                                    v-model="password"
                                    required
                                />
                            </div>
                        </div>

                        <div class="lg-divider"></div>
                        <button type="submit" class="lg-submit">Entrar</button>
                    </form>

                    <div class="lg-footer">
                        <div class="lg-footer-line"></div>
                        <RouterLink to="/register" class="lg-footer-link">Crear cuenta</RouterLink>
                        <div class="lg-footer-line"></div>
                    </div>
                </div>
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
const password = ref("");
const backend_url = import.meta.env.VITE_BACKEND_URL;
const auth = authState();
const router = useRouter();

function login() {
    axios
        .post(`http://${backend_url}/api/auth/login`, {
            nameOrMail: username.value,
            password: password.value,
        })
        .then((response) => {
            if (response.data.user) auth.setUser(response.data.user);
            router.push("/dashboard");
        })
        .catch((error) => {
            alert(error.response.data.error);
        });
}
</script>

<style>
/* No-scoped para reutilizar en register */
@import url("https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600&family=Crimson+Pro:ital,wght@0,300;0,400;1,300&display=swap");

#mainContainer-login,
#mainContainer-register {
    --accent: #534ab7;
    --accent-hover: #3c3489;
    --accent-text: #eeedfe;
    --accent-muted: #afa9ec;
    --bg: #0d1b2a;
    --bg-surface: #111e2e;
    --bg-card: #0d1b2a;
    --bg-card-border: #1c2f4a;
    --border: #1c3a58;
    --txt: #e0ddd8;
    --txt-title: #e8e3d8;
    --txt-muted: #6b8caa;
    --txt-placeholder: #2e4a62;
    --mask-r: 48px;

    overflow: hidden;
    width: 100%;
    height: 100vh;
    display: flex;
    align-items: stretch;
    position: relative;
    font-family: "Crimson Pro", Georgia, serif;
    background: var(--bg);
}

.lg-img-panel {
    position: absolute;
    right: -40px;
    top: 0;
    bottom: 0;
    width: 65%;
    background: url("../assets/images/tymna_the_weaver.webp") center / cover no-repeat;
    z-index: 0;
}

.lg-bg-panel {
    position: absolute;
    inset: 0;
    background: linear-gradient(105deg, var(--bg) 42%, rgba(13, 27, 42, 0.25) 100%);
    z-index: 1;
}

.lg-form-side {
    position: relative;
    z-index: 2;
    width: 38%;
    min-width: 300px;
    display: flex;
    align-items: center;
    padding: 0 0 0 5%;
}

.lg-box-outer {
    --r: var(--mask-r);
    -webkit-mask: radial-gradient(var(--r) at var(--r) var(--r), #0000 98%, #000)
        calc(-1 * var(--r)) calc(-1 * var(--r));
    background: var(--bg-card-border);
    padding: 2px;
    width: 100%;
}

.lg-box {
    --r: var(--mask-r);
    -webkit-mask: radial-gradient(var(--r) at var(--r) var(--r), #0000 98%, #000)
        calc(-1 * var(--r)) calc(-1 * var(--r));
    background: var(--bg-card);
    padding: 40px 36px 36px;
    display: flex;
    flex-direction: column;
}

.lg-title {
    font-family: "Cinzel", serif;
    font-size: 28px;
    font-weight: 600;
    color: var(--txt-title);
    letter-spacing: 0.04em;
    margin: 0 0 6px;
    line-height: 1.1;
}

.lg-subtitle {
    font-size: 13px;
    color: var(--txt-muted);
    margin: 0 0 28px;
    font-style: italic;
    letter-spacing: 0.02em;
}

form {
    display: flex;
    flex-direction: column;
}

.lg-field {
    display: flex;
    flex-direction: column;
    gap: 5px;
    margin-bottom: 16px;
}

.lg-label {
    font-size: 11px;
    color: var(--txt-muted);
    text-transform: uppercase;
    letter-spacing: 0.1em;
}

.lg-input-wrap {
    display: flex;
    align-items: center;
    background: var(--bg-surface);
    border: 0.5px solid var(--border);
    height: 42px;
    transition:
        border-color 0.2s,
        box-shadow 0.2s;
}

.lg-input-wrap:focus-within {
    border-color: var(--accent);
    box-shadow: 0 0 0 2px rgba(83, 74, 183, 0.2);
}

.lg-input-icon {
    width: 42px;
    height: 42px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-right: 0.5px solid var(--border);
    flex-shrink: 0;
    color: var(--txt-muted);
}

.lg-input-icon svg {
    width: 16px;
    height: 16px;
}

.lg-input {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    color: var(--txt);
    font-size: 14px;
    padding: 0 14px;
    font-family: "Crimson Pro", serif;
}

.lg-input::placeholder {
    color: var(--txt-placeholder);
}

.lg-divider {
    height: 0.5px;
    background: var(--border);
    margin: 8px 0 20px;
}

.lg-submit {
    width: 100%;
    height: 44px;
    background: var(--accent);
    border: none;
    color: var(--accent-text);
    font-family: "Cinzel", serif;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.12em;
    cursor: pointer;
    text-transform: uppercase;
    transition:
        background 0.15s,
        transform 0.15s;
}

.lg-submit:hover {
    background: var(--accent-hover);
}

.lg-submit:active {
    transform: scale(0.98);
}

.lg-footer {
    margin-top: 20px;
    display: flex;
    align-items: center;
    gap: 12px;
}

.lg-footer-line {
    flex: 1;
    height: 0.5px;
    background: var(--border);
}

.lg-footer-link {
    font-family: "Cinzel", serif;
    font-size: 12px;
    color: var(--accent);
    text-decoration: none;
    letter-spacing: 0.06em;
    white-space: nowrap;
    transition: color 0.15s;
}

.lg-footer-link:hover {
    color: var(--accent-muted);
}

@media (max-width: 849px) {
    .lg-img-panel {
        display: none;
    }
    .lg-form-side {
        width: 100%;
        padding: 0 16px;
        justify-content: center;
        min-width: unset;
    }
}
</style>
