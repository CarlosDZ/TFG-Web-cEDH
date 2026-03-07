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

<style scoped>
#mainContainer-sectionNavMenu {
    display: flex;
    width: 100%;
    height: 100%;
    position: absolute;
    padding-left: 20px;

    background-color: var(--background-color);
    overflow: hidden;

    .bttnWrapper {
        width: auto;
        display: flex;
        min-width: 13%;
        height: 100%;
        margin-right: 1%;
        align-items: center;
        justify-content: center;
        background-color: var(--button-background-color);
        transform: skewX(-25deg);
        text-decoration: none;
        overflow: hidden;
        transition:
            transform 0.8s ease,
            background 0.8s ease;
        h1 {
            transform: skewX(25deg);
            align-items: center;
            justify-content: center;
            color: var(--txt-color);
            padding: 0 30px;
        }
    }

    .bttnWrapper:hover {
        transform: scale(1.1) skewX(-25deg);
        overflow-y: hidden;
        background-color: var(--button-background-color-hovered);
        h1 {
            transform: skewX(25deg);
        }
    }


    #txt-wrapper{
        margin-left: auto;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        margin-right: 3%;

        h3, h4{
            text-align: center;
            color: var(--txt-color);
        }
        
    }
}
</style>
