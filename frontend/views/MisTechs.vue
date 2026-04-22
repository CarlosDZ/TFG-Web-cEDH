<script setup>
import { ref, watch } from "vue";
import { useRouter } from "vue-router";
import { authState } from "../utils/auth";
import { getCommanderTechsByUser } from "../services/commanderTechService";
import { usePanelState } from "../composables/usePanelState";
import CommanderTechCard from "../components/commanderTechs/commanderTechCard.component.vue";
import CommanderTechDetail from "../components/commanderTechs/commanderTechDetail.vue";
import CommanderTechBuilderModal from "../components/commanderTechs/commanderTechBuilder.modal.vue";
import sectionNavMenu from "../components/sectionNavMenu.component.vue";
import personalNavMenu from "../components/personalNavMenu.component.vue";
import headersSearchBar from "../components/headerSearchBar.component.vue";

const auth = authState();
const router = useRouter();
const { isPanelOpen } = usePanelState();

const techs = ref([]);
const loading = ref(true);
const selectedTech = ref(null);
const showBuilderModal = ref(false);

function onTechSaved(tech) {
  techs.value.unshift(tech);
  showBuilderModal.value = false;
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
      techs.value = await getCommanderTechsByUser(auth.user.id);
    } finally {
      loading.value = false;
    }
  },
  { immediate: true },
);
</script>

<template>
  <div id="mainContainer-misTechs">
    <header>
      <headersSearchBar />
    </header>

    <main>
      <div class="mis-techs-feed" :class="{ 'panel-open': isPanelOpen }">
        <div class="feed-header">
          <h1 class="feed-title">Mis Techs</h1>
          <span v-if="!loading" class="feed-count">
            {{ techs.length }} {{ techs.length === 1 ? "tech" : "techs" }}
          </span>
        </div>

        <p v-if="loading" class="feed-status">Cargando techs...</p>

        <div v-else-if="techs.length === 0" class="feed-empty">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
          <span class="feed-empty__title">Sin techs</span>
          <span class="feed-empty__sub"
            >Aún no has publicado ningún análisis.</span
          >
          <RouterLink to="/commander-techs" class="feed-empty__link"
            >Ir a Commander Techs</RouterLink
          >
        </div>

        <div v-else class="tech-grid">
          <CommanderTechCard
            v-for="tech in techs"
            :key="tech._id"
            :tech="tech"
            @open="selectedTech = $event"
          />
        </div>

        <button
          class="add-btn"
          title="Nueva tech"
          @click="showBuilderModal = true"
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

      <CommanderTechBuilderModal
        v-if="showBuilderModal"
        @close="showBuilderModal = false"
        @saved="onTechSaved"
      />

      <CommanderTechDetail
        v-if="selectedTech"
        :tech="selectedTech"
        @close="selectedTech = null"
      />

      <personalNavMenu />
    </main>

    <footer>
      <sectionNavMenu />
    </footer>
  </div>
</template>

<style scoped>
#mainContainer-misTechs {
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

.mis-techs-feed {
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

.mis-techs-feed.panel-open {
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

.tech-grid {
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
