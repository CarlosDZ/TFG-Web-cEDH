import { ref } from "vue";

const isPanelOpen = ref(true);

export function usePanelState() {
    return { isPanelOpen };
}
