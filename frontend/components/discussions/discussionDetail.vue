<script setup>
import { ref, nextTick } from "vue";
import postOnFeed from "./postOnFeed.component.vue";

defineOptions({ name: "discussionDetail" });

const props = defineProps({
  post: { type: Object, required: true },
});
const emit = defineEmits(["close"]);

const visible = ref(false);

nextTick(() => {
  visible.value = true;
});

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
            <div class="detail-header">
              <span class="detail-eyebrow">Discusión</span>
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

            <div class="detail-body">
              <postOnFeed
                :discusion-element="post"
                :depth="0"
                :is-last="true"
              />
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.detail-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 900;
  display: flex;
  justify-content: flex-end;
}

@media (prefers-color-scheme: dark) {
  .detail-panel {
    --comment-border: rgb(100, 100, 231);
    --txt-color: #e0ddd8;
    --txt-secondary: #8899aa;
    --card-bg: #111827;
    --hover-bg: rgba(83, 74, 183, 0.08);
  }
}

@media (prefers-color-scheme: light) {
  .detail-panel {
    --comment-border: rgba(58, 53, 65, 0.3);
    --txt-color: #3a3541;
    --txt-secondary: rgba(58, 53, 65, 0.55);
    --card-bg: #ffffff;
    --hover-bg: rgba(0, 0, 0, 0.04);
  }
}

.detail-panel {
  width: min(580px, 92vw);
  height: calc(100% - 1rem);
  margin-top: 1rem;
  border-radius: 12px 0 0 0;
  background: var(--card-bg, #0d1b2a);
  border-left: 0.5px solid var(--comment-border);
  border-top: 0.5px solid var(--comment-border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem 0.75rem;
  border-bottom: 0.5px solid var(--comment-border);
  flex-shrink: 0;
}

.detail-eyebrow {
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--txt-secondary, #888);
}

.close-btn {
  background: none;
  border: 0.5px solid var(--comment-border);
  border-radius: 8px;
  padding: 6px;
  cursor: pointer;
  color: var(--txt-secondary, #888);
  display: flex;
  align-items: center;
  transition:
    color 0.15s,
    border-color 0.15s;
}
.close-btn:hover {
  color: var(--txt-color);
  border-color: var(--txt-color);
}
.close-btn svg {
  width: 16px;
  height: 16px;
}

.detail-body {
  flex: 1;
  overflow-y: auto;
  /* padding-left amplio para que los ::before/::after de las líneas de árbol
     (left: -20px) no queden cortados */
  padding: 1rem 1rem 1rem 2rem;
  box-sizing: border-box;
}

.detail-body :deep(.discusion) {
  max-width: 100%;
  box-sizing: border-box;
}

.detail-body :deep(.post-wrapper) {
  max-width: 100%;
}

/* Slide-in from right */
.detail-panel-enter-active,
.detail-panel-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.detail-panel-enter-from,
.detail-panel-leave-to {
  transform: translateX(100%);
}

.detail-backdrop-enter-active,
.detail-backdrop-leave-active {
  transition: opacity 0.3s ease;
}
.detail-backdrop-enter-from,
.detail-backdrop-leave-to {
  opacity: 0;
}
</style>
