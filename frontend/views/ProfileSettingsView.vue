<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { authState } from "../utils/auth";
import { updateUsuario } from "../services/userService";
import headersSearchBar from "../components/headerSearchBar.component.vue";
import sectionNavMenu from "../components/sectionNavMenu.component.vue";

const auth = authState();
const router = useRouter();

const username = ref("");
const bio = ref("");
const email = ref("");
const currentPassword = ref("");
const newPassword = ref("");
const confirmPassword = ref("");

const saving = ref(false);
const successMsg = ref("");
const errorMsg = ref("");
const passwordError = ref("");

onMounted(() => {
  if (!auth.isLogged) {
    router.replace("/login");
    return;
  }
  username.value = auth.user.username ?? "";
  bio.value = auth.user.bio ?? "";
  email.value = auth.user.email ?? "";
});

async function saveProfile() {
  errorMsg.value = "";
  successMsg.value = "";
  saving.value = true;
  try {
    const updated = await updateUsuario(auth.user._id, {
      username: username.value,
      bio: bio.value,
      email: email.value,
    });
    auth.setUser({ ...auth.user, ...updated });
    successMsg.value = "Perfil actualizado correctamente.";
  } catch (e) {
    errorMsg.value = e.message;
  } finally {
    saving.value = false;
  }
}

async function changePassword() {
  passwordError.value = "";
  successMsg.value = "";
  if (newPassword.value !== confirmPassword.value) {
    passwordError.value = "Las contraseñas no coinciden.";
    return;
  }
  if (newPassword.value.length < 6) {
    passwordError.value =
      "La nueva contraseña debe tener al menos 6 caracteres.";
    return;
  }
  saving.value = true;
  try {
    await updateUsuario(auth.user._id, {
      currentPassword: currentPassword.value,
      newPassword: newPassword.value,
    });
    currentPassword.value = "";
    newPassword.value = "";
    confirmPassword.value = "";
    successMsg.value = "Contraseña cambiada correctamente.";
  } catch (e) {
    passwordError.value = e.message;
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div id="mainContainer-settings">
    <header>
      <headersSearchBar />
    </header>

    <main>
      <div class="settings-wrapper">
        <div class="settings-header">
          <button class="back-btn" @click="router.back()">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </button>
          <h1 class="page-title">Ajustes de perfil</h1>
        </div>

        <div v-if="successMsg" class="alert alert-success">
          {{ successMsg }}
        </div>

        <!-- Perfil general -->
        <section class="settings-card">
          <h2 class="card-title">Información del perfil</h2>

          <div class="field">
            <label>Nombre de usuario</label>
            <input v-model="username" type="text" maxlength="30" />
          </div>

          <div class="field">
            <label>Correo electrónico</label>
            <input v-model="email" type="email" />
          </div>

          <div class="field">
            <label>Descripción</label>
            <textarea
              v-model="bio"
              rows="4"
              maxlength="400"
              placeholder="Cuéntanos algo sobre ti..."
            />
            <span class="char-count">{{ bio.length }} / 400</span>
          </div>

          <div v-if="errorMsg" class="alert alert-error">{{ errorMsg }}</div>

          <button class="btn-primary" :disabled="saving" @click="saveProfile">
            <span v-if="saving">Guardando...</span>
            <span v-else>Guardar cambios</span>
          </button>
        </section>

        <!-- Cambio de contraseña -->
        <section class="settings-card">
          <h2 class="card-title">Cambiar contraseña</h2>

          <div class="field">
            <label>Contraseña actual</label>
            <input
              v-model="currentPassword"
              type="password"
              autocomplete="current-password"
            />
          </div>

          <div class="field">
            <label>Nueva contraseña</label>
            <input
              v-model="newPassword"
              type="password"
              autocomplete="new-password"
            />
          </div>

          <div class="field">
            <label>Confirmar nueva contraseña</label>
            <input
              v-model="confirmPassword"
              type="password"
              autocomplete="new-password"
            />
          </div>

          <div v-if="passwordError" class="alert alert-error">
            {{ passwordError }}
          </div>

          <button
            class="btn-primary"
            :disabled="
              saving || !currentPassword || !newPassword || !confirmPassword
            "
            @click="changePassword"
          >
            <span v-if="saving">Guardando...</span>
            <span v-else>Cambiar contraseña</span>
          </button>
        </section>
      </div>
    </main>

    <footer>
      <sectionNavMenu />
    </footer>
  </div>
</template>

<style scoped>
@media (prefers-color-scheme: dark) {
  #mainContainer-settings {
    --bg: #0d0e1a;
    --surface: #1a1b2e;
    --txt: #e8e6f0;
    --txt-muted: rgba(232, 230, 240, 0.5);
    --border: rgba(232, 230, 240, 0.12);
    --accent: #534ab7;
    --accent-hover: #6358d4;
    --input-bg: #252640;
    --success-bg: rgba(110, 231, 183, 0.1);
    --success-color: #6ee7b7;
    --error-bg: rgba(252, 165, 165, 0.1);
    --error-color: #fca5a5;
  }
}
@media (prefers-color-scheme: light) {
  #mainContainer-settings {
    --bg: #f0ede8;
    --surface: #ffffff;
    --txt: #3a3541;
    --txt-muted: rgba(58, 53, 65, 0.5);
    --border: rgba(58, 53, 65, 0.15);
    --accent: #534ab7;
    --accent-hover: #6358d4;
    --input-bg: #f4f0eb;
    --success-bg: rgba(4, 120, 87, 0.08);
    --success-color: #047857;
    --error-bg: rgba(220, 38, 38, 0.08);
    --error-color: #dc2626;
  }
}

#mainContainer-settings {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--bg);
  font-family: inherit;

  header {
    height: 9vh;
    width: 100%;
    display: flex;
    position: sticky;
    top: 0;
    z-index: 1000;
  }

  main {
    flex: 1;
    overflow-y: auto;
    padding: 32px 24px;
  }

  footer {
    width: 100%;
    min-height: 6vh;
    display: flex;
    position: relative;
  }
}

.settings-wrapper {
  max-width: 560px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.settings-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.back-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--txt-muted);
  display: flex;
  align-items: center;
  padding: 4px;
  border-radius: 6px;
  transition: color 0.15s;

  svg {
    width: 20px;
    height: 20px;
  }

  &:hover {
    color: var(--txt);
  }
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--txt);
  margin: 0;
}

.settings-card {
  background: var(--surface);
  border: 0.5px solid var(--border);
  border-radius: 10px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--txt);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0 0 4px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  position: relative;

  label {
    font-size: 12px;
    font-weight: 500;
    color: var(--txt-muted);
  }

  input,
  textarea {
    background: var(--input-bg);
    border: 0.5px solid var(--border);
    border-radius: 6px;
    color: var(--txt);
    font-size: 14px;
    font-family: inherit;
    padding: 9px 12px;
    outline: none;
    transition: border-color 0.15s;
    resize: vertical;

    &:focus {
      border-color: var(--accent);
    }

    &::placeholder {
      color: var(--txt-muted);
    }
  }
}

.char-count {
  font-size: 11px;
  color: var(--txt-muted);
  text-align: right;
}

.btn-primary {
  align-self: flex-start;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  padding: 9px 20px;
  cursor: pointer;
  transition:
    background 0.15s,
    opacity 0.15s;

  &:hover:not(:disabled) {
    background: var(--accent-hover);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.alert {
  font-size: 13px;
  border-radius: 6px;
  padding: 10px 14px;
}

.alert-success {
  background: var(--success-bg);
  color: var(--success-color);
  border: 0.5px solid var(--success-color);
}

.alert-error {
  background: var(--error-bg);
  color: var(--error-color);
  border: 0.5px solid var(--error-color);
}
</style>
