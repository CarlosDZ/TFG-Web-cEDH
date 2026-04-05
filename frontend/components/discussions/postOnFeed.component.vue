<script setup>
import { computed, ref, onMounted } from "vue";
import { authState } from "../../utils/auth";
import { marked } from "marked";
import discussionBuilderModal from "./discussionBuilder.modal.vue";
import { useReplies } from "../../composables/useReplies";

defineOptions({ name: "postOnFeed" });

const auth = authState();

const props = defineProps({
    discusionElement: { type: Object, required: true },
    depth: { type: Number, default: 0 },
    isLast: { type: Boolean, default: true },
});

import avatar from "../../assets/images/avatar.jpg";
const image_url = avatar;

const isReply = computed(() => props.depth > 0);
const scale = computed(() => Math.max(0.85, 1 - props.depth * 0.05));
const titulo = computed(() => {
    const t = props.discusionElement.title;
    return t ? t.charAt(0).toUpperCase() + t.slice(1) : t;
});
const autor = computed(() => props.discusionElement.authorId.username);
const likes = computed(() => props.discusionElement.likes);
const fechaFormateada = computed(() =>
    new Date(props.discusionElement.createdAt).toLocaleString("es-ES")
);
const body = computed(() => {
    const cleaned = props.discusionElement.markdown_text.replace(/\n{3,}/g, "\n\n");
    return marked.parse(cleaned);
});

const notification = ref(false);
let notifTimeout = null;
const showNotification = () => {
    notification.value = true;
    clearTimeout(notifTimeout);
    notifTimeout = setTimeout(() => {
        notification.value = false;
    }, 3000);
};

const likedLocal = ref(false);
const likesLocal = ref(likes.value);

onMounted(async () => {
    try {
        const res = await fetch(`/api/comment/${props.discusionElement._id}/isLiked`, {
            credentials: "include",
        });
        if (!res.ok) return;
        const data = await res.json();
        likedLocal.value = data.liked;
    } catch (err) {
        console.error("Error comprobando like:", err);
    }
});

const toggleLike = async () => {
    if (!auth.isLogged) {
        showNotification();
        return;
    }
    try {
        const res = await fetch(`/api/comment/${props.discusionElement._id}/like`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) throw new Error("Error al hacer like");
        const data = await res.json();
        likesLocal.value = data.likes;
        likedLocal.value = data.liked;
    } catch (err) {
        console.error("Error al hacer like:", err);
    }
};

const showReplyModal = ref(false);
function handleReply() {
    if (!auth.isLogged) {
        showNotification();
        return;
    }
    showReplyModal.value = true;
}

const expanded = ref(false);
const { replies, loading: repliesLoading, fetchReplies } = useReplies(props.discusionElement._id);

async function toggleReplies() {
    if (!expanded.value) await fetchReplies();
    expanded.value = !expanded.value;
}

function onReplyPublished(newReply) {
    showReplyModal.value = false;
    discusionElement.replyCount = (discusionElement.replyCount || 0) + 1;
    if (expanded.value) {
        replies.value.push(newReply);
    } else {
        expanded.value = true;
        fetchReplies();
    }
}
</script>

<template>
    <div class="post-wrapper" :class="{ 'is-reply': isReply, 'is-last': isLast && isReply }">
        <article
            class="discusion"
            :class="{
                'is-reply': isReply,
                'is-last': isLast && isReply,
            }"
            :style="{ fontSize: `${scale}em` }"
        >
            <div class="card-header">
                <img :src="image_url" alt="avatar" />
                <div class="card-meta">
                    <h2 v-if="titulo">{{ titulo }}</h2>
                    <p class="author">{{ autor }} · {{ fechaFormateada }}</p>
                </div>
            </div>

            <div class="main-body" v-html="body" />

            <div class="card-footer">
                <button class="like-btn" :class="{ liked: likedLocal }" @click="toggleLike">
                    <svg class="heart" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path
                            fill-rule="evenodd"
                            clip-rule="evenodd"
                            d="M12 6.00019C10.2006 3.90317 7.19377 3.2551 4.93923 5.17534C2.68468 7.09558 2.36727 10.3061 4.13778 12.5772C5.60984 14.4654 10.0648 18.4479 11.5249 19.7369C11.6882 19.8811 11.7699 19.9532 11.8652 19.9815C11.9483 20.0062 12.0393 20.0062 12.1225 19.9815C12.2178 19.9532 12.2994 19.8811 12.4628 19.7369C13.9229 18.4479 18.3778 14.4654 19.8499 12.5772C21.6204 10.3061 21.3417 7.07538 19.0484 5.17534C16.7551 3.2753 13.7994 3.90317 12 6.00019Z"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        />
                    </svg>
                    <span class="like-count">{{ likesLocal }}</span>
                </button>

                <button class="reply-btn" @click="handleReply">
                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    >
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    Responder
                </button>

                <button
                    v-if="discusionElement.replyCount > 0 || replies.length > 0"
                    class="expand-btn"
                    @click="toggleReplies"
                >
                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        :style="{
                            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.25s ease',
                        }"
                    >
                        <polyline points="6 9 12 15 18 9" />
                    </svg>
                    <span v-if="repliesLoading">Cargando...</span>
                    <span v-else>
                        {{ expanded ? "Ocultar" : "Ver" }}
                        {{ discusionElement.replyCount || replies.length }}
                        {{
                            (discusionElement.replyCount || replies.length) === 1
                                ? "respuesta"
                                : "respuestas"
                        }}
                    </span>
                </button>
            </div>

            <discussionBuilderModal
                v-if="showReplyModal"
                :parent-id="discusionElement._id"
                :commenting-on-deck="false"
                @close="showReplyModal = false"
                @published="onReplyPublished"
            />
        </article>

        <Teleport to="body">
            <Transition name="notif">
                <div v-if="notification" class="notification">
                    Estás en modo invitado. Inicia sesión para interactuar.
                </div>
            </Transition>
        </Teleport>

        <Transition name="replies">
            <div
                v-if="expanded && replies.length"
                class="replies-container"
                :style="{ marginLeft: `${48 + depth * 32}px` }"
            >
                <postOnFeed
                    v-for="(reply, index) in replies"
                    :key="reply._id"
                    :discusion-element="reply"
                    :depth="depth + 1"
                    :is-last="index === replies.length - 1"
                />
            </div>
        </Transition>
    </div>
</template>

<style scoped>
.discusion {
    margin: 6px 10px 6px 0;
    max-width: 680px;
    width: 100%;
    padding: 0.875rem 1.25rem;
    border-radius: 12px;
    border: 0.5px solid var(--comment-border);
    background: var(--card-bg, transparent);
}

.card-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 0.6rem;
}

.card-meta {
    display: flex;
    flex-direction: column;
    gap: 1px;
}

img {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
}

.is-reply img {
    width: 26px;
    height: 26px;
}

h2 {
    margin: 0;
    font-size: 1em;
    font-weight: 500;
    color: var(--txt-color);
    line-height: 1.25;
}

.author {
    margin: 0;
    font-size: 0.75em;
    color: var(--txt-secondary, #888);
}

.main-body {
    font-size: 0.9em;
    line-height: 1.55;
    color: var(--txt-color);
    margin: 0 0 0.75rem;
}

.card-footer {
    display: flex;
    align-items: center;
    gap: 6px;
    padding-top: 0.6rem;
    border-top: 0.5px solid var(--comment-border);
}

.like-btn,
.reply-btn,
.expand-btn {
    display: flex;
    align-items: center;
    gap: 5px;
    background: none;
    border: 0.5px solid var(--comment-border);
    border-radius: 99px;
    padding: 3px 10px 3px 8px;
    cursor: pointer;
    font-size: 0.75em;
    font-weight: 500;
    color: var(--txt-secondary, #888);
    transition:
        background 0.15s,
        border-color 0.15s,
        color 0.15s;
}

.like-btn:hover,
.reply-btn:hover,
.expand-btn:hover {
    background: var(--hover-bg, rgba(0, 0, 0, 0.04));
    color: var(--txt-color);
}

.like-btn.liked {
    border-color: #e24b4a;
    color: #e24b4a;
}

.heart {
    width: 13px;
    height: 13px;
    transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.like-btn.liked .heart {
    transform: scale(1.2);
}
.heart path {
    fill: transparent;
    stroke: currentColor;
    stroke-width: 1.5;
    transition: fill 0.15s;
}
.like-btn.liked .heart path {
    fill: #e24b4a;
}
.like-count {
    line-height: 1;
}

.reply-btn svg,
.expand-btn svg {
    width: 12px;
    height: 12px;
    flex-shrink: 0;
}

.replies-container {
    display: flex;
    flex-direction: column;
    padding-left: 0;
}

.replies-enter-active,
.replies-leave-active {
    transition:
        opacity 0.25s ease,
        transform 0.25s ease;
}
.replies-enter-from,
.replies-leave-to {
    opacity: 0;
    transform: translateY(-6px);
}

.notification {
    position: fixed;
    bottom: 2rem;
    left: 50%;
    transform: translateX(-50%);
    background: var(--card-bg, #0d1b2a);
    border: 0.5px solid #e24b4a;
    color: #e24b4a;
    border-radius: 8px;
    padding: 8px 18px;
    font-size: 0.85em;
    font-weight: 500;
    pointer-events: none;
    z-index: 2000;
    white-space: nowrap;
}

.notif-enter-active,
.notif-leave-active {
    transition:
        opacity 0.25s ease,
        transform 0.25s ease;
}
.notif-enter-from,
.notif-leave-to {
    opacity: 0;
    transform: translateX(-50%) translateY(16px);
}

.main-body :deep(h1),
.main-body :deep(h2),
.main-body :deep(h3) {
    font-family: "Cinzel", serif;
    color: var(--txt-color);
    font-weight: 600;
    margin: 0.75rem 0 0.3rem;
    line-height: 1.2;
}
.main-body :deep(h1) {
    font-size: 1.2em;
}
.main-body :deep(h2) {
    font-size: 1.05em;
}
.main-body :deep(h3) {
    font-size: 0.95em;
}
.main-body :deep(p) {
    margin: 0 0 0.5rem;
}
.main-body :deep(strong) {
    font-weight: 600;
    color: var(--txt-color);
}
.main-body :deep(em) {
    font-style: italic;
}
.main-body :deep(blockquote) {
    border-left: 2px solid var(--comment-border);
    margin: 0.5rem 0;
    padding: 0.2rem 0 0.2rem 0.875rem;
    color: var(--txt-secondary, #888);
    font-style: italic;
}
.main-body :deep(hr) {
    border: none;
    border-top: 0.5px solid var(--comment-border);
    margin: 0.75rem 0;
}
.main-body :deep(code) {
    font-family: monospace;
    font-size: 0.9em;
    background: rgba(83, 74, 183, 0.1);
    color: #afa9ec;
    padding: 1px 4px;
}
.post-wrapper {
    display: flex;
    flex-direction: column;
    position: relative;
}
.post-wrapper.is-reply::before {
    content: "";
    position: absolute;
    left: -20px;
    top: 0;
    height: 30px;
    width: 14px;
    border-left: 2px solid rgba(83, 74, 183, 0.7);
    border-bottom: 2px solid rgba(83, 74, 183, 0.7);
    border-bottom-left-radius: 6px;
    pointer-events: none;
}
.post-wrapper.is-reply:not(.is-last)::after {
    content: "";
    position: absolute;
    left: -20px;
    top: 0;
    bottom: 0;
    width: 0;
    border-left: 2px solid rgba(83, 74, 183, 0.7);
    pointer-events: none;
}
</style>
