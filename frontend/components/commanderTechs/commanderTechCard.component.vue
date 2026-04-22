<script setup>
import { computed } from "vue";

const props = defineProps({
  tech: { type: Object, required: true },
});

const emit = defineEmits(["open"]);

const commanders = computed(() =>
  Array.isArray(props.tech.commander)
    ? props.tech.commander.join(" / ")
    : props.tech.commander,
);

const authorName = computed(() => props.tech.authorId?.username ?? "Anónimo");
const authorInitial = computed(() => authorName.value.charAt(0).toUpperCase());

const fecha = computed(() => {
  if (!props.tech.lastChangeDate) return "";
  return new Date(props.tech.lastChangeDate).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
});

const pickupPreview = computed(() => {
  const text = props.tech.pickup_lane ?? "";
  return text.length > 160 ? text.slice(0, 160) + "…" : text;
});
</script>

<template>
  <article class="tech-card" @click="emit('open', tech)">
    <div class="tech-card__header">
      <div class="tech-card__meta">
        <div class="tech-card__avatar">{{ authorInitial }}</div>
        <span class="tech-card__author">{{ authorName }}</span>
        <span class="tech-card__date">{{ fecha }}</span>
      </div>
      <div class="tech-card__likes">
        <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13">
          <path
            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
          />
        </svg>
        <span>{{ tech.likes ?? 0 }}</span>
      </div>
    </div>

    <p class="tech-card__commanders">{{ commanders }}</p>
    <h2 class="tech-card__title">{{ tech.title }}</h2>

    <p v-if="pickupPreview" class="tech-card__pickup">{{ pickupPreview }}</p>
  </article>
</template>

<style scoped>
.tech-card {
  background: var(--surface-bg, #080f18);
  border: 0.5px solid var(--border-color, #1c3a58);
  border-radius: 12px;
  padding: 1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 5px;
  cursor: pointer;
  transition:
    border-color 0.15s,
    background 0.15s;
}

.tech-card:hover {
  border-color: #534ab7;
  background: rgba(83, 74, 183, 0.05);
}

.tech-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tech-card__meta {
  display: flex;
  align-items: center;
  gap: 7px;
}

.tech-card__avatar {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.15);
  flex-shrink: 0;
  background: #1c3a58;
  color: #afa9ec;
  font-size: 10px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: "Cinzel", serif;
}

.tech-card__author {
  font-family: "Cinzel", serif;
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--accent-muted, #afa9ec);
}

.tech-card__date {
  font-size: 10px;
  color: var(--txt-muted, #6b8caa);
}

.tech-card__likes {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--txt-muted, #6b8caa);
}

.tech-card__likes svg {
  color: #534ab7;
}

.tech-card__commanders {
  font-size: 11px;
  color: var(--accent-muted, #afa9ec);
  font-style: italic;
  margin: 0;
}

.tech-card__title {
  font-family: "Cinzel", serif;
  font-size: 14px;
  color: var(--txt-title, #e8e3d8);
  margin: 0;
  line-height: 1.3;
  letter-spacing: 0.04em;
}

.tech-card__pickup {
  font-size: 12px;
  color: var(--txt-muted, #6b8caa);
  line-height: 1.5;
  margin: 2px 0 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
