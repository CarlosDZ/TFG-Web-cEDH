<script setup>
import { ref, reactive, computed, nextTick, onMounted } from "vue";
import { usePanelState } from "../../composables/usePanelState";

const { isPanelOpen } = usePanelState();

const props = defineProps({
    initialData: { type: Object, default: null },
    deckId:      { type: String, default: null },
});
const emit = defineEmits(["close", "saved"]);

const visible = ref(false);
const saving      = ref(false);
const activeTab   = ref("general");
const availableTags = ref([]);

const TABS = [
    { id: "general", label: "General" },
    { id: "cards",   label: "Cartas"  },
    { id: "primer",  label: "Primer"  },
];

// ── Form state ─────────────────────────────────────────────────────────────
const form = reactive({
    title:              props.initialData?.title              ?? "",
    description:        props.initialData?.description        ?? "",
    isPublic:           props.initialData?.isPublic           ?? true,
    allowComments:      props.initialData?.allowComments      ?? true,
    tags:               props.initialData?.tags               ? [...props.initialData.tags] : [],
    commander:          props.initialData?.commander          ? [...props.initialData.commander] : [],
    cards:              props.initialData?.cards              ? [...props.initialData.cards] : [],
    alternative_choices:props.initialData?.alternative_choices? [...props.initialData.alternative_choices] : [],
    decktech_markdown:  props.initialData?.decktech_markdown  ?? "",
});

// ── Card list inputs ────────────────────────────────────────────────────────
const newCommander   = ref("");
const newCard        = ref("");
const newAltChoice   = ref("");

function addToList(list, inputRef) {
    const val = inputRef.value.trim();
    if (val && !list.includes(val)) list.push(val);
    inputRef.value = "";
}
function removeFromList(list, idx) {
    list.splice(idx, 1);
}

// ── Tags ────────────────────────────────────────────────────────────────────
function toggleTag(tagId) {
    const i = form.tags.indexOf(tagId);
    if (i === -1) form.tags.push(tagId);
    else form.tags.splice(i, 1);
}

// ── Validation ──────────────────────────────────────────────────────────────
const canSave = computed(() => form.title.trim().length > 0 && !saving.value);

// ── Lifecycle ───────────────────────────────────────────────────────────────
onMounted(async () => {
    nextTick(() => { visible.value = true; });
    try {
        const res = await fetch("/api/tag/");
        const data = await res.json();
        availableTags.value = data.filter(t => t.active);
    } catch { /* no tags available */ }
});

// ── Actions ─────────────────────────────────────────────────────────────────
function handleClose() {
    visible.value = false;
    setTimeout(() => emit("close"), 320);
}

async function save() {
    if (!canSave.value) return;
    saving.value = true;
    try {
        const payload = {
            title:               form.title.trim(),
            description:         form.description.trim(),
            isPublic:            form.isPublic,
            allowComments:       form.allowComments,
            tags:                form.tags,
            commander:           form.commander,
            cards:               form.cards,
            alternative_choices: form.alternative_choices,
            decktech_markdown:   form.decktech_markdown.trim(),
        };

        const url = props.deckId
            ? `/api/decklist/${props.deckId}`
            : `/api/decklist`;
        const method = props.deckId ? "PATCH" : "POST";

        const res = await fetch(url, {
            method,
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Error al guardar");
        const data = await res.json();
        emit("saved", data);
        handleClose();
    } catch (err) {
        console.error(err);
    } finally {
        saving.value = false;
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

                            <!-- Header -->
                            <div class="modal-header">
                                <div class="modal-header-text">
                                    <span class="modal-eyebrow">
                                        {{ deckId ? "Editando deck" : "Nueva decklist" }}
                                    </span>
                                    <h2 class="modal-heading">
                                        {{ form.title || (deckId ? "Sin título" : "¿Qué vas a jugar?") }}
                                    </h2>
                                </div>
                                <button class="close-btn" @click="handleClose" title="Cerrar">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18"/>
                                        <line x1="6" y1="6" x2="18" y2="18"/>
                                    </svg>
                                </button>
                            </div>

                            <!-- Tabs -->
                            <div class="tab-bar">
                                <button
                                    v-for="tab in TABS"
                                    :key="tab.id"
                                    class="tab-btn"
                                    :class="{ active: activeTab === tab.id }"
                                    @click="activeTab = tab.id"
                                >
                                    {{ tab.label }}
                                </button>
                            </div>

                            <!-- Body -->
                            <div class="modal-body">

                                <!-- ── Tab: General ── -->
                                <div v-if="activeTab === 'general'" class="tab-content">

                                    <div class="field-group">
                                        <label class="field-label">Título <span class="required">*</span></label>
                                        <input
                                            class="field-input"
                                            type="text"
                                            placeholder="Nombre del deck..."
                                            v-model="form.title"
                                            maxlength="200"
                                        />
                                    </div>

                                    <div class="field-group">
                                        <label class="field-label">Descripción</label>
                                        <textarea
                                            class="field-textarea"
                                            placeholder="Breve descripción del deck..."
                                            v-model="form.description"
                                            rows="3"
                                            maxlength="1000"
                                        />
                                    </div>

                                    <div class="toggles-row">
                                        <button
                                            class="toggle-btn"
                                            :class="{ active: form.isPublic }"
                                            @click="form.isPublic = !form.isPublic"
                                            type="button"
                                        >
                                            <span class="toggle-track">
                                                <span class="toggle-thumb" />
                                            </span>
                                            Público
                                        </button>
                                        <button
                                            class="toggle-btn"
                                            :class="{ active: form.allowComments }"
                                            @click="form.allowComments = !form.allowComments"
                                            type="button"
                                        >
                                            <span class="toggle-track">
                                                <span class="toggle-thumb" />
                                            </span>
                                            Permitir comentarios
                                        </button>
                                    </div>

                                    <div v-if="availableTags.length > 0" class="field-group">
                                        <label class="field-label">Tags</label>
                                        <div class="tags-wrap">
                                            <button
                                                v-for="tag in availableTags"
                                                :key="tag._id"
                                                class="tag-pill"
                                                :class="{ selected: form.tags.includes(tag._id) }"
                                                type="button"
                                                @click="toggleTag(tag._id)"
                                            >
                                                {{ tag.name }}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <!-- ── Tab: Cartas ── -->
                                <div v-else-if="activeTab === 'cards'" class="tab-content">

                                    <div class="card-section">
                                        <label class="field-label">
                                            Comandante(s)
                                            <span class="count-badge">{{ form.commander.length }}</span>
                                        </label>
                                        <div class="card-input-row">
                                            <input class="field-input" type="text" placeholder="Nombre de la carta..." v-model="newCommander" @keydown.enter.prevent="addToList(form.commander, newCommander)" />
                                            <button class="add-btn" type="button" @click="addToList(form.commander, newCommander)">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                                            </button>
                                        </div>
                                        <div class="chip-grid chip-grid--sm">
                                            <span v-for="(card, i) in form.commander" :key="i" class="card-chip card-chip--accent">
                                                {{ card }}<button class="chip-remove" type="button" @click="removeFromList(form.commander, i)" title="Eliminar">✕</button>
                                            </span>
                                        </div>
                                    </div>

                                    <div class="card-section">
                                        <label class="field-label">
                                            Mainboard
                                            <span class="count-badge">{{ form.cards.length }}</span>
                                        </label>
                                        <div class="card-input-row">
                                            <input class="field-input" type="text" placeholder="Nombre de la carta..." v-model="newCard" @keydown.enter.prevent="addToList(form.cards, newCard)" />
                                            <button class="add-btn" type="button" @click="addToList(form.cards, newCard)">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                                            </button>
                                        </div>
                                        <div class="chip-grid chip-grid--lg">
                                            <span v-for="(card, i) in form.cards" :key="i" class="card-chip">
                                                {{ card }}<button class="chip-remove" type="button" @click="removeFromList(form.cards, i)" title="Eliminar">✕</button>
                                            </span>
                                        </div>
                                    </div>

                                    <div class="card-section">
                                        <label class="field-label">
                                            Alternativas
                                            <span class="count-badge">{{ form.alternative_choices.length }}</span>
                                        </label>
                                        <div class="card-input-row">
                                            <input class="field-input" type="text" placeholder="Nombre de la carta..." v-model="newAltChoice" @keydown.enter.prevent="addToList(form.alternative_choices, newAltChoice)" />
                                            <button class="add-btn" type="button" @click="addToList(form.alternative_choices, newAltChoice)">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                                            </button>
                                        </div>
                                        <div class="chip-grid chip-grid--md">
                                            <span v-for="(card, i) in form.alternative_choices" :key="i" class="card-chip card-chip--alt">
                                                {{ card }}<button class="chip-remove" type="button" @click="removeFromList(form.alternative_choices, i)" title="Eliminar">✕</button>
                                            </span>
                                        </div>
                                    </div>

                                </div>

                                <!-- ── Tab: Primer ── -->
                                <div v-else-if="activeTab === 'primer'" class="tab-content">
                                    <textarea
                                        class="field-textarea primer-textarea"
                                        placeholder="Escribe el primer del deck en Markdown..."
                                        v-model="form.decktech_markdown"
                                    />
                                </div>

                            </div>

                            <!-- Footer -->
                            <div class="modal-footer">
                                <button class="btn-publish" type="button" :disabled="!canSave" @click="save">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                                        <polyline points="17 21 17 13 7 13 7 21"/>
                                        <polyline points="7 3 7 8 15 8"/>
                                    </svg>
                                    {{ saving ? "Guardando..." : (deckId ? "Guardar cambios" : "Publicar deck") }}
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
    width: 95%;
    max-width: 1000px;
    max-height: 96vh;
    display: flex;
    flex-direction: column;
    transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    transform: translateX(0);
}

.modal-wrapper.panel-offset {
    transform: translateX(-110px);
}

.modal {
    --accent:       #534ab7;
    --accent-hover: #3c3489;
    --accent-text:  #eeedfe;
    --accent-muted: #afa9ec;
    --bg:           #0d1b2a;
    --bg-surface:   #080f18;
    --border:       #1c3a58;
    --txt:          #e0ddd8;
    --txt-title:    #e8e3d8;
    --txt-muted:    #6b8caa;
    --txt-placeholder: #2a4460;

    width: 100%;
    max-height: 96vh;
    background: var(--bg);
    border: 0.5px solid var(--border);
    display: flex;
    flex-direction: column;
    font-family: "Crimson Pro", Georgia, serif;
    overflow: hidden;
}

/* Header */
.modal-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 22px 22px 18px;
    background: var(--bg-surface);
    border-bottom: 0.5px solid var(--border);
    flex-shrink: 0;
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
    letter-spacing: 0.03em;
    margin: 0;
    line-height: 1.2;
    max-width: 500px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
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
.close-btn:hover { color: var(--txt); border-color: var(--txt-muted); }
.close-btn svg { width: 14px; height: 14px; }

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
    transition: color 0.15s, border-color 0.15s;
    margin-bottom: -0.5px;
}
.tab-btn:hover { color: var(--accent-muted); }
.tab-btn.active {
    color: var(--accent-text);
    border-bottom-color: var(--accent);
}

/* Body */
.modal-body {
    flex: 1;
    overflow-y: auto;
    scrollbar-gutter: stable;
}

.tab-content {
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding: 20px 22px;
}

/* Fields */
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
    display: flex;
    align-items: center;
    gap: 6px;
}

.required { color: var(--accent); }

.field-input {
    background: var(--bg-surface);
    border: 0.5px solid var(--border);
    color: var(--txt);
    font-family: "Crimson Pro", Georgia, serif;
    font-size: 14px;
    padding: 9px 12px;
    outline: none;
    width: 100%;
    box-sizing: border-box;
    transition: border-color 0.15s;
}
.field-input:focus { border-color: var(--accent); }
.field-input::placeholder { color: var(--txt-placeholder); }

.field-textarea {
    background: var(--bg-surface);
    border: 0.5px solid var(--border);
    color: var(--txt);
    font-family: "Crimson Pro", Georgia, serif;
    font-size: 14px;
    line-height: 1.6;
    padding: 10px 12px;
    outline: none;
    resize: vertical;
    width: 100%;
    box-sizing: border-box;
    transition: border-color 0.15s;
}
.field-textarea:focus { border-color: var(--accent); }
.field-textarea::placeholder { color: var(--txt-placeholder); }

.primer-textarea {
    min-height: 320px;
    resize: none;
    flex: 1;
    font-size: 13px;
}

/* Toggles */
.toggles-row {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
}

.toggle-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    background: var(--bg-surface);
    border: 0.5px solid var(--border);
    color: var(--txt-muted);
    font-family: "Cinzel", serif;
    font-size: 10px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 8px 14px 8px 10px;
    cursor: pointer;
    transition: color 0.15s, border-color 0.15s;
}
.toggle-btn.active { color: var(--accent-text); border-color: var(--accent); }

.toggle-track {
    width: 28px;
    height: 15px;
    background: var(--border);
    border-radius: 99px;
    position: relative;
    flex-shrink: 0;
    transition: background 0.2s;
}
.toggle-btn.active .toggle-track { background: var(--accent); }

.toggle-thumb {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 11px;
    height: 11px;
    background: var(--txt-muted);
    border-radius: 50%;
    transition: left 0.2s, background 0.2s;
}
.toggle-btn.active .toggle-thumb {
    left: 15px;
    background: var(--accent-text);
}

/* Tags */
.tags-wrap {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
}

.tag-pill {
    font-size: 10px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    background: transparent;
    color: var(--txt-muted);
    border: 0.5px solid var(--border);
    padding: 4px 10px;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s, color 0.15s;
}
.tag-pill:hover { border-color: var(--accent-muted); color: var(--accent-muted); }
.tag-pill.selected {
    background: rgba(83, 74, 183, 0.15);
    border-color: var(--accent);
    color: var(--accent-text);
}

/* Cards tab */
.card-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.count-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: rgba(83, 74, 183, 0.2);
    color: var(--accent-muted);
    border-radius: 99px;
    font-size: 9px;
    padding: 1px 7px;
    font-family: "Cinzel", serif;
}

.card-input-row {
    display: flex;
    gap: 6px;
}
.card-input-row .field-input { flex: 1; }

.add-btn {
    width: 36px;
    height: 36px;
    background: var(--accent);
    border: none;
    color: var(--accent-text);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    flex-shrink: 0;
    transition: background 0.15s;
}
.add-btn:hover { background: var(--accent-hover); }
.add-btn svg { width: 16px; height: 16px; }

.chip-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    overflow-y: auto;
    scrollbar-gutter: stable;
    padding: 2px 0;
}
.chip-grid--sm { max-height: 60px; }
.chip-grid--md { max-height: 120px; }
.chip-grid--lg { max-height: 220px; }

.card-chip {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    background: rgba(28, 58, 88, 0.5);
    border: 0.5px solid var(--border);
    color: var(--txt);
    font-size: 11px;
    padding: 3px 7px 3px 9px;
    border-radius: 3px;
    line-height: 1.4;
    max-width: 100%;
}

.card-chip--accent {
    background: rgba(83, 74, 183, 0.15);
    border-color: rgba(83, 74, 183, 0.4);
    color: var(--accent-text);
}

.card-chip--alt {
    background: rgba(28, 58, 88, 0.3);
    border-style: dashed;
    color: var(--txt-muted);
}

.chip-remove {
    background: none;
    border: none;
    color: var(--txt-muted);
    cursor: pointer;
    font-size: 9px;
    padding: 0;
    flex-shrink: 0;
    line-height: 1;
    transition: color 0.15s;
}
.chip-remove:hover { color: #e05c5c; }

/* Footer */
.modal-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding: 12px 18px 16px;
    border-top: 0.5px solid var(--border);
    background: var(--bg-surface);
    flex-shrink: 0;
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
    transition: background 0.15s, opacity 0.15s;
}
.btn-publish > * { transform: skewX(12deg); }
.btn-publish svg { width: 13px; height: 13px; flex-shrink: 0; }
.btn-publish:hover { background: var(--accent-hover); }
.btn-publish:disabled { opacity: 0.35; cursor: not-allowed; }

/* Animations */
@media (max-width: 768px) {
    .modal-wrapper { width: 100%; max-width: 100%; }
    .modal-wrapper.panel-offset { transform: translateX(0); }
}

.backdrop-enter-active, .backdrop-leave-active { transition: opacity 0.3s ease; }
.backdrop-enter-from, .backdrop-leave-to { opacity: 0; }

.modal-enter-active { transition: transform 0.35s cubic-bezier(0.34, 1.1, 0.64, 1), opacity 0.25s ease; }
.modal-leave-active { transition: transform 0.28s cubic-bezier(0.4, 0, 1, 1), opacity 0.2s ease; }
.modal-enter-from, .modal-leave-to { transform: translateY(40px); opacity: 0; }
</style>
