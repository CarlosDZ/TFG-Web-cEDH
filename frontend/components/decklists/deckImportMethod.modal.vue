<script setup>
import { ref, nextTick, onMounted } from "vue";
import { usePanelState } from "../../composables/usePanelState";

const { isPanelOpen } = usePanelState();
const emit = defineEmits(["close", "select"]);

const visible = ref(false);

const IMPORT_METHODS = [
    {
        id: "moxfield",
        label: "Moxfield",
        sub: "Importa automáticamente desde un enlace de Moxfield",
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
        </svg>`,
    },
    {
        id: "plaintext",
        label: "Texto plano",
        sub: "Pega tu lista en formato de texto (1 Nombre de carta)",
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
        </svg>`,
    },
];

onMounted(() => {
    nextTick(() => { visible.value = true; });
});

function handleClose() {
    visible.value = false;
    setTimeout(() => emit("close"), 320);
}

function select(methodId) {
    visible.value = false;
    setTimeout(() => emit("select", methodId), 320);
}
</script>

<template>
    <Teleport to="body">
        <Transition name="backdrop">
            <div v-if="visible" class="modal-backdrop" @click.self="handleClose">
                <div class="modal-wrapper" :class="{ 'panel-offset': isPanelOpen }">
                    <Transition name="modal">
                        <div v-if="visible" class="modal">

                            <div class="modal-header">
                                <div class="modal-header-text">
                                    <span class="modal-eyebrow">Nueva decklist</span>
                                    <h2 class="modal-heading">¿Cómo quieres importar?</h2>
                                </div>
                                <button class="close-btn" @click="handleClose" title="Cerrar">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            </div>

                            <div class="modal-body">
                                <button
                                    v-for="method in IMPORT_METHODS"
                                    :key="method.id"
                                    class="method-card"
                                    @click="select(method.id)"
                                >
                                    <span class="method-icon" v-html="method.icon" />
                                    <span class="method-info">
                                        <span class="method-label">{{ method.label }}</span>
                                        <span class="method-sub">{{ method.sub }}</span>
                                    </span>
                                    <svg class="method-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <polyline points="9 18 15 12 9 6" />
                                    </svg>
                                </button>
                            </div>

                        </div>
                    </Transition>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<style scoped>
.modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(5, 10, 18, 0.8);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
}

.modal-wrapper {
    width: 90%;
    max-width: 480px;
    transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    transform: translateX(0);
}

.modal-wrapper.panel-offset {
    transform: translateX(-110px);
}

.modal {
    --accent: #534ab7;
    --accent-hover: #3c3489;
    --accent-text: #eeedfe;
    --accent-muted: #afa9ec;
    --bg: #0d1b2a;
    --bg-surface: #080f18;
    --border: #1c3a58;
    --txt: #e0ddd8;
    --txt-title: #e8e3d8;
    --txt-muted: #6b8caa;

    width: 100%;
    background: var(--bg);
    border: 0.5px solid var(--border);
    display: flex;
    flex-direction: column;
    font-family: "Crimson Pro", Georgia, serif;
}

.modal-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 22px 22px 18px;
    background: var(--bg-surface);
    border-bottom: 0.5px solid var(--border);
}

.modal-eyebrow {
    font-family: "Cinzel", serif;
    font-size: 10px;
    font-weight: 600;
    color: var(--accent-muted);
    text-transform: uppercase;
    letter-spacing: 0.12em;
    display: block;
    margin-bottom: 4px;
}

.modal-heading {
    font-family: "Cinzel", serif;
    font-size: 20px;
    font-weight: 600;
    color: var(--txt-title);
    letter-spacing: 0.03em;
    margin: 0;
    line-height: 1.2;
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
    flex-shrink: 0;
    margin-left: 16px;
    transition: color 0.15s, border-color 0.15s;
}
.close-btn:hover {
    color: var(--txt);
    border-color: var(--txt-muted);
}
.close-btn svg {
    width: 14px;
    height: 14px;
}

.modal-body {
    display: flex;
    flex-direction: column;
    padding: 16px;
    gap: 8px;
}

.method-card {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px 18px;
    background: var(--bg-surface);
    border: 0.5px solid var(--border);
    cursor: pointer;
    text-align: left;
    transition: border-color 0.15s, background 0.15s;
}
.method-card:hover {
    border-color: var(--accent);
    background: rgba(83, 74, 183, 0.07);
}
.method-card:hover .method-arrow {
    color: var(--accent-muted);
    transform: translateX(3px);
}

.method-icon {
    flex-shrink: 0;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--accent-muted);
}
.method-icon :deep(svg) {
    width: 22px;
    height: 22px;
}

.method-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
}

.method-label {
    font-family: "Cinzel", serif;
    font-size: 13px;
    font-weight: 600;
    color: var(--txt-title);
    letter-spacing: 0.04em;
}

.method-sub {
    font-size: 12px;
    color: var(--txt-muted);
    line-height: 1.4;
}

.method-arrow {
    width: 16px;
    height: 16px;
    color: var(--border);
    flex-shrink: 0;
    transition: color 0.15s, transform 0.15s;
}

@media (max-width: 768px) {
    .modal-wrapper {
        width: 100%;
        max-width: 100%;
    }
    .modal-wrapper.panel-offset {
        transform: translateX(0);
    }
}

.backdrop-enter-active,
.backdrop-leave-active {
    transition: opacity 0.3s ease;
}
.backdrop-enter-from,
.backdrop-leave-to {
    opacity: 0;
}

.modal-enter-active {
    transition: transform 0.35s cubic-bezier(0.34, 1.1, 0.64, 1), opacity 0.25s ease;
}
.modal-leave-active {
    transition: transform 0.28s cubic-bezier(0.4, 0, 1, 1), opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
    transform: translateY(40px);
    opacity: 0;
}
</style>
