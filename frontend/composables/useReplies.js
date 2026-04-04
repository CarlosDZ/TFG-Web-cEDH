import { ref } from "vue";
import { getReplies } from "../services/discussionService";

export function useReplies(commentId) {
    const replies = ref([]);
    const loading = ref(false);
    const loaded = ref(false);

    async function fetchReplies() {
        if (loaded.value) return;
        loading.value = true;
        replies.value = await getReplies(commentId);
        loaded.value = true;
        loading.value = false;
    }

    return { replies, loading, loaded, fetchReplies };
}
