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
@media (prefers-color-scheme: dark) {
  #mainContainer-sectionNavMenu {
    --bg: #1a1b2e;
    --txt: #e8e6f0;
    --txt-muted: rgba(232, 230, 240, 0.45);
    --border: rgba(232, 230, 240, 0.18);
    --btn-bg: #2a2b42;
    --btn-bg-hover: #32334e;
    --accent: #534ab7;
    --accent-hover: #3c3489;
    --accent-text: #eeedfe;
    --accent-muted: #afa9ec;
  }
}
@media (prefers-color-scheme: light) {
  #mainContainer-sectionNavMenu {
    --bg: #f4f0eb;
    --txt: #3a3541;
    --txt-muted: rgba(58, 53, 65, 0.45);
    --border: rgba(58, 53, 65, 0.2);
    --btn-bg: #e8e3dc;
    --btn-bg-hover: #ddd7ce;
    --accent: #534ab7;
    --accent-hover: #3c3489;
    --accent-text: #eeedfe;
    --accent-muted: #afa9ec;
  }
}

#mainContainer-sectionNavMenu {
  display: flex;
  width: 100%;
  height: 100%;
  position: absolute;
  padding-left: 16px;
  background-color: var(--bg);
  border-top: 0.5px solid var(--border);
  overflow: hidden;
  align-items: center;
  box-sizing: border-box;
}

.bttnWrapper {
  min-width: 13%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--btn-bg);
  transform: skewX(-18deg);
  text-decoration: none;
  overflow: hidden;
  margin-right: 1%;
  transition:
    transform 0.25s ease,
    background 0.25s ease;

  span {
    transform: skewX(18deg);
    font-size: 14px;
    font-weight: 500;
    color: var(--txt);
    padding: 0 28px;
    white-space: nowrap;
    transition: color 0.25s ease;
  }
}

.bttnWrapper:hover {
  transform: scale(1.06) skewX(-18deg);
  background-color: var(--btn-bg-hover);
}

.bttnWrapper.router-link-active {
  background-color: var(--accent);

  span {
    color: var(--accent-text);
  }
}

.bttnWrapper.router-link-active:hover {
  background-color: var(--accent-hover);
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
  color: var(--txt);
}

.app-author {
  font-size: 10px;
  color: var(--txt-muted);
}
</style>
