<script setup>
import { ref, nextTick, onMounted } from "vue";
import { usePanelState } from "../../composables/usePanelState";

const { isPanelOpen } = usePanelState();
const emit = defineEmits(["close", "confirm"]);

const visible = ref(false);
const url = ref("");
const loading = ref(false);
const error = ref("");

onMounted(() => {
    nextTick(() => {
        visible.value = true;
    });
});

function handleClose() {
    visible.value = false;
    setTimeout(() => emit("close"), 320);
}

async function confirm() {
    if (!url.value.trim()) return;
    error.value = "";
    loading.value = true;
    try {
        const res = await fetch(
            `/api/decklist/import/moxfield?url=${encodeURIComponent(url.value.trim())}`,
            {
                credentials: "include",
            }
        );
        const data = await res.json();
        if (!res.ok) {
            error.value = data.error ?? "Error al importar el deck";
            return;
        }
        visible.value = false;
        setTimeout(() => emit("confirm", data), 320);
    } catch {
        error.value = "Error de conexión";
    } finally {
        loading.value = false;
    }
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
                                    <span class="modal-eyebrow">Importar deck</span>
                                    <h2 class="modal-heading">Desde Moxfield</h2>
                                </div>
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

                            <div class="modal-body">
                                <div class="field-group">
                                    <label class="field-label">Link del deck</label>
                                    <input
                                        class="field-input"
                                        type="url"
                                        placeholder="https://www.moxfield.com/decks/..."
                                        v-model="url"
                                        @keydown.enter.prevent="confirm"
                                        autofocus
                                    />
                                </div>

                                <p v-if="error" class="error-msg">{{ error }}</p>

                                <div class="disclaimer">
                                    <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="1.5"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                    >
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="12" y1="8" x2="12" y2="12" />
                                        <line x1="12" y1="16" x2="12.01" y2="16" />
                                    </svg>
                                    <span>
                                        Los decks con visibilidad
                                        <strong>privada</strong>
                                        no pueden importarse. Asegúrate de que el deck es público
                                        antes de continuar o usa otro metodo para importar.
                                    </span>
                                </div>
                            </div>

                            <div class="modal-footer">
                                <button class="btn-cancel" type="button" @click="handleClose">
                                    Cancelar
                                </button>
                                <button
                                    class="btn-import"
                                    type="button"
                                    :disabled="!url.trim() || loading"
                                    @click="confirm"
                                >
                                    <svg
                                        v-if="loading"
                                        class="spinner"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2"
                                    >
                                        <path
                                            d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
                                        />
                                    </svg>
                                    <svg
                                        v-else
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                    >
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                        <polyline points="17 8 12 3 7 8" />
                                        <line x1="12" y1="3" x2="12" y2="15" />
                                    </svg>
                                    {{ loading ? "Importando..." : "Importar" }}
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
    z-index: 1100;
    display: flex;
    align-items: center;
    justify-content: center;
}

.modal-wrapper {
    width: 90%;
    max-width: 460px;
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
    --txt-placeholder: #2a4460;

    background: var(--bg);
    border: 0.5px solid var(--border);
    font-family: "Crimson Pro", Georgia, serif;
}

.modal-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 20px 22px 16px;
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
    font-size: 18px;
    font-weight: 600;
    color: var(--txt-title);
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
    margin-left: 16px;
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

.modal-body {
    padding: 20px 22px;
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.field-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.field-label {
    font-family: "Cinzel", serif;
    font-size: 10px;
    font-weight: 600;
    color: var(--accent-muted);
    text-transform: uppercase;
    letter-spacing: 0.1em;
}

.field-input {
    background: var(--bg-surface);
    border: 0.5px solid var(--border);
    color: var(--txt);
    font-family: "Crimson Pro", Georgia, serif;
    font-size: 13px;
    padding: 9px 12px;
    outline: none;
    width: 100%;
    box-sizing: border-box;
    transition: border-color 0.15s;
}
.field-input:focus {
    border-color: var(--accent);
}
.field-input::placeholder {
    color: var(--txt-placeholder);
}

.error-msg {
    font-size: 12px;
    color: #e05c5c;
    margin: 0;
}

.disclaimer {
    display: flex;
    align-items: flex-start;
    gap: 9px;
    background: rgba(28, 58, 88, 0.4);
    border: 0.5px solid var(--border);
    border-left: 2px solid var(--accent);
    padding: 10px 12px;
    font-size: 12px;
    color: var(--txt-muted);
    line-height: 1.5;
}
.disclaimer svg {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
    color: var(--accent-muted);
    margin-top: 1px;
}
.disclaimer strong {
    color: var(--txt);
}

.modal-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
    padding: 12px 18px 16px;
    border-top: 0.5px solid var(--border);
    background: var(--bg-surface);
}

.btn-cancel {
    background: none;
    border: 0.5px solid var(--border);
    color: var(--txt-muted);
    font-family: "Cinzel", serif;
    font-size: 10px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 9px 18px;
    cursor: pointer;
    transition:
        border-color 0.15s,
        color 0.15s;
}
.btn-cancel:hover {
    border-color: var(--txt-muted);
    color: var(--txt);
}

.btn-import {
    display: flex;
    align-items: center;
    gap: 8px;
    background: var(--accent);
    border: none;
    color: var(--accent-text);
    font-family: "Cinzel", serif;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    padding: 10px 22px;
    cursor: pointer;
    transform: skewX(-12deg);
    transition:
        background 0.15s,
        opacity 0.15s;
}
.btn-import > * {
    transform: skewX(12deg);
}
.btn-import svg {
    width: 13px;
    height: 13px;
}
.btn-import:hover {
    background: var(--accent-hover);
}
.btn-import:disabled {
    opacity: 0.35;
    cursor: not-allowed;
}

.spinner {
    animation: spin 0.8s linear infinite;
}
@keyframes spin {
    to {
        transform: skewX(12deg) rotate(360deg);
    }
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
    transition:
        transform 0.35s cubic-bezier(0.34, 1.1, 0.64, 1),
        opacity 0.25s ease;
}
.modal-leave-active {
    transition:
        transform 0.28s cubic-bezier(0.4, 0, 1, 1),
        opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
    transform: translateY(40px);
    opacity: 0;
}
</style>
