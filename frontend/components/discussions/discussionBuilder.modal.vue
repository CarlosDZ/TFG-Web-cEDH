<script setup>
import { ref, nextTick, onMounted } from "vue";
import { usePanelState } from "../../composables/usePanelState";

const { isPanelOpen } = usePanelState();

const props = defineProps({
    parentId: { type: String, default: null },
    commentingOnDeck: { type: Boolean, default: false },
});
const emit = defineEmits(["close", "published"]);

const title = ref("");
const body = ref("");
const publishing = ref(false);
const bodyRef = ref(null);
const visible = ref(false);
const TOOLBAR_ACTIONS = [
    { label: "Título", icon: "<b>H1</b>", action: (t) => `# ${t}` },
    { label: "Subtítulo", icon: "<b>H2</b>", action: (t) => `## ${t}` },
    { label: "Negrita", icon: "<b>B</b>", action: (t) => `**${t}**` },
    { label: "Cursiva", icon: "<i>I</i>", action: (t) => `*${t}*` },
    { label: "Cita", icon: "❝", action: (t) => `> ${t}` },
    { label: "Separador", icon: "—", action: (t) => `\n---\n${t}` },
];

onMounted(() => {
    nextTick(() => {
        visible.value = true;
    });
});

function handleClose() {
    visible.value = false;
    setTimeout(() => emit("close"), 320);
}

function applyFormat(actionFn) {
    const el = bodyRef.value;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = body.value.slice(start, end) || "texto";
    const replacement = actionFn(selected);
    body.value = body.value.slice(0, start) + replacement + body.value.slice(end);
    nextTick(() => {
        el.focus();
        el.setSelectionRange(start, start + replacement.length);
    });
}

async function publish() {
    if ((!title.value.trim() && !props.parentId) || !body.value.trim()) return;
    publishing.value = true;
    try {
        var target_url;
        if (!props.commentingOnDeck && !props.parentId) {
            target_url = `/api/comment`;
        } else if (!props.commentingOnDeck && props.parentId) {
            target_url = `/api/comment/${props.parentId}/comment`;
        } else {
            target_url = `/api/decklist/${props.parentId}/comment`;
        }

        const payload = {
            title: title.value.trim(),
            markdown_text: body.value.trim(),
            ...(props.parentId && { parent_id: props.parentId }),
        };
        const res = await fetch(target_url, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Error al publicar");
        const data = await res.json();
        emit("published", data);
        handleClose();
    } catch (err) {
        console.error(err);
    } finally {
        publishing.value = false;
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
                                    <span class="modal-eyebrow">
                                        {{ parentId ? "Respondiendo" : "Nueva discusión" }}
                                    </span>
                                    <h2 class="modal-heading">
                                        {{ parentId ? "¿Qué piensas?" : "¿Qué quieres debatir?" }}
                                    </h2>
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
                                <div class="toolbar">
                                    <button
                                        v-for="action in TOOLBAR_ACTIONS"
                                        :key="action.label"
                                        class="toolbar-btn"
                                        :title="action.label"
                                        type="button"
                                        @click="applyFormat(action.action)"
                                    >
                                        <span class="toolbar-icon" v-html="action.icon"></span>
                                        <span class="toolbar-label">{{ action.label }}</span>
                                    </button>
                                </div>

                                <div class="fields">
                                    <div v-if="!parentId" class="field-title-wrap">
                                        <input
                                            class="field-title"
                                            type="text"
                                            placeholder="Título de la discusión..."
                                            v-model="title"
                                            maxlength="200"
                                        />
                                        <div
                                            class="char-count"
                                            :class="{
                                                'char-warn': title.length > 160,
                                                'char-limit': title.length >= 200,
                                            }"
                                        >
                                            {{ title.length }}/200
                                        </div>
                                    </div>
                                    <textarea
                                        ref="bodyRef"
                                        class="field-body"
                                        placeholder="Desarrolla tu argumento, pregunta o análisis..."
                                        v-model="body"
                                        maxlength="3000"
                                    />
                                    <div
                                        class="char-count"
                                        :class="{
                                            'char-warn': body.length > 2700,
                                            'char-limit': body.length >= 3000,
                                        }"
                                    >
                                        {{ body.length }}/3000
                                    </div>
                                </div>
                            </div>

                            <div class="modal-footer">
                                <button
                                    class="btn-publish"
                                    type="button"
                                    :disabled="
                                        (!title.trim() && !props.parentId) ||
                                        !body.trim() ||
                                        publishing
                                    "
                                    @click="publish"
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
                                    {{ publishing ? "Publicando..." : "Publicar" }}
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
    max-width: 700px;
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
    display: flex;
    flex-direction: row;
    flex: 1;
}

.toolbar {
    display: flex;
    flex-direction: column;
    gap: 1px;
    padding: 8px 6px;
    border-right: 0.5px solid var(--border);
    background: var(--bg-surface);
}

.toolbar-btn {
    background: none;
    border: 0.5px solid transparent;
    color: var(--txt-muted);
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    padding: 7px 8px;
    width: 58px;
    transition:
        background 0.1s,
        border-color 0.1s,
        color 0.1s;
}
.toolbar-btn:hover {
    background: rgba(83, 74, 183, 0.15);
    border-color: var(--border);
    color: var(--accent-muted);
}
.toolbar-icon {
    font-size: 13px;
    font-family: "Cinzel", serif;
    line-height: 1;
    color: inherit;
}
.toolbar-label {
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: inherit;
    white-space: nowrap;
    font-family: "Crimson Pro", serif;
}

.fields {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
}

.field-title {
    background: transparent;
    border: none;
    border-bottom: 0.5px solid var(--border);
    outline: none;
    color: var(--txt-title);
    font-family: "Cinzel", serif;
    font-size: 16px;
    font-weight: 600;
    letter-spacing: 0.02em;
    padding: 16px 18px;
    width: 100%;
    box-sizing: border-box;
}

.field-title-wrap {
    display: flex;
    align-items: center;
    border-bottom: 0.5px solid var(--border);
}

.field-title-wrap .field-title {
    border-bottom: none;
    flex: 1;
}

.field-title-wrap .char-count {
    padding: 0 14px;
    white-space: nowrap;
    flex-shrink: 0;
}

.field-title::placeholder {
    color: var(--txt-placeholder);
    font-weight: 400;
    font-family: "Crimson Pro", serif;
}

.field-body {
    background: transparent;
    border: none;
    outline: none;
    color: var(--txt);
    font-family: "Crimson Pro", Georgia, serif;
    font-size: 15px;
    line-height: 1.7;
    padding: 16px 18px;
    resize: none;
    min-height: 200px;
    flex: 1;
    width: 100%;
    box-sizing: border-box;
}
.field-body::placeholder {
    color: var(--txt-placeholder);
}

.char-count {
    font-size: 11px;
    color: var(--txt-placeholder);
    letter-spacing: 0.04em;
    padding: 6px 18px 10px;
    text-align: right;
}

.modal-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding: 12px 18px 16px;
    border-top: 0.5px solid var(--border);
    background: var(--bg-surface);
}

.btn-publish {
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
.btn-publish > * {
    transform: skewX(12deg);
}
.btn-publish svg {
    width: 13px;
    height: 13px;
    flex-shrink: 0;
}
.btn-publish:hover {
    background: var(--accent-hover);
}
.btn-publish:disabled {
    opacity: 0.35;
    cursor: not-allowed;
}

@media (max-width: 768px) {
    .modal-wrapper {
        width: 100%;
        max-width: 100%;
    }
    .modal-wrapper.panel-offset {
        transform: translateX(0);
    }
    .toolbar {
        flex-direction: row;
        border-right: none;
        border-bottom: 0.5px solid var(--border);
        padding: 6px 8px;
        overflow-x: auto;
    }
    .toolbar-btn {
        width: auto;
        flex-direction: row;
        padding: 6px 10px;
        gap: 5px;
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
