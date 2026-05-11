<script setup>
import { ref, onMounted, watch, computed } from "vue";
import { marked } from "marked";
import { useRoute, useRouter } from "vue-router";
import { getUsuarioPorId } from "../services/userService";
import { authState } from "../utils/auth";
import { getDecklistsByUser } from "../services/decklistService";
import { getCommanderTechsByUser } from "../services/commanderTechService";
import { getDiscusionesByUser } from "../services/discussionService";
import headersSearchBar from "../components/headerSearchBar.component.vue";
import sectionNavMenu from "../components/sectionNavMenu.component.vue";
import DeckCard from "../components/decklists/deckCard.component.vue";
import CommanderTechCard from "../components/commanderTechs/commanderTechCard.component.vue";
import CommanderTechDetail from "../components/commanderTechs/commanderTechDetail.vue";
import DiscussionDetail from "../components/discussions/discussionDetail.vue";

const route = useRoute();
const router = useRouter();
const auth = authState();
const user = ref(null);
const isOwnProfile = computed(
  () => auth.isLogged && auth.user?.id === route.params.id,
);
const loading = ref(true);
const error = ref(null);

const decks = ref([]);
const techs = ref([]);
const discussions = ref([]);
const selectedTech = ref(null);
const selectedDiscussion = ref(null);

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
  });
}

function formatDateShort(dateStr) {
  return new Date(dateStr).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

async function loadUser(id) {
  loading.value = true;
  error.value = null;
  user.value = null;
  decks.value = [];
  techs.value = [];
  discussions.value = [];
  try {
    user.value = await getUsuarioPorId(id);
    [decks.value, techs.value, discussions.value] = await Promise.all([
      getDecklistsByUser(id),
      getCommanderTechsByUser(id),
      getDiscusionesByUser(id),
    ]);
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}

async function handleLogout() {
  await auth.logout();
  router.push("/login");
}

onMounted(() => loadUser(route.params.id));
watch(
  () => route.params.id,
  (id) => {
    if (id) loadUser(id);
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
        <!-- Header -->
        <div class="profile-header">
          <div class="avatar-placeholder">
            {{ user.username.charAt(0).toUpperCase() }}
          </div>
          <div class="profile-info">
            <div class="name-row">
              <h1 class="username">{{ user.username }}</h1>
              <button
                v-if="isOwnProfile"
                class="settings-btn"
                title="Ajustes de perfil"
                @click="router.push('/ajustes-perfil')"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                >
                  <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
                  <path
                    d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"
                  />
                </svg>
              </button>
              <button
                v-if="isOwnProfile"
                class="settings-btn logout-btn"
                title="Cerrar sesión"
                @click="handleLogout"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
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

        <!-- Bio -->
        <div v-if="user.bio" class="bio-section">
          <p class="bio-text">{{ user.bio }}</p>
        </div>

        <!-- Decks públicos -->
        <section class="content-section">
          <h2 class="section-title">
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
            Decks públicos
            <span class="section-count">{{ decks.length }}</span>
          </h2>
          <div v-if="decks.length" class="cards-grid">
            <DeckCard v-for="deck in decks" :key="deck._id" :deck="deck" />
          </div>
          <p v-else class="empty-msg">Este jugador no tiene decks públicos.</p>
        </section>

        <!-- Commander Techs -->
        <section class="content-section">
          <h2 class="section-title">
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
            Techs
            <span class="section-count">{{ techs.length }}</span>
          </h2>
          <div v-if="techs.length" class="cards-grid">
            <CommanderTechCard
              v-for="tech in techs"
              :key="tech._id"
              :tech="tech"
              @open="selectedTech = $event"
            />
          </div>
          <p v-else class="empty-msg">
            Este jugador no ha publicado ninguna tech.
          </p>
        </section>

        <!-- Discusiones -->
        <section class="content-section">
          <h2 class="section-title">
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
            Discusiones
            <span class="section-count">{{ discussions.length }}</span>
          </h2>
          <div v-if="discussions.length" class="discussions-list">
            <article
              v-for="d in discussions"
              :key="d._id"
              class="discussion-card"
              style="cursor: pointer"
              @click="selectedDiscussion = d"
            >
              <h3 class="discussion-title">{{ d.title || "Sin título" }}</h3>
              <div
                v-if="d.markdown_text"
                class="discussion-preview"
                v-html="
                  marked.parse(d.markdown_text.replace(/\n{3,}/g, '\n\n'))
                "
              />
              <div class="discussion-meta">
                <span class="meta-item">
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    width="11"
                    height="11"
                  >
                    <path
                      d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                    />
                  </svg>
                  {{ d.likes ?? 0 }}
                </span>
                <span class="meta-item">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    width="11"
                    height="11"
                  >
                    <path
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  {{ d.replyCount ?? 0 }}
                </span>
                <span class="meta-date">{{
                  formatDateShort(d.createdAt)
                }}</span>
              </div>
            </article>
          </div>
          <p v-else class="empty-msg">
            Este jugador no ha iniciado ninguna discusión.
          </p>
        </section>
      </div>
    </main>

    <CommanderTechDetail
      v-if="selectedTech"
      :tech="selectedTech"
      @close="selectedTech = null"
    />

    <DiscussionDetail
      v-if="selectedDiscussion"
      :post="selectedDiscussion"
      @close="selectedDiscussion = null"
    />

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
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 32px;
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

.settings-btn {
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
    width: 18px;
    height: 18px;
  }

  &:hover {
    color: var(--accent);
  }
}

.logout-btn:hover {
  color: #e06868;
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
  margin: 0;
}

/* Sections */
.content-section {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--txt);
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.section-title svg {
  width: 16px;
  height: 16px;
  opacity: 0.7;
  flex-shrink: 0;
}

.section-count {
  font-size: 11px;
  font-weight: 500;
  color: var(--accent);
  background: rgba(83, 74, 183, 0.12);
  border: 0.5px solid rgba(83, 74, 183, 0.3);
  border-radius: 10px;
  padding: 1px 8px;
  letter-spacing: 0;
  text-transform: none;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px;
}

.empty-msg {
  font-size: 13px;
  color: var(--txt-muted);
  margin: 0;
  padding: 16px 0;
}

/* Discussion cards */
.discussions-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.discussion-card {
  background: var(--surface);
  border: 0.5px solid var(--border);
  border-radius: 8px;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 120px;
  transition: border-color 0.15s;
}
.discussion-card:hover {
  border-color: var(--accent);
}

.discussion-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--txt);
  margin: 0;
}

.discussion-preview {
  font-size: 11px;
  color: var(--txt-muted);
  line-height: 1.55;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.discussion-preview :deep(p) {
  margin: 0 0 4px;
}
.discussion-preview :deep(h1),
.discussion-preview :deep(h2),
.discussion-preview :deep(h3) {
  font-size: 11px;
  font-weight: 600;
  margin: 0 0 4px;
}
.discussion-preview :deep(ul),
.discussion-preview :deep(ol) {
  margin: 0;
  padding-left: 16px;
}
.discussion-preview :deep(code) {
  font-size: 10px;
}

.discussion-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 2px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--txt-muted);
}
.meta-item svg {
  color: var(--accent);
}

.meta-date {
  font-size: 11px;
  color: var(--txt-muted);
  margin-left: auto;
}
</style>
