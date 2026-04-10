import { ref, onMounted } from "vue";
import { getCommanderTechs } from "../services/commanderTechService";

export function useCommanderTechs() {
  const techs = ref([]);
  const loading = ref(true);

  onMounted(async () => {
    techs.value = await getCommanderTechs();
    loading.value = false;
  });

  return { techs, loading };
}
