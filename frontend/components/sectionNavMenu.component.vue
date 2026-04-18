<script setup>
import {
  name,
  version,
  author,
} from "../../package.json" with { type: "json" };
</script>

<template>
  <div id="mainContainer-sectionNavMenu">
    <RouterLink to="/torneos" class="bttnWrapper"
      ><span>Torneos</span></RouterLink
    >
    <RouterLink to="/decklists" class="bttnWrapper"
      ><span>Decklists</span></RouterLink
    >
    <RouterLink to="/commander-techs" class="bttnWrapper">
      <span>Techs</span>
    </RouterLink>
    <RouterLink to="/jugadores" class="bttnWrapper"
      ><span>Jugadores</span></RouterLink
    >
    <div id="txt-wrapper">
      <p class="app-name">{{ name }} {{ version }}</p>
      <p class="app-author">Developed by {{ author }}</p>
    </div>
  </div>
</template>

<style scoped>
#mainContainer-sectionNavMenu {
  --muted: color-mix(in srgb, var(--txt-color) 45%, transparent);

  display: flex;
  width: 100%;
  height: 100%;
  position: absolute;
  padding-left: 16px;
  background-color: var(--background-color);
  overflow: hidden;
  align-items: center;
}

.bttnWrapper {
  min-width: 13%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--button-background-color);
  transform: skewX(-25deg);
  text-decoration: none;
  overflow: hidden;
  margin-right: 1%;
  transition:
    transform 0.35s ease,
    background 0.35s ease;

  span {
    transform: skewX(25deg);
    font-size: 14px;
    font-weight: 500;
    color: var(--txt-color);
    padding: 0 28px;
    white-space: nowrap;
  }
}

.bttnWrapper:hover {
  transform: scale(1.08) skewX(-25deg);
  background-color: var(--button-background-color-hovered);
}

#txt-wrapper {
  margin-left: auto;
  margin-right: 3%;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
  gap: 1px;
}

.app-name {
  font-size: 12px;
  font-weight: 500;
  color: var(--txt-color);
}

.app-author {
  font-size: 10px;
  color: var(--muted);
}
</style>
