import { ref, onMounted } from "vue";
import { getPublicDecklists } from "../services/decklistService.js";

export function useDecklists() {
    const decklists = ref([]);
    const loading = ref(true);

    onMounted(async () => {
        decklists.value = await getPublicDecklists();
        loading.value = false;
    });

    return { decklists, loading };
}
