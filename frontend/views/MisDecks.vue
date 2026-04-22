<script setup>
import { ref, watch } from "vue";
import { useRouter } from "vue-router";
import { authState } from "../utils/auth";
import { getDecklistsByUser } from "../services/decklistService";
import { usePanelState } from "../composables/usePanelState";
import DeckCard from "../components/decklists/deckCard.component.vue";
import DeckImportMethodModal from "../components/decklists/deckImportMethod.modal.vue";
import MoxfieldImportModal from "../components/decklists/moxfieldImport.modal.vue";
import DeckBuilderModal from "../components/decklists/deckBuilder.modal.vue";
import sectionNavMenu from "../components/sectionNavMenu.component.vue";
import personalNavMenu from "../components/personalNavMenu.component.vue";
import headersSearchBar from "../components/headerSearchBar.component.vue";

const auth = authState();
const router = useRouter();
const { isPanelOpen } = usePanelState();

const decks = ref([]);
const loading = ref(true);

const showMethodModal = ref(false);
const showMoxfieldModal = ref(false);
const showBuilderModal = ref(false);
const builderInitialData = ref(null);

function onMethodSelected(methodId) {
  showMethodModal.value = false;
  if (methodId === "moxfield") {
    showMoxfieldModal.value = true;
  } else {
    builderInitialData.value = null;
    showBuilderModal.value = true;
  }
}

function onMoxfieldConfirm(data) {
  showMoxfieldModal.value = false;
  builderInitialData.value = data;
  showBuilderModal.value = true;
}

function onDeckSaved(deck) {
  decks.value.unshift(deck);
}

watch(
  () => auth.sessionLoading,
  async (stillLoading) => {
    if (stillLoading) return;
    if (!auth.isLogged) {
      router.push("/login");
      return;
    }
    try {
      decks.value = await getDecklistsByUser(auth.user.id);
    } finally {
      loading.value = false;
    }
  },
  { immediate: true },
);
</script>

<template>
  <div id="mainContainer-misDecks">
    <header>
      <headersSearchBar />
    </header>

    <main>
      <div class="mis-decks-feed" :class="{ 'panel-open': isPanelOpen }">
        <div class="feed-header">
          <h1 class="feed-title">Mis Decks</h1>
          <span v-if="!loading" class="feed-count"
            >{{ decks.length }}
            {{ decks.length === 1 ? "decklist" : "decklists" }}</span
          >
        </div>

        <p v-if="loading" class="feed-status">Cargando decklists...</p>

        <div v-else-if="decks.length === 0" class="feed-empty">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <rect x="2" y="3" width="8" height="8" rx="1" />
            <rect x="14" y="3" width="8" height="8" rx="1" />
            <rect x="2" y="13" width="8" height="8" rx="1" />
            <rect x="14" y="13" width="8" height="8" rx="1" />
          </svg>
          <span class="feed-empty__title">Sin decklists</span>
          <span class="feed-empty__sub"
            >Aún no has publicado ninguna decklist.</span
          >
          <RouterLink to="/decklists" class="feed-empty__link"
            >Ir a Decklists</RouterLink
          >
        </div>

        <div v-else class="deck-grid">
          <DeckCard v-for="deck in decks" :key="deck._id" :deck="deck" />
        </div>

        <button
          class="add-btn"
          title="Nueva decklist"
          @click="showMethodModal = true"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>

      <DeckImportMethodModal
        v-if="showMethodModal"
        @close="showMethodModal = false"
        @select="onMethodSelected"
      />
      <MoxfieldImportModal
        v-if="showMoxfieldModal"
        @close="showMoxfieldModal = false"
        @confirm="onMoxfieldConfirm"
      />
      <DeckBuilderModal
        v-if="showBuilderModal"
        :initial-data="builderInitialData"
        @close="showBuilderModal = false"
        @saved="onDeckSaved"
      />

      <personalNavMenu />
    </main>

    <footer>
      <sectionNavMenu />
    </footer>
  </div>
</template>

<style scoped>
#mainContainer-misDecks {
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

.mis-decks-feed {
  height: 84vh;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 1rem 0.5rem 1rem 1rem;
  display: flex;
  flex-direction: column;
  transition: margin-right 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  scrollbar-gutter: stable;
  margin-right: 0;
}

.mis-decks-feed.panel-open {
  margin-right: 220px;
}

.feed-header {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 1rem;
}

.feed-title {
  font-family: "Cinzel", serif;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: var(--txt-title, #e8e3d8);
  margin: 0;
}

.feed-count {
  font-size: 12px;
  color: var(--txt-muted, #6b8caa);
}

.feed-status {
  flex: 1;
  font-size: 13px;
  color: var(--txt-color);
  opacity: 0.5;
  padding: 2rem 0;
}

.feed-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--txt-muted, #6b8caa);
}

.feed-empty svg {
  width: 40px;
  height: 40px;
  color: #534ab7;
  opacity: 0.5;
  margin-bottom: 4px;
}

.feed-empty__title {
  font-family: "Cinzel", serif;
  font-size: 13px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--accent-muted, #afa9ec);
}

.feed-empty__sub {
  font-size: 12px;
  color: var(--txt-muted, #6b8caa);
}

.feed-empty__link {
  margin-top: 8px;
  font-size: 12px;
  color: #afa9ec;
  text-decoration: none;
  border: 0.5px solid rgba(83, 74, 183, 0.4);
  padding: 6px 16px;
  border-radius: 6px;
  transition: background 0.15s;
}

.feed-empty__link:hover {
  background: rgba(83, 74, 183, 0.1);
}

.deck-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 12px;
  align-content: start;
  padding-bottom: 1rem;
}

.add-btn {
  position: sticky;
  bottom: 1.25rem;
  align-self: flex-end;
  margin-right: 1rem;
  width: 48px;
  height: 48px;
  background: #534ab7;
  border: none;
  border-radius: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #eeedfe;
  transform: skewX(-12deg);
  transition:
    background 0.15s,
    transform 0.15s;
}

.add-btn:hover {
  background: #3c3489;
}

.add-btn:active {
  transform: skewX(-12deg) scale(0.9);
}

.add-btn svg {
  width: 20px;
  height: 20px;
  transform: skewX(12deg);
}
</style>
