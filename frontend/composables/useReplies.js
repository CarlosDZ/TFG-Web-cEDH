import { ref } from "vue";
import { getReplies } from "../services/discussionService";

export function useReplies(commentId) {
    const replies = ref([]);
    const loading = ref(false);
    const loaded = ref(false);

    async function fetchReplies() {
        if (loaded.value) {
            console.log("[fetchReplies] ya cargado, skip");
            return;
        }
        loading.value = true;
        console.log("[fetchReplies] fetching para id:", commentId);
        const data = await getReplies(commentId);
        console.log("[fetchReplies] respuesta:", data);
        replies.value = data;
        loaded.value = true;
        loading.value = false;
    }

    return { replies, loading, loaded, fetchReplies };
}
