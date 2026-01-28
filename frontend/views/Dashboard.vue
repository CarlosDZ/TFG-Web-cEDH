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
