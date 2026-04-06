<script setup>
import { ref } from "vue";
import { authState } from "../utils/auth";

import DecklistFeed from "../components/decklists/decklistFeed.component.vue";
import sectionNavMenu from "../components/sectionNavMenu.component.vue";
import personalNavMenu from "../components/personalNavMenu.component.vue";
import headersSearchBar from "../components/headerSearchBar.component.vue";

const auth = authState();
const showNewDeckModal = ref(false);

function onNewDeck() {
    showNewDeckModal.value = true;
}
</script>

<template>
    <div id="mainContainer-decklists">
        <header>
            <headersSearchBar />
        </header>

        <main>
            <DecklistFeed @new-deck="onNewDeck" />
            <personalNavMenu />
        </main>

        <footer>
            <sectionNavMenu />
        </footer>
    </div>
</template>

<style scoped>
#mainContainer-decklists {
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;

    header {
        height: 9vh;
        width: 100%;
        display: flex;
        position: sticky;
        top: 0;
        z-index: 1000;
    }

    main {
        width: 100%;
        flex: 1;
        display: flex;
        position: relative;
        overflow: hidden;
        background-color: var(--background-color);
    }

    footer {
        width: 100%;
        min-height: 6vh;
        display: flex;
        position: relative;
    }
}
</style>
