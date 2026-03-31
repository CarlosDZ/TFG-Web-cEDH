<script setup>
import { useDiscussions } from "../../composables/useDiscussion";
import postOnFeed from "./postOnFeed.component.vue";

const { discussions, loading } = useDiscussions();
</script>

<template>
    <div id="mainContainer-commentFeed">
        <p v-if="loading">Cargando...</p>

        <postOnFeed
            v-for="discusion in discussions"
            :key="discusion.id"
            :discusionElement="discusion"
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
    transition: flex 0.3s ease;
    scrollbar-gutter: stable;
    padding: 1rem 0.5rem 1rem 1rem;
}

#mainContainer-commentFeed p {
    font-size: 13px;
    color: var(--txt-color);
    opacity: 0.5;
    padding: 2rem 1.5rem;
}
</style>
