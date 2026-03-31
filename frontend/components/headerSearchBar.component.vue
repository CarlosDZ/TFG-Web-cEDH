<script setup></script>

<template>
    <div id="header-search-bar">
        <div class="brand-section">
            <div class="brand-inner">
                <div class="brand-content">
                    <div class="logo-wrap">
                        <img src="../assets/images/texture_placeholder.jpg" alt="Spain cEDH" />
                    </div>
                    <div class="brand-text">
                        <span class="brand-name">Spain cEDH</span>
                        <span class="brand-sub">Community</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="search-zone">
            <div class="search-wrap">
                <div class="select-wrap">
                    <select class="search-filter">
                        <option value="card">Cartas</option>
                        <option value="deck">Decks</option>
                        <option value="commander-tech">Techs</option>
                        <option value="user">Jugadores</option>
                        <option value="discussion">Discusiones</option>
                    </select>
                    <svg
                        class="select-arrow"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    >
                        <polyline points="6 9 12 15 18 9" />
                    </svg>
                </div>
                <input type="text" placeholder="Buscar en Spain cEDH..." class="search-input" />
                <button class="search-submit" title="Buscar">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2.2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    >
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                </button>
            </div>
        </div>

        <div class="profile-section">
            <div class="profile-inner">
                <div class="profile-content">
                    <div class="avatar-wrap">
                        <img src="../assets/images/avatar.jpg" alt="Avatar" />
                    </div>
                    <span class="profile-label">Mi perfil</span>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
@media (prefers-color-scheme: dark) {
    #header-search-bar {
        --bg: #1a1b2e;
        --txt: #e8e6f0;
        --txt-muted: rgba(232, 230, 240, 0.45);
        --border: rgba(232, 230, 240, 0.18);
        --input-bg: #2a2b42;
        --accent: #534ab7;
        --accent-hover: #3c3489;
        --accent-text: #eeedfe;
        --accent-muted: #afa9ec;
        --focus-ring: rgba(83, 74, 183, 0.28);
    }
}
@media (prefers-color-scheme: light) {
    #header-search-bar {
        --bg: #f4f0eb;
        --txt: #3a3541;
        --txt-muted: rgba(58, 53, 65, 0.45);
        --border: rgba(58, 53, 65, 0.2);
        --input-bg: #ffffff;
        --accent: #534ab7;
        --accent-hover: #3c3489;
        --accent-text: #eeedfe;
        --accent-muted: #afa9ec;
        --focus-ring: rgba(83, 74, 183, 0.2);
    }
}

#header-search-bar {
    display: flex;
    align-items: stretch;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background-color: var(--bg);
    border-bottom: 0.5px solid var(--border);
    box-sizing: border-box;
    font-family: inherit;
}

.brand-section {
    display: flex;
    align-items: center;
    flex-shrink: 0;
}
.brand-inner {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 0 36px 0 216px;
    background: var(--accent);
    transform: skewX(-18deg);
    transform-origin: bottom left;
    translate: -218px 0;
    min-width: 130px;
    cursor: pointer;
    transition: background 0.2s;
}
.brand-inner:hover {
    background: var(--accent-hover);
}
.brand-content {
    transform: skewX(18deg);
    translate: 18px 0;
    display: flex;
    align-items: center;
    gap: 10px;
}
.logo-wrap {
    width: 32px;
    height: 32px;
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    overflow: hidden;
    flex-shrink: 0;
}
.logo-wrap img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}
.brand-text {
    display: flex;
    flex-direction: column;
    line-height: 1.15;
}
.brand-name {
    font-size: 13px;
    font-weight: 500;
    color: var(--accent-text);
    white-space: nowrap;
    letter-spacing: 0.02em;
}
.brand-sub {
    font-size: 10px;
    color: var(--accent-muted);
    text-transform: uppercase;
    letter-spacing: 0.07em;
    white-space: nowrap;
}

.search-zone {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 12px;
}
.search-wrap {
    display: flex;
    align-items: center;
    width: 100%;
    max-width: 620px;
    height: 38px;
    background: var(--input-bg);
    border: 0.5px solid var(--border);
    border-radius: 4px;
    overflow: hidden;
    transition:
        border-color 0.2s,
        box-shadow 0.2s;
}
.search-wrap:focus-within {
    border-color: var(--accent);
    box-shadow: 0 0 0 2px var(--focus-ring);
}
.select-wrap {
    position: relative;
    display: flex;
    align-items: center;
    flex-shrink: 0;
    border-right: 0.5px solid var(--border);
}
.search-filter {
    background: transparent;
    border: none;
    color: var(--txt);
    font-size: 12px;
    font-weight: 500;
    padding: 0 28px 0 12px;
    height: 38px;
    cursor: pointer;
    outline: none;
    -webkit-appearance: none;
    appearance: none;
}
.select-arrow {
    position: absolute;
    right: 8px;
    width: 10px;
    height: 10px;
    color: var(--txt-muted);
    pointer-events: none;
}
.search-input {
    flex: 1;
    background: transparent;
    border: none;
    color: var(--txt);
    font-size: 13px;
    padding: 0 12px;
    outline: none;
}
.search-input::placeholder {
    color: var(--txt-muted);
    font-size: 12px;
}
.search-submit {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    flex-shrink: 0;
    background: var(--accent);
    border: none;
    cursor: pointer;
    color: var(--accent-text);
    transition:
        background 0.15s,
        transform 0.15s;
    border-radius: 0;
}
.search-submit:hover {
    background: var(--accent-hover);
}
.search-submit:active {
    transform: scale(0.9);
}

.profile-section {
    display: flex;
    align-items: center;
    flex-shrink: 0;
}
.profile-inner {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 0 216px 0 36px;
    background: var(--accent);
    transform: skewX(18deg);
    transform-origin: bottom right;
    translate: 218px 0;
    cursor: pointer;
    transition: background 0.15s;
}
.profile-inner:hover {
    background: var(--accent-hover);
}
.profile-content {
    transform: skewX(-18deg);
    translate: -18px 0;
    display: flex;
    align-items: center;
    gap: 9px;
}
.avatar-wrap {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 1.5px solid rgba(255, 255, 255, 0.25);
    overflow: hidden;
    flex-shrink: 0;
}
.avatar-wrap img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}
.profile-label {
    font-size: 12px;
    font-weight: 500;
    color: var(--accent-text);
    white-space: nowrap;
}

@media (max-width: 768px) {
    .brand-section {
        display: none;
    }
    .profile-label {
        display: none;
    }
    .search-zone {
        padding: 0 8px;
    }
}
</style>
