<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import { getCardByName } from "../services/scryfallService";
import headersSearchBar from "../components/headerSearchBar.component.vue";
import sectionNavMenu from "../components/sectionNavMenu.component.vue";

const route = useRoute();
const card = ref(null);
const loading = ref(true);
const error = ref(null);
const showBack = ref(false);

// DFC = layouts where the card physically flips; shown with a flip button.
const DFC_LAYOUTS = [
  "transform",
  "modal_dfc",
  "reversible_card",
  "double_faced_token",
];

// Labels for layouts where card_faces exist but the card doesn't flip —
// the secondary face is rendered as an inline panel.
const SECONDARY_FACE_LABELS = {
  adventure: "Aventura",
  prepare: "Hechizo preparado",
  split: "Segundo hechizo",
  aftermath: "Aftermath",
  flip: "Forma volteada",
};

const isDFC = computed(
  () => card.value && DFC_LAYOUTS.includes(card.value.layout),
);

// Non-DFC cards with card_faces get a secondary panel instead of a flip button.
const hasSecondaryFace = computed(
  () => !isDFC.value && !!card.value?.card_faces?.[1],
);

const secondaryFaceLabel = computed(
  () => SECONDARY_FACE_LABELS[card.value?.layout] ?? "Hechizo adjunto",
);

// Always use per-face data when card_faces exists, so the root mana_cost
// (e.g. "{1}{R} // {R}") is never shown directly.
const currentFace = computed(() => {
  if (!card.value) return null;
  if (card.value.card_faces) {
    return card.value.card_faces[showBack.value ? 1 : 0];
  }
  return card.value;
});

const secondaryFace = computed(() =>
  hasSecondaryFace.value ? card.value.card_faces[1] : null,
);

const currentImage = computed(() => {
  if (!card.value) return null;
  if (isDFC.value && card.value.card_faces) {
    return card.value.card_faces[showBack.value ? 1 : 0].image_uris?.normal;
  }
  return card.value.image_uris?.normal;
});

const isCommanderLegal = computed(
  () => card.value?.legalities?.commander === "legal",
);

function parseManaSymbols(manaCost) {
  if (!manaCost) return [];
  const regex = /\{([^}]+)\}/g;
  const symbols = [];
  let match;
  while ((match = regex.exec(manaCost)) !== null) {
    symbols.push(match[1]);
  }
  return symbols;
}

function manaSymbolUrl(symbol) {
  return `https://svgs.scryfall.io/card-symbols/${encodeURIComponent(symbol)}.svg`;
}

const colorIdentityColors = {
  W: { bg: "#f9faf4", border: "#c8b560", label: "Blanco" },
  U: { bg: "#0e68ab", border: "#0a4f80", label: "Azul" },
  B: { bg: "#21201e", border: "#6e6e6e", label: "Negro" },
  R: { bg: "#d3202a", border: "#9e1a20", label: "Rojo" },
  G: { bg: "#00733e", border: "#005530", label: "Verde" },
};

async function loadCard(name) {
  loading.value = true;
  error.value = null;
  card.value = null;
  showBack.value = false;
  try {
    card.value = await getCardByName(name);
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}

onMounted(() => loadCard(route.params.name));
watch(
  () => route.params.name,
  (name) => {
    if (name) loadCard(name);
  },
);
</script>

<template>
  <div id="mainContainer-card">
    <header>
      <headersSearchBar />
    </header>

    <main>
      <div v-if="loading" class="state-msg">
        <div class="spinner"></div>
        <span>Buscando carta...</span>
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

      <div v-else-if="card" class="card-view">
        <div class="card-image-col">
          <div class="card-image-wrap">
            <img
              :src="currentImage"
              :alt="currentFace?.name"
              class="card-img"
            />
          </div>
          <button v-if="isDFC" class="flip-btn" @click="showBack = !showBack">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.2"
            >
              <path d="M1 4v6h6" />
              <path d="M23 20v-6h-6" />
              <path
                d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"
              />
            </svg>
            {{ showBack ? "Ver cara frontal" : "Ver cara trasera" }}
          </button>
        </div>

        <div class="card-detail-col">
          <div class="card-name-row">
            <h1 class="card-name">{{ currentFace?.name }}</h1>
            <div class="mana-cost">
              <img
                v-for="sym in parseManaSymbols(currentFace?.mana_cost)"
                :key="sym"
                :src="manaSymbolUrl(sym)"
                :alt="`{${sym}}`"
                class="mana-pip"
              />
            </div>
          </div>

          <p class="type-line">{{ currentFace?.type_line }}</p>

          <div class="oracle-text">
            <p
              v-for="(line, i) in (currentFace?.oracle_text ?? '').split('\n')"
              :key="i"
            >
              {{ line }}
            </p>
          </div>

          <div v-if="currentFace?.flavor_text" class="flavor-text">
            "{{ currentFace.flavor_text }}"
          </div>

          <div
            v-if="
              currentFace?.power !== undefined ||
              currentFace?.loyalty !== undefined
            "
            class="stats"
          >
            <span v-if="currentFace.power !== undefined">
              {{ currentFace.power }} / {{ currentFace.toughness }}
            </span>
            <span v-else-if="currentFace.loyalty !== undefined">
              Lealtad: {{ currentFace.loyalty }}
            </span>
          </div>

          <!-- Panel de cara secundaria (aventura, prepare, split, etc.) -->
          <div v-if="secondaryFace" class="adventure-section">
            <div class="adventure-header">
              <span class="adventure-label">{{ secondaryFaceLabel }}</span>
              <div class="adventure-name-row">
                <span class="adventure-name">{{ secondaryFace.name }}</span>
                <div class="mana-cost">
                  <img
                    v-for="sym in parseManaSymbols(secondaryFace.mana_cost)"
                    :key="sym"
                    :src="manaSymbolUrl(sym)"
                    :alt="`{${sym}}`"
                    class="mana-pip"
                  />
                </div>
              </div>
              <span class="adventure-type">{{ secondaryFace.type_line }}</span>
            </div>
            <div class="adventure-oracle">
              <p
                v-for="(line, i) in (secondaryFace.oracle_text ?? '').split(
                  '\n',
                )"
                :key="i"
              >
                {{ line }}
              </p>
            </div>
          </div>

          <div class="section-divider"></div>

          <div class="info-grid">
            <div class="info-row">
              <span class="info-label">Identidad de color</span>
              <div class="color-pips">
                <span
                  v-if="card.color_identity.length === 0"
                  class="colorless-pip"
                  title="Incolora"
                  >C</span
                >
                <span
                  v-for="c in card.color_identity"
                  :key="c"
                  class="color-pip"
                  :style="{
                    backgroundColor: colorIdentityColors[c]?.bg,
                    borderColor: colorIdentityColors[c]?.border,
                    color: c === 'W' ? '#3a3541' : '#fff',
                  }"
                  :title="colorIdentityColors[c]?.label"
                  >{{ c }}</span
                >
              </div>
            </div>

            <div class="info-row">
              <span class="info-label">Commander</span>
              <span
                class="legality-badge"
                :class="isCommanderLegal ? 'legal' : 'banned'"
              >
                {{
                  isCommanderLegal
                    ? "Legal"
                    : card.legalities?.commander === "banned"
                      ? "Prohibida"
                      : "No legal"
                }}
              </span>
            </div>

            <div class="info-row">
              <span class="info-label">Edición</span>
              <span class="info-value">{{ card.set_name }}</span>
            </div>

            <div class="info-row">
              <span class="info-label">Artista</span>
              <span class="info-value">{{
                currentFace?.artist ?? card.artist
              }}</span>
            </div>
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
  #mainContainer-card {
    --bg: #0d0e1a;
    --surface: #1a1b2e;
    --surface2: #252640;
    --txt: #e8e6f0;
    --txt-muted: rgba(232, 230, 240, 0.5);
    --border: rgba(232, 230, 240, 0.12);
    --accent: #534ab7;
    --accent-text: #eeedfe;
    --legal-bg: rgba(16, 185, 129, 0.15);
    --legal-color: #6ee7b7;
    --legal-border: rgba(16, 185, 129, 0.3);
    --banned-bg: rgba(239, 68, 68, 0.15);
    --banned-color: #fca5a5;
    --banned-border: rgba(239, 68, 68, 0.3);
    --spinner-color: #534ab7;
  }
}
@media (prefers-color-scheme: light) {
  #mainContainer-card {
    --bg: #f0ede8;
    --surface: #ffffff;
    --surface2: #f4f0eb;
    --txt: #3a3541;
    --txt-muted: rgba(58, 53, 65, 0.5);
    --border: rgba(58, 53, 65, 0.15);
    --accent: #534ab7;
    --accent-text: #eeedfe;
    --legal-bg: rgba(16, 185, 129, 0.1);
    --legal-color: #047857;
    --legal-border: rgba(16, 185, 129, 0.4);
    --banned-bg: rgba(239, 68, 68, 0.1);
    --banned-color: #b91c1c;
    --banned-border: rgba(239, 68, 68, 0.35);
    --spinner-color: #534ab7;
  }
}

#mainContainer-card {
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

/* States */
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
  color: var(--banned-color);
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

/* Card layout */
.card-view {
  display: flex;
  gap: 40px;
  max-width: 900px;
  margin: 0 auto;
  align-items: flex-start;
}

.card-image-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.card-image-wrap {
  width: 260px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}
.card-img {
  width: 100%;
  display: block;
}

.flip-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--surface);
  border: 0.5px solid var(--border);
  border-radius: 6px;
  color: var(--txt);
  font-size: 12px;
  padding: 6px 14px;
  cursor: pointer;
  transition:
    background 0.15s,
    border-color 0.15s;
}
.flip-btn:hover {
  background: var(--surface2);
  border-color: var(--accent);
}
.flip-btn svg {
  width: 14px;
  height: 14px;
}

/* Detail column */
.card-detail-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card-name-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.card-name {
  font-size: 22px;
  font-weight: 600;
  color: var(--txt);
  line-height: 1.2;
}
.mana-cost {
  display: flex;
  align-items: center;
  gap: 3px;
  flex-shrink: 0;
}
.mana-pip {
  width: 20px;
  height: 20px;
}

.type-line {
  font-size: 13px;
  color: var(--txt-muted);
  font-style: italic;
  border-left: 2px solid var(--accent);
  padding-left: 10px;
}

.oracle-text {
  background: var(--surface);
  border: 0.5px solid var(--border);
  border-radius: 8px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 13.5px;
  color: var(--txt);
  line-height: 1.6;
}

.flavor-text {
  font-size: 12.5px;
  color: var(--txt-muted);
  font-style: italic;
  padding: 0 4px;
  line-height: 1.5;
}

.stats {
  font-size: 16px;
  font-weight: 600;
  color: var(--txt);
  text-align: right;
}

.section-divider {
  height: 0.5px;
  background: var(--border);
}

.info-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.info-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.info-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--txt-muted);
  width: 130px;
  flex-shrink: 0;
}
.info-value {
  font-size: 13px;
  color: var(--txt);
}

.color-pips {
  display: flex;
  gap: 5px;
}
.color-pip,
.colorless-pip {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 1.5px solid;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
}
.colorless-pip {
  background: #7b7b7b;
  border-color: #555;
  color: #fff;
}

.legality-badge {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 3px 10px;
  border-radius: 4px;
  border: 0.5px solid;
}
.legality-badge.legal {
  background: var(--legal-bg);
  color: var(--legal-color);
  border-color: var(--legal-border);
}
.legality-badge.banned {
  background: var(--banned-bg);
  color: var(--banned-color);
  border-color: var(--banned-border);
}

.adventure-section {
  border: 0.5px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
}
.adventure-header {
  background: var(--surface2);
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  border-bottom: 0.5px solid var(--border);
}
.adventure-label {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--accent);
}
.adventure-name-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.adventure-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--txt);
}
.adventure-type {
  font-size: 11.5px;
  color: var(--txt-muted);
  font-style: italic;
}
.adventure-oracle {
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  color: var(--txt);
  line-height: 1.6;
}

@media (max-width: 680px) {
  .card-view {
    flex-direction: column;
    align-items: center;
  }
  .card-image-wrap {
    width: 220px;
  }
  .card-detail-col {
    width: 100%;
  }
}
</style>
