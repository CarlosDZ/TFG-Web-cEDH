<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { autocompleteCards } from "../services/scryfallService";
import { searchUsuarios } from "../services/userService";
import {
  searchDiscusiones,
  searchDecks,
  searchTechs,
} from "../services/searchService";

const router = useRouter();

const searchFilter = ref("card");
const searchQuery = ref("");
// Each suggestion: { label: string, navigateTo: string, group: string|null }
const suggestions = ref([]);
const showSuggestions = ref(false);
const loadingSuggestions = ref(false);
const highlightedIndex = ref(-1);

let debounceTimer = null;
const DEBOUNCE_MS = 800;

// Groups for display: [{group, items: [{label, navigateTo, index}]}]
const groupedSuggestions = computed(() => {
  const groups = new Map();
  suggestions.value.forEach((s, i) => {
    const key = s.group ?? "";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push({ ...s, index: i });
  });
  return [...groups.entries()].map(([group, items]) => ({ group, items }));
});

function submitPath(q) {
  const t = q.trim();
  if (!t) return null;
  const f = searchFilter.value;
  if (f === "card") return `/carta/${encodeURIComponent(t)}`;
  if (f === "user") return `/jugador/${encodeURIComponent(t)}`;
  if (f === "discussion")
    return `/busqueda/discusiones?q=${encodeURIComponent(t)}`;
  if (f === "deck")
    return `/busqueda/decks?q=${encodeURIComponent(t)}&by=title`;
  if (f === "commander-tech")
    return `/busqueda/techs?q=${encodeURIComponent(t)}`;
  return null;
}

watch(searchQuery, (val) => {
  highlightedIndex.value = -1;
  clearTimeout(debounceTimer);

  if (!val || val.trim().length < 2) {
    suggestions.value = [];
    showSuggestions.value = false;
    loadingSuggestions.value = false;
    return;
  }

  loadingSuggestions.value = true;
  debounceTimer = setTimeout(async () => {
    const f = searchFilter.value;
    const q = val.trim();

    if (f === "card") {
      const names = (await autocompleteCards(val)).slice(0, 8);
      suggestions.value = names.map((n) => ({
        label: n,
        navigateTo: `/carta/${encodeURIComponent(n)}`,
        group: null,
      }));
    } else if (f === "user") {
      const users = await searchUsuarios(val);
      suggestions.value = users.map((u) => ({
        label: u.username,
        navigateTo: `/jugador/${encodeURIComponent(u.username)}`,
        group: null,
      }));
    } else if (f === "discussion") {
      const posts = await searchDiscusiones(val);
      suggestions.value = posts.slice(0, 8).map((p) => ({
        label: p.title || "(Sin título)",
        navigateTo: `/busqueda/discusiones?q=${encodeURIComponent(p.title || "")}`,
        group: null,
      }));
    } else if (f === "deck") {
      const [byTitle, byCommander] = await Promise.all([
        searchDecks(q, "title"),
        autocompleteCards(q),
      ]);
      suggestions.value = [
        ...byTitle.slice(0, 5).map((d) => ({
          label: d.title,
          navigateTo: `/busqueda/decks?q=${encodeURIComponent(d.title)}&by=title`,
          group: "Por título",
        })),
        ...byCommander.slice(0, 5).map((c) => ({
          label: c,
          navigateTo: `/busqueda/decks?q=${encodeURIComponent(c)}&by=commander`,
          group: "Por comandante",
        })),
      ];
    } else if (f === "commander-tech") {
      const [byTech, byCommander] = await Promise.all([
        searchTechs(q),
        autocompleteCards(q),
      ]);
      suggestions.value = [
        ...byTech.slice(0, 5).map((t) => ({
          label: Array.isArray(t.commander)
            ? t.commander.join(" / ")
            : t.commander,
          navigateTo: `/busqueda/techs?q=${encodeURIComponent(Array.isArray(t.commander) ? t.commander[0] : t.commander)}`,
          group: "En la base de datos",
        })),
        ...byCommander.slice(0, 5).map((c) => ({
          label: c,
          navigateTo: `/busqueda/techs?q=${encodeURIComponent(c)}`,
          group: "Buscar por comandante",
        })),
      ];
    } else {
      suggestions.value = [];
    }

    loadingSuggestions.value = false;
    showSuggestions.value = suggestions.value.length > 0;
  }, DEBOUNCE_MS);
});

watch(searchFilter, () => {
  suggestions.value = [];
  showSuggestions.value = false;
  loadingSuggestions.value = false;
  highlightedIndex.value = -1;
  clearTimeout(debounceTimer);
});

function navigateTo(path) {
  if (!path) return;
  showSuggestions.value = false;
  suggestions.value = [];
  router.push(path);
}

function onSubmit() {
  if (
    highlightedIndex.value >= 0 &&
    suggestions.value[highlightedIndex.value]
  ) {
    navigateTo(suggestions.value[highlightedIndex.value].navigateTo);
  } else {
    navigateTo(submitPath(searchQuery.value));
  }
}

function onSuggestionClick(suggestion) {
  searchQuery.value = suggestion.label;
  navigateTo(suggestion.navigateTo);
}

function onKeydown(e) {
  if (!showSuggestions.value) return;
  if (e.key === "ArrowDown") {
    e.preventDefault();
    highlightedIndex.value = Math.min(
      highlightedIndex.value + 1,
      suggestions.value.length - 1,
    );
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    highlightedIndex.value = Math.max(highlightedIndex.value - 1, -1);
  } else if (e.key === "Escape") {
    showSuggestions.value = false;
    highlightedIndex.value = -1;
  }
}

function onClickOutside(e) {
  const el = document.getElementById("header-search-bar");
  if (el && !el.contains(e.target)) {
    showSuggestions.value = false;
    highlightedIndex.value = -1;
  }
}

onMounted(() => document.addEventListener("click", onClickOutside));
onUnmounted(() => {
  document.removeEventListener("click", onClickOutside);
  clearTimeout(debounceTimer);
});
</script>

<template>
  <div id="header-search-bar">
    <div class="brand-section">
      <div class="brand-inner" @click="router.push('/dashboard')">
        <div class="brand-content">
          <div class="logo-wrap">
            <img
              src="../assets/images/texture_placeholder.jpg"
              alt="Spain cEDH"
            />
          </div>
          <div class="brand-text">
            <span class="brand-name">Spain cEDH</span>
            <span class="brand-sub">Community</span>
          </div>
        </div>
      </div>
    </div>

    <div class="search-zone">
      <div
        class="search-wrap"
        :class="{ focused: showSuggestions || loadingSuggestions }"
      >
        <div class="select-wrap">
          <select v-model="searchFilter" class="search-filter">
            <option value="card">Cartas</option>
            <option value="deck">Decks</option>
            <option value="commander-tech">Techs</option>
            <option value="user">Jugadores</option>
            <option value="discussion">Discusiones</option>
          </select>
          <svg
            class="select-arrow"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>

        <div class="input-suggestions-wrap">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar en Spain cEDH..."
            class="search-input"
            @keydown="onKeydown"
            @keydown.enter="onSubmit"
            @focus="showSuggestions = suggestions.length > 0"
            autocomplete="off"
          />

          <div
            v-if="showSuggestions && suggestions.length > 0"
            class="suggestions-dropdown"
          >
            <template v-for="grp in groupedSuggestions" :key="grp.group">
              <div v-if="grp.group" class="suggestion-group-label">
                {{ grp.group }}
              </div>
              <button
                v-for="s in grp.items"
                :key="s.navigateTo"
                class="suggestion-item"
                :class="{ highlighted: s.index === highlightedIndex }"
                @click="onSuggestionClick(s)"
                @mouseenter="highlightedIndex = s.index"
              >
                <svg
                  class="suggestion-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                {{ s.label }}
              </button>
            </template>
          </div>
        </div>

        <button class="search-submit" title="Buscar" @click="onSubmit">
          <svg
            v-if="!loadingSuggestions"
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <div v-else class="btn-spinner"></div>
        </button>
      </div>
    </div>

    <div class="profile-section">
      <div class="profile-inner">
        <div class="profile-content">
          <div class="avatar-wrap">
            <img src="../assets/images/avatar.jpg" alt="Avatar" />
          </div>
          <span class="profile-label">Mi perfil</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@media (prefers-color-scheme: dark) {
  #header-search-bar {
    --bg: #1a1b2e;
    --txt: #e8e6f0;
    --txt-muted: rgba(232, 230, 240, 0.45);
    --border: rgba(232, 230, 240, 0.18);
    --input-bg: #2a2b42;
    --accent: #534ab7;
    --accent-hover: #3c3489;
    --accent-text: #eeedfe;
    --accent-muted: #afa9ec;
    --focus-ring: rgba(83, 74, 183, 0.28);
    --dropdown-bg: #1e1f36;
    --dropdown-border: rgba(232, 230, 240, 0.12);
    --dropdown-hover: #2a2b42;
    --dropdown-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  }
}
@media (prefers-color-scheme: light) {
  #header-search-bar {
    --bg: #f4f0eb;
    --txt: #3a3541;
    --txt-muted: rgba(58, 53, 65, 0.45);
    --border: rgba(58, 53, 65, 0.2);
    --input-bg: #ffffff;
    --accent: #534ab7;
    --accent-hover: #3c3489;
    --accent-text: #eeedfe;
    --accent-muted: #afa9ec;
    --focus-ring: rgba(83, 74, 183, 0.2);
    --dropdown-bg: #ffffff;
    --dropdown-border: rgba(58, 53, 65, 0.15);
    --dropdown-hover: #f4f0eb;
    --dropdown-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  }
}

#header-search-bar {
  display: flex;
  align-items: stretch;
  width: 100%;
  height: 100%;
  overflow: visible;
  background-color: var(--bg);
  border-bottom: 0.5px solid var(--border);
  box-sizing: border-box;
  font-family: inherit;
}

.brand-section {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}
.brand-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 0 36px 0 216px;
  background: var(--accent);
  transform: skewX(-18deg);
  transform-origin: bottom left;
  translate: -218px 0;
  min-width: 130px;
  cursor: pointer;
  transition: background 0.2s;
}
.brand-inner:hover {
  background: var(--accent-hover);
}
.brand-content {
  transform: skewX(18deg);
  translate: 18px 0;
  display: flex;
  align-items: center;
  gap: 10px;
}
.logo-wrap {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  overflow: hidden;
  flex-shrink: 0;
}
.logo-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.brand-text {
  display: flex;
  flex-direction: column;
  line-height: 1.15;
}
.brand-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--accent-text);
  white-space: nowrap;
  letter-spacing: 0.02em;
}
.brand-sub {
  font-size: 10px;
  color: var(--accent-muted);
  text-transform: uppercase;
  letter-spacing: 0.07em;
  white-space: nowrap;
}

.search-zone {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 12px;
  position: relative;
  z-index: 200;
}
.search-wrap {
  display: flex;
  align-items: center;
  width: 100%;
  max-width: 620px;
  height: 38px;
  background: var(--input-bg);
  border: 0.5px solid var(--border);
  border-radius: 4px;
  overflow: visible;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
  position: relative;
}
.search-wrap:focus-within,
.search-wrap.focused {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px var(--focus-ring);
}
.select-wrap {
  position: relative;
  display: flex;
  align-items: center;
  flex-shrink: 0;
  border-right: 0.5px solid var(--border);
  height: 38px;
}
.search-filter {
  background: transparent;
  border: none;
  color: var(--txt);
  font-size: 12px;
  font-weight: 500;
  padding: 0 28px 0 12px;
  height: 38px;
  cursor: pointer;
  outline: none;
  -webkit-appearance: none;
  appearance: none;
}
.select-arrow {
  position: absolute;
  right: 8px;
  width: 10px;
  height: 10px;
  color: var(--txt-muted);
  pointer-events: none;
}

.input-suggestions-wrap {
  flex: 1;
  position: relative;
  height: 38px;
  display: flex;
  align-items: center;
}
.search-input {
  width: 100%;
  height: 100%;
  background: transparent;
  border: none;
  color: var(--txt);
  font-size: 13px;
  padding: 0 12px;
  outline: none;
  box-sizing: border-box;
}
.search-input::placeholder {
  color: var(--txt-muted);
  font-size: 12px;
}

.suggestions-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  left: -1px;
  right: -1px;
  background: var(--dropdown-bg);
  border: 0.5px solid var(--dropdown-border);
  border-radius: 6px;
  box-shadow: var(--dropdown-shadow);
  overflow: hidden;
  z-index: 300;
}
.suggestion-group-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--accent-muted);
  padding: 6px 14px 3px;
  pointer-events: none;
}
.suggestion-item {
  display: flex;
  align-items: center;
  gap: 9px;
  width: 100%;
  padding: 9px 14px;
  background: transparent;
  border: none;
  color: var(--txt);
  font-size: 13px;
  text-align: left;
  cursor: pointer;
  transition: background 0.1s;
}
.suggestion-item:hover,
.suggestion-item.highlighted {
  background: var(--dropdown-hover);
}
.suggestion-icon {
  width: 12px;
  height: 12px;
  color: var(--txt-muted);
  flex-shrink: 0;
}

.search-submit {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  background: var(--accent);
  border: none;
  cursor: pointer;
  color: var(--accent-text);
  transition:
    background 0.15s,
    transform 0.15s;
  border-radius: 0 4px 4px 0;
}
.search-submit:hover {
  background: var(--accent-hover);
}
.search-submit:active {
  transform: scale(0.9);
}
.btn-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.profile-section {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}
.profile-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 0 216px 0 36px;
  background: var(--accent);
  transform: skewX(18deg);
  transform-origin: bottom right;
  translate: 218px 0;
  cursor: pointer;
  transition: background 0.15s;
}
.profile-inner:hover {
  background: var(--accent-hover);
}
.profile-content {
  transform: skewX(-18deg);
  translate: -18px 0;
  display: flex;
  align-items: center;
  gap: 9px;
}
.avatar-wrap {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1.5px solid rgba(255, 255, 255, 0.25);
  overflow: hidden;
  flex-shrink: 0;
}
.avatar-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.profile-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--accent-text);
  white-space: nowrap;
}

@media (max-width: 768px) {
  .brand-section {
    display: none;
  }
  .profile-label {
    display: none;
  }
  .search-zone {
    padding: 0 8px;
  }
}
</style>
