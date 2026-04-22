<script setup>
import { computed } from "vue";

const props = defineProps({
  tournament: { type: Object, required: true },
});

const emit = defineEmits(["open"]);

const authorName = computed(
  () => props.tournament.authorId?.username ?? "Anónimo",
);

const authorInitial = computed(() => authorName.value.charAt(0).toUpperCase());

const fechaDisplay = computed(() => {
  if (!props.tournament.tournament_date_hour) return "";
  return new Date(props.tournament.tournament_date_hour).toLocaleDateString(
    "es-ES",
    { day: "numeric", month: "short", year: "numeric" },
  );
});

const horaDisplay = computed(() => {
  if (!props.tournament.tournament_date_hour) return "";
  return new Date(props.tournament.tournament_date_hour).toLocaleTimeString(
    "es-ES",
    { hour: "2-digit", minute: "2-digit" },
  );
});

const isPast = computed(() => {
  if (!props.tournament.tournament_date_hour) return false;
  return new Date(props.tournament.tournament_date_hour) < new Date();
});

const topPrize = computed(() => {
  if (!props.tournament.prizes?.length) return null;
  return props.tournament.prizes[0];
});
</script>

<template>
  <article
    class="tournament-card"
    :class="{
      'tournament-card--past': isPast,
      'tournament-card--full': tournament.isFull,
    }"
    @click="emit('open', tournament)"
  >
    <div class="tournament-card__badges">
      <span v-if="tournament.isFull" class="badge badge--full">Completo</span>
      <span v-else-if="isPast" class="badge badge--past">Finalizado</span>
      <span v-else class="badge badge--open">Abierto</span>
    </div>

    <h2 class="tournament-card__name">{{ tournament.name }}</h2>

    <div class="tournament-card__row">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
      <span>{{ fechaDisplay }} · {{ horaDisplay }}</span>
    </div>

    <div class="tournament-card__row">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <polygon
          points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
        />
      </svg>
      <span class="tournament-card__format">{{ tournament.format }}</span>
    </div>

    <div v-if="tournament.enter_cost" class="tournament-card__row">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
      <span>{{ tournament.enter_cost }}</span>
    </div>

    <div v-if="topPrize" class="tournament-card__prize">
      <span class="tournament-card__prize-label">1º</span>
      <span class="tournament-card__prize-text">{{ topPrize.prize }}</span>
    </div>

    <div class="tournament-card__footer">
      <div class="tournament-card__avatar">{{ authorInitial }}</div>
      <span class="tournament-card__author">{{ authorName }}</span>
    </div>
  </article>
</template>

<style scoped>
.tournament-card {
  background: var(--surface-bg, #080f18);
  border: 0.5px solid var(--border-color, #1c3a58);
  border-radius: 12px;
  padding: 1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 7px;
  cursor: pointer;
  transition:
    border-color 0.15s,
    background 0.15s;
}

.tournament-card:hover {
  border-color: #534ab7;
  background: rgba(83, 74, 183, 0.05);
}

.tournament-card--past {
  opacity: 0.65;
}

.tournament-card__badges {
  display: flex;
  gap: 6px;
  margin-bottom: 2px;
}

.badge {
  font-family: "Cinzel", serif;
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 2px 8px;
  border-radius: 3px;
}

.badge--open {
  background: rgba(83, 183, 117, 0.12);
  color: #5ecb82;
  border: 0.5px solid rgba(83, 183, 117, 0.3);
}

.badge--full {
  background: rgba(226, 75, 74, 0.1);
  color: #e24b4a;
  border: 0.5px solid rgba(226, 75, 74, 0.3);
}

.badge--past {
  background: rgba(107, 140, 170, 0.1);
  color: #6b8caa;
  border: 0.5px solid rgba(107, 140, 170, 0.25);
}

.tournament-card__name {
  font-family: "Cinzel", serif;
  font-size: 15px;
  font-weight: 600;
  color: var(--txt-title, #e8e3d8);
  margin: 0;
  line-height: 1.25;
  letter-spacing: 0.03em;
}

.tournament-card__row {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 12px;
  color: var(--txt-muted, #6b8caa);
}

.tournament-card__row svg {
  width: 13px;
  height: 13px;
  flex-shrink: 0;
  color: #534ab7;
  opacity: 0.8;
}

.tournament-card__format {
  color: var(--accent-muted, #afa9ec);
  font-style: italic;
}

.tournament-card__prize {
  display: flex;
  align-items: baseline;
  gap: 7px;
  background: rgba(83, 74, 183, 0.07);
  border: 0.5px solid rgba(83, 74, 183, 0.2);
  border-radius: 6px;
  padding: 5px 10px;
  margin-top: 2px;
}

.tournament-card__prize-label {
  font-family: "Cinzel", serif;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #afa9ec;
  text-transform: uppercase;
  flex-shrink: 0;
}

.tournament-card__prize-text {
  font-size: 12px;
  color: var(--txt-muted, #6b8caa);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tournament-card__footer {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
}

.tournament-card__avatar {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
  background: #1c3a58;
  color: #afa9ec;
  font-size: 9px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: "Cinzel", serif;
}

.tournament-card__author {
  font-family: "Cinzel", serif;
  font-size: 9px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--accent-muted, #afa9ec);
}
</style>
