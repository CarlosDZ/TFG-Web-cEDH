<script setup>
import { computed, ref, onMounted } from "vue";
import { authState } from "../../utils/auth";
import { marked } from "marked";
import discussionBuilderModal from "./discussionBuilder.modal.vue";
import { useReplies } from "../../composables/useReplies";

const auth = authState();

const props = defineProps({
    discusionElement: {
        type: Object,
        required: true,
    },
});

import avatar from "../../assets/images/avatar.jpg";
const image_url = avatar;

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
</script>

<template>
    <article class="discusion">
        <div class="card-header">
            <img :src="image_url" alt="avatar" />
            <div class="card-meta">
                <h2>{{ titulo }}</h2>
                <p class="author">Por {{ autor }} · {{ fechaFormateada }}</p>
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
            @published="showReplyModal = false"
        />

        <Transition name="notif">
            <div v-if="notification" class="notification">
                Estás en modo invitado. Inicia sesión para interactuar.
            </div>
        </Transition>
    </article>
</template>

<style scoped>
.discusion {
    margin: 12px 10px 12px 20px;
    max-width: 680px;
    width: 100%;
    padding: 1.25rem 1.5rem;
    border-radius: 20px;
    border: 0.5px solid var(--comment-border);
    position: relative;
    background: var(--card-bg, transparent);
}

.card-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 1rem;
}

.card-meta {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

img {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
}

h2 {
    margin: 0;
    font-size: 17px;
    font-weight: 500;
    color: var(--txt-color);
    line-height: 1.3;
}

.author {
    margin: 0;
    font-size: 12px;
    color: var(--txt-secondary, #888);
}

.main-body {
    font-size: 15px;
    line-height: 1.65;
    color: var(--txt-color);
    white-space: pre-line;
    margin: 0 0 1.25rem;
}

.card-footer {
    display: flex;
    align-items: center;
    padding-top: 0.875rem;
    border-top: 0.5px solid var(--comment-border);
}

.like-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    background: none;
    border: 0.5px solid var(--comment-border);
    border-radius: 99px;
    padding: 5px 14px 5px 10px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    color: var(--txt-secondary, #888);
    transition:
        background 0.15s,
        border-color 0.15s,
        color 0.15s;
}

.like-btn:hover {
    background: var(--hover-bg, rgba(0, 0, 0, 0.04));
}

.like-btn.liked {
    border-color: #e24b4a;
    color: #e24b4a;
}

.heart {
    width: 16px;
    height: 16px;
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

.notification {
    position: absolute;
    bottom: 1rem;
    right: 1rem;
    background: var(--card-bg, #fff);
    border: 0.5px solid #e24b4a;
    color: #e24b4a;
    border-radius: 10px;
    padding: 8px 14px;
    font-size: 13px;
    font-weight: 500;
    pointer-events: none;
    z-index: 10;
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
    transform: translateY(4px);
}

.main-body :deep(h1),
.main-body :deep(h2),
.main-body :deep(h3) {
    font-family: "Cinzel", serif;
    color: var(--txt-color);
    font-weight: 600;
    margin: 1rem 0 0.4rem;
    line-height: 1.2;
}
.main-body :deep(h1) {
    font-size: 20px;
}
.main-body :deep(h2) {
    font-size: 17px;
}
.main-body :deep(h3) {
    font-size: 14px;
}

.main-body :deep(p) {
    margin: 0 0 0.75rem;
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
    margin: 0.75rem 0;
    padding: 0.25rem 0 0.25rem 1rem;
    color: var(--txt-secondary, #888);
    font-style: italic;
}
.main-body :deep(hr) {
    border: none;
    border-top: 0.5px solid var(--comment-border);
    margin: 1rem 0;
}
.main-body :deep(code) {
    font-family: monospace;
    font-size: 13px;
    background: rgba(83, 74, 183, 0.1);
    color: #afa9ec;
    padding: 1px 5px;
}
.reply-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    background: none;
    border: 0.5px solid var(--comment-border);
    border-radius: 99px;
    padding: 5px 14px 5px 10px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    color: var(--txt-secondary, #888);
    margin-left: 8px;
    transition:
        background 0.15s,
        border-color 0.15s,
        color 0.15s;
}
.reply-btn:hover {
    background: var(--hover-bg, rgba(0, 0, 0, 0.04));
    color: var(--txt-color);
}
.reply-btn svg {
    width: 14px;
    height: 14px;
}
.expand-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    background: none;
    border: 0.5px solid var(--comment-border);
    border-radius: 99px;
    padding: 5px 14px 5px 10px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    color: var(--txt-secondary, #888);
    transition:
        background 0.15s,
        border-color 0.15s,
        color 0.15s;
}
.expand-btn:hover {
    background: var(--hover-bg, rgba(0, 0, 0, 0.04));
    color: var(--txt-color);
}
.expand-btn svg {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
}
</style>
