<template>
  <div id="mainContainer-verify">
    <div class="lg-img-panel"></div>
    <div class="lg-bg-panel"></div>

    <div class="lg-form-side">
      <div class="lg-box-outer">
        <div class="lg-box">
          <h1 class="lg-title">Verificación de correo</h1>
          <p class="lg-subtitle">Spain cEDH Community</p>

          <div class="vf-message" :class="status">
            <p v-if="status === 'loading'">Verificando tu correo…</p>
            <p v-else-if="status === 'success'">
              {{ message || "Correo verificado con éxito." }}
            </p>
            <p v-else>
              {{ message || "No se ha podido verificar el correo." }}
            </p>
          </div>

          <div class="lg-divider"></div>

          <RouterLink to="/login" class="lg-submit-link">
            <button type="button" class="lg-submit">Ir a iniciar sesión</button>
          </RouterLink>

          <div class="lg-footer" v-if="status === 'error'">
            <div class="lg-footer-line"></div>
            <RouterLink to="/login" class="lg-footer-link">
              Reenviar correo desde login
            </RouterLink>
            <div class="lg-footer-line"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";
import { useRoute } from "vue-router";

const route = useRoute();
const status = ref("loading");
const message = ref("");

onMounted(async () => {
  const token = route.query.token;
  if (!token) {
    status.value = "error";
    message.value = "Falta el token de verificación.";
    return;
  }
  const backend_url = import.meta.env.VITE_BACKEND_URL;
  try {
    const res = await axios.post(`${backend_url}/api/auth/verify-email`, {
      token,
    });
    status.value = "success";
    message.value = res.data.message;
  } catch (err) {
    status.value = "error";
    message.value =
      err.response?.data?.error || "No se ha podido verificar el correo.";
  }
});
</script>

<style scoped>
#mainContainer-verify {
  height: 100vh;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
#mainContainer-verify .lg-img-panel {
  background-image: url("../assets/images/kenrith_returned_king.jpg");
}
#mainContainer-verify .lg-form-side {
  width: 100%;
  max-width: 460px;
  min-width: 0;
  padding: 0 16px;
  justify-content: center;
}
.vf-message {
  font-size: 14px;
  padding: 14px 16px;
  background: var(--bg-surface);
  border: 0.5px solid var(--border);
  margin-bottom: 20px;
  color: var(--txt);
  text-align: center;
}
.vf-message.success {
  border-color: #4ab78a;
  color: #c8eedd;
}
.vf-message.error {
  border-color: #b74a4a;
  color: #eecccc;
}
.lg-submit-link {
  text-decoration: none;
}
@media (max-width: 849px) {
  #mainContainer-verify .lg-img-panel {
    display: none;
  }
}
</style>
