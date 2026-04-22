<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { marked } from "marked";
import { authState } from "../utils/auth";
import {
  getDeck,
  getDeckComments,
  isDeckLiked,
  toggleDeckLike,
  refreshDeckImages,
} from "../services/decklistService";
import sectionNavMenu from "../components/sectionNavMenu.component.vue";
import personalNavMenu from "../components/personalNavMenu.component.vue";
import headersSearchBar from "../components/headerSearchBar.component.vue";
import postOnFeed from "../components/discussions/postOnFeed.component.vue";
import discussionBuilderModal from "../components/discussions/discussionBuilder.modal.vue";

const route = useRoute();
const router = useRouter();
const auth = authState();

const deck = ref(null);
const comments = ref([]);
const loading = ref(true);
const error = ref(null);
const activeTab = ref("lista");
const visualMode = ref(false);
const loadingImages = ref(false);
const likedLocal = ref(false);
const likesLocal = ref(0);
const notification = ref(false);
let notifTimeout = null;
const showCommentModal = ref(false);

const COLOR_MAP = {
  W: { bg: "#f9f6e8", border: "#c8b87a", title: "White" },
  U: { bg: "#0e68ab", border: "#0a4f82", title: "Blue" },
  B: { bg: "#2a2a2a", border: "#555", title: "Black" },
  R: { bg: "#d3202a", border: "#a01820", title: "Red" },
  G: { bg: "#00733e", border: "#005a30", title: "Green" },
};

const commanders = computed(() =>
  Array.isArray(deck.value?.commander)
    ? deck.value.commander.join(" / ")
    : (deck.value?.commander ?? ""),
);

const authorName = computed(() => deck.value?.authorId?.username ?? "Anónimo");
const authorInitial = computed(() => authorName.value.charAt(0).toUpperCase());

function scryfallImg(name) {
  return deck.value?.card_images?.[name] ?? null;
}

async function enableVisualMode() {
  visualMode.value = true;
  const hasImages =
    deck.value?.card_images && Object.keys(deck.value.card_images).length > 0;
  if (hasImages) return;
  loadingImages.value = true;
  try {
    const { card_images } = await refreshDeckImages(deck.value._id);
    deck.value.card_images = card_images;
  } catch (err) {
    console.error("No se pudieron obtener las imágenes:", err);
  } finally {
    loadingImages.value = false;
  }
}

const colorPips = computed(() => {
  const identity = deck.value?.color_identity ?? "";
  if (!identity) return null;
  return identity
    .split("")
    .map((c) => COLOR_MAP[c])
    .filter(Boolean);
});

const fecha = computed(() => {
  if (!deck.value?.createdAt) return "";
  return new Date(deck.value.createdAt).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
});

const decktechHtml = computed(() => {
  if (!deck.value?.decktech_markdown) return "";
  const cleaned = deck.value.decktech_markdown.replace(/\n{3,}/g, "\n\n");
  return marked.parse(cleaned);
});

onMounted(async () => {
  try {
    deck.value = await getDeck(route.params.id);
    likesLocal.value = deck.value.likes ?? 0;
    if (auth.isLogged) {
      likedLocal.value = await isDeckLiked(route.params.id);
    }
    comments.value = await getDeckComments(route.params.id);
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
});

function showNotification() {
  notification.value = true;
  clearTimeout(notifTimeout);
  notifTimeout = setTimeout(() => {
    notification.value = false;
  }, 3000);
}

async function handleLike() {
  if (!auth.isLogged) {
    showNotification();
    return;
  }
  try {
    await toggleDeckLike(route.params.id);
    likedLocal.value = !likedLocal.value;
    likesLocal.value += likedLocal.value ? 1 : -1;
  } catch (err) {
    console.error(err);
  }
}

function handleNewComment() {
  if (!auth.isLogged) {
    showNotification();
    return;
  }
  showCommentModal.value = true;
}

function onCommentPublished(newComment) {
  showCommentModal.value = false;
  // newComment from backend won't have populated authorId, add a placeholder
  newComment.authorId = { username: auth.username ?? "Tú" };
  newComment.replyCount = 0;
  comments.value.unshift(newComment);
}
</script>

<template>
  <div id="mainContainer-deckdetail">
    <header>
      <headersSearchBar />
    </header>

    <main>
      <div class="deck-detail-scroll">
        <div v-if="loading" class="status-msg">Cargando decklist...</div>
        <div v-else-if="error" class="status-msg error">{{ error }}</div>

        <template v-else>
          <!-- Back -->
          <button class="back-btn" @click="router.back()">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Decklists
          </button>

          <!-- Hero -->
          <div class="deck-hero">
            <div class="deck-hero__top">
              <div class="deck-hero__meta">
                <div class="deck-hero__avatar">{{ authorInitial }}</div>
                <span class="deck-hero__author">{{ authorName }}</span>
                <span class="deck-hero__date">{{ fecha }}</span>
              </div>
              <div class="deck-hero__identity">
                <template v-if="colorPips">
                  <span
                    v-for="pip in colorPips"
                    :key="pip.title"
                    class="color-pip"
                    :style="{ background: pip.bg, borderColor: pip.border }"
                    :title="pip.title"
                  />
                </template>
                <span
                  v-else
                  class="color-pip color-pip--colorless"
                  title="Incoloro"
                  >C</span
                >
              </div>
            </div>

            <h1 class="deck-hero__title">{{ deck.title }}</h1>
            <p class="deck-hero__commanders">{{ commanders }}</p>
            <p v-if="deck.description" class="deck-hero__desc">
              {{ deck.description }}
            </p>

            <div class="deck-hero__footer">
              <div class="deck-hero__tags">
                <span
                  class="deck-tag"
                  v-for="tag in (deck.tags ?? []).slice(0, 5)"
                  :key="tag"
                  >{{ tag }}</span
                >
              </div>
              <button
                class="like-btn"
                :class="{ liked: likedLocal }"
                @click="handleLike"
              >
                <svg
                  class="heart"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M12 6.00019C10.2006 3.90317 7.19377 3.2551 4.93923 5.17534C2.68468 7.09558 2.36727 10.3061 4.13778 12.5772C5.60984 14.4654 10.0648 18.4479 11.5249 19.7369C11.6882 19.8811 11.7699 19.9532 11.8652 19.9815C11.9483 20.0062 12.0393 20.0062 12.1225 19.9815C12.2178 19.9532 12.2994 19.8811 12.4628 19.7369C13.9229 18.4479 18.3778 14.4654 19.8499 12.5772C21.6204 10.3061 21.3417 7.07538 19.0484 5.17534C16.7551 3.2753 13.7994 3.90317 12 6.00019Z"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
                <span>{{ likesLocal }}</span>
              </button>
            </div>
          </div>

          <!-- Tabs -->
          <nav class="tabs">
            <button
              class="tab-btn"
              :class="{ active: activeTab === 'lista' }"
              @click="activeTab = 'lista'"
            >
              Lista
            </button>
            <button
              v-if="deck.decktech_markdown"
              class="tab-btn"
              :class="{ active: activeTab === 'guia' }"
              @click="activeTab = 'guia'"
            >
              Guía
            </button>
            <button
              v-if="deck.allowComments"
              class="tab-btn"
              :class="{ active: activeTab === 'comentarios' }"
              @click="activeTab = 'comentarios'"
            >
              Comentarios
              <span class="tab-count">{{ comments.length }}</span>
            </button>
            <div v-if="activeTab === 'lista'" class="lista-toolbar">
              <button
                class="view-toggle"
                :class="{ active: !visualMode }"
                @click="visualMode = false"
                title="Vista lista"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <line x1="8" y1="6" x2="21" y2="6" />
                  <line x1="8" y1="12" x2="21" y2="12" />
                  <line x1="8" y1="18" x2="21" y2="18" />
                  <line x1="3" y1="6" x2="3.01" y2="6" />
                  <line x1="3" y1="12" x2="3.01" y2="12" />
                  <line x1="3" y1="18" x2="3.01" y2="18" />
                </svg>
              </button>
              <button
                class="view-toggle"
                :class="{ active: visualMode }"
                @click="enableVisualMode"
                title="Vista visual"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
              </button>
            </div>
          </nav>

          <!-- Tab: Lista -->
          <div v-if="activeTab === 'lista'" class="tab-content">
            <!-- Modo lista -->
            <template v-if="!visualMode">
              <section class="card-section">
                <h3 class="section-label">
                  Comandante{{ deck.commander?.length > 1 ? "s" : "" }}
                </h3>
                <ul class="card-list">
                  <li
                    v-for="card in deck.commander"
                    :key="card"
                    class="card-row"
                  >
                    <span class="card-name commander-name">{{ card }}</span>
                  </li>
                </ul>
              </section>

              <section class="card-section">
                <h3 class="section-label">Mazo</h3>
                <ul class="card-list">
                  <li v-for="card in deck.cards" :key="card" class="card-row">
                    <span class="card-name">{{ card }}</span>
                  </li>
                </ul>
              </section>

              <section
                v-if="(deck.alternative_choices ?? []).length"
                class="card-section"
              >
                <h3 class="section-label">
                  Opciones alternativas
                  <span class="section-count">{{
                    deck.alternative_choices.length
                  }}</span>
                </h3>
                <ul class="card-list">
                  <li
                    v-for="card in deck.alternative_choices"
                    :key="card"
                    class="card-row alt"
                  >
                    <span class="card-name">{{ card }}</span>
                  </li>
                </ul>
              </section>
            </template>

            <!-- Modo visual -->
            <div v-if="loadingImages" class="images-loading">
              Obteniendo imágenes...
            </div>
            <template v-else>
              <section class="card-section">
                <h3 class="section-label">
                  Comandante{{ deck.commander?.length > 1 ? "s" : "" }}
                </h3>
                <div class="card-img-grid">
                  <div
                    v-for="card in deck.commander"
                    :key="card"
                    class="card-img-wrap"
                  >
                    <img
                      v-if="scryfallImg(card)"
                      :src="scryfallImg(card)"
                      :alt="card"
                      :title="card"
                      loading="lazy"
                      class="card-img"
                    />
                    <span v-else class="card-img-missing" :title="card">{{
                      card
                    }}</span>
                  </div>
                </div>
              </section>

              <section class="card-section">
                <h3 class="section-label">Mazo</h3>
                <div class="card-img-grid">
                  <div
                    v-for="card in deck.cards"
                    :key="card"
                    class="card-img-wrap"
                  >
                    <img
                      v-if="scryfallImg(card)"
                      :src="scryfallImg(card)"
                      :alt="card"
                      :title="card"
                      loading="lazy"
                      class="card-img"
                    />
                    <span v-else class="card-img-missing" :title="card">{{
                      card
                    }}</span>
                  </div>
                </div>
              </section>

              <section
                v-if="(deck.alternative_choices ?? []).length"
                class="card-section"
              >
                <h3 class="section-label">
                  Opciones alternativas
                  <span class="section-count">{{
                    deck.alternative_choices.length
                  }}</span>
                </h3>
                <div class="card-img-grid">
                  <div
                    v-for="card in deck.alternative_choices"
                    :key="card"
                    class="card-img-wrap"
                  >
                    <img
                      v-if="scryfallImg(card)"
                      :src="scryfallImg(card)"
                      :alt="card"
                      :title="card"
                      loading="lazy"
                      class="card-img card-img--alt"
                    />
                    <span v-else class="card-img-missing" :title="card">{{
                      card
                    }}</span>
                  </div>
                </div>
              </section>
            </template>
          </div>

          <!-- Tab: Guía -->
          <div v-if="activeTab === 'guia'" class="tab-content">
            <div class="decktech-body" v-html="decktechHtml" />
          </div>

          <!-- Tab: Comentarios -->
          <div v-if="activeTab === 'comentarios'" class="tab-content">
            <button class="new-comment-btn" @click="handleNewComment">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path
                  d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                />
              </svg>
              Comentar
            </button>

            <div v-if="comments.length === 0" class="no-comments">
              Sin comentarios aún. ¡Sé el primero!
            </div>

            <div class="comments-feed">
              <postOnFeed
                v-for="(comment, index) in comments"
                :key="comment._id"
                :discusion-element="comment"
                :depth="0"
                :is-last="index === comments.length - 1"
              />
            </div>
          </div>
        </template>
      </div>

      <personalNavMenu />
    </main>

    <footer>
      <sectionNavMenu />
    </footer>

    <discussionBuilderModal
      v-if="showCommentModal"
      :parent-id="route.params.id"
      :commenting-on-deck="true"
      @close="showCommentModal = false"
      @published="onCommentPublished"
    />

    <Teleport to="body">
      <Transition name="notif">
        <div v-if="notification" class="notification">
          Estás en modo invitado. Inicia sesión para interactuar.
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
#mainContainer-deckdetail {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;

  header {
    height: 9vh;
    width: 100%;
    display: flex;
    position: sticky;
    top: 0;
    z-index: 1000;
  }

  main {
    width: 100%;
    flex: 1;
    display: flex;
    position: relative;
    overflow: hidden;
    background-color: var(--background-color);
  }

  footer {
    width: 100%;
    min-height: 6vh;
    display: flex;
    position: relative;
  }
}

.deck-detail-scroll {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-gutter: stable;
  padding: 1.25rem 1.5rem 3rem;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.status-msg {
  padding: 3rem;
  text-align: center;
  color: var(--txt-muted, #6b8caa);
  font-size: 14px;
}
.status-msg.error {
  color: #e24b4a;
}

/* Back button */
.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: none;
  border: 0.5px solid var(--border-color, #1c3a58);
  color: var(--txt-muted, #6b8caa);
  font-size: 12px;
  font-family: "Cinzel", serif;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 5px 12px 5px 8px;
  cursor: pointer;
  margin-bottom: 1.25rem;
  transition:
    color 0.15s,
    border-color 0.15s;
}
.back-btn:hover {
  color: var(--accent-muted, #afa9ec);
  border-color: #534ab7;
}
.back-btn svg {
  width: 14px;
  height: 14px;
}

/* Hero */
.deck-hero {
  background: var(--surface-bg, #080f18);
  border: 0.5px solid var(--border-color, #1c3a58);
  border-radius: 12px;
  padding: 1.5rem 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 1.25rem;
}

.deck-hero__top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.deck-hero__meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.deck-hero__avatar {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.15);
  flex-shrink: 0;
  background: #1c3a58;
  color: #afa9ec;
  font-size: 11px;
  font-weight: 700;
  font-family: "Cinzel", serif;
  display: flex;
  align-items: center;
  justify-content: center;
}

.deck-hero__author {
  font-family: "Cinzel", serif;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--accent-muted, #afa9ec);
}

.deck-hero__date {
  font-size: 11px;
  color: var(--txt-muted, #6b8caa);
}

.deck-hero__identity {
  display: flex;
  align-items: center;
  gap: 4px;
}

.deck-hero__title {
  font-family: "Cinzel", serif;
  font-size: 22px;
  font-weight: 600;
  color: var(--txt-title, #e8e3d8);
  margin: 4px 0 0;
  line-height: 1.25;
  letter-spacing: 0.03em;
}

.deck-hero__commanders {
  font-size: 13px;
  color: var(--accent-muted, #afa9ec);
  font-style: italic;
}

.deck-hero__desc {
  font-size: 13px;
  color: var(--txt-muted, #6b8caa);
  line-height: 1.6;
  margin-top: 4px;
}

.deck-hero__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 6px;
  flex-wrap: wrap;
  gap: 8px;
}

.deck-hero__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.deck-tag {
  font-size: 10px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  background: rgba(83, 74, 183, 0.15);
  color: var(--accent-muted, #afa9ec);
  border: 0.5px solid rgba(83, 74, 183, 0.3);
  border-radius: 4px;
  padding: 2px 8px;
}

/* Like button */
.like-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: 0.5px solid var(--border-color, #1c3a58);
  border-radius: 99px;
  padding: 5px 14px 5px 10px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  color: var(--txt-muted, #6b8caa);
  transition:
    background 0.15s,
    border-color 0.15s,
    color 0.15s;
}
.like-btn:hover {
  border-color: #e24b4a;
  color: #e24b4a;
}
.like-btn.liked {
  border-color: #e24b4a;
  color: #e24b4a;
}
.heart {
  width: 15px;
  height: 15px;
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.like-btn.liked .heart {
  transform: scale(1.2);
}
.heart path {
  fill: transparent;
  stroke: currentColor;
  stroke-width: 1.5;
  transition: fill 0.15s;
}
.like-btn.liked .heart path {
  fill: #e24b4a;
}

/* Color pips */
.color-pip {
  width: 15px;
  height: 15px;
  border-radius: 50%;
  border: 1px solid;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.color-pip--colorless {
  background: #3a3a3a;
  border-color: #666;
  color: #aaa;
  font-size: 8px;
  font-family: "Cinzel", serif;
  font-weight: 700;
}

/* Tabs */
.tabs {
  display: flex;
  align-items: center;
  gap: 0;
  border-bottom: 0.5px solid var(--border-color, #1c3a58);
  margin-bottom: 1.25rem;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  padding: 10px 18px;
  cursor: pointer;
  font-family: "Cinzel", serif;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--txt-muted, #6b8caa);
  margin-bottom: -1px;
  transition:
    color 0.15s,
    border-color 0.15s;
}
.tab-btn:hover {
  color: var(--accent-muted, #afa9ec);
}
.tab-btn.active {
  color: var(--accent-muted, #afa9ec);
  border-bottom-color: #534ab7;
}

.tab-count {
  font-size: 10px;
  background: rgba(83, 74, 183, 0.2);
  color: var(--accent-muted, #afa9ec);
  border-radius: 99px;
  padding: 1px 6px;
  font-family: monospace;
  letter-spacing: 0;
}

/* Tab content */
.tab-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Lista tab */
.card-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.section-label {
  font-family: "Cinzel", serif;
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--accent-muted, #afa9ec);
  margin: 0 0 4px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-count {
  font-family: monospace;
  font-size: 10px;
  color: var(--txt-muted, #6b8caa);
  text-transform: none;
  letter-spacing: 0;
}

.card-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
}

.card-row {
  display: flex;
  align-items: center;
  padding: 5px 10px;
  border-bottom: 0.5px solid rgba(28, 58, 88, 0.4);
  transition: background 0.1s;
}
.card-row:last-child {
  border-bottom: none;
}
.card-row:hover {
  background: rgba(83, 74, 183, 0.05);
}
.card-row.alt .card-name {
  color: var(--txt-muted, #6b8caa);
  font-style: italic;
}

.card-name {
  font-size: 13px;
  color: var(--txt-color, #c8c4b8);
  font-family: "Crimson Pro", Georgia, serif;
}

.commander-name {
  color: var(--accent-muted, #afa9ec);
  font-weight: 600;
}

/* Guía tab */
.decktech-body {
  font-family: "Crimson Pro", Georgia, serif;
  font-size: 15px;
  line-height: 1.7;
  color: var(--txt-color, #c8c4b8);
  max-width: 720px;
}

.decktech-body :deep(h1),
.decktech-body :deep(h2),
.decktech-body :deep(h3) {
  font-family: "Cinzel", serif;
  color: var(--txt-title, #e8e3d8);
  font-weight: 600;
  margin: 1.25rem 0 0.4rem;
  line-height: 1.2;
}
.decktech-body :deep(h1) {
  font-size: 1.3em;
}
.decktech-body :deep(h2) {
  font-size: 1.1em;
}
.decktech-body :deep(h3) {
  font-size: 1em;
}
.decktech-body :deep(p) {
  margin: 0 0 0.75rem;
}
.decktech-body :deep(strong) {
  font-weight: 600;
  color: var(--txt-color);
}
.decktech-body :deep(em) {
  font-style: italic;
}
.decktech-body :deep(blockquote) {
  border-left: 2px solid var(--border-color, #1c3a58);
  margin: 0.75rem 0;
  padding: 0.25rem 0 0.25rem 1rem;
  color: var(--txt-muted, #6b8caa);
  font-style: italic;
}
.decktech-body :deep(hr) {
  border: none;
  border-top: 0.5px solid var(--border-color, #1c3a58);
  margin: 1.25rem 0;
}
.decktech-body :deep(code) {
  font-family: monospace;
  font-size: 0.88em;
  background: rgba(83, 74, 183, 0.1);
  color: #afa9ec;
  padding: 1px 5px;
}
.decktech-body :deep(ul),
.decktech-body :deep(ol) {
  padding-left: 1.5rem;
  margin: 0 0 0.75rem;
}
.decktech-body :deep(li) {
  margin-bottom: 0.25rem;
}

/* Comments tab */
.new-comment-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  background: rgba(83, 74, 183, 0.12);
  border: 0.5px solid rgba(83, 74, 183, 0.35);
  color: var(--accent-muted, #afa9ec);
  font-family: "Cinzel", serif;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 8px 18px;
  cursor: pointer;
  align-self: flex-start;
  transition:
    background 0.15s,
    border-color 0.15s;
}
.new-comment-btn:hover {
  background: rgba(83, 74, 183, 0.22);
  border-color: #534ab7;
}
.new-comment-btn svg {
  width: 13px;
  height: 13px;
}

.no-comments {
  font-size: 13px;
  color: var(--txt-muted, #6b8caa);
  padding: 1.5rem 0;
}

.comments-feed {
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* View toggle */
.lista-toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: 12px;
  padding-left: 12px;
  border-left: 0.5px solid var(--border-color, #1c3a58);
  margin-bottom: 1px;
}

.view-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  background: none;
  border: 0.5px solid var(--border-color, #1c3a58);
  border-radius: 6px;
  cursor: pointer;
  color: var(--txt-muted, #6b8caa);
  transition:
    border-color 0.15s,
    color 0.15s,
    background 0.15s;
}
.view-toggle:hover {
  border-color: #534ab7;
  color: #afa9ec;
}
.view-toggle.active {
  border-color: #534ab7;
  background: rgba(83, 74, 183, 0.15);
  color: #afa9ec;
}
.view-toggle svg {
  width: 14px;
  height: 14px;
}

/* Visual mode grid */
.card-img-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 10px;
}

.card-img-wrap {
  aspect-ratio: 146 / 204;
  border-radius: 6px;
  overflow: hidden;
  background: var(--surface-bg, #080f18);
  border: 0.5px solid var(--border-color, #1c3a58);
}

.card-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.2s ease;
}
.card-img:hover {
  transform: scale(1.04);
}

.card-img--alt {
  opacity: 0.7;
}

.images-loading {
  font-size: 13px;
  color: var(--txt-muted, #6b8caa);
  padding: 2rem 0;
  opacity: 0.6;
}

.card-img-missing {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-size: 10px;
  color: var(--txt-muted, #6b8caa);
  text-align: center;
  padding: 4px;
  line-height: 1.3;
}

/* Notification */
.notification {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  background: var(--card-bg, #0d1b2a);
  border: 0.5px solid #e24b4a;
  color: #e24b4a;
  border-radius: 8px;
  padding: 8px 18px;
  font-size: 0.85em;
  font-weight: 500;
  pointer-events: none;
  z-index: 2000;
  white-space: nowrap;
}
.notif-enter-active,
.notif-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}
.notif-enter-from,
.notif-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(16px);
}
</style>
