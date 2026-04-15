<script setup>
import { ref } from "vue";

import CommanderTechFeed from "../components/commanderTechs/commanderTechFeed.component.vue";
import CommanderTechBuilderModal from "../components/commanderTechs/commanderTechBuilder.modal.vue";
import CommanderTechDetail from "../components/commanderTechs/commanderTechDetail.vue";
import sectionNavMenu from "../components/sectionNavMenu.component.vue";
import personalNavMenu from "../components/personalNavMenu.component.vue";
import headersSearchBar from "../components/headerSearchBar.component.vue";

const showBuilderModal = ref(false);
const selectedTech = ref(null);
const techs = ref([]);

function onTechSaved(tech) {
  techs.value.unshift(tech);
  showBuilderModal.value = false;
}
</script>

<template>
  <div id="mainContainer-commanderTechs">
    <header>
      <headersSearchBar />
    </header>

    <main>
      <CommanderTechFeed
        @new-tech="showBuilderModal = true"
        @open-tech="selectedTech = $event"
      />

      <CommanderTechBuilderModal
        v-if="showBuilderModal"
        @close="showBuilderModal = false"
        @saved="onTechSaved"
      />

      <CommanderTechDetail
        v-if="selectedTech"
        :tech="selectedTech"
        @close="selectedTech = null"
      />

      <personalNavMenu />
    </main>

    <footer>
      <sectionNavMenu />
    </footer>
  </div>
</template>

<style scoped>
#mainContainer-commanderTechs {
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
