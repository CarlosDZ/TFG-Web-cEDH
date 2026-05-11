<script setup>
import { ref, onMounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { getAllUsuarios, searchUsuarios } from "../services/userService";
import headersSearchBar from "../components/headerSearchBar.component.vue";
import sectionNavMenu from "../components/sectionNavMenu.component.vue";

const router = useRouter();
const route = useRoute();
const usuarios = ref([]);
const loading = ref(true);
const error = ref(null);
const page = ref(1);
const totalPages = ref(1);
const total = ref(0);

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
  });
}

async function loadPage(p) {
  loading.value = true;
  error.value = null;
  try {
    const data = await getAllUsuarios(p);
    usuarios.value = data.usuarios;
    total.value = data.total;
    totalPages.value = data.pages;
    page.value = data.page;
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}

async function loadWithQuery(q) {
  loading.value = true;
  error.value = null;
  try {
    const results = await searchUsuarios(q);
    usuarios.value = results;
    total.value = results.length;
    totalPages.value = 1;
    page.value = 1;
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}

function loadCurrent() {
  const q = route.query.q;
  if (q && q.trim().length >= 2) loadWithQuery(q.trim());
  else loadPage(1);
}

onMounted(loadCurrent);
watch(() => route.query.q, loadCurrent);
</script>

<template>
  <div id="mainContainer-jugadores">
    <header>
      <headersSearchBar />
    </header>

    <main>
      <div class="page-header">
        <h1 class="page-title">Jugadores</h1>
        <span v-if="!loading && !error" class="user-count"
          >{{ total }} jugadores</span
        >
      </div>

      <div v-if="loading" class="state-msg">
        <div class="spinner"></div>
        <span>Cargando jugadores...</span>
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

      <div v-else class="users-grid">
        <div
          v-for="user in usuarios"
          :key="user._id"
          class="user-card"
          @click="router.push(`/jugador/${user._id}`)"
        >
          <div class="card-avatar">
            {{ user.username.charAt(0).toUpperCase() }}
          </div>
          <div class="card-info">
            <div class="card-name-row">
              <span class="card-username">{{ user.username }}</span>
              <span
                v-if="user.isVerified"
                class="verified-badge"
                title="Jugador verificado"
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
            </div>
            <p v-if="user.bio" class="card-bio">{{ user.bio }}</p>
            <span class="card-date"
              >Desde {{ formatDate(user.createdAt) }}</span
            >
          </div>
        </div>
      </div>

      <div v-if="!loading && !error && totalPages > 1" class="pagination">
        <button
          class="page-btn"
          :disabled="page <= 1"
          @click="loadPage(page - 1)"
        >
          &#8592;
        </button>
        <span class="page-info">{{ page }} / {{ totalPages }}</span>
        <button
          class="page-btn"
          :disabled="page >= totalPages"
          @click="loadPage(page + 1)"
        >
          &#8594;
        </button>
      </div>
    </main>

    <footer>
      <sectionNavMenu />
    </footer>
  </div>
</template>

<style scoped>
@media (prefers-color-scheme: dark) {
  #mainContainer-jugadores {
    --surface: #1a1b2e;
    --surface-hover: #20213a;
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
  #mainContainer-jugadores {
    --surface: #ffffff;
    --surface-hover: #f4f0eb;
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

#mainContainer-jugadores {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
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
    display: flex;
    flex-direction: column;
    gap: 24px;
    background-color: var(--background-color);
  }

  footer {
    width: 100%;
    min-height: 6vh;
    display: flex;
    position: relative;
  }
}

.page-header {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.page-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--txt);
  margin: 0;
}

.user-count {
  font-size: 13px;
  color: var(--txt-muted);
}

.state-msg {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
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

.users-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px;
}

.user-card {
  background: var(--surface);
  border: 0.5px solid var(--border);
  border-radius: 10px;
  padding: 16px;
  display: flex;
  align-items: flex-start;
  gap: 14px;
  cursor: pointer;
  transition:
    background 0.15s,
    border-color 0.15s,
    transform 0.1s;
}
.user-card:hover {
  background: var(--surface-hover);
  border-color: var(--accent);
  transform: translateY(-1px);
}

.card-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--avatar-bg);
  color: var(--accent-text);
  font-size: 20px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 2px solid rgba(255, 255, 255, 0.1);
}

.card-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.card-name-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.card-username {
  font-size: 15px;
  font-weight: 600;
  color: var(--txt);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.verified-badge {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  color: var(--verified-color);
}
.verified-badge svg {
  width: 16px;
  height: 16px;
}

.card-bio {
  font-size: 12.5px;
  color: var(--txt-muted);
  line-height: 1.4;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-date {
  font-size: 11px;
  color: var(--txt-muted);
  margin-top: 2px;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 8px 0;
}

.page-btn {
  background: var(--surface);
  border: 0.5px solid var(--border);
  border-radius: 6px;
  color: var(--txt);
  padding: 6px 14px;
  cursor: pointer;
  font-size: 14px;
  transition:
    background 0.15s,
    border-color 0.15s;
}
.page-btn:hover:not(:disabled) {
  background: var(--surface-hover);
  border-color: var(--accent);
}
.page-btn:disabled {
  opacity: 0.35;
  cursor: default;
}

.page-info {
  font-size: 13px;
  color: var(--txt-muted);
}
</style>
