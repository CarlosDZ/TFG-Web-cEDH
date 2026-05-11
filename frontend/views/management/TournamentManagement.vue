<script setup>
import { ref, computed, onMounted } from "vue";
import {
  getOrganizedTournaments,
  patchTournament,
  getEntries,
  patchEntry,
  cancelEntry,
} from "../../services/tournamentService";
import TournamentBuilderModal from "../../components/tournaments/tournamentBuilder.modal.vue";

// ─── List view ───────────────────────────────────────────────────────────────
const tournaments = ref([]);
const loading = ref(true);
const error = ref("");
const filter = ref("all");
const showBuilder = ref(false);
const builderData = ref(null);

const filtered = computed(() => {
  const now = new Date();
  if (filter.value === "upcoming")
    return tournaments.value.filter(
      (t) => new Date(t.tournament_date_hour) >= now,
    );
  if (filter.value === "past")
    return tournaments.value.filter(
      (t) => new Date(t.tournament_date_hour) < now,
    );
  return tournaments.value;
});

async function loadTournaments() {
  loading.value = true;
  try {
    tournaments.value = await getOrganizedTournaments();
  } catch {
    error.value = "Error al cargar los torneos.";
  } finally {
    loading.value = false;
  }
}

onMounted(loadTournaments);

function handleBuilderUpdated(updated) {
  const idx = tournaments.value.findIndex((t) => t._id === updated._id);
  if (idx !== -1) {
    tournaments.value[idx] = { ...tournaments.value[idx], ...updated };
    if (selected.value?._id === updated._id)
      selected.value = tournaments.value[idx];
  }
  showBuilder.value = false;
  builderData.value = null;
}

// ─── Management sub-section ──────────────────────────────────────────────────
const selected = ref(null);
const activeTab = ref("general");

function openManage(tournament) {
  selected.value = tournament;
  activeTab.value = "general";
  entriesLoaded.value = false;
  entries.value = [];
}

function goBack() {
  selected.value = null;
  entries.value = [];
  entriesLoaded.value = false;
}

// ─── General tab ─────────────────────────────────────────────────────────────
const generalSaving = ref(false);
const generalError = ref("");
const generalSuccess = ref(false);

const quickForm = computed(() =>
  selected.value
    ? {
        auto_accept_participants: selected.value.auto_accept_participants,
        needs_decklist: selected.value.needs_decklist,
        reserve_non_confirmed_places:
          selected.value.reserve_non_confirmed_places,
        isFull: selected.value.isFull,
      }
    : {},
);

const localQuick = ref({});

function initQuickForm() {
  if (!selected.value) return;
  localQuick.value = { ...quickForm.value };
}

async function saveQuick() {
  generalSaving.value = true;
  generalError.value = "";
  generalSuccess.value = false;
  try {
    const updated = await patchTournament(selected.value._id, localQuick.value);
    const idx = tournaments.value.findIndex(
      (t) => t._id === selected.value._id,
    );
    if (idx !== -1)
      tournaments.value[idx] = { ...tournaments.value[idx], ...updated };
    selected.value = { ...selected.value, ...updated };
    generalSuccess.value = true;
    setTimeout(() => (generalSuccess.value = false), 2500);
  } catch {
    generalError.value = "Error al guardar los cambios.";
  } finally {
    generalSaving.value = false;
  }
}

function openFullEdit() {
  builderData.value = selected.value;
  showBuilder.value = true;
}

// ─── Inscripciones tab ────────────────────────────────────────────────────────
const entries = ref([]);
const entriesLoaded = ref(false);
const entriesLoading = ref(false);
const entriesError = ref("");
const deckViewer = ref(null);
const entryActionLoading = ref(null);

const pendingEntries = computed(() =>
  entries.value.filter((e) => e.status === "pending"),
);
const acceptedEntries = computed(() =>
  entries.value.filter((e) => e.status === "accepted"),
);
const rejectedEntries = computed(() =>
  entries.value.filter((e) => e.status === "rejected"),
);

async function loadEntries() {
  if (entriesLoaded.value) return;
  entriesLoading.value = true;
  entriesError.value = "";
  try {
    entries.value = await getEntries(selected.value._id);
    entriesLoaded.value = true;
  } catch {
    entriesError.value = "Error al cargar inscripciones.";
  } finally {
    entriesLoading.value = false;
  }
}

async function setEntryStatus(entry, status) {
  entryActionLoading.value = entry._id;
  try {
    const updated = await patchEntry(selected.value._id, entry._id, { status });
    const idx = entries.value.findIndex((e) => e._id === entry._id);
    if (idx !== -1) entries.value[idx] = { ...entries.value[idx], ...updated };
    // Update entry_counts on the tournament
    const t = selected.value;
    const oldStatus = entry.status;
    if (t.entry_counts) {
      t.entry_counts[oldStatus] = Math.max(
        0,
        (t.entry_counts[oldStatus] ?? 0) - 1,
      );
      t.entry_counts[status] = (t.entry_counts[status] ?? 0) + 1;
    }
  } catch {
    entriesError.value = "Error al actualizar la inscripción.";
  } finally {
    entryActionLoading.value = null;
  }
}

async function removeEntry(entry) {
  if (!confirm(`¿Eliminar la inscripción de ${entry.username_snapshot}?`))
    return;
  entryActionLoading.value = entry._id;
  try {
    await cancelEntry(selected.value._id, entry._id);
    entries.value = entries.value.filter((e) => e._id !== entry._id);
    const t = selected.value;
    if (t.entry_counts) {
      t.entry_counts[entry.status] = Math.max(
        0,
        (t.entry_counts[entry.status] ?? 0) - 1,
      );
    }
  } catch {
    entriesError.value = "Error al eliminar la inscripción.";
  } finally {
    entryActionLoading.value = null;
  }
}

function openDeckViewer(entry) {
  deckViewer.value = entry;
  visualMode.value = false;
}

const TYPE_GROUPS = [
  { key: "Creature", label: "Criaturas", match: (t) => t.includes("Creature") },
  {
    key: "Planeswalker",
    label: "Planeswalkers",
    match: (t) => t.includes("Planeswalker"),
  },
  {
    key: "Instant",
    label: "Instantáneos",
    match: (t) => t.includes("Instant"),
  },
  { key: "Sorcery", label: "Conjuros", match: (t) => t.includes("Sorcery") },
  {
    key: "Artifact",
    label: "Artefactos",
    match: (t) => t.includes("Artifact"),
  },
  {
    key: "Enchantment",
    label: "Encantamientos",
    match: (t) => t.includes("Enchantment"),
  },
  { key: "Land", label: "Tierras", match: (t) => t.includes("Land") },
  { key: "Other", label: "Otros", match: () => true },
];

function getCardType(entry, name) {
  const ct = entry?.card_types;
  if (!ct) return "";
  return (typeof ct.get === "function" ? ct.get(name) : ct[name]) ?? "";
}

function classifyCard(entry, name) {
  const typeLine = getCardType(entry, name);
  return TYPE_GROUPS.find((g) => g.match(typeLine))?.key ?? "Other";
}

function groupedCards(entry) {
  if (!entry) return [];
  const groups = {};
  for (const card of entry.cards ?? []) {
    const key = classifyCard(entry, card);
    if (!groups[key]) groups[key] = [];
    groups[key].push(card);
  }
  return TYPE_GROUPS.filter((g) => groups[g.key]).map((g) => ({
    ...g,
    cards: groups[g.key],
  }));
}

function scryfallImg(entry, name) {
  const ci = entry?.card_images;
  if (!ci) return null;
  return (typeof ci.get === "function" ? ci.get(name) : ci[name]) ?? null;
}

function hasImages(entry) {
  if (!entry?.card_images) return false;
  const ci = entry.card_images;
  if (typeof ci.size === "number") return ci.size > 0;
  return Object.keys(ci).length > 0;
}

const visualMode = ref(false);

// ─── Resultados tab ───────────────────────────────────────────────────────────
const resultForms = ref({});
const resultSaving = ref(null);
const resultError = ref("");

function initResultForm(entry) {
  if (!resultForms.value[entry._id]) {
    resultForms.value[entry._id] = {
      placement: entry.placement ?? "",
      comment: entry.metadata?.comment ?? "",
    };
  }
}

async function saveResult(entry) {
  resultSaving.value = entry._id;
  resultError.value = "";
  const form = resultForms.value[entry._id];
  try {
    const updated = await patchEntry(selected.value._id, entry._id, {
      placement: form.placement || null,
      metadata: { ...entry.metadata, comment: form.comment },
    });
    const idx = entries.value.findIndex((e) => e._id === entry._id);
    if (idx !== -1) entries.value[idx] = { ...entries.value[idx], ...updated };
  } catch {
    resultError.value = "Error al guardar el resultado.";
  } finally {
    resultSaving.value = null;
  }
}

// ─── Shared helpers ───────────────────────────────────────────────────────────
function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
function formatTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
function isPast(t) {
  return new Date(t.tournament_date_hour) < new Date();
}
function deadlinePassed(t) {
  return (
    t.registration_deadline && new Date(t.registration_deadline) < new Date()
  );
}
function totalSlots(t) {
  return (t.entry_counts?.pending ?? 0) + (t.entry_counts?.accepted ?? 0);
}
function slotLabel(t) {
  return t.max_players
    ? `${totalSlots(t)} / ${t.max_players}`
    : `${totalSlots(t)} inscritos`;
}
function slotPct(t) {
  if (!t.max_players) return null;
  return Math.min(100, Math.round((totalSlots(t) / t.max_players) * 100));
}

function onTabChange(tab) {
  activeTab.value = tab;
  if (tab === "general") initQuickForm();
  if ((tab === "inscripciones" || tab === "resultados") && !entriesLoaded.value)
    loadEntries();
  if (tab === "resultados") acceptedEntries.value.forEach(initResultForm);
}
</script>

<template>
  <div id="mainContainer-tournamentManagement">
    <div class="mgmt-view">
      <!-- ── LIST VIEW ── -->
      <template v-if="!selected">
        <header class="mgmt-header">
          <div>
            <span class="eyebrow">Administración</span>
            <h1 class="heading">Organización de torneos</h1>
          </div>
        </header>

        <div class="filter-bar">
          <button
            v-for="f in [
              { id: 'all', label: 'Todos' },
              { id: 'upcoming', label: 'Próximos' },
              { id: 'past', label: 'Pasados' },
            ]"
            :key="f.id"
            class="filter-btn"
            :class="{ active: filter === f.id }"
            @click="filter = f.id"
          >
            {{ f.label }}
          </button>
          <span class="filter-count">{{ filtered.length }} torneo(s)</span>
        </div>

        <div v-if="loading" class="state-msg">Cargando torneos...</div>
        <div v-else-if="error" class="state-msg state-msg--error">
          {{ error }}
        </div>
        <div v-else-if="filtered.length === 0" class="state-msg">
          No hay torneos en esta categoría.
        </div>

        <div v-else class="table-wrap">
          <table class="mgmt-table">
            <thead>
              <tr>
                <th>Torneo</th>
                <th>Fecha</th>
                <th>Formato</th>
                <th>Inscripciones</th>
                <th>Configuración</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="t in filtered"
                :key="t._id"
                :class="{ 'row--past': isPast(t) }"
              >
                <td class="td-name">
                  <span class="t-name">{{ t.name }}</span>
                  <span v-if="t.description" class="t-desc">{{
                    t.description
                  }}</span>
                </td>
                <td class="td-date">
                  <span class="date-main">{{
                    formatDate(t.tournament_date_hour)
                  }}</span>
                  <span class="date-time">{{
                    formatTime(t.tournament_date_hour)
                  }}</span>
                  <span
                    v-if="t.registration_deadline"
                    class="date-deadline"
                    :class="{ 'deadline--passed': deadlinePassed(t) }"
                  >
                    Cierre: {{ formatDate(t.registration_deadline) }}
                  </span>
                </td>
                <td class="td-format">
                  <span class="format-text">{{ t.format }}</span>
                  <span class="enter-cost">{{ t.enter_cost }}</span>
                </td>
                <td class="td-entries">
                  <div class="entries-summary">
                    <span class="slot-label">{{ slotLabel(t) }}</span>
                    <div v-if="t.max_players" class="slot-bar">
                      <div
                        class="slot-bar__fill"
                        :style="{ width: slotPct(t) + '%' }"
                      />
                    </div>
                  </div>
                  <div class="entry-pills">
                    <span class="pill pill--accepted" title="Confirmados">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {{ t.entry_counts?.accepted ?? 0 }}
                    </span>
                    <span class="pill pill--pending" title="Pendientes">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      {{ t.entry_counts?.pending ?? 0 }}
                    </span>
                    <span class="pill pill--rejected" title="Rechazados">
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
                      {{ t.entry_counts?.rejected ?? 0 }}
                    </span>
                  </div>
                </td>
                <td class="td-config">
                  <div class="config-tags">
                    <span
                      class="config-tag"
                      :class="
                        t.auto_accept_participants ? 'tag--on' : 'tag--off'
                      "
                      >{{
                        t.auto_accept_participants ? "Auto-accept" : "Manual"
                      }}</span
                    >
                    <span v-if="t.needs_decklist" class="config-tag tag--on"
                      >Decklist</span
                    >
                    <span
                      v-if="t.reserve_non_confirmed_places"
                      class="config-tag tag--neutral"
                      >Reserva pendientes</span
                    >
                  </div>
                </td>
                <td class="td-status">
                  <span
                    class="status-badge"
                    :class="{
                      'badge--past': isPast(t),
                      'badge--full': t.isFull && !isPast(t),
                      'badge--deadline':
                        deadlinePassed(t) && !t.isFull && !isPast(t),
                      'badge--open':
                        !isPast(t) && !t.isFull && !deadlinePassed(t),
                    }"
                  >
                    {{
                      isPast(t)
                        ? "Finalizado"
                        : t.isFull
                          ? "Completo"
                          : deadlinePassed(t)
                            ? "Inscripción cerrada"
                            : "Abierto"
                    }}
                  </span>
                </td>
                <td class="td-actions">
                  <button class="action-btn" @click="openManage(t)">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.8"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    Gestionar
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>

      <!-- ── MANAGEMENT SUB-SECTION ── -->
      <template v-else>
        <!-- Back + title -->
        <div class="manage-topbar">
          <button class="back-btn" @click="goBack">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Volver
          </button>
          <div class="manage-title-block">
            <span class="eyebrow">Gestión del torneo</span>
            <h1 class="heading">{{ selected.name }}</h1>
          </div>
          <span
            class="status-badge ml-auto"
            :class="{
              'badge--past': isPast(selected),
              'badge--full': selected.isFull && !isPast(selected),
              'badge--deadline':
                deadlinePassed(selected) &&
                !selected.isFull &&
                !isPast(selected),
              'badge--open':
                !isPast(selected) &&
                !selected.isFull &&
                !deadlinePassed(selected),
            }"
          >
            {{
              isPast(selected)
                ? "Finalizado"
                : selected.isFull
                  ? "Completo"
                  : deadlinePassed(selected)
                    ? "Inscripción cerrada"
                    : "Abierto"
            }}
          </span>
        </div>

        <!-- Tabs -->
        <div class="manage-tabs">
          <button
            v-for="tab in [
              { id: 'general', label: 'General' },
              { id: 'inscripciones', label: 'Inscripciones' },
              { id: 'resultados', label: 'Resultados' },
            ]"
            :key="tab.id"
            class="manage-tab"
            :class="{ active: activeTab === tab.id }"
            @click="onTabChange(tab.id)"
          >
            {{ tab.label }}
            <span
              v-if="
                tab.id === 'inscripciones' && selected.entry_counts?.pending
              "
              class="tab-badge"
            >
              {{ selected.entry_counts.pending }}
            </span>
          </button>
        </div>

        <!-- ── TAB: GENERAL ── -->
        <div v-if="activeTab === 'general'" class="tab-body">
          <div class="general-grid">
            <!-- Quick toggles -->
            <section class="general-section">
              <h2 class="section-heading">Configuración de inscripciones</h2>
              <div class="toggle-list">
                <label class="toggle-row">
                  <span class="toggle-label-text">
                    <span class="toggle-label-main">Aceptación automática</span>
                    <span class="toggle-label-sub"
                      >Las inscripciones se aceptan sin revisión manual</span
                    >
                  </span>
                  <div class="toggle-control">
                    <input
                      type="checkbox"
                      class="toggle-input"
                      v-model="localQuick.auto_accept_participants"
                    />
                    <span class="toggle-track"
                      ><span class="toggle-thumb"
                    /></span>
                  </div>
                </label>
                <label class="toggle-row">
                  <span class="toggle-label-text">
                    <span class="toggle-label-main">Requiere decklist</span>
                    <span class="toggle-label-sub"
                      >Los participantes deben adjuntar una decklist al
                      inscribirse</span
                    >
                  </span>
                  <div class="toggle-control">
                    <input
                      type="checkbox"
                      class="toggle-input"
                      v-model="localQuick.needs_decklist"
                    />
                    <span class="toggle-track"
                      ><span class="toggle-thumb"
                    /></span>
                  </div>
                </label>
                <label class="toggle-row">
                  <span class="toggle-label-text">
                    <span class="toggle-label-main"
                      >Reserva de plazas pendientes</span
                    >
                    <span class="toggle-label-sub"
                      >Las inscripciones pendientes cuentan contra el límite de
                      plazas</span
                    >
                  </span>
                  <div class="toggle-control">
                    <input
                      type="checkbox"
                      class="toggle-input"
                      v-model="localQuick.reserve_non_confirmed_places"
                    />
                    <span class="toggle-track"
                      ><span class="toggle-thumb"
                    /></span>
                  </div>
                </label>
                <label class="toggle-row">
                  <span class="toggle-label-text">
                    <span class="toggle-label-main">Marcar como completo</span>
                    <span class="toggle-label-sub"
                      >Bloquea manualmente nuevas inscripciones</span
                    >
                  </span>
                  <div class="toggle-control">
                    <input
                      type="checkbox"
                      class="toggle-input"
                      v-model="localQuick.isFull"
                    />
                    <span class="toggle-track"
                      ><span class="toggle-thumb"
                    /></span>
                  </div>
                </label>
              </div>

              <div v-if="generalError" class="form-error">
                {{ generalError }}
              </div>
              <div class="form-actions">
                <button
                  class="btn-save"
                  :disabled="generalSaving"
                  @click="saveQuick"
                >
                  {{ generalSaving ? "Guardando..." : "Guardar cambios" }}
                </button>
                <span v-if="generalSuccess" class="save-success"
                  >Cambios guardados</span
                >
              </div>
            </section>

            <!-- Tournament info summary + deep edit -->
            <section class="general-section">
              <h2 class="section-heading">Información del torneo</h2>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Fecha</span
                  ><span class="info-val"
                    >{{ formatDate(selected.tournament_date_hour) }} ·
                    {{ formatTime(selected.tournament_date_hour) }}</span
                  >
                </div>
                <div class="info-item">
                  <span class="info-label">Formato</span
                  ><span class="info-val">{{ selected.format }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Entrada</span
                  ><span class="info-val">{{ selected.enter_cost }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Plazas máximas</span
                  ><span class="info-val">{{
                    selected.max_players ?? "Sin límite"
                  }}</span>
                </div>
                <div v-if="selected.registration_deadline" class="info-item">
                  <span class="info-label">Cierre de inscripciones</span>
                  <span
                    class="info-val"
                    :class="{ 'val--warn': deadlinePassed(selected) }"
                    >{{ formatDate(selected.registration_deadline) }}</span
                  >
                </div>
              </div>
              <button class="btn-secondary" @click="openFullEdit">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path
                    d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                  />
                  <path
                    d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                  />
                </svg>
                Editar toda la información
              </button>
            </section>
          </div>
        </div>

        <!-- ── TAB: INSCRIPCIONES ── -->
        <div v-else-if="activeTab === 'inscripciones'" class="tab-body">
          <div v-if="entriesLoading" class="state-msg">
            Cargando inscripciones...
          </div>
          <div v-else-if="entriesError" class="state-msg state-msg--error">
            {{ entriesError }}
          </div>
          <template v-else>
            <!-- Pending -->
            <section v-if="pendingEntries.length" class="entries-section">
              <h2 class="section-heading section-heading--pending">
                Pendientes
                <span class="count-badge count-badge--pending">{{
                  pendingEntries.length
                }}</span>
              </h2>
              <div class="entries-list">
                <div
                  v-for="entry in pendingEntries"
                  :key="entry._id"
                  class="entry-card entry-card--pending"
                >
                  <div class="entry-card__info">
                    <span class="entry-username">{{
                      entry.username_snapshot
                    }}</span>
                    <span v-if="entry.title" class="entry-deck">{{
                      entry.title
                    }}</span>
                    <span
                      v-if="entry.commander?.length"
                      class="entry-commander"
                      >{{ entry.commander.join(" / ") }}</span
                    >
                    <span class="entry-date">{{
                      formatDate(entry.submitted_at)
                    }}</span>
                  </div>
                  <div class="entry-card__actions">
                    <button
                      v-if="entry.title"
                      class="btn-deck"
                      @click="openDeckViewer(entry)"
                    >
                      Ver deck
                    </button>
                    <button
                      class="btn-accept"
                      :disabled="entryActionLoading === entry._id"
                      @click="setEntryStatus(entry, 'accepted')"
                    >
                      Aceptar
                    </button>
                    <button
                      class="btn-reject"
                      :disabled="entryActionLoading === entry._id"
                      @click="setEntryStatus(entry, 'rejected')"
                    >
                      Rechazar
                    </button>
                    <button
                      class="btn-remove"
                      :disabled="entryActionLoading === entry._id"
                      @click="removeEntry(entry)"
                      title="Eliminar inscripción"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.8"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      >
                        <polyline points="3 6 5 6 21 6" />
                        <path
                          d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"
                        />
                        <path d="M10 11v6M14 11v6" />
                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <!-- Accepted -->
            <section v-if="acceptedEntries.length" class="entries-section">
              <h2 class="section-heading section-heading--accepted">
                Confirmados
                <span class="count-badge count-badge--accepted">{{
                  acceptedEntries.length
                }}</span>
              </h2>
              <div class="entries-list">
                <div
                  v-for="entry in acceptedEntries"
                  :key="entry._id"
                  class="entry-card entry-card--accepted"
                >
                  <div class="entry-card__info">
                    <span class="entry-username">{{
                      entry.username_snapshot
                    }}</span>
                    <span v-if="entry.title" class="entry-deck">{{
                      entry.title
                    }}</span>
                    <span
                      v-if="entry.commander?.length"
                      class="entry-commander"
                      >{{ entry.commander.join(" / ") }}</span
                    >
                    <span class="entry-date">{{
                      formatDate(entry.submitted_at)
                    }}</span>
                  </div>
                  <div class="entry-card__actions">
                    <button
                      v-if="entry.title"
                      class="btn-deck"
                      @click="openDeckViewer(entry)"
                    >
                      Ver deck
                    </button>
                    <button
                      class="btn-reject"
                      :disabled="entryActionLoading === entry._id"
                      @click="setEntryStatus(entry, 'rejected')"
                    >
                      Retirar confirmación
                    </button>
                    <button
                      class="btn-remove"
                      :disabled="entryActionLoading === entry._id"
                      @click="removeEntry(entry)"
                      title="Eliminar inscripción"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.8"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      >
                        <polyline points="3 6 5 6 21 6" />
                        <path
                          d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"
                        />
                        <path d="M10 11v6M14 11v6" />
                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <!-- Rejected -->
            <section v-if="rejectedEntries.length" class="entries-section">
              <h2 class="section-heading section-heading--rejected">
                Rechazados
                <span class="count-badge count-badge--rejected">{{
                  rejectedEntries.length
                }}</span>
              </h2>
              <div class="entries-list">
                <div
                  v-for="entry in rejectedEntries"
                  :key="entry._id"
                  class="entry-card entry-card--rejected"
                >
                  <div class="entry-card__info">
                    <span class="entry-username">{{
                      entry.username_snapshot
                    }}</span>
                    <span v-if="entry.title" class="entry-deck">{{
                      entry.title
                    }}</span>
                    <span class="entry-date">{{
                      formatDate(entry.submitted_at)
                    }}</span>
                  </div>
                  <div class="entry-card__actions">
                    <button
                      class="btn-accept"
                      :disabled="entryActionLoading === entry._id"
                      @click="setEntryStatus(entry, 'accepted')"
                    >
                      Aceptar
                    </button>
                    <button
                      class="btn-remove"
                      :disabled="entryActionLoading === entry._id"
                      @click="removeEntry(entry)"
                      title="Eliminar"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.8"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      >
                        <polyline points="3 6 5 6 21 6" />
                        <path
                          d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"
                        />
                        <path d="M10 11v6M14 11v6" />
                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <p
              v-if="
                !pendingEntries.length &&
                !acceptedEntries.length &&
                !rejectedEntries.length
              "
              class="state-msg"
            >
              No hay inscripciones todavía.
            </p>
          </template>
        </div>

        <!-- ── TAB: RESULTADOS ── -->
        <div v-else-if="activeTab === 'resultados'" class="tab-body">
          <div v-if="entriesLoading" class="state-msg">
            Cargando participantes...
          </div>
          <div v-else-if="entriesError" class="state-msg state-msg--error">
            {{ entriesError }}
          </div>
          <template v-else>
            <p class="tab-hint">
              Asigna posición y comentario post-torneo a cada participante
              confirmado.
            </p>
            <div v-if="resultError" class="state-msg state-msg--error">
              {{ resultError }}
            </div>

            <div v-if="!acceptedEntries.length" class="state-msg">
              No hay participantes confirmados.
            </div>
            <div v-else class="results-list">
              <div
                v-for="entry in acceptedEntries"
                :key="entry._id"
                class="result-row"
                @vue:mounted="initResultForm(entry)"
              >
                <div class="result-row__player">
                  <span class="entry-username">{{
                    entry.username_snapshot
                  }}</span>
                  <span v-if="entry.title" class="entry-deck">{{
                    entry.title
                  }}</span>
                  <span
                    v-if="entry.commander?.length"
                    class="entry-commander"
                    >{{ entry.commander.join(" / ") }}</span
                  >
                </div>
                <div class="result-row__fields" v-if="resultForms[entry._id]">
                  <div class="result-field">
                    <label class="result-label">Posición</label>
                    <input
                      class="result-input result-input--short"
                      type="text"
                      placeholder="Ej: 1º, Top4, 5-8..."
                      v-model="resultForms[entry._id].placement"
                      maxlength="30"
                    />
                  </div>
                  <div class="result-field result-field--grow">
                    <label class="result-label">Comentario post-torneo</label>
                    <input
                      class="result-input"
                      type="text"
                      placeholder="Notas del autor, declaraciones, movidas destacadas..."
                      v-model="resultForms[entry._id].comment"
                      maxlength="300"
                    />
                  </div>
                  <button
                    class="btn-save-result"
                    :disabled="resultSaving === entry._id"
                    @click="saveResult(entry)"
                  >
                    {{ resultSaving === entry._id ? "..." : "Guardar" }}
                  </button>
                </div>
              </div>
            </div>
          </template>
        </div>
      </template>

      <!-- ── DECK VIEWER MODAL ── -->
      <Teleport to="body">
        <Transition name="backdrop">
          <div
            v-if="deckViewer"
            class="deck-backdrop"
            @click.self="deckViewer = null"
          >
            <div class="deck-modal">
              <div class="deck-modal__header">
                <div>
                  <span class="eyebrow">Decklist</span>
                  <h2 class="deck-modal__title">{{ deckViewer.title }}</h2>
                  <p class="deck-modal__commander">
                    {{ deckViewer.commander?.join(" / ") }}
                  </p>
                </div>
                <div class="deck-modal__actions">
                  <button
                    class="view-toggle-btn"
                    @click="visualMode = !visualMode"
                  >
                    {{ visualMode ? "Ver lista" : "Ver imágenes" }}
                  </button>
                  <button class="close-btn" @click="deckViewer = null">
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
              <div class="deck-modal__body">
                <div
                  v-for="g in groupedCards(deckViewer)"
                  :key="g.key"
                  class="deck-type-group"
                >
                  <h3 class="deck-type-heading">
                    {{ g.label }}
                    <span class="deck-type-count">({{ g.cards.length }})</span>
                  </h3>
                  <div v-if="visualMode" class="deck-card-grid">
                    <div
                      v-for="card in g.cards"
                      :key="card"
                      class="deck-card-tile"
                      :title="card"
                    >
                      <img
                        v-if="scryfallImg(deckViewer, card)"
                        :src="scryfallImg(deckViewer, card)"
                        :alt="card"
                      />
                      <span v-else class="deck-card-fallback">{{ card }}</span>
                    </div>
                  </div>
                  <ul v-else class="deck-card-list">
                    <li
                      v-for="card in g.cards"
                      :key="card"
                      class="deck-card-item"
                    >
                      {{ card }}
                    </li>
                  </ul>
                </div>
                <p v-if="!deckViewer.cards?.length" class="state-msg">
                  Sin cartas registradas.
                </p>
              </div>
            </div>
          </div>
        </Transition>
      </Teleport>

      <!-- Builder modal for full edit -->
      <TournamentBuilderModal
        v-if="showBuilder"
        :initialData="builderData"
        @close="
          showBuilder = false;
          builderData = null;
        "
        @updated="handleBuilderUpdated"
      />
    </div>
  </div>
</template>

<style scoped>
/* ── Base ── */
#mainContainer-tournamentManagement {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  background-color: var(--background-color);
}
.mgmt-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 24px 80px;
  font-family: "Crimson Pro", Georgia, serif;
  --accent: #534ab7;
  --accent-hover: #3c3489;
  --accent-muted: #afa9ec;
  --accent-text: #eeedfe;
  --bg: #0d1b2a;
  --bg-surface: #080f18;
  --border: #1c3a58;
  --txt: #e0ddd8;
  --txt-title: #e8e3d8;
  --txt-muted: #6b8caa;
}

.eyebrow {
  font-family: "Cinzel", serif;
  font-size: 10px;
  font-weight: 600;
  color: var(--accent-muted);
  text-transform: uppercase;
  letter-spacing: 0.14em;
  display: block;
  margin-bottom: 6px;
}
.heading {
  font-family: "Cinzel", serif;
  font-size: 24px;
  font-weight: 600;
  color: var(--txt-title);
  margin: 0;
  letter-spacing: 0.03em;
}
.state-msg {
  font-size: 15px;
  color: var(--txt-muted);
  font-style: italic;
  padding: 20px 0;
}
.state-msg--error {
  color: #e05c5c;
  font-style: normal;
}
.tab-hint {
  font-size: 14px;
  color: var(--txt-muted);
  font-style: italic;
  margin: 0 0 24px;
}

/* ── List view ── */
.mgmt-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 28px;
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
.filter-btn {
  background: none;
  border: 0.5px solid var(--border);
  color: var(--txt-muted);
  font-family: "Cinzel", serif;
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 6px 14px;
  cursor: pointer;
  transition:
    color 0.15s,
    border-color 0.15s,
    background 0.15s;
}
.filter-btn:hover {
  color: var(--accent-muted);
  border-color: var(--accent);
}
.filter-btn.active {
  color: var(--accent-text);
  border-color: var(--accent);
  background: rgba(83, 74, 183, 0.12);
}
.filter-count {
  margin-left: auto;
  font-size: 12px;
  color: var(--txt-muted);
  font-style: italic;
}

.table-wrap {
  overflow-x: auto;
  border: 0.5px solid var(--border);
}
.mgmt-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  min-width: 900px;
}
.mgmt-table thead tr {
  background: var(--bg-surface);
  border-bottom: 0.5px solid var(--border);
}
.mgmt-table th {
  font-family: "Cinzel", serif;
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--accent-muted);
  text-align: left;
  padding: 12px 16px;
  white-space: nowrap;
}
.mgmt-table td {
  padding: 14px 16px;
  border-bottom: 0.5px solid rgba(28, 58, 88, 0.5);
  vertical-align: top;
  color: var(--txt);
}
.mgmt-table tbody tr {
  transition: background 0.12s;
}
.mgmt-table tbody tr:hover {
  background: rgba(83, 74, 183, 0.04);
}
.mgmt-table tbody tr:last-child td {
  border-bottom: none;
}
.row--past {
  opacity: 0.6;
}

.td-name {
  max-width: 220px;
}
.t-name {
  font-family: "Cinzel", serif;
  font-size: 13px;
  font-weight: 600;
  color: var(--txt-title);
  display: block;
  line-height: 1.3;
}
.t-desc {
  display: block;
  font-size: 11px;
  color: var(--txt-muted);
  font-style: italic;
  margin-top: 3px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 200px;
}
.td-date {
  white-space: nowrap;
}
.date-main {
  display: block;
  color: var(--txt);
}
.date-time {
  display: block;
  font-size: 11px;
  color: var(--txt-muted);
}
.date-deadline {
  display: block;
  font-size: 10px;
  color: var(--txt-muted);
  margin-top: 4px;
  font-style: italic;
}
.deadline--passed {
  color: #e05c5c;
}
.td-format {
  white-space: nowrap;
}
.format-text {
  display: block;
  color: var(--accent-muted);
  font-style: italic;
}
.enter-cost {
  display: block;
  font-size: 11px;
  color: var(--txt-muted);
  margin-top: 2px;
}
.entries-summary {
  margin-bottom: 8px;
}
.slot-label {
  font-size: 13px;
  color: var(--txt);
}
.slot-bar {
  height: 3px;
  background: var(--border);
  margin-top: 5px;
  width: 100px;
}
.slot-bar__fill {
  height: 100%;
  background: var(--accent);
  transition: width 0.3s;
}
.entry-pills {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 3px;
  font-family: "Cinzel", serif;
  font-weight: 600;
  letter-spacing: 0.06em;
  white-space: nowrap;
}
.pill svg {
  width: 10px;
  height: 10px;
  flex-shrink: 0;
}
.pill--accepted {
  background: rgba(83, 183, 117, 0.1);
  color: #5ecb82;
  border: 0.5px solid rgba(83, 183, 117, 0.3);
}
.pill--pending {
  background: rgba(175, 169, 236, 0.1);
  color: var(--accent-muted);
  border: 0.5px solid rgba(175, 169, 236, 0.25);
}
.pill--rejected {
  background: rgba(226, 75, 74, 0.08);
  color: #e24b4a;
  border: 0.5px solid rgba(226, 75, 74, 0.25);
}
.config-tags {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.config-tag {
  display: inline-block;
  font-family: "Cinzel", serif;
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 2px 7px;
  border-radius: 3px;
  align-self: flex-start;
}
.tag--on {
  background: rgba(83, 183, 117, 0.1);
  color: #5ecb82;
  border: 0.5px solid rgba(83, 183, 117, 0.25);
}
.tag--off {
  background: rgba(107, 140, 170, 0.08);
  color: var(--txt-muted);
  border: 0.5px solid rgba(107, 140, 170, 0.2);
}
.tag--neutral {
  background: rgba(83, 74, 183, 0.08);
  color: var(--accent-muted);
  border: 0.5px solid rgba(83, 74, 183, 0.2);
}

.status-badge {
  font-family: "Cinzel", serif;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 3px 9px;
  border-radius: 3px;
  white-space: nowrap;
}
.badge--open {
  background: rgba(83, 183, 117, 0.12);
  color: #5ecb82;
  border: 0.5px solid rgba(83, 183, 117, 0.3);
}
.badge--full {
  background: rgba(226, 75, 74, 0.1);
  color: #e24b4a;
  border: 0.5px solid rgba(226, 75, 74, 0.3);
}
.badge--past {
  background: rgba(107, 140, 170, 0.1);
  color: var(--txt-muted);
  border: 0.5px solid rgba(107, 140, 170, 0.25);
}
.badge--deadline {
  background: rgba(226, 165, 74, 0.1);
  color: #e2a54a;
  border: 0.5px solid rgba(226, 165, 74, 0.3);
}

.td-actions {
  white-space: nowrap;
}
.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: 0.5px solid var(--border);
  color: var(--txt-muted);
  font-family: "Cinzel", serif;
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 7px 12px;
  cursor: pointer;
  transition:
    color 0.15s,
    border-color 0.15s,
    background 0.15s;
}
.action-btn:hover {
  color: var(--accent-muted);
  border-color: var(--accent);
  background: rgba(83, 74, 183, 0.08);
}
.action-btn svg {
  width: 13px;
  height: 13px;
}

/* ── Management sub-section ── */
.manage-topbar {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}
.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: 0.5px solid var(--border);
  color: var(--txt-muted);
  font-family: "Cinzel", serif;
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 7px 14px;
  cursor: pointer;
  transition:
    color 0.15s,
    border-color 0.15s;
  flex-shrink: 0;
}
.back-btn:hover {
  color: var(--txt);
  border-color: var(--txt-muted);
}
.back-btn svg {
  width: 13px;
  height: 13px;
}
.manage-title-block {
  flex: 1;
  min-width: 0;
}
.manage-title-block .heading {
  font-size: 20px;
}
.ml-auto {
  margin-left: auto;
}

.manage-tabs {
  display: flex;
  border-bottom: 0.5px solid var(--border);
  margin-bottom: 28px;
}
.manage-tab {
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
  display: flex;
  align-items: center;
  gap: 7px;
}
.manage-tab:hover {
  color: var(--accent-muted);
}
.manage-tab.active {
  color: var(--accent-text);
  border-bottom-color: var(--accent);
}
.tab-badge {
  background: rgba(226, 165, 74, 0.15);
  color: #e2a54a;
  border: 0.5px solid rgba(226, 165, 74, 0.35);
  font-size: 9px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 3px;
}

.tab-body {
  max-width: 900px;
}

/* ── General tab ── */
.general-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
}
@media (max-width: 768px) {
  .general-grid {
    grid-template-columns: 1fr;
  }
}

.general-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.section-heading {
  font-family: "Cinzel", serif;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--accent-muted);
  margin: 0 0 4px;
  border-bottom: 0.5px solid var(--border);
  padding-bottom: 8px;
}

.toggle-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}
.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 0;
  border-bottom: 0.5px solid rgba(28, 58, 88, 0.5);
  cursor: pointer;
}
.toggle-row:last-child {
  border-bottom: none;
}
.toggle-label-text {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.toggle-label-main {
  font-size: 14px;
  color: var(--txt);
}
.toggle-label-sub {
  font-size: 11px;
  color: var(--txt-muted);
  font-style: italic;
}
.toggle-control {
  flex-shrink: 0;
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
  display: block;
  cursor: pointer;
  transition:
    background 0.2s,
    border-color 0.2s;
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
  transition:
    transform 0.2s,
    background 0.2s;
  display: block;
}
.toggle-input:checked + .toggle-track .toggle-thumb {
  transform: translateX(16px);
  background: var(--accent);
}

.form-error {
  font-size: 13px;
  color: #e05c5c;
}
.form-actions {
  display: flex;
  align-items: center;
  gap: 14px;
}
.save-success {
  font-size: 13px;
  color: #5ecb82;
}

.info-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.info-item {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.info-label {
  font-family: "Cinzel", serif;
  font-size: 9px;
  font-weight: 600;
  color: var(--accent-muted);
  text-transform: uppercase;
  letter-spacing: 0.12em;
}
.info-val {
  font-size: 14px;
  color: var(--txt);
}
.val--warn {
  color: #e05c5c;
}

/* ── Buttons ── */
.btn-save,
.btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-family: "Cinzel", serif;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 9px 20px;
  cursor: pointer;
  border: none;
  transition:
    background 0.15s,
    opacity 0.15s;
}
.btn-save {
  background: var(--accent);
  color: var(--accent-text);
  transform: skewX(-12deg);
}
.btn-save > * {
  transform: skewX(12deg);
}
.btn-save:hover {
  background: var(--accent-hover);
}
.btn-save:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
.btn-secondary {
  background: none;
  border: 0.5px solid var(--border);
  color: var(--txt-muted);
}
.btn-secondary svg {
  width: 13px;
  height: 13px;
}
.btn-secondary:hover {
  border-color: var(--accent-muted);
  color: var(--accent-muted);
}

/* ── Entries ── */
.entries-section {
  margin-bottom: 32px;
}
.section-heading--pending {
  color: #e2a54a;
}
.section-heading--accepted {
  color: #5ecb82;
}
.section-heading--rejected {
  color: #e24b4a;
}
.count-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 1px 7px;
  border-radius: 3px;
  margin-left: 6px;
}
.count-badge--pending {
  background: rgba(226, 165, 74, 0.12);
  color: #e2a54a;
  border: 0.5px solid rgba(226, 165, 74, 0.3);
}
.count-badge--accepted {
  background: rgba(83, 183, 117, 0.1);
  color: #5ecb82;
  border: 0.5px solid rgba(83, 183, 117, 0.3);
}
.count-badge--rejected {
  background: rgba(226, 75, 74, 0.08);
  color: #e24b4a;
  border: 0.5px solid rgba(226, 75, 74, 0.25);
}

.entries-list {
  display: flex;
  flex-direction: column;
  gap: 0;
  border: 0.5px solid var(--border);
}
.entry-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 18px;
  border-bottom: 0.5px solid rgba(28, 58, 88, 0.5);
  transition: background 0.12s;
}
.entry-card:last-child {
  border-bottom: none;
}
.entry-card:hover {
  background: rgba(83, 74, 183, 0.03);
}
.entry-card--pending {
  border-left: 2px solid rgba(226, 165, 74, 0.5);
}
.entry-card--accepted {
  border-left: 2px solid rgba(83, 183, 117, 0.4);
}
.entry-card--rejected {
  border-left: 2px solid rgba(226, 75, 74, 0.3);
  opacity: 0.7;
}

.entry-card__info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.entry-username {
  font-family: "Cinzel", serif;
  font-size: 13px;
  font-weight: 600;
  color: var(--txt-title);
}
.entry-deck {
  font-size: 13px;
  color: var(--accent-muted);
  font-style: italic;
}
.entry-commander {
  font-size: 11px;
  color: var(--txt-muted);
}
.entry-date {
  font-size: 10px;
  color: var(--txt-muted);
  margin-top: 2px;
}

.entry-card__actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}
.btn-accept,
.btn-reject,
.btn-deck {
  font-family: "Cinzel", serif;
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 6px 12px;
  cursor: pointer;
  border: 0.5px solid;
  transition:
    background 0.15s,
    opacity 0.15s;
}
.btn-accept:disabled,
.btn-reject:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.btn-accept {
  background: rgba(83, 183, 117, 0.1);
  color: #5ecb82;
  border-color: rgba(83, 183, 117, 0.3);
}
.btn-accept:hover:not(:disabled) {
  background: rgba(83, 183, 117, 0.2);
}
.btn-reject {
  background: rgba(226, 75, 74, 0.08);
  color: #e24b4a;
  border-color: rgba(226, 75, 74, 0.25);
}
.btn-reject:hover:not(:disabled) {
  background: rgba(226, 75, 74, 0.15);
}
.btn-deck {
  background: none;
  color: var(--accent-muted);
  border-color: rgba(175, 169, 236, 0.25);
}
.btn-deck:hover {
  background: rgba(83, 74, 183, 0.1);
}
.btn-remove {
  background: none;
  border: 0.5px solid transparent;
  color: var(--txt-muted);
  padding: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition:
    color 0.15s,
    border-color 0.15s;
}
.btn-remove:hover {
  color: #e05c5c;
  border-color: rgba(224, 92, 92, 0.3);
}
.btn-remove:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.btn-remove svg {
  width: 13px;
  height: 13px;
}

/* ── Resultados ── */
.results-list {
  display: flex;
  flex-direction: column;
  gap: 0;
  border: 0.5px solid var(--border);
}
.result-row {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  padding: 16px 18px;
  border-bottom: 0.5px solid rgba(28, 58, 88, 0.5);
  flex-wrap: wrap;
}
.result-row:last-child {
  border-bottom: none;
}
.result-row__player {
  min-width: 180px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.result-row__fields {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  flex: 1;
  flex-wrap: wrap;
}
.result-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.result-field--grow {
  flex: 1;
  min-width: 200px;
}
.result-label {
  font-family: "Cinzel", serif;
  font-size: 9px;
  font-weight: 600;
  color: var(--accent-muted);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}
.result-input {
  background: var(--bg-surface);
  border: 0.5px solid var(--border);
  color: var(--txt);
  font-family: "Crimson Pro", Georgia, serif;
  font-size: 14px;
  padding: 7px 10px;
  outline: none;
  transition: border-color 0.15s;
}
.result-input:focus {
  border-color: var(--accent);
}
.result-input--short {
  width: 120px;
}
.btn-save-result {
  font-family: "Cinzel", serif;
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 8px 14px;
  cursor: pointer;
  background: var(--accent);
  color: var(--accent-text);
  border: none;
  transition:
    background 0.15s,
    opacity 0.15s;
  align-self: flex-end;
}
.btn-save-result:hover {
  background: var(--accent-hover);
}
.btn-save-result:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* ── Deck viewer modal ── */
.deck-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(5, 10, 18, 0.85);
  z-index: 1100;
  display: flex;
  align-items: center;
  justify-content: center;
}
.deck-modal {
  background: #0d1b2a;
  border: 0.5px solid #1c3a58;
  width: 95%;
  max-width: 680px;
  max-height: 88vh;
  display: flex;
  flex-direction: column;
  font-family: "Crimson Pro", Georgia, serif;
  --accent: #534ab7;
  --accent-muted: #afa9ec;
  --accent-text: #eeedfe;
  --border: #1c3a58;
  --txt: #e0ddd8;
  --txt-title: #e8e3d8;
  --txt-muted: #6b8caa;
}
.deck-modal__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 20px 22px 16px;
  background: #080f18;
  border-bottom: 0.5px solid #1c3a58;
  flex-shrink: 0;
}
.deck-modal__title {
  font-family: "Cinzel", serif;
  font-size: 16px;
  font-weight: 600;
  color: #e8e3d8;
  margin: 0;
}
.deck-modal__commander {
  font-size: 13px;
  color: #afa9ec;
  font-style: italic;
  margin: 4px 0 0;
}
.close-btn {
  background: none;
  border: 0.5px solid #1c3a58;
  color: #6b8caa;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  cursor: pointer;
  flex-shrink: 0;
  transition:
    color 0.15s,
    border-color 0.15s;
}
.close-btn:hover {
  color: #e0ddd8;
  border-color: #6b8caa;
}
.close-btn svg {
  width: 14px;
  height: 14px;
}
.deck-modal__body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 22px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.deck-type-heading {
  font-family: "Cinzel", serif;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #afa9ec;
  margin: 0 0 8px;
}
.deck-type-count {
  color: #6b8caa;
  font-weight: 400;
}
.deck-card-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.deck-card-item {
  font-size: 13px;
  color: #e0ddd8;
  padding: 2px 0;
  border-bottom: 0.5px solid rgba(28, 58, 88, 0.3);
}
.deck-modal__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.view-toggle-btn {
  background: none;
  border: 0.5px solid var(--border);
  color: var(--txt-muted);
  font-family: "Cinzel", serif;
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 7px 12px;
  cursor: pointer;
  transition:
    color 0.15s,
    border-color 0.15s,
    background 0.15s;
}
.view-toggle-btn:hover {
  color: var(--accent-muted);
  border-color: var(--accent);
  background: rgba(83, 74, 183, 0.08);
}
.deck-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 8px;
}
.deck-card-tile {
  aspect-ratio: 488 / 680;
  border-radius: 8px;
  overflow: hidden;
  background: #080f18;
  border: 0.5px solid rgba(28, 58, 88, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
}
.deck-card-tile img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.deck-card-fallback {
  font-size: 11px;
  color: #6b8caa;
  text-align: center;
  padding: 8px;
  word-break: break-word;
}

.backdrop-enter-active,
.backdrop-leave-active {
  transition: opacity 0.25s ease;
}
.backdrop-enter-from,
.backdrop-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .mgmt-view {
    padding: 24px 16px 60px;
  }
  .heading {
    font-size: 18px;
  }
  .manage-topbar {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  .result-row {
    flex-direction: column;
  }
  .result-row__fields {
    width: 100%;
  }
}
</style>
