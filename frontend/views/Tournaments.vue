<script setup>
import { ref } from "vue";

import TournamentFeed from "../components/tournaments/tournamentFeed.component.vue";
import TournamentBuilderModal from "../components/tournaments/tournamentBuilder.modal.vue";
import TournamentDetail from "../components/tournaments/tournamentDetail.vue";
import sectionNavMenu from "../components/sectionNavMenu.component.vue";
import personalNavMenu from "../components/personalNavMenu.component.vue";
import headersSearchBar from "../components/headerSearchBar.component.vue";

const showBuilderModal = ref(false);
const selectedTournament = ref(null);
const tournaments = ref([]);

function onTournamentSaved(tournament) {
  tournaments.value.unshift(tournament);
  showBuilderModal.value = false;
}

function onTournamentDeleted(id) {
  tournaments.value = tournaments.value.filter((t) => t._id !== id);
  selectedTournament.value = null;
}
</script>

<template>
  <div id="mainContainer-tournaments">
    <header>
      <headersSearchBar />
    </header>

    <main>
      <TournamentFeed
        @new-tournament="showBuilderModal = true"
        @open-tournament="selectedTournament = $event"
      />

      <TournamentBuilderModal
        v-if="showBuilderModal"
        @close="showBuilderModal = false"
        @saved="onTournamentSaved"
      />

      <TournamentDetail
        v-if="selectedTournament"
        :tournament="selectedTournament"
        @close="selectedTournament = null"
        @deleted="onTournamentDeleted"
      />

      <personalNavMenu />
    </main>

    <footer>
      <sectionNavMenu />
    </footer>
  </div>
</template>

<style scoped>
#mainContainer-tournaments {
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
