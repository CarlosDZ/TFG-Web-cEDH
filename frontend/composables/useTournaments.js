import { ref, onMounted } from "vue";
import { getTournaments, getSavedTournaments } from "../services/tournamentService";

const tournaments = ref([]);
const loading = ref(true);
const savedIds = ref(new Set());
const savedTournaments = ref([]);
let fetched = false;
let savedFetched = false;

export function useTournaments() {
  onMounted(async () => {
    if (fetched) return;
    fetched = true;
    tournaments.value = await getTournaments();
    loading.value = false;
  });

  async function loadSavedIds() {
    if (savedFetched) return;
    savedFetched = true;
    try {
      const saved = await getSavedTournaments();
      savedTournaments.value = saved;
      savedIds.value = new Set(saved.map((t) => t._id));
    } catch {
      savedFetched = false;
    }
  }

  function toggleSavedId(id) {
    const next = new Set(savedIds.value);
    if (next.has(id)) {
      next.delete(id);
      savedTournaments.value = savedTournaments.value.filter((t) => t._id !== id);
    } else {
      next.add(id);
      const t = tournaments.value.find((t) => t._id === id);
      if (t) savedTournaments.value = [t, ...savedTournaments.value];
    }
    savedIds.value = next;
  }

  function addTournament(t) {
    tournaments.value = [t, ...tournaments.value];
  }

  function updateTournament(t) {
    const i = tournaments.value.findIndex((x) => x._id === t._id);
    if (i !== -1) tournaments.value[i] = t;
  }

  function removeTournament(id) {
    tournaments.value = tournaments.value.filter((t) => t._id !== id);
  }

  return { tournaments, loading, savedIds, savedTournaments, loadSavedIds, toggleSavedId, addTournament, updateTournament, removeTournament };
}
