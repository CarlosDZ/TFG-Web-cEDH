<script setup>
import { ref, computed, onMounted, nextTick } from "vue";
import { marked } from "marked";
import { authState } from "../../utils/auth";
import {
  toggleSave,
  deleteTournament,
  joinTournament,
  getMyEntry,
  cancelEntry,
} from "../../services/tournamentService";
import { getDecklistsByUser, getDeck } from "../../services/decklistService";
import { useTournaments } from "../../composables/useTournaments";

defineOptions({ name: "TournamentDetail" });

const props = defineProps({
  tournament: { type: Object, required: true },
});
const emit = defineEmits(["close", "deleted", "edit"]);

const auth = authState();
const { savedIds, loadSavedIds, toggleSavedId } = useTournaments();
const visible = ref(false);
const activeTab = ref("info");
const notification = ref("");
let notifTimeout = null;

const isSaved = computed(() => savedIds.value.has(props.tournament._id));

const authorName = computed(
  () => props.tournament.authorId?.username ?? "Anónimo",
);

const fechaDisplay = computed(() => {
  if (!props.tournament.tournament_date_hour) return "";
  return new Date(props.tournament.tournament_date_hour).toLocaleDateString(
    "es-ES",
    { weekday: "long", day: "numeric", month: "long", year: "numeric" },
  );
});

const horaDisplay = computed(() => {
  if (!props.tournament.tournament_date_hour) return "";
  return new Date(props.tournament.tournament_date_hour).toLocaleTimeString(
    "es-ES",
    { hour: "2-digit", minute: "2-digit" },
  );
});

const isPast = computed(
  () => new Date(props.tournament.tournament_date_hour) < new Date(),
);

const deadlinePassed = computed(() => {
  if (!props.tournament.registration_deadline) return false;
  return new Date(props.tournament.registration_deadline) < new Date();
});

const canJoin = computed(
  () => !isPast.value && !props.tournament.isFull && !deadlinePassed.value,
);

const isOrganizer = computed(
  () =>
    auth.isLogged &&
    (auth.user?.isAdmin ||
      props.tournament.authorId?._id === auth.user?.id ||
      props.tournament.authorId?.toString() === auth.user?.id),
);

// Join flow state
const myEntry = ref(null);
const myEntryLoaded = ref(false);
const userDecks = ref([]);
const selectedDeckId = ref("");
const joining = ref(false);
const cancelling = ref(false);
const joinError = ref("");

const rulesHtml = computed(() => {
  const md = props.tournament.ruling_markdown ?? "";
  return md.trim() ? marked.parse(md.replace(/\n{3,}/g, "\n\n")) : "";
});

const mapSrc = computed(() => {
  const u = props.tournament.ubication ?? "";
  if (!u.includes("google.com/maps")) return null;
  return u;
});

const canDelete = computed(
  () =>
    auth.isLogged &&
    (auth.user?.isAdmin ||
      props.tournament.authorId?._id === auth.user?.id ||
      props.tournament.authorId?.toString() === auth.user?.id),
);

function showNotif(msg, duration = 3000) {
  notification.value = msg;
  clearTimeout(notifTimeout);
  notifTimeout = setTimeout(() => {
    notification.value = "";
  }, duration);
}

async function loadJoinData() {
  if (!auth.isLogged || myEntryLoaded.value) return;
  myEntryLoaded.value = true;
  myEntry.value = await getMyEntry(props.tournament._id);
  if (!myEntry.value && props.tournament.needs_decklist) {
    userDecks.value = await getDecklistsByUser(auth.user.id);
  }
}

async function handleJoin() {
  joining.value = true;
  joinError.value = "";
  try {
    let payload = {};
    if (props.tournament.needs_decklist) {
      if (!selectedDeckId.value) {
        joinError.value = "Selecciona una decklist para continuar.";
        return;
      }
      const deck = await getDeck(selectedDeckId.value);
      payload = {
        decklistId: deck._id,
        title: deck.title,
        commander: deck.commander,
        cards: deck.cards,
        color_identity: deck.color_identity,
        card_images: deck.card_images,
        card_types: deck.card_types,
      };
    }
    myEntry.value = await joinTournament(props.tournament._id, payload);
  } catch (err) {
    joinError.value = err.message ?? "Error al inscribirse.";
  } finally {
    joining.value = false;
  }
}

async function handleCancelEntry() {
  if (!confirm("¿Cancelar tu inscripción a este torneo?")) return;
  cancelling.value = true;
  try {
    await cancelEntry(props.tournament._id, myEntry.value._id);
    myEntry.value = null;
    selectedDeckId.value = "";
    if (props.tournament.needs_decklist && userDecks.value.length === 0) {
      userDecks.value = await getDecklistsByUser(auth.user.id);
    }
  } catch {
    showNotif("Error al cancelar la inscripción.");
  } finally {
    cancelling.value = false;
  }
}

onMounted(() => {
  nextTick(() => {
    visible.value = true;
  });
  if (auth.isLogged) loadSavedIds();
});

async function handleSave() {
  if (!auth.isLogged) {
    showNotif("Estás en modo invitado. Inicia sesión para interactuar.");
    return;
  }
  try {
    toggleSavedId(props.tournament._id);
    await toggleSave(props.tournament._id);
  } catch {
    toggleSavedId(props.tournament._id);
    showNotif("Error al guardar el torneo.");
  }
}

async function handleDelete() {
  if (
    !confirm(
      `¿Borrar el torneo "${props.tournament.name}"? Esta acción no se puede deshacer.`,
    )
  )
    return;
  try {
    await deleteTournament(props.tournament._id);
    emit("deleted", props.tournament._id);
    handleClose();
  } catch {
    showNotif("Error al borrar el torneo.");
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
                <span class="detail-eyebrow">Torneo</span>
                <h1 class="detail-title">{{ tournament.name }}</h1>
                <p class="detail-meta">
                  Organizado por {{ authorName }}
                  <span
                    v-if="tournament.isFull"
                    class="status-badge status-badge--full"
                    >Completo</span
                  >
                  <span
                    v-else-if="isPast"
                    class="status-badge status-badge--past"
                    >Finalizado</span
                  >
                  <span v-else class="status-badge status-badge--open"
                    >Abierto</span
                  >
                </p>
              </div>
              <div class="detail-header__right">
                <button
                  class="icon-btn"
                  :class="{ 'icon-btn--saved': isSaved }"
                  :title="isSaved ? 'Quitar de guardados' : 'Guardar torneo'"
                  @click="handleSave"
                >
                  <svg
                    viewBox="0 0 24 24"
                    :fill="isSaved ? 'currentColor' : 'none'"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path
                      d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"
                    />
                  </svg>
                </button>
                <button
                  v-if="canDelete"
                  class="icon-btn"
                  title="Editar torneo"
                  @click="emit('edit', tournament)"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <circle cx="12" cy="12" r="3" />
                    <path
                      d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
                    />
                  </svg>
                </button>
                <button
                  v-if="canDelete"
                  class="icon-btn icon-btn--danger"
                  title="Borrar torneo"
                  @click="handleDelete"
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
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6M14 11v6" />
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                  </svg>
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
                :class="{ active: activeTab === 'info' }"
                @click="activeTab = 'info'"
              >
                Info
              </button>
              <button
                v-if="tournament.prizes?.length"
                class="tab-btn"
                :class="{ active: activeTab === 'prizes' }"
                @click="activeTab = 'prizes'"
              >
                Premios
              </button>
              <button
                v-if="tournament.ruling_markdown"
                class="tab-btn"
                :class="{ active: activeTab === 'rules' }"
                @click="activeTab = 'rules'"
              >
                Reglas
              </button>
              <button
                v-if="!isPast"
                class="tab-btn"
                :class="{ active: activeTab === 'join' }"
                @click="
                  activeTab = 'join';
                  loadJoinData();
                "
              >
                Inscripción
              </button>
            </div>

            <!-- Info tab -->
            <div v-if="activeTab === 'info'" class="detail-body">
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Fecha</span>
                  <span class="info-value">{{ fechaDisplay }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Hora</span>
                  <span class="info-value">{{ horaDisplay }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Formato</span>
                  <span class="info-value">{{ tournament.format }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Entrada</span>
                  <span class="info-value">{{ tournament.enter_cost }}</span>
                </div>
                <div v-if="tournament.max_players" class="info-item">
                  <span class="info-label">Plazas</span>
                  <span class="info-value">{{ tournament.max_players }}</span>
                </div>
              </div>

              <p v-if="tournament.description" class="detail-description">
                {{ tournament.description }}
              </p>

              <div v-if="mapSrc" class="map-wrapper">
                <span class="info-label">Ubicación</span>
                <iframe
                  :src="mapSrc"
                  class="map-iframe"
                  allowfullscreen
                  loading="lazy"
                  referrerpolicy="no-referrer-when-downgrade"
                  title="Ubicación del torneo"
                />
              </div>
              <div v-else-if="tournament.ubication" class="info-item">
                <span class="info-label">Ubicación</span>
                <a
                  :href="tournament.ubication"
                  target="_blank"
                  rel="noopener"
                  class="info-link"
                >
                  Ver en Google Maps
                </a>
              </div>
            </div>

            <!-- Prizes tab -->
            <div v-else-if="activeTab === 'prizes'" class="detail-body">
              <table class="prizes-table">
                <thead>
                  <tr>
                    <th>Posición</th>
                    <th>Premio</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(p, i) in tournament.prizes" :key="i">
                    <td class="prize-range">{{ p.range }}</td>
                    <td class="prize-desc">{{ p.prize }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Rules tab -->
            <div v-else-if="activeTab === 'rules'" class="detail-body">
              <div class="markdown-body" v-html="rulesHtml" />
            </div>

            <!-- Join tab -->
            <div v-else-if="activeTab === 'join'" class="detail-body join-body">
              <!-- Not logged in -->
              <template v-if="!auth.isLogged">
                <p class="join-hint">
                  Inicia sesión para inscribirte en este torneo.
                </p>
              </template>

              <!-- Already inscribed -->
              <template v-else-if="myEntry">
                <div class="entry-status-card">
                  <span class="info-label">Tu inscripción</span>
                  <div class="entry-status-row">
                    <span
                      class="status-badge"
                      :class="{
                        'status-badge--open': myEntry.status === 'accepted',
                        'status-badge--pending': myEntry.status === 'pending',
                        'status-badge--full': myEntry.status === 'rejected',
                      }"
                    >
                      {{
                        myEntry.status === "accepted"
                          ? "Aceptada"
                          : myEntry.status === "pending"
                            ? "Pendiente de confirmación"
                            : "Rechazada"
                      }}
                    </span>
                  </div>
                  <p v-if="myEntry.title" class="entry-deck-name">
                    {{ myEntry.title }}
                  </p>
                  <p v-if="myEntry.commander?.length" class="entry-commander">
                    {{ myEntry.commander.join(" / ") }}
                  </p>
                  <button
                    v-if="myEntry.status !== 'accepted'"
                    class="btn-cancel-entry"
                    :disabled="cancelling"
                    @click="handleCancelEntry"
                  >
                    {{ cancelling ? "Cancelando..." : "Cancelar inscripción" }}
                  </button>
                </div>
              </template>

              <!-- Closed / full -->
              <template v-else-if="!canJoin">
                <p class="join-hint">
                  {{
                    tournament.isFull
                      ? "El torneo está completo."
                      : "El plazo de inscripción ha finalizado."
                  }}
                </p>
              </template>

              <!-- Join form -->
              <template v-else>
                <div class="join-form">
                  <p v-if="tournament.needs_decklist" class="join-hint">
                    Este torneo requiere que adjuntes una decklist. Se guardará
                    una copia del estado actual.
                  </p>
                  <p v-else class="join-hint">
                    {{
                      tournament.auto_accept_participants
                        ? "Tu inscripción será confirmada automáticamente."
                        : "Tu inscripción quedará pendiente de confirmación por el organizador."
                    }}
                  </p>

                  <div v-if="tournament.needs_decklist" class="field-group">
                    <label class="info-label">Selecciona tu decklist</label>
                    <select class="join-select" v-model="selectedDeckId">
                      <option value="" disabled>Elige una decklist...</option>
                      <option
                        v-for="d in userDecks"
                        :key="d._id"
                        :value="d._id"
                      >
                        {{ d.title }} — {{ d.commander?.join(" / ") }}
                      </option>
                    </select>
                    <p
                      v-if="userDecks.length === 0"
                      class="join-hint join-hint--warn"
                    >
                      No tienes decklists públicas. Crea una desde Mi Perfil.
                    </p>
                  </div>

                  <p v-if="joinError" class="join-error">{{ joinError }}</p>

                  <button
                    class="btn-join"
                    :disabled="
                      joining || (tournament.needs_decklist && !selectedDeckId)
                    "
                    @click="handleJoin"
                  >
                    {{ joining ? "Inscribiendo..." : "Inscribirse" }}
                  </button>
                </div>
              </template>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>

    <Transition name="notif">
      <div v-if="notification" class="notification">{{ notification }}</div>
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
  --txt: #e0ddd8;
  --txt-title: #e8e3d8;
  --txt-muted: #6b8caa;
  --txt-placeholder: #2a4460;

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
  gap: 4px;
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

.detail-title {
  font-family: "Cinzel", serif;
  font-size: 20px;
  font-weight: 600;
  color: var(--txt-title);
  margin: 0;
  line-height: 1.2;
  letter-spacing: 0.03em;
}

.detail-meta {
  font-size: 12px;
  color: var(--txt-muted);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.status-badge {
  font-family: "Cinzel", serif;
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 2px 7px;
  border-radius: 3px;
}

.status-badge--open {
  background: rgba(83, 183, 117, 0.12);
  color: #5ecb82;
  border: 0.5px solid rgba(83, 183, 117, 0.3);
}

.status-badge--full {
  background: rgba(226, 75, 74, 0.1);
  color: #e24b4a;
  border: 0.5px solid rgba(226, 75, 74, 0.3);
}

.status-badge--past {
  background: rgba(107, 140, 170, 0.1);
  color: #6b8caa;
  border: 0.5px solid rgba(107, 140, 170, 0.25);
}

.detail-header__right {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.icon-btn {
  background: none;
  border: 0.5px solid var(--border);
  cursor: pointer;
  color: var(--txt-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 7px;
  transition:
    color 0.15s,
    border-color 0.15s;
}
.icon-btn:hover {
  color: var(--accent-muted);
  border-color: var(--accent-muted);
}
.icon-btn--saved {
  color: var(--accent-muted);
  border-color: var(--accent);
}
.icon-btn--danger:hover {
  color: #e05c5c;
  border-color: rgba(224, 92, 92, 0.4);
}
.icon-btn svg {
  width: 15px;
  height: 15px;
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

.detail-body {
  flex: 1;
  overflow-y: auto;
  scrollbar-gutter: stable;
  padding: 28px 32px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-family: "Cinzel", serif;
  font-size: 9px;
  font-weight: 600;
  color: var(--accent-muted);
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

.info-value {
  font-size: 14px;
  color: var(--txt);
  line-height: 1.4;
}

.info-link {
  font-size: 14px;
  color: var(--accent-muted);
  text-decoration: none;
}
.info-link:hover {
  color: var(--accent-text);
  text-decoration: underline;
}

.detail-description {
  font-size: 15px;
  color: var(--txt-muted);
  line-height: 1.7;
  margin: 0;
  font-style: italic;
}

.map-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.map-iframe {
  width: 100%;
  height: 320px;
  border: 0.5px solid var(--border);
  border-radius: 6px;
}

/* Prizes table */
.prizes-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.prizes-table th {
  font-family: "Cinzel", serif;
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--accent-muted);
  text-align: left;
  padding: 8px 12px;
  border-bottom: 0.5px solid var(--border);
}

.prizes-table td {
  padding: 12px 12px;
  border-bottom: 0.5px solid rgba(28, 58, 88, 0.5);
  color: var(--txt);
  vertical-align: top;
}

.prize-range {
  font-family: "Cinzel", serif;
  font-size: 13px;
  color: var(--accent-muted);
  white-space: nowrap;
  width: 100px;
}

.prize-desc {
  line-height: 1.5;
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
.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  padding-left: 1.5rem;
  margin: 0 0 0.75rem;
}
.markdown-body :deep(li) {
  margin-bottom: 0.25rem;
}

/* Join tab */
.join-body {
  gap: 20px;
}

.join-hint {
  font-size: 14px;
  color: var(--txt-muted);
  font-style: italic;
  margin: 0;
  line-height: 1.6;
}

.join-hint--warn {
  color: #e24b4a;
  font-style: normal;
}

.join-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 480px;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.join-select {
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
.join-select:focus {
  border-color: var(--accent);
}
.join-select option {
  background: var(--bg-surface);
  color: var(--txt);
}

.join-error {
  font-size: 13px;
  color: #e05c5c;
  margin: 0;
}

.btn-join {
  align-self: flex-start;
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
  padding: 10px 24px;
  cursor: pointer;
  transform: skewX(-12deg);
  transition:
    background 0.15s,
    opacity 0.15s;
}
.btn-join > * {
  transform: skewX(12deg);
}
.btn-join:hover {
  background: var(--accent-hover);
}
.btn-join:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.entry-status-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 20px;
  border: 0.5px solid var(--border);
  background: var(--bg-surface);
  max-width: 480px;
}

.entry-status-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.status-badge--pending {
  background: rgba(175, 169, 236, 0.1);
  color: var(--accent-muted);
  border: 0.5px solid rgba(175, 169, 236, 0.3);
}

.entry-deck-name {
  font-size: 15px;
  color: var(--txt);
  margin: 0;
  font-weight: 600;
}

.entry-commander {
  font-size: 13px;
  color: var(--txt-muted);
  margin: 0;
  font-style: italic;
}

.btn-cancel-entry {
  align-self: flex-start;
  background: none;
  border: 0.5px solid rgba(224, 92, 92, 0.4);
  color: #e05c5c;
  font-family: "Cinzel", serif;
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 7px 16px;
  cursor: pointer;
  margin-top: 4px;
  transition:
    background 0.15s,
    border-color 0.15s;
}
.btn-cancel-entry:hover {
  background: rgba(224, 92, 92, 0.08);
}
.btn-cancel-entry:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Notification */
.notification {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  background: #0d1b2a;
  border: 0.5px solid #534ab7;
  color: #afa9ec;
  border-radius: 8px;
  padding: 8px 18px;
  font-size: 0.85em;
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
