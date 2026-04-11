<script setup>
import { ref, computed, onMounted, nextTick } from "vue";
import { marked } from "marked";
import { authState } from "../../utils/auth";
import {
  toggleLike,
  isLiked,
  getCommanderTechComments,
  commentOnTech,
} from "../../services/commanderTechService";
import postOnFeed from "../discussions/postOnFeed.component.vue";

defineOptions({ name: "commanderTechDetail" });

const props = defineProps({
  tech: { type: Object, required: true },
});
const emit = defineEmits(["close"]);

const auth = authState();

const visible = ref(false);
const activeTab = ref("content");

const likesLocal = ref(props.tech.likes ?? 0);
const likedLocal = ref(false);

const comments = ref([]);
const commentsLoaded = ref(false);
const commentsLoading = ref(false);
const newComment = ref("");
const posting = ref(false);
const notification = ref(false);
let notifTimeout = null;

const commanders = computed(() =>
  Array.isArray(props.tech.commander)
    ? props.tech.commander.join(" / ")
    : props.tech.commander,
);

const authorName = computed(() => props.tech.authorId?.username ?? "Anónimo");

const fecha = computed(() => {
  if (!props.tech.lastChangeDate) return "";
  return new Date(props.tech.lastChangeDate).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
});

const body = computed(() => {
  const cleaned = (props.tech.text_markdown ?? "").replace(/\n{3,}/g, "\n\n");
  return marked.parse(cleaned);
});

function showNotification() {
  notification.value = true;
  clearTimeout(notifTimeout);
  notifTimeout = setTimeout(() => {
    notification.value = false;
  }, 3000);
}

onMounted(async () => {
  nextTick(() => {
    visible.value = true;
  });
  if (auth.isLogged) {
    try {
      const data = await isLiked(props.tech._id);
      likedLocal.value = data.liked;
    } catch {
      /* ignore */
    }
  }
});

async function handleToggleLike() {
  if (!auth.isLogged) {
    showNotification();
    return;
  }
  try {
    const data = await toggleLike(props.tech._id);
    likesLocal.value = data.likes;
    likedLocal.value = data.liked;
  } catch {
    /* ignore */
  }
}

async function loadComments() {
  if (commentsLoaded.value) return;
  commentsLoading.value = true;
  try {
    comments.value = await getCommanderTechComments(props.tech._id);
    commentsLoaded.value = true;
  } finally {
    commentsLoading.value = false;
  }
}

async function switchToComments() {
  activeTab.value = "comments";
  await loadComments();
}

async function postComment() {
  if (!newComment.value.trim() || posting.value) return;
  if (!auth.isLogged) {
    showNotification();
    return;
  }
  posting.value = true;
  try {
    const created = await commentOnTech(
      props.tech._id,
      newComment.value.trim(),
    );
    const withMeta = {
      ...created,
      authorId: { username: auth.user?.username ?? "Tú" },
      replyCount: 0,
    };
    comments.value.unshift(withMeta);
    newComment.value = "";
  } catch {
    /* ignore */
  } finally {
    posting.value = false;
  }
}

function handleClose() {
  visible.value = false;
  setTimeout(() => emit("close"), 320);
}
</script>

<template>
  <Teleport to="body">
    <Transition name="detail-backdrop">
      <div v-if="visible" class="detail-backdrop" @click.self="handleClose">
        <Transition name="detail-panel">
          <div v-if="visible" class="detail-panel">
            <!-- Header -->
            <div class="detail-header">
              <div class="detail-header__left">
                <span class="detail-eyebrow">Commander Tech</span>
                <p class="detail-commanders">{{ commanders }}</p>
                <h1 class="detail-title">{{ tech.title }}</h1>
                <p class="detail-meta">{{ authorName }} · {{ fecha }}</p>
              </div>
              <div class="detail-header__right">
                <button
                  class="like-btn"
                  :class="{ liked: likedLocal }"
                  @click="handleToggleLike"
                >
                  <svg
                    class="heart"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fill-rule="evenodd"
                      clip-rule="evenodd"
                      d="M12 6.00019C10.2006 3.90317 7.19377 3.2551 4.93923 5.17534C2.68468 7.09558 2.36727 10.3061 4.13778 12.5772C5.60984 14.4654 10.0648 18.4479 11.5249 19.7369C11.6882 19.8811 11.7699 19.9532 11.8652 19.9815C11.9483 20.0062 12.0393 20.0062 12.1225 19.9815C12.2178 19.9532 12.2994 19.8811 12.4628 19.7369C13.9229 18.4479 18.3778 14.4654 19.8499 12.5772C21.6204 10.3061 21.3417 7.07538 19.0484 5.17534C16.7551 3.2753 13.7994 3.90317 12 6.00019Z"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                  <span>{{ likesLocal }}</span>
                </button>
                <button class="close-btn" @click="handleClose" title="Cerrar">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            <!-- Tab bar -->
            <div class="tab-bar">
              <button
                class="tab-btn"
                :class="{ active: activeTab === 'content' }"
                @click="activeTab = 'content'"
              >
                Análisis
              </button>
              <button
                class="tab-btn"
                :class="{ active: activeTab === 'comments' }"
                @click="switchToComments"
              >
                Comentarios
              </button>
            </div>

            <!-- Content tab -->
            <div v-if="activeTab === 'content'" class="detail-body">
              <div class="markdown-body" v-html="body" />
            </div>

            <!-- Comments tab -->
            <div v-else-if="activeTab === 'comments'" class="detail-body">
              <div v-if="auth.isLogged" class="comment-composer">
                <textarea
                  class="comment-input"
                  placeholder="Escribe un comentario..."
                  v-model="newComment"
                  maxlength="3000"
                  rows="3"
                />
                <div class="comment-composer__footer">
                  <span class="char-count">{{ newComment.length }}/3000</span>
                  <button
                    class="btn-comment"
                    :disabled="!newComment.trim() || posting"
                    @click="postComment"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                    {{ posting ? "Enviando..." : "Comentar" }}
                  </button>
                </div>
              </div>

              <p v-if="commentsLoading" class="comments-status">
                Cargando comentarios...
              </p>

              <div
                v-else-if="comments.length === 0 && commentsLoaded"
                class="comments-empty"
              >
                <p>Sé el primero en comentar.</p>
              </div>

              <div v-else class="comments-list">
                <postOnFeed
                  v-for="(comment, index) in comments"
                  :key="comment._id"
                  :discusion-element="comment"
                  :depth="0"
                  :is-last="index === comments.length - 1"
                />
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>

    <Transition name="notif">
      <div v-if="notification" class="notification">
        Estás en modo invitado. Inicia sesión para interactuar.
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.detail-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(5, 10, 18, 0.85);
  z-index: 1000;
  display: flex;
  align-items: stretch;
  justify-content: flex-end;
}

.detail-panel {
  --accent: #534ab7;
  --accent-hover: #3c3489;
  --accent-text: #eeedfe;
  --accent-muted: #afa9ec;
  --bg: #0d1b2a;
  --bg-surface: #080f18;
  --border: #1c3a58;
  --txt-color: #e0e1dd;
  --comment-border: rgb(100, 100, 231);
  --txt: #e0ddd8;
  --txt-title: #e8e3d8;
  --txt-muted: #6b8caa;
  --txt-placeholder: #2a4460;
  --comment-border: #1c3a58;

  width: 100%;
  max-width: 780px;
  height: 100%;
  background: var(--bg);
  border-left: 0.5px solid var(--border);
  display: flex;
  flex-direction: column;
  font-family: "Crimson Pro", Georgia, serif;
  overflow: hidden;
}

/* Header */
.detail-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 24px 24px 20px;
  background: var(--bg-surface);
  border-bottom: 0.5px solid var(--border);
  flex-shrink: 0;
}

.detail-header__left {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.detail-eyebrow {
  font-family: "Cinzel", serif;
  font-size: 9px;
  font-weight: 600;
  color: var(--accent-muted);
  text-transform: uppercase;
  letter-spacing: 0.14em;
}

.detail-commanders {
  font-size: 13px;
  color: var(--accent-muted);
  font-style: italic;
  margin: 2px 0 0;
}

.detail-title {
  font-family: "Cinzel", serif;
  font-size: 20px;
  font-weight: 600;
  color: var(--txt-title);
  margin: 4px 0 0;
  line-height: 1.2;
  letter-spacing: 0.03em;
}

.detail-meta {
  font-size: 11px;
  color: var(--txt-muted);
  margin: 4px 0 0;
}

.detail-header__right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.like-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: 0.5px solid var(--border);
  border-radius: 99px;
  padding: 5px 12px 5px 10px;
  cursor: pointer;
  font-size: 13px;
  color: var(--txt-muted);
  transition:
    border-color 0.15s,
    color 0.15s;
}
.like-btn:hover {
  border-color: var(--accent-muted);
  color: var(--txt);
}
.like-btn.liked {
  border-color: #e24b4a;
  color: #e24b4a;
}

.heart {
  width: 15px;
  height: 15px;
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

.close-btn {
  background: none;
  border: 0.5px solid var(--border);
  cursor: pointer;
  color: var(--txt-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  transition:
    color 0.15s,
    border-color 0.15s;
}
.close-btn:hover {
  color: var(--txt);
  border-color: var(--txt-muted);
}
.close-btn svg {
  width: 14px;
  height: 14px;
}

/* Tab bar */
.tab-bar {
  display: flex;
  border-bottom: 0.5px solid var(--border);
  background: var(--bg-surface);
  flex-shrink: 0;
}

.tab-btn {
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--txt-muted);
  font-family: "Cinzel", serif;
  font-size: 10px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 10px 20px;
  cursor: pointer;
  transition:
    color 0.15s,
    border-color 0.15s;
  margin-bottom: -0.5px;
}
.tab-btn:hover {
  color: var(--accent-muted);
}
.tab-btn.active {
  color: var(--accent-text);
  border-bottom-color: var(--accent);
}

/* Body */
.detail-body {
  flex: 1;
  overflow-y: auto;
  scrollbar-gutter: stable;
  padding: 28px 32px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Markdown */
.markdown-body {
  font-size: 15px;
  line-height: 1.75;
  color: var(--txt);
  max-width: 680px;
}

.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3) {
  font-family: "Cinzel", serif;
  color: var(--txt-title);
  font-weight: 600;
  margin: 1.4rem 0 0.5rem;
  line-height: 1.2;
  letter-spacing: 0.03em;
}
.markdown-body :deep(h1) {
  font-size: 1.3em;
  border-bottom: 0.5px solid var(--border);
  padding-bottom: 0.4rem;
}
.markdown-body :deep(h2) {
  font-size: 1.1em;
}
.markdown-body :deep(h3) {
  font-size: 0.98em;
  color: var(--accent-muted);
}
.markdown-body :deep(p) {
  margin: 0 0 0.75rem;
}
.markdown-body :deep(strong) {
  font-weight: 600;
  color: var(--txt-title);
}
.markdown-body :deep(em) {
  font-style: italic;
  color: var(--accent-muted);
}
.markdown-body :deep(blockquote) {
  border-left: 2px solid var(--accent);
  margin: 0.75rem 0;
  padding: 0.3rem 0 0.3rem 1rem;
  color: var(--txt-muted);
  font-style: italic;
  background: rgba(83, 74, 183, 0.05);
}
.markdown-body :deep(hr) {
  border: none;
  border-top: 0.5px solid var(--border);
  margin: 1.25rem 0;
}
.markdown-body :deep(code) {
  font-family: monospace;
  font-size: 0.88em;
  background: rgba(83, 74, 183, 0.12);
  color: #afa9ec;
  padding: 2px 6px;
  border-radius: 3px;
}
.markdown-body :deep(pre) {
  background: rgba(83, 74, 183, 0.07);
  border: 0.5px solid var(--border);
  border-radius: 6px;
  padding: 1rem;
  overflow-x: auto;
  margin: 0.75rem 0;
}
.markdown-body :deep(pre code) {
  background: none;
  padding: 0;
  color: var(--txt);
}
.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  padding-left: 1.5rem;
  margin: 0 0 0.75rem;
}
.markdown-body :deep(li) {
  margin-bottom: 0.25rem;
}

/* Comment composer */
.comment-composer {
  display: flex;
  flex-direction: column;
  gap: 8px;
  border: 0.5px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
  background: var(--bg-surface);
}

.comment-input {
  background: transparent;
  border: none;
  outline: none;
  color: var(--txt);
  font-family: "Crimson Pro", Georgia, serif;
  font-size: 14px;
  line-height: 1.6;
  padding: 12px 14px 4px;
  resize: none;
  width: 100%;
  box-sizing: border-box;
}
.comment-input::placeholder {
  color: var(--txt-placeholder);
}

.comment-composer__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px 10px;
  border-top: 0.5px solid var(--border);
}

.char-count {
  font-size: 11px;
  color: var(--txt-placeholder);
}

.btn-comment {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--accent);
  border: none;
  color: var(--accent-text);
  font-family: "Cinzel", serif;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 7px 16px;
  cursor: pointer;
  transform: skewX(-12deg);
  transition:
    background 0.15s,
    opacity 0.15s;
}
.btn-comment > * {
  transform: skewX(12deg);
}
.btn-comment svg {
  width: 11px;
  height: 11px;
}
.btn-comment:hover {
  background: var(--accent-hover);
}
.btn-comment:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.comments-status {
  font-size: 13px;
  color: var(--txt-muted);
  opacity: 0.6;
}

.comments-empty p {
  font-size: 13px;
  color: var(--txt-muted);
  font-style: italic;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* Notification */
.notification {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  background: #0d1b2a;
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

/* Transitions */
.detail-backdrop-enter-active,
.detail-backdrop-leave-active {
  transition: opacity 0.3s ease;
}
.detail-backdrop-enter-from,
.detail-backdrop-leave-to {
  opacity: 0;
}

.detail-panel-enter-active {
  transition: transform 0.35s cubic-bezier(0.34, 1.05, 0.64, 1);
}
.detail-panel-leave-active {
  transition: transform 0.28s cubic-bezier(0.4, 0, 1, 1);
}
.detail-panel-enter-from,
.detail-panel-leave-to {
  transform: translateX(100%);
}
</style>
