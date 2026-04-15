<script setup>
import { authState } from "../../utils/auth";
import { usePanelState } from "../../composables/usePanelState";
import { useCommanderTechs } from "../../composables/useCommanderTechs";
import CommanderTechCard from "./commanderTechCard.component.vue";

const { techs, loading } = useCommanderTechs();
const auth = authState();
const { isPanelOpen } = usePanelState();

const emit = defineEmits(["new-tech", "open-tech"]);
</script>

<template>
  <div id="mainContainer-techFeed" :class="{ 'panel-open': isPanelOpen }">
    <p v-if="loading" class="feed-status">Cargando commander techs...</p>

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
      <span class="feed-empty__title">Sin commander techs</span>
      <span class="feed-empty__sub"
        >Sé el primero en compartir un análisis.</span
      >
    </div>

    <div v-else class="tech-grid">
      <CommanderTechCard
        v-for="tech in techs"
        :key="tech._id"
        :tech="tech"
        @open="emit('open-tech', $event)"
      />
    </div>

    <button
      v-if="auth.isLogged"
      class="new-tech-btn"
      title="Nueva commander tech"
      @click="emit('new-tech')"
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
</template>

<style scoped>
#mainContainer-techFeed {
  height: 84vh;
  background: var(--background-color);
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  transition:
    flex 0.3s ease,
    margin-right 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  scrollbar-gutter: stable;
  padding: 1rem 0.5rem 1rem 1rem;
  position: relative;
  margin-right: 0;
  display: flex;
  flex-direction: column;
}

#mainContainer-techFeed.panel-open {
  margin-right: 220px;
}

.feed-status {
  font-size: 13px;
  color: var(--txt-color);
  opacity: 0.5;
  padding: 2rem 1.5rem;
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

.tech-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 12px;
  align-content: start;
  padding-bottom: 1rem;
}

.new-tech-btn {
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

.new-tech-btn:hover {
  background: #3c3489;
}

.new-tech-btn:active {
  transform: skewX(-12deg) scale(0.9);
}

.new-tech-btn svg {
  width: 20px;
  height: 20px;
  transform: skewX(12deg);
}
</style>
