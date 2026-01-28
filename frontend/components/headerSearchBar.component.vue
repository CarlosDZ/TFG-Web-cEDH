<script setup></script>

<template>
    <div id="mainContainer-headerSearchBar">
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
    </div>
</template>
