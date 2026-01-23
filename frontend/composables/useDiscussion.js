import { ref, onMounted } from "vue";
import { getOrderedDiscussions } from "../services/discussionService";

export function useDiscussions() {
    const discussions = ref([]);
    const loading = ref(true);
    onMounted(async () => {
        discussions.value = await getOrderedDiscussions();
        loading.value = false;
    });
    return { discussions, loading };
}
