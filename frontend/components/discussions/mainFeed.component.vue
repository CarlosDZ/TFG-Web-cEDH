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
    transition: flex 0.3s ease;
    scrollbar-gutter: left;
}

</style>