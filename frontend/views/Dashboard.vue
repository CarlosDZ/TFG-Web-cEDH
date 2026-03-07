<script setup>
import { ref } from "vue";
import axios from "axios";
import { authState } from "../utils/auth";

import mainFeed from "../components/discussions/mainFeed.component.vue";
import sectionNavMenu from "../components/sectionNavMenu.component.vue";
import personalNavMenu from "../components/personalNavMenu.component.vue";
import headersSearchBar from "../components/headerSearchBar.component.vue";

const backend_url = import.meta.env.VITE_BACKEND_URL;
const auth = authState();
</script>

<template>
    <div id="mainContainer-dashboard">
        <header>
            <headersSearchBar />
        </header>

        <main>
            <mainFeed />
            <personalNavMenu />
        </main>
        <footer>
            <sectionNavMenu />
        </footer>
    </div>
</template>

<style scoped>
#mainContainer-dashboard {
    height: 100%;
    width: 100%;

    header {
        height: 10vh;
        width: 100%;
        display: flex;

        background-color: var(--navigation-dashboard-bg);
        position: sticky;
        top: 0;
        z-index: 1000;
    }

    main {
        width: 100%;
        min-height: 84vh;
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
