<script setup>
import { ref } from "vue";
import { useTournaments } from "../composables/useTournaments";

import TournamentFeed from "../components/tournaments/tournamentFeed.component.vue";
import TournamentBuilderModal from "../components/tournaments/tournamentBuilder.modal.vue";
import TournamentDetail from "../components/tournaments/tournamentDetail.vue";
import sectionNavMenu from "../components/sectionNavMenu.component.vue";
import personalNavMenu from "../components/personalNavMenu.component.vue";
import headersSearchBar from "../components/headerSearchBar.component.vue";

const { addTournament, updateTournament, removeTournament } = useTournaments();

const showBuilderModal = ref(false);
const editingTournament = ref(null);
const selectedTournament = ref(null);

function onTournamentSaved(tournament) {
  addTournament(tournament);
  showBuilderModal.value = false;
}

function onTournamentUpdated(tournament) {
  updateTournament(tournament);
  if (selectedTournament.value?._id === tournament._id) {
    selectedTournament.value = tournament;
  }
  editingTournament.value = null;
}

function onTournamentDeleted(id) {
  removeTournament(id);
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

      <TournamentBuilderModal
        v-if="editingTournament"
        :initial-data="editingTournament"
        @close="editingTournament = null"
        @updated="onTournamentUpdated"
      />

      <TournamentDetail
        v-if="selectedTournament"
        :tournament="selectedTournament"
        @close="selectedTournament = null"
        @deleted="onTournamentDeleted"
        @edit="editingTournament = $event"
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
