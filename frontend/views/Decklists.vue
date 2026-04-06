<script setup>
import { ref } from "vue";

import DecklistFeed from "../components/decklists/decklistFeed.component.vue";
import DeckImportMethodModal from "../components/decklists/deckImportMethod.modal.vue";
import DeckBuilderModal from "../components/decklists/deckBuilder.modal.vue";
import sectionNavMenu from "../components/sectionNavMenu.component.vue";
import personalNavMenu from "../components/personalNavMenu.component.vue";
import headersSearchBar from "../components/headerSearchBar.component.vue";

const showMethodModal  = ref(false);
const showBuilderModal = ref(false);
const builderInitialData = ref(null);

const decklists = ref([]);

async function onMethodSelected(methodId) {
    showMethodModal.value = false;

    if (methodId === "moxfield") {
        const url = window.prompt("Introduce el link de Moxfield:");
        if (!url) return;
        try {
            const res = await fetch(`/api/decklist/import/moxfield?url=${encodeURIComponent(url)}`, {
                credentials: "include",
            });
            if (!res.ok) {
                const err = await res.json();
                window.alert(err.error ?? "Error al importar el deck");
                return;
            }
            builderInitialData.value = await res.json();
        } catch {
            window.alert("Error de conexión al importar");
            return;
        }
    } else {
        builderInitialData.value = null;
    }

    showBuilderModal.value = true;
}

function onDeckSaved(deck) {
    decklists.value.unshift(deck);
}
</script>

<template>
    <div id="mainContainer-decklists">
        <header>
            <headersSearchBar />
        </header>

        <main>
            <DecklistFeed @new-deck="showMethodModal = true" @deck-saved="onDeckSaved" />
        <DeckImportMethodModal
            v-if="showMethodModal"
            @close="showMethodModal = false"
            @select="onMethodSelected"
        />
        <DeckBuilderModal
            v-if="showBuilderModal"
            :initial-data="builderInitialData"
            @close="showBuilderModal = false"
            @saved="onDeckSaved"
        />
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
