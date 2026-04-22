<script setup>
import { ref, reactive, computed, nextTick, onMounted } from "vue";
import { usePanelState } from "../../composables/usePanelState";
import { postTournament, patchTournament } from "../../services/tournamentService";

const { isPanelOpen } = usePanelState();

const props = defineProps({
  initialData: { type: Object, default: null },
});
const emit = defineEmits(["close", "saved", "updated"]);

const isEditMode = computed(() => !!props.initialData);

const visible = ref(false);
const saving = ref(false);
const saveError = ref("");
const activeTab = ref("general");

const TABS = [
  { id: "general", label: "General" },
  { id: "prizes", label: "Premios" },
  { id: "rules", label: "Reglas" },
];

const FORMATS = [
  "Eliminatorio Bo3",
  "Eliminatorio Bo1",
  "Brackets Bo3",
  "Brackets Bo1",
  "Swiss",
  "Por puntos",
  "Liga",
];

function toDatetimeLocal(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const KNOWN_FORMATS = [
  "Eliminatorio Bo3", "Eliminatorio Bo1", "Brackets Bo3", "Brackets Bo1",
  "Swiss", "Por puntos", "Liga",
];

function resolveFormat(f) {
  if (!f) return { format: "", customFormat: "" };
  if (KNOWN_FORMATS.includes(f)) return { format: f, customFormat: "" };
  return { format: "__custom__", customFormat: f };
}

const init = props.initialData;
const { format: initFormat, customFormat: initCustomFormat } = resolveFormat(init?.format);

const form = reactive({
  name: init?.name ?? "",
  description: init?.description ?? "",
  format: initFormat,
  customFormat: initCustomFormat,
  enter_cost: init?.enter_cost ?? "",
  ubication: init?.ubication ?? "",
  tournament_date_hour: toDatetimeLocal(init?.tournament_date_hour),
  max_players: init?.max_players ?? "",
  prizes: init?.prizes?.length ? init.prizes.map((p) => ({ ...p })) : [{ range: "1", prize: "" }],
  ruling_markdown: init?.ruling_markdown ?? "",
  isFull: init?.isFull ?? false,
});

const bodyRef = ref(null);
const useCustomFormat = computed(() => form.format === "__custom__");

const TOOLBAR_ACTIONS = [
  { label: "Título", icon: "<b>H1</b>", action: (t) => `# ${t}` },
  { label: "Subtítulo", icon: "<b>H2</b>", action: (t) => `## ${t}` },
  { label: "Negrita", icon: "<b>B</b>", action: (t) => `**${t}**` },
  { label: "Cursiva", icon: "<i>I</i>", action: (t) => `*${t}*` },
  { label: "Cita", icon: "❝", action: (t) => `> ${t}` },
  { label: "Separador", icon: "—", action: () => `\n---\n` },
  { label: "Lista", icon: "≡", action: (t) => `- ${t}` },
];

function addPrize() {
  form.prizes.push({ range: "", prize: "" });
}

function removePrize(i) {
  form.prizes.splice(i, 1);
}

function applyFormat(actionFn) {
  const el = bodyRef.value;
  if (!el) return;
  const start = el.selectionStart;
  const end = el.selectionEnd;
  const selected = form.ruling_markdown.slice(start, end) || "texto";
  const replacement = actionFn(selected);
  form.ruling_markdown =
    form.ruling_markdown.slice(0, start) +
    replacement +
    form.ruling_markdown.slice(end);
  nextTick(() => {
    el.focus();
    el.setSelectionRange(start, start + replacement.length);
  });
}

const canSave = computed(
  () =>
    form.name.trim().length > 0 &&
    ((form.format.length > 0 && form.format !== "__custom__") ||
      (form.format === "__custom__" && form.customFormat.trim().length > 0)) &&
    form.enter_cost.trim().length > 0 &&
    form.ubication.trim().length > 0 &&
    form.tournament_date_hour.length > 0 &&
    !saving.value,
);

onMounted(() => {
  nextTick(() => {
    visible.value = true;
  });
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
    const resolvedFormat =
      form.format === "__custom__" ? form.customFormat.trim() : form.format;
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      format: resolvedFormat,
      enter_cost: form.enter_cost.trim(),
      ubication: form.ubication.trim(),
      tournament_date_hour: new Date(form.tournament_date_hour).toISOString(),
      max_players: form.max_players ? Number(form.max_players) : null,
      prizes: form.prizes.filter((p) => p.range.trim() && p.prize.trim()),
      ruling_markdown: form.ruling_markdown.trim(),
      ...(isEditMode.value && { isFull: form.isFull }),
    };
    if (isEditMode.value) {
      const data = await patchTournament(props.initialData._id, payload);
      emit("updated", data);
    } else {
      const data = await postTournament(payload);
      emit("saved", data);
    }
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
                  <span class="modal-eyebrow">{{ isEditMode ? 'Editar torneo' : 'Nuevo torneo' }}</span>
                  <h2 class="modal-heading">
                    {{ form.name || "¿Cómo se llama el torneo?" }}
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
                      >Nombre <span class="required">*</span></label
                    >
                    <input
                      class="field-input"
                      type="text"
                      placeholder="Nombre del torneo..."
                      v-model="form.name"
                      maxlength="150"
                    />
                  </div>

                  <div class="field-group">
                    <label class="field-label">Descripción</label>
                    <textarea
                      class="field-textarea"
                      placeholder="Breve descripción del evento..."
                      v-model="form.description"
                      rows="3"
                      maxlength="500"
                    />
                  </div>

                  <div class="two-col">
                    <div class="field-group">
                      <label class="field-label"
                        >Fecha y hora <span class="required">*</span></label
                      >
                      <input
                        class="field-input"
                        type="datetime-local"
                        v-model="form.tournament_date_hour"
                      />
                    </div>

                    <div class="field-group">
                      <label class="field-label">Plazas máximas</label>
                      <input
                        class="field-input"
                        type="number"
                        min="4"
                        placeholder="Sin límite"
                        v-model="form.max_players"
                      />
                    </div>
                  </div>

                  <div class="field-group">
                    <label class="field-label"
                      >Formato <span class="required">*</span></label
                    >
                    <select class="field-input" v-model="form.format">
                      <option value="" disabled>
                        Selecciona un formato...
                      </option>
                      <option v-for="f in FORMATS" :key="f" :value="f">
                        {{ f }}
                      </option>
                      <option value="__custom__">Otro (personalizado)</option>
                    </select>
                    <input
                      v-if="useCustomFormat"
                      class="field-input"
                      type="text"
                      placeholder="Describe el formato..."
                      v-model="form.customFormat"
                      maxlength="100"
                    />
                  </div>

                  <div class="field-group">
                    <label class="field-label"
                      >Coste de entrada <span class="required">*</span></label
                    >
                    <input
                      class="field-input"
                      type="text"
                      placeholder="Ej: 10€, Gratuito, 2 sobres..."
                      v-model="form.enter_cost"
                      maxlength="100"
                    />
                  </div>

                  <div class="field-group">
                    <label class="field-label">
                      Ubicación (embed URL de Google Maps)
                      <span class="required">*</span>
                    </label>
                    <input
                      class="field-input"
                      type="url"
                      placeholder="https://www.google.com/maps/embed?pb=..."
                      v-model="form.ubication"
                    />
                    <span class="field-hint">
                      En Google Maps: Compartir → Incorporar un mapa → copia la
                      URL del atributo src
                    </span>
                  </div>

                  <div v-if="isEditMode" class="field-group">
                    <label class="field-label">Estado</label>
                    <label class="toggle-label">
                      <input type="checkbox" class="toggle-input" v-model="form.isFull" />
                      <span class="toggle-track">
                        <span class="toggle-thumb" />
                      </span>
                      <span class="toggle-text">{{ form.isFull ? 'Completo' : 'Abierto' }}</span>
                    </label>
                  </div>
                </div>

                <!-- Tab: Prizes -->
                <div v-else-if="activeTab === 'prizes'" class="tab-content">
                  <p class="tab-hint">
                    Define los premios por posición. Usa rangos como "1", "2-4",
                    "5-8"...
                  </p>

                  <div
                    v-for="(prize, i) in form.prizes"
                    :key="i"
                    class="prize-row"
                  >
                    <div class="field-group prize-range">
                      <label class="field-label">Posición</label>
                      <input
                        class="field-input"
                        type="text"
                        placeholder='Ej: "1" o "2-4"'
                        v-model="prize.range"
                        maxlength="20"
                      />
                    </div>
                    <div class="field-group prize-desc">
                      <label class="field-label">Premio</label>
                      <input
                        class="field-input"
                        type="text"
                        placeholder="Ej: 200€ crédito tienda..."
                        v-model="prize.prize"
                        maxlength="200"
                      />
                    </div>
                    <button
                      v-if="form.prizes.length > 1"
                      class="remove-prize-btn"
                      type="button"
                      @click="removePrize(i)"
                      title="Eliminar"
                    >
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

                  <button class="add-prize-btn" type="button" @click="addPrize">
                    <svg
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
                    Añadir premio
                  </button>
                </div>

                <!-- Tab: Rules -->
                <div v-else-if="activeTab === 'rules'" class="tab-content-md">
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
                      placeholder="Redacta las reglas del torneo en Markdown..."
                      v-model="form.ruling_markdown"
                      maxlength="20000"
                    />
                    <div
                      class="char-count"
                      :class="{
                        'char-warn': form.ruling_markdown.length > 18000,
                      }"
                    >
                      {{ form.ruling_markdown.length }}/20000
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
                  {{ saving ? (isEditMode ? "Guardando..." : "Publicando...") : (isEditMode ? "Guardar cambios" : "Publicar torneo") }}
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

.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
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
.field-input option {
  background: var(--bg-surface);
  color: var(--txt);
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

.field-hint {
  font-size: 11px;
  color: var(--txt-muted);
  font-style: italic;
  line-height: 1.4;
}

.tab-hint {
  font-size: 13px;
  color: var(--txt-muted);
  font-style: italic;
  margin: 0;
}

.prize-row {
  display: flex;
  align-items: flex-end;
  gap: 10px;
}

.prize-range {
  flex: 0 0 120px;
}

.prize-desc {
  flex: 1;
}

.remove-prize-btn {
  width: 34px;
  height: 34px;
  background: none;
  border: 0.5px solid var(--border);
  color: var(--txt-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  margin-bottom: 0;
  align-self: flex-end;
  transition:
    color 0.15s,
    border-color 0.15s;
}
.remove-prize-btn:hover {
  color: #e05c5c;
  border-color: rgba(224, 92, 92, 0.4);
}
.remove-prize-btn svg {
  width: 12px;
  height: 12px;
}

.add-prize-btn {
  display: flex;
  align-items: center;
  gap: 7px;
  background: none;
  border: 0.5px dashed var(--border);
  color: var(--txt-muted);
  font-family: "Cinzel", serif;
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 9px 16px;
  cursor: pointer;
  transition:
    color 0.15s,
    border-color 0.15s;
  align-self: flex-start;
}
.add-prize-btn:hover {
  color: var(--accent-muted);
  border-color: var(--accent-muted);
}
.add-prize-btn svg {
  width: 12px;
  height: 12px;
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

.toggle-label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
}

.toggle-input {
  display: none;
}

.toggle-track {
  width: 36px;
  height: 20px;
  background: var(--bg-surface);
  border: 0.5px solid var(--border);
  border-radius: 0;
  position: relative;
  flex-shrink: 0;
  transition: background 0.2s, border-color 0.2s;
}

.toggle-input:checked + .toggle-track {
  background: rgba(83, 74, 183, 0.2);
  border-color: var(--accent);
}

.toggle-thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 12px;
  height: 12px;
  background: var(--txt-muted);
  transition: transform 0.2s, background 0.2s;
}

.toggle-input:checked + .toggle-track .toggle-thumb {
  transform: translateX(16px);
  background: var(--accent);
}

.toggle-text {
  font-size: 13px;
  color: var(--txt);
}

@media (max-width: 768px) {
  .modal-wrapper {
    width: 100%;
    max-width: 100%;
  }
  .modal-wrapper.panel-offset {
    transform: translateX(0);
  }
  .two-col {
    grid-template-columns: 1fr;
  }
}
</style>
