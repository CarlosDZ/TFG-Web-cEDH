<script setup>
import { name, version, author } from "../../package.json" with { type: "json" };
</script>

<template>
    <div id="mainContainer-sectionNavMenu">
        <RouterLink to="/torneos" class="bttnWrapper"><h1>Torneos</h1></RouterLink>
        <RouterLink to="/decklists" class="bttnWrapper"><h1>Decklists</h1></RouterLink>
        <RouterLink to="/commander-techs" class="bttnWrapper"><h1>Commander Techs</h1></RouterLink>
        <RouterLink to="/jugadores" class="bttnWrapper"><h1>Jugadores</h1></RouterLink>

        <div id="txt-wrapper">
            <h3>{{ name }} {{ version }}</h3>
            <h4>Developed by {{ author }}</h4>
        </div>
    </div>
</template>
