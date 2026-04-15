<script setup>
import { ref, onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import { getUsuarioPorNombre } from "../services/userService";
import headersSearchBar from "../components/headerSearchBar.component.vue";
import sectionNavMenu from "../components/sectionNavMenu.component.vue";

const route = useRoute();
const user = ref(null);
const loading = ref(true);
const error = ref(null);

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
  });
}

async function loadUser(username) {
  loading.value = true;
  error.value = null;
  user.value = null;
  try {
    user.value = await getUsuarioPorNombre(username);
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}

onMounted(() => loadUser(route.params.username));
watch(
  () => route.params.username,
  (u) => {
    if (u) loadUser(u);
  },
);
</script>

<template>
  <div id="mainContainer-user-profile">
    <header>
      <headersSearchBar />
    </header>

    <main>
      <div v-if="loading" class="state-msg">
        <div class="spinner"></div>
        <span>Cargando perfil...</span>
      </div>

      <div v-else-if="error" class="state-msg error">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span>{{ error }}</span>
      </div>

      <div v-else-if="user" class="profile-view">
        <div class="profile-header">
          <div class="avatar-placeholder">
            {{ user.username.charAt(0).toUpperCase() }}
          </div>
          <div class="profile-info">
            <div class="name-row">
              <h1 class="username">{{ user.username }}</h1>
              <span
                v-if="user.isVerified"
                class="verified-badge"
                title="Jugador verificado"
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Verificado
              </span>
            </div>
            <span class="join-date"
              >Miembro desde {{ formatDate(user.createdAt) }}</span
            >
          </div>
        </div>

        <div v-if="user.bio" class="bio-section">
          <p class="bio-text">{{ user.bio }}</p>
        </div>

        <div class="placeholder-section">
          <div class="placeholder-card">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
            >
              <path
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            <span>Decks públicos</span>
            <span class="coming-soon">Próximamente</span>
          </div>
          <div class="placeholder-card">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
            >
              <path
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
            <span>Commander Techs</span>
            <span class="coming-soon">Próximamente</span>
          </div>
          <div class="placeholder-card">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
            >
              <path
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <span>Discusiones</span>
            <span class="coming-soon">Próximamente</span>
          </div>
        </div>
      </div>
    </main>

    <footer>
      <sectionNavMenu />
    </footer>
  </div>
</template>

<style scoped>
@media (prefers-color-scheme: dark) {
  #mainContainer-user-profile {
    --bg: #0d0e1a;
    --surface: #1a1b2e;
    --surface2: #252640;
    --txt: #e8e6f0;
    --txt-muted: rgba(232, 230, 240, 0.5);
    --border: rgba(232, 230, 240, 0.12);
    --accent: #534ab7;
    --accent-text: #eeedfe;
    --verified-color: #6ee7b7;
    --spinner-color: #534ab7;
    --avatar-bg: #534ab7;
  }
}
@media (prefers-color-scheme: light) {
  #mainContainer-user-profile {
    --bg: #f0ede8;
    --surface: #ffffff;
    --surface2: #f4f0eb;
    --txt: #3a3541;
    --txt-muted: rgba(58, 53, 65, 0.5);
    --border: rgba(58, 53, 65, 0.15);
    --accent: #534ab7;
    --accent-text: #eeedfe;
    --verified-color: #047857;
    --spinner-color: #534ab7;
    --avatar-bg: #534ab7;
  }
}

#mainContainer-user-profile {
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

.state-msg {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  height: 100%;
  min-height: 200px;
  color: var(--txt-muted);
  font-size: 14px;
}
.state-msg.error {
  color: #fca5a5;
}
.state-msg svg {
  width: 36px;
  height: 36px;
}
.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--border);
  border-top-color: var(--spinner-color);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.profile-view {
  max-width: 720px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 20px;
}

.avatar-placeholder {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: var(--avatar-bg);
  color: var(--accent-text);
  font-size: 28px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 2px solid rgba(255, 255, 255, 0.15);
}

.profile-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.username {
  font-size: 22px;
  font-weight: 600;
  color: var(--txt);
}

.verified-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  color: var(--verified-color);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.verified-badge svg {
  width: 14px;
  height: 14px;
}

.join-date {
  font-size: 12px;
  color: var(--txt-muted);
}

.bio-section {
  background: var(--surface);
  border: 0.5px solid var(--border);
  border-radius: 8px;
  padding: 14px 16px;
}
.bio-text {
  font-size: 13.5px;
  color: var(--txt);
  line-height: 1.6;
  white-space: pre-wrap;
}

.placeholder-section {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
}

.placeholder-card {
  background: var(--surface);
  border: 0.5px solid var(--border);
  border-radius: 8px;
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  text-align: center;
  color: var(--txt-muted);
}
.placeholder-card svg {
  width: 28px;
  height: 28px;
  opacity: 0.5;
}
.placeholder-card span {
  font-size: 13px;
  color: var(--txt);
}
.placeholder-card .coming-soon {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--accent);
  border: 0.5px solid var(--accent);
  border-radius: 3px;
  padding: 2px 7px;
}
</style>
