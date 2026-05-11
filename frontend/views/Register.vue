<template>
  <div id="mainContainer-register">
    <div class="lg-img-panel"></div>
    <div class="lg-bg-panel"></div>

    <div class="lg-form-side">
      <div class="lg-box-outer">
        <div class="lg-box">
          <h1 class="lg-title">Crear cuenta</h1>
          <p class="lg-subtitle">Spain cEDH Community</p>

          <div v-if="successMessage" class="vf-message success">
            {{ successMessage }}
          </div>

          <form v-else @submit.prevent="register">
            <div class="lg-field">
              <label class="lg-label">Usuario</label>
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
                  placeholder="tu_usuario"
                  v-model="username"
                  required
                />
              </div>
            </div>

            <div class="lg-field">
              <label class="lg-label">Email</label>
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
                    <rect x="2" y="4" width="20" height="16" rx="0" />
                    <path d="M2 7l10 7 10-7" />
                  </svg>
                </span>
                <input
                  class="lg-input"
                  type="email"
                  placeholder="correo@ejemplo.com"
                  v-model="email"
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
            <button type="submit" class="lg-submit">Registrar</button>
          </form>

          <div class="lg-footer">
            <div class="lg-footer-line"></div>
            <RouterLink to="/login" class="lg-footer-link"
              >Iniciar sesión</RouterLink
            >
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
const email = ref("");
const password = ref("");
const successMessage = ref("");
const auth = authState();
const router = useRouter();

function register() {
  const backend_url = import.meta.env.VITE_BACKEND_URL;
  axios
    .post(`${backend_url}/api/auth/register`, {
      username: username.value,
      email: email.value,
      password: password.value,
    })
    .then((response) => {
      if (response.data.user) {
        auth.setUser(response.data.user);
        router.push("/dashboard");
        return;
      }
      successMessage.value =
        response.data.mensaje ||
        `Hemos enviado un correo de verificación a ${email.value}. Revisa tu bandeja de entrada para activar la cuenta.`;
    })
    .catch((error) => {
      alert(error.response.data.error);
    });
}
</script>

<style scoped>
#mainContainer-register .lg-img-panel {
  background-image: url("../assets/images/kenrith_returned_king.jpg");
}

.vf-message {
  font-size: 14px;
  padding: 14px 16px;
  background: var(--bg-surface);
  border: 0.5px solid var(--border);
  margin-bottom: 20px;
  color: var(--txt);
}
.vf-message.success {
  border-color: #4ab78a;
  color: #c8eedd;
}

@media (max-width: 849px) {
  #mainContainer-register .lg-img-panel {
    display: none;
  }
}
</style>
