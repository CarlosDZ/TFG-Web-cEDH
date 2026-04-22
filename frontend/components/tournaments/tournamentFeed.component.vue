<script setup>
import { ref, computed } from "vue";
import { authState } from "../../utils/auth";
import { usePanelState } from "../../composables/usePanelState";
import { useTournaments } from "../../composables/useTournaments";
import TournamentCard from "./tournamentCard.component.vue";

const { tournaments, loading } = useTournaments();
const auth = authState();
const { isPanelOpen } = usePanelState();

const filter = ref("all"); // "all" | "upcoming"

const filtered = computed(() => {
  if (filter.value === "upcoming") {
    const now = new Date();
    return tournaments.value.filter(
      (t) => !t.isFull && new Date(t.tournament_date_hour) > now,
    );
  }
  return tournaments.value;
});

const emit = defineEmits(["new-tournament", "open-tournament"]);
</script>

<template>
  <div id="mainContainer-tournamentFeed" :class="{ 'panel-open': isPanelOpen }">
    <div class="feed-toolbar">
      <button
        class="filter-btn"
        :class="{ active: filter === 'all' }"
        @click="filter = 'all'"
      >
        Todos
      </button>
      <button
        class="filter-btn"
        :class="{ active: filter === 'upcoming' }"
        @click="filter = 'upcoming'"
      >
        Disponibles
      </button>
    </div>

    <p v-if="loading" class="feed-status">Cargando torneos...</p>

    <div v-else-if="filtered.length === 0" class="feed-empty">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
      <span class="feed-empty__title">Sin torneos</span>
      <span class="feed-empty__sub">No hay torneos en este momento.</span>
    </div>

    <div v-else class="tournament-grid">
      <TournamentCard
        v-for="t in filtered"
        :key="t._id"
        :tournament="t"
        @open="emit('open-tournament', $event)"
      />
    </div>

    <button
      v-if="auth.isLogged && (auth.user?.isVerified || auth.user?.isAdmin)"
      class="new-tournament-btn"
      title="Nuevo torneo"
      @click="emit('new-tournament')"
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
#mainContainer-tournamentFeed {
  height: 84vh;
  background: var(--background-color);
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  transition:
    flex 0.3s ease,
    margin-right 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  scrollbar-gutter: stable;
  padding: 1rem 0.5rem 2rem 1rem;
  position: relative;
  margin-right: 0;
  display: flex;
  flex-direction: column;
}

#mainContainer-tournamentFeed.panel-open {
  margin-right: 220px;
}

.feed-toolbar {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
  margin-bottom: 12px;
}

.filter-btn {
  background: none;
  border: 0.5px solid var(--border-color, #1c3a58);
  color: var(--txt-muted, #6b8caa);
  font-family: "Cinzel", serif;
  font-size: 9px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 5px 14px;
  cursor: pointer;
  transition:
    color 0.15s,
    border-color 0.15s,
    background 0.15s;
}

.filter-btn:hover {
  color: var(--accent-muted, #afa9ec);
  border-color: var(--accent-muted, #afa9ec);
}

.filter-btn.active {
  background: rgba(83, 74, 183, 0.12);
  border-color: #534ab7;
  color: #eeedfe;
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

.tournament-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 12px;
  align-content: start;
  padding-bottom: 1rem;
}

.new-tournament-btn {
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

.new-tournament-btn:hover {
  background: #3c3489;
}

.new-tournament-btn:active {
  transform: skewX(-12deg) scale(0.9);
}

.new-tournament-btn svg {
  width: 20px;
  height: 20px;
  transform: skewX(12deg);
}
</style>
