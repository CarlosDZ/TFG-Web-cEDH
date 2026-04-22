import { ref, onMounted } from "vue";
import { getTournaments } from "../services/tournamentService";

export function useTournaments() {
  const tournaments = ref([]);
  const loading = ref(true);

  onMounted(async () => {
    tournaments.value = await getTournaments();
    loading.value = false;
  });

  return { tournaments, loading };
}
