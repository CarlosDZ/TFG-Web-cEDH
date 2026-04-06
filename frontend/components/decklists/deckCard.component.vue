<script setup>
import { computed } from "vue";

const props = defineProps({
    deck: { type: Object, required: true },
});

const COLOR_MAP = {
    W: { bg: "#f9f6e8", border: "#c8b87a", title: "White" },
    U: { bg: "#0e68ab", border: "#0a4f82", title: "Blue" },
    B: { bg: "#2a2a2a", border: "#555", title: "Black" },
    R: { bg: "#d3202a", border: "#a01820", title: "Red" },
    G: { bg: "#00733e", border: "#005a30", title: "Green" },
};

const commanders = computed(() =>
    Array.isArray(props.deck.commander) ? props.deck.commander.join(" / ") : props.deck.commander
);

const authorName = computed(() => props.deck.authorId?.username ?? "Anónimo");

const colorPips = computed(() => {
    const identity = props.deck.color_identity ?? "";
    if (!identity) return null;
    return identity.split("").map((c) => COLOR_MAP[c]).filter(Boolean);
});

const fecha = computed(() => {
    if (!props.deck.createdAt) return "";
    return new Date(props.deck.createdAt).toLocaleDateString("es-ES", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
});
</script>

<template>
    <article class="deck-card">
        <div class="deck-card__header">
            <div class="deck-card__meta">
                <img class="deck-card__avatar" src="../../assets/images/avatar.jpg" alt="" />
                <span class="deck-card__author">{{ authorName }}</span>
                <span class="deck-card__date">{{ fecha }}</span>
            </div>
            <div class="deck-card__likes">
                <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
                <span>{{ deck.likes ?? 0 }}</span>
            </div>
        </div>

        <h2 class="deck-card__title">{{ deck.title }}</h2>
        <p class="deck-card__commanders">{{ commanders }}</p>

        <p v-if="deck.description" class="deck-card__desc">{{ deck.description }}</p>

        <div class="deck-card__footer">
            <span class="deck-card__tag" v-for="tag in (deck.tags ?? []).slice(0, 3)" :key="tag">{{ tag }}</span>
            <div class="deck-card__identity">
                <template v-if="colorPips">
                    <span
                        v-for="pip in colorPips"
                        :key="pip.title"
                        class="color-pip"
                        :style="{ background: pip.bg, borderColor: pip.border }"
                        :title="pip.title"
                    />
                </template>
                <span v-else class="color-pip color-pip--colorless" title="Incoloro">C</span>
            </div>
        </div>
    </article>
</template>

<style scoped>
.deck-card {
    background: var(--surface-bg, #080f18);
    border: 0.5px solid var(--border-color, #1c3a58);
    border-radius: 12px;
    padding: 1rem 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 6px;
    cursor: pointer;
    transition: border-color 0.15s, background 0.15s;
}

.deck-card:hover {
    border-color: #534ab7;
    background: rgba(83, 74, 183, 0.05);
}

.deck-card__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.deck-card__meta {
    display: flex;
    align-items: center;
    gap: 7px;
}

.deck-card__avatar {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    object-fit: cover;
    border: 1px solid rgba(255, 255, 255, 0.15);
    flex-shrink: 0;
}

.deck-card__author {
    font-family: "Cinzel", serif;
    font-size: 10px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--accent-muted, #afa9ec);
}

.deck-card__date {
    font-size: 10px;
    color: var(--txt-muted, #6b8caa);
}

.deck-card__likes {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: var(--txt-muted, #6b8caa);
}

.deck-card__likes svg {
    color: #534ab7;
}

.deck-card__title {
    font-family: "Cinzel", serif;
    font-size: 15px;
    color: var(--txt-title, #e8e3d8);
    margin: 2px 0 0;
    line-height: 1.3;
}

.deck-card__commanders {
    font-size: 12px;
    color: var(--accent-muted, #afa9ec);
    font-style: italic;
}

.deck-card__desc {
    font-size: 12px;
    color: var(--txt-muted, #6b8caa);
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.deck-card__footer {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 4px;
    flex-wrap: wrap;
}

.deck-card__tag {
    font-size: 10px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    background: rgba(83, 74, 183, 0.15);
    color: var(--accent-muted, #afa9ec);
    border: 0.5px solid rgba(83, 74, 183, 0.3);
    border-radius: 4px;
    padding: 2px 7px;
}

.deck-card__identity {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 3px;
}

.color-pip {
    width: 13px;
    height: 13px;
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
</style>
