<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  searchDiscusiones,
  searchDecks,
  searchTechs,
} from "../services/searchService";
import headersSearchBar from "../components/headerSearchBar.component.vue";
import sectionNavMenu from "../components/sectionNavMenu.component.vue";

const route = useRoute();
const router = useRouter();

const results = ref([]);
const loading = ref(false);
const error = ref(null);

const type = computed(() => route.params.type); // discusiones | decks | techs
const q = computed(() => route.query.q || "");
const by = computed(() => route.query.by || "title");

const typeLabels = {
  discusiones: "Discusiones",
  decks: "Decks",
  techs: "Techs",
};

const byLabels = { title: "título", commander: "comandante" };

function formatDate(d) {
  return new Date(d).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function commanderLabel(arr) {
  return Array.isArray(arr) ? arr.join(" / ") : arr;
}

const colorMap = {
  W: "#f9f6e8",
  U: "#0e68ab",
  B: "#21201e",
  R: "#d3202a",
  G: "#00733e",
};
const colorTextMap = {
  W: "#3a3541",
  U: "#fff",
  B: "#fff",
  R: "#fff",
  G: "#fff",
};

async function runSearch() {
  if (!q.value || q.value.trim().length < 2) {
    results.value = [];
    return;
  }
  loading.value = true;
  error.value = null;
  try {
    if (type.value === "discusiones") {
      results.value = await searchDiscusiones(q.value);
    } else if (type.value === "decks") {
      results.value = await searchDecks(q.value, by.value);
    } else if (type.value === "techs") {
      results.value = await searchTechs(q.value);
    } else {
      results.value = [];
    }
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}

onMounted(runSearch);
watch([type, q, by], runSearch);
</script>

<template>
  <div id="mainContainer-search-results">
    <header>
      <headersSearchBar />
    </header>

    <main>
      <div class="results-wrapper">
        <!-- Header de búsqueda -->
        <div class="search-header">
          <div class="search-meta">
            <span class="type-badge">{{ typeLabels[type] ?? type }}</span>
            <span class="search-desc">
              Resultados para
              <strong>"{{ q }}"</strong>
              <span v-if="type !== 'discusiones' && type !== 'techs'">
                por {{ byLabels[by] ?? by }}
              </span>
            </span>
          </div>
          <!-- Switcher título/comandante solo para decks -->
          <div v-if="type === 'decks'" class="by-switcher">
            <button
              :class="{ active: by === 'title' }"
              @click="router.push({ query: { q, by: 'title' } })"
            >
              Por título
            </button>
            <button
              :class="{ active: by === 'commander' }"
              @click="router.push({ query: { q, by: 'commander' } })"
            >
              Por comandante
            </button>
          </div>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="state-msg">
          <div class="spinner"></div>
          <span>Buscando...</span>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="state-msg state-error">
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

        <!-- Sin resultados -->
        <div
          v-else-if="results.length === 0 && q.length >= 2"
          class="state-msg"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <span>No se encontraron resultados para "{{ q }}"</span>
        </div>

        <!-- ── Resultados: Discusiones ── -->
        <ul v-else-if="type === 'discusiones'" class="results-list">
          <li
            v-for="item in results"
            :key="item._id"
            class="result-card discussion-card"
          >
            <div class="card-top">
              <h2 class="card-title">{{ item.title || "(Sin título)" }}</h2>
              <div class="card-stats">
                <span class="stat">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                    />
                  </svg>
                  {{ item.likes }}
                </span>
                <span class="stat">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                    />
                  </svg>
                  {{ item.replyCount ?? 0 }}
                </span>
              </div>
            </div>
            <p class="card-excerpt">
              {{ (item.markdown_text || "").slice(0, 160)
              }}{{ (item.markdown_text || "").length > 160 ? "…" : "" }}
            </p>
            <div class="card-footer">
              <span class="card-author">{{ item.authorId?.username }}</span>
              <span class="card-date">{{ formatDate(item.createdAt) }}</span>
            </div>
          </li>
        </ul>

        <!-- ── Resultados: Decks ── -->
        <ul v-else-if="type === 'decks'" class="results-list">
          <li
            v-for="item in results"
            :key="item._id"
            class="result-card deck-card"
          >
            <div class="card-top">
              <h2 class="card-title">{{ item.title }}</h2>
              <div class="color-pips">
                <span
                  v-for="c in (item.color_identity || '').split('')"
                  :key="c"
                  class="color-pip"
                  :style="{
                    background: colorMap[c],
                    color: colorTextMap[c],
                    borderColor: colorMap[c],
                  }"
                  >{{ c }}</span
                >
              </div>
            </div>
            <p class="card-commander">{{ commanderLabel(item.commander) }}</p>
            <div class="card-footer">
              <span class="card-author">{{ item.authorId?.username }}</span>
              <span class="stat">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                  />
                </svg>
                {{ item.likes }}
              </span>
            </div>
          </li>
        </ul>

        <!-- ── Resultados: Techs ── -->
        <ul v-else-if="type === 'techs'" class="results-list">
          <li
            v-for="item in results"
            :key="item._id"
            class="result-card tech-card"
          >
            <div class="card-top">
              <h2 class="card-title">{{ commanderLabel(item.commander) }}</h2>
              <span class="stat">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                  />
                </svg>
                {{ item.likes }}
              </span>
            </div>
            <div class="card-footer">
              <span class="card-author">{{ item.authorId?.username }}</span>
              <span class="card-date">{{
                formatDate(item.lastChangeDate)
              }}</span>
            </div>
          </li>
        </ul>
      </div>
    </main>

    <footer>
      <sectionNavMenu />
    </footer>
  </div>
</template>

<style scoped>
@media (prefers-color-scheme: dark) {
  #mainContainer-search-results {
    --bg: #0d0e1a;
    --surface: #1a1b2e;
    --surface2: #252640;
    --txt: #e8e6f0;
    --txt-muted: rgba(232, 230, 240, 0.5);
    --border: rgba(232, 230, 240, 0.12);
    --accent: #534ab7;
    --accent-text: #eeedfe;
    --spinner-color: #534ab7;
    --switcher-bg: #252640;
    --switcher-active-bg: #534ab7;
  }
}
@media (prefers-color-scheme: light) {
  #mainContainer-search-results {
    --bg: #f0ede8;
    --surface: #ffffff;
    --surface2: #f4f0eb;
    --txt: #3a3541;
    --txt-muted: rgba(58, 53, 65, 0.5);
    --border: rgba(58, 53, 65, 0.15);
    --accent: #534ab7;
    --accent-text: #eeedfe;
    --spinner-color: #534ab7;
    --switcher-bg: #e8e4df;
    --switcher-active-bg: #534ab7;
  }
}

#mainContainer-search-results {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--bg);
  font-family: inherit;

  header {
    height: 9vh;
    width: 100%;
    position: sticky;
    top: 0;
    z-index: 1000;
  }
  main {
    flex: 1;
    overflow-y: auto;
    padding: 28px 24px;
  }
  footer {
    width: 100%;
    min-height: 6vh;
    display: flex;
    position: relative;
  }
}

.results-wrapper {
  max-width: 760px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Search header */
.search-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}
.search-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.type-badge {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--accent-text);
  background: var(--accent);
  padding: 3px 10px;
  border-radius: 4px;
}
.search-desc {
  font-size: 13px;
  color: var(--txt-muted);
}
.search-desc strong {
  color: var(--txt);
}
.by-switcher {
  display: flex;
  background: var(--switcher-bg);
  border-radius: 6px;
  padding: 3px;
  gap: 2px;
}
.by-switcher button {
  background: transparent;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  color: var(--txt-muted);
  padding: 4px 12px;
  cursor: pointer;
  transition:
    background 0.15s,
    color 0.15s;
}
.by-switcher button.active {
  background: var(--switcher-active-bg);
  color: var(--accent-text);
}

/* State messages */
.state-msg {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 48px 0;
  color: var(--txt-muted);
  font-size: 14px;
}
.state-msg svg {
  width: 36px;
  height: 36px;
}
.state-error {
  color: #fca5a5;
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

/* Result cards */
.results-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.result-card {
  background: var(--surface);
  border: 0.5px solid var(--border);
  border-radius: 8px;
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: border-color 0.15s;
  cursor: pointer;
}
.result-card:hover {
  border-color: var(--accent);
}
.card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.card-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--txt);
  line-height: 1.3;
}
.card-stats {
  display: flex;
  gap: 12px;
  flex-shrink: 0;
}
.stat {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--txt-muted);
}
.stat svg {
  width: 12px;
  height: 12px;
}
.card-excerpt {
  font-size: 13px;
  color: var(--txt-muted);
  line-height: 1.5;
}
.card-commander {
  font-size: 12.5px;
  color: var(--accent-text);
  background: rgba(83, 74, 183, 0.2);
  border-radius: 4px;
  padding: 2px 8px;
  align-self: flex-start;
  font-style: italic;
}
.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.card-author {
  font-size: 11.5px;
  color: var(--txt-muted);
}
.card-author::before {
  content: "por ";
}
.card-date {
  font-size: 11px;
  color: var(--txt-muted);
}
.color-pips {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}
.color-pip {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1.5px solid;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  font-weight: 700;
}
</style>
