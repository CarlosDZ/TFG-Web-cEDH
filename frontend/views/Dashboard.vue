<script setup>
import { ref } from "vue";
import axios from "axios";
import { authState } from "../utils/auth";

import mainFeed from "../components/discussions/mainFeed.component.vue";
import sectionNavMenu from "../components/sectionNavMenu.component.vue";

const backend_url = import.meta.env.VITE_BACKEND_URL;
const auth = authState();
</script>

<template>
    <div id="mainContainer-dashboard">
        <header>
            <img src="../assets/images/texture_placeholder.jpg" alt="Spain cEDH" />

            <div class="search-area">
                <input type="text" placeholder="Escribe aquí para buscar..." />
                <select>
                    <option value="card">Cartas</option>
                    <option value="deck">Decks</option>
                    <option value="commander-tech">Techs</option>
                    <option value="user">Jugadores</option>
                    <option value="discussion">Discusiones</option>
                </select>
                <button class="search-btn"><b>Buscar</b></button>
            </div>

            <button id="profile-button">
                <img src="../assets/images/avatar.jpg" alt="Prof" />
            </button>
        </header>

        <main>
            <sectionNavMenu />
            <mainFeed />
            <aside id="my-content"></aside>
        </main>
    </div>
</template>
