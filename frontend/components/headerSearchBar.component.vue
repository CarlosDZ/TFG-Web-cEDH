<script setup>
// Aquí podrías añadir lógica de búsqueda en el futuro
</script>
<template>
    <div id="header-search-bar">
        <div class="brand-section">
            <img src="../assets/images/texture_placeholder.jpg" alt="Spain cEDH" class="logo" />
        </div>
        <div class="search-wrapper">
            <div class="search-container">
                <select class="search-filter">
                    <option value="card">Cartas</option>
                    <option value="deck">Decks</option>
                    <option value="commander-tech">Techs</option>
                    <option value="user">Jugadores</option>
                    <option value="discussion">Discusiones</option>
                </select>
                <div class="divider"></div>
                <input type="text" placeholder="Buscar en Spain cEDH..." class="search-input" />
            </div>
            <button class="search-submit" title="Buscar">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
            </button>
        </div>
        <div class="profile-section">
            <button id="profile-button" title="Mi Perfil">
                <img src="../assets/images/avatar.jpg" alt="Avatar" />
            </button>
        </div>
    </div>
</template>
<style scoped>
#header-search-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    height: 100%;
    padding: 0 1.5rem;
    box-sizing: border-box;
}
/* Sección de Logo */
.brand-section {
    flex: 0 0 120px;
    display: flex;
    align-items: center;
}
.logo {
    height: 45px;
    object-fit: contain;
    border-radius: 8px;
}
/* Contenedor central de búsqueda */
.search-wrapper {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 0 1rem;
}
.search-container {
    display: flex;
    align-items: center;
    background-color: var(--navigation-dashboard-input-bg);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    width: 100%;
    max-width: 700px;
    height: 48px;
    transition: all 0.3s ease;
    overflow: hidden;
}
.search-container:focus-within {
    box-shadow: 0 0 0 2px var(--navigation-dashboard-input-text);
    border-color: transparent;
}
/* Estilos de los inputs internos */
.search-filter {
    background: transparent;
    color: var(--navigation-dashboard-input-text);
    border: none;
    padding: 0 1rem;
    height: 100%;
    cursor: pointer;
    font-weight: 600;
    outline: none;
}
.divider {
    width: 1px;
    height: 24px;
    background-color: rgba(255, 255, 255, 0.2);
}
.search-input {
    flex: 1;
    background: transparent;
    border: none;
    color: var(--navigation-dashboard-input-text);
    padding: 0 1rem;
    outline: none;
    font-size: 0.95rem;
}
.search-submit {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background-color: var(--navigation-dashboard-input-text);
    color: var(--navigation-dashboard-bg);
    border: none;
    cursor: pointer;
    transition: opacity 0.2s;
}
.search-submit:hover {
    opacity: 0.9;
}
/* Sección Perfil */
.profile-section {
    flex: 0 0 120px;
    display: flex;
    justify-content: flex-end;
}
#profile-button {
    background: none;
    border: 2px solid transparent;
    padding: 0;
    cursor: pointer;
    border-radius: 50%;
    transition: transform 0.2s ease;
    width: 45px;
    height: 45px;
}
#profile-button:hover {
    transform: scale(1.05);
    border-color: var(--navigation-dashboard-input-text);
}
#profile-button img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
}
/* Responsive básico */
@media (max-width: 768px) {
    .brand-section {
        display: none;
    }
    .search-wrapper {
        padding: 0 0.5rem;
    }
}
</style>