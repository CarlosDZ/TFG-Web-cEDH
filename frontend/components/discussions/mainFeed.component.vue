<script setup>
import { ref } from "vue";
import { useDiscussions } from "../../composables/useDiscussion";
import { authState } from "../../utils/auth";
import { usePanelState } from "../../composables/usePanelState";
import postOnFeed from "./postOnFeed.component.vue";
import NewPostModal from "./discussionBuilder.modal.vue";

const { discussions, loading } = useDiscussions();
const auth = authState();
const { isPanelOpen } = usePanelState();
const showModal = ref(false);
</script>

<template>
    <div id="mainContainer-commentFeed" :class="{ 'panel-open': isPanelOpen }">
        <p v-if="loading">Cargando...</p>
        <postOnFeed
            v-for="discusion in discussions"
            :key="discusion.id"
            :discusionElement="discusion"
        />

        <button
            v-if="auth.isLogged"
            class="new-post-btn"
            title="Nueva discusión"
            @click="showModal = true"
        >
            <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
            >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
        </button>

        <NewPostModal
            v-if="showModal"
            :parent-id="null"
            @close="showModal = false"
            @published="discussions.unshift($event)"
        />
    </div>
</template>

<style scoped>
#mainContainer-commentFeed {
    height: 84vh;
    background: transparent;
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    transition:
        flex 0.3s ease,
        margin-right 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    scrollbar-gutter: stable;
    padding: 1rem 0.5rem 1rem 1rem;
    position: relative;
    margin-right: 0;
}

#mainContainer-commentFeed.panel-open {
    margin-right: 220px;
}

#mainContainer-commentFeed p {
    font-size: 13px;
    color: var(--txt-color);
    opacity: 0.5;
    padding: 2rem 1.5rem;
}

.new-post-btn {
    position: sticky;
    bottom: 1.25rem;
    float: right;
    margin-right: 1rem;
    width: 48px;
    height: 48px;
    background: #534ab7;
    border: none;
    border-radius: 0;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #eeedfe;
    transform: skewX(-12deg);
    transition:
        background 0.15s,
        transform 0.15s;
}

.new-post-btn:hover {
    background: #3c3489;
}
.new-post-btn:active {
    transform: skewX(-12deg) scale(0.9);
}

.new-post-btn svg {
    width: 20px;
    height: 20px;
    transform: skewX(12deg);
}
</style>
