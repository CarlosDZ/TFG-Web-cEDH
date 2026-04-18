<script setup>
import { ref, reactive, computed, nextTick, onMounted } from "vue";
import { usePanelState } from "../../composables/usePanelState";
import { postCommanderTech } from "../../services/commanderTechService";

const { isPanelOpen } = usePanelState();

const emit = defineEmits(["close", "saved"]);

const visible = ref(false);
const saving = ref(false);
const saveError = ref("");
const activeTab = ref("general");
const availableTags = ref([]);

const TABS = [
  { id: "general", label: "General" },
  { id: "markdown", label: "Markdown" },
];

const form = reactive({
  title: "",
  commander: [],
  pickup_lane: "",
  text_markdown: "",
  allowComments: true,
  tags: [],
});

const newCommander = ref("");
const bodyRef = ref(null);
const commanderSuggestions = ref([]);
const suggestionsVisible = ref(false);
const loadingCommander = ref(false);
let debounceTimer = null;

async function fetchSuggestions(query) {
  if (query.trim().length < 2) {
    commanderSuggestions.value = [];
    suggestionsVisible.value = false;
    loadingCommander.value = false;
    return;
  }
  try {
    const res = await fetch(
      `https://api.scryfall.com/cards/autocomplete?q=${encodeURIComponent(query)}&include_extras=false`,
    );
    const data = await res.json();
    commanderSuggestions.value = data.data ?? [];
    suggestionsVisible.value = commanderSuggestions.value.length > 0;
  } catch {
    commanderSuggestions.value = [];
    suggestionsVisible.value = false;
  } finally {
    loadingCommander.value = false;
  }
}

function onCommanderInput() {
  clearTimeout(debounceTimer);
  if (newCommander.value.trim().length < 2) {
    loadingCommander.value = false;
    commanderSuggestions.value = [];
    suggestionsVisible.value = false;
    return;
  }
  loadingCommander.value = true;
  debounceTimer = setTimeout(() => fetchSuggestions(newCommander.value), 250);
}

function selectSuggestion(name) {
  newCommander.value = name;
  suggestionsVisible.value = false;
  addCommander();
}

const TOOLBAR_ACTIONS = [
  { label: "Título", icon: "<b>H1</b>", action: (t) => `# ${t}` },
  { label: "Subtítulo", icon: "<b>H2</b>", action: (t) => `## ${t}` },
  { label: "Negrita", icon: "<b>B</b>", action: (t) => `**${t}**` },
  { label: "Cursiva", icon: "<i>I</i>", action: (t) => `*${t}*` },
  { label: "Cita", icon: "❝", action: (t) => `> ${t}` },
  { label: "Separador", icon: "—", action: () => `\n---\n` },
];

function addCommander() {
  const val = newCommander.value.trim();
  if (val && !form.commander.includes(val)) form.commander.push(val);
  newCommander.value = "";
}

function removeCommander(i) {
  form.commander.splice(i, 1);
}

function toggleTag(tagId) {
  const i = form.tags.indexOf(tagId);
  if (i === -1) form.tags.push(tagId);
  else form.tags.splice(i, 1);
}

function applyFormat(actionFn) {
  const el = bodyRef.value;
  if (!el) return;
  const start = el.selectionStart;
  const end = el.selectionEnd;
  const selected = form.text_markdown.slice(start, end) || "texto";
  const replacement = actionFn(selected);
  form.text_markdown =
    form.text_markdown.slice(0, start) +
    replacement +
    form.text_markdown.slice(end);
  nextTick(() => {
    el.focus();
    el.setSelectionRange(start, start + replacement.length);
  });
}

const canSave = computed(
  () =>
    form.title.trim().length > 0 &&
    form.text_markdown.trim().length > 0 &&
    !saving.value,
);

onMounted(async () => {
  nextTick(() => {
    visible.value = true;
  });
  try {
    const res = await fetch("/api/tag/");
    const data = await res.json();
    availableTags.value = data.filter((t) => t.active);
  } catch {
    /* no tags */
  }
});

function handleClose() {
  visible.value = false;
  setTimeout(() => emit("close"), 320);
}

async function save() {
  if (!canSave.value) return;
  saving.value = true;
  saveError.value = "";
  try {
    const payload = {
      title: form.title.trim(),
      commander: form.commander,
      pickup_lane: form.pickup_lane.trim(),
      text_markdown: form.text_markdown.trim(),
      allowComments: form.allowComments,
      tags: form.tags,
    };
    const data = await postCommanderTech(payload);
    emit("saved", data);
    handleClose();
  } catch (err) {
    saveError.value = err.message ?? "Error al guardar";
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
                  <span class="modal-eyebrow">Nueva commander tech</span>
                  <h2 class="modal-heading">
                    {{ form.title || "¿Sobre qué quieres escribir?" }}
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
                <!-- Tab: General -->
                <div v-if="activeTab === 'general'" class="tab-content">
                  <div class="field-group">
                    <label class="field-label"
                      >Título <span class="required">*</span></label
                    >
                    <input
                      class="field-input"
                      type="text"
                      placeholder="Nombre del análisis..."
                      v-model="form.title"
                      maxlength="200"
                    />
                  </div>

                  <div class="field-group">
                    <label class="field-label">
                      Comandante(s)
                      <span class="count-badge">{{
                        form.commander.length
                      }}</span>
                    </label>
                    <div class="card-input-row">
                      <div class="commander-input-wrap">
                        <input
                          class="field-input"
                          type="text"
                          placeholder="Nombre del comandante..."
                          v-model="newCommander"
                          @keydown.enter.prevent="addCommander"
                          @input="onCommanderInput"
                          @blur="suggestionsVisible = false"
                          autocomplete="off"
                        />
                        <ul v-if="suggestionsVisible" class="suggestions-list">
                          <li
                            v-for="name in commanderSuggestions"
                            :key="name"
                            class="suggestion-item"
                            @mousedown.prevent="selectSuggestion(name)"
                          >
                            {{ name }}
                          </li>
                        </ul>
                      </div>
                      <button
                        class="add-btn"
                        type="button"
                        @click="addCommander"
                      >
                        <svg
                          v-if="!loadingCommander"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        >
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        <div v-else class="btn-spinner"></div>
                      </button>
                    </div>
                    <div class="chip-grid">
                      <span
                        v-for="(c, i) in form.commander"
                        :key="i"
                        class="card-chip card-chip--accent"
                      >
                        {{ c
                        }}<button
                          class="chip-remove"
                          type="button"
                          @click="removeCommander(i)"
                        >
                          ✕
                        </button>
                      </span>
                    </div>
                  </div>

                  <div class="field-group">
                    <label class="field-label">
                      Resumen (pickup lane)
                      <span
                        class="count-badge"
                        :class="{
                          'count-badge--warn': form.pickup_lane.length > 280,
                        }"
                        >{{ form.pickup_lane.length }}/300</span
                      >
                    </label>
                    <textarea
                      class="field-textarea"
                      placeholder="Breve resumen visible en el feed..."
                      v-model="form.pickup_lane"
                      rows="3"
                      maxlength="300"
                    />
                  </div>

                  <div class="toggles-row">
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

                <!-- Tab: Markdown -->
                <div
                  v-else-if="activeTab === 'markdown'"
                  class="tab-content-md"
                >
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
                  <div class="md-editor-wrap">
                    <textarea
                      ref="bodyRef"
                      class="md-textarea"
                      placeholder="Desarrolla el análisis del comandante en Markdown..."
                      v-model="form.text_markdown"
                      maxlength="20000"
                    />
                    <div
                      class="char-count"
                      :class="{
                        'char-warn': form.text_markdown.length > 18000,
                      }"
                    >
                      {{ form.text_markdown.length }}/20000
                    </div>
                  </div>
                </div>
              </div>

              <!-- Error -->
              <div v-if="saveError" class="save-error">
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
                {{ saveError }}
              </div>

              <!-- Footer -->
              <div class="modal-footer">
                <button
                  class="btn-publish"
                  type="button"
                  :disabled="!canSave"
                  @click="save"
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
                  {{ saving ? "Publicando..." : "Publicar tech" }}
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
  max-width: 900px;
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
  max-height: 96vh;
  position: relative;
  background: var(--bg);
  border: 0.5px solid var(--border);
  display: flex;
  flex-direction: column;
  font-family: "Crimson Pro", Georgia, serif;
  overflow: hidden;
}

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

.tab-content-md {
  display: flex;
  height: 100%;
  min-height: 400px;
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
  display: flex;
  align-items: center;
  gap: 6px;
}

.required {
  color: var(--accent);
}

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
.field-input:focus {
  border-color: var(--accent);
}
.field-input::placeholder {
  color: var(--txt-placeholder);
}

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
.field-textarea:focus {
  border-color: var(--accent);
}
.field-textarea::placeholder {
  color: var(--txt-placeholder);
}

.card-input-row {
  display: flex;
  gap: 6px;
}
.card-input-row .field-input {
  flex: 1;
}

.commander-input-wrap {
  flex: 1;
  position: relative;
}
.commander-input-wrap .field-input {
  width: 100%;
}

.suggestions-list {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 100;
  background: var(--bg-surface);
  border: 0.5px solid var(--accent);
  border-top: none;
  margin: 0;
  padding: 0;
  list-style: none;
  max-height: 220px;
  overflow-y: auto;
}

.suggestion-item {
  padding: 8px 12px;
  font-family: "Crimson Pro", Georgia, serif;
  font-size: 14px;
  color: var(--txt);
  cursor: pointer;
  transition: background 0.1s;
}
.suggestion-item:hover {
  background: rgba(83, 74, 183, 0.2);
  color: var(--accent-text);
}

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
.add-btn:hover {
  background: var(--accent-hover);
}
.add-btn svg {
  width: 16px;
  height: 16px;
}

.btn-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.chip-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  padding: 2px 0;
}

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
}

.card-chip--accent {
  background: rgba(83, 74, 183, 0.15);
  border-color: rgba(83, 74, 183, 0.4);
  color: var(--accent-text);
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
.chip-remove:hover {
  color: #e05c5c;
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
.count-badge--warn {
  background: rgba(226, 75, 74, 0.15);
  color: #e24b4a;
}

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
  transition:
    color 0.15s,
    border-color 0.15s;
}
.toggle-btn.active {
  color: var(--accent-text);
  border-color: var(--accent);
}

.toggle-track {
  width: 28px;
  height: 15px;
  background: var(--border);
  border-radius: 99px;
  position: relative;
  flex-shrink: 0;
  transition: background 0.2s;
}
.toggle-btn.active .toggle-track {
  background: var(--accent);
}

.toggle-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 11px;
  height: 11px;
  background: var(--txt-muted);
  border-radius: 50%;
  transition:
    left 0.2s,
    background 0.2s;
}
.toggle-btn.active .toggle-thumb {
  left: 15px;
  background: var(--accent-text);
}

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
  transition:
    background 0.15s,
    border-color 0.15s,
    color 0.15s;
}
.tag-pill:hover {
  border-color: var(--accent-muted);
  color: var(--accent-muted);
}
.tag-pill.selected {
  background: rgba(83, 74, 183, 0.15);
  border-color: var(--accent);
  color: var(--accent-text);
}

/* Markdown tab */
.toolbar {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 8px 6px;
  border-right: 0.5px solid var(--border);
  background: var(--bg-surface);
  flex-shrink: 0;
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
}
.toolbar-label {
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  white-space: nowrap;
  font-family: "Crimson Pro", serif;
}

.md-editor-wrap {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.md-textarea {
  background: transparent;
  border: none;
  outline: none;
  color: var(--txt);
  font-family: "Crimson Pro", Georgia, serif;
  font-size: 15px;
  line-height: 1.7;
  padding: 16px 18px;
  resize: none;
  flex: 1;
  width: 100%;
  box-sizing: border-box;
  min-height: 300px;
}
.md-textarea::placeholder {
  color: var(--txt-placeholder);
}

.char-count {
  font-size: 11px;
  color: var(--txt-placeholder);
  padding: 6px 18px 10px;
  text-align: right;
}
.char-warn {
  color: #e24b4a;
}

.save-error {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 18px;
  background: rgba(224, 92, 92, 0.08);
  border-top: 0.5px solid rgba(224, 92, 92, 0.3);
  font-size: 12px;
  color: #e05c5c;
  line-height: 1.5;
}
.save-error svg {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  margin-top: 1px;
}

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

@media (max-width: 768px) {
  .modal-wrapper {
    width: 100%;
    max-width: 100%;
  }
  .modal-wrapper.panel-offset {
    transform: translateX(0);
  }
}
</style>
