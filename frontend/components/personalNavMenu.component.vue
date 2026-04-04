<script setup>
import { authState } from "../utils/auth";
import { ref } from "vue";
const auth = authState();

import { usePanelState } from "../composables/usePanelState";

const { isPanelOpen } = usePanelState();

function togglePanel() {
    isPanelOpen.value = !isPanelOpen.value;
}
</script>

<template>
    <div id="mainContainer-personalNavMenu" :class="{ open: isPanelOpen }">
        <div class="tab" @click="togglePanel">
            <span class="tab-arrow" />
        </div>

        <div class="panel-content" v-if="!auth.isLogged">
            <div class="guest-area">
                <div class="guest-icon">
                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    >
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                    </svg>
                </div>
                <p class="guest-title">Modo invitado</p>
                <p class="guest-sub">Inicia sesión para ver tu área personal</p>
                <RouterLink to="/login">
                    <button class="auth-btn primary">Iniciar sesión</button>
                </RouterLink>
                <RouterLink to="/register">
                    <button class="auth-btn">Crear cuenta</button>
                </RouterLink>
            </div>
        </div>

        <div class="panel-content" v-else>
            <span class="section-label">Mi área</span>
            <RouterLink to="/mis-decks">
                <button class="nav-btn">
                    <span class="icon">
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="1.5"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        >
                            <rect x="2" y="3" width="8" height="8" rx="1" />
                            <rect x="14" y="3" width="8" height="8" rx="1" />
                            <rect x="2" y="13" width="8" height="8" rx="1" />
                            <rect x="14" y="13" width="8" height="8" rx="1" />
                        </svg>
                    </span>
                    Mis decks
                </button>
            </RouterLink>
            <RouterLink to="/mis-commandertech">
                <button class="nav-btn">
                    <span class="icon">
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="1.5"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        >
                            <path d="M12 2L2 7l10 5 10-5-10-5z" />
                            <path d="M2 17l10 5 10-5" />
                            <path d="M2 12l10 5 10-5" />
                        </svg>
                    </span>
                    Commander techs
                </button>
            </RouterLink>

            <div class="divider" />
            <span class="section-label">Comunidad</span>

            <RouterLink to="/mis-discusiones">
                <button class="nav-btn">
                    <span class="icon">
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="1.5"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        >
                            <path
                                d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                            />
                        </svg>
                    </span>
                    Mis discusiones
                </button>
            </RouterLink>
            <RouterLink to="/mis-torneos-pendientes">
                <button class="nav-btn">
                    <span class="icon">
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="1.5"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        >
                            <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
                        </svg>
                    </span>
                    Próximos torneos
                </button>
            </RouterLink>
        </div>
    </div>
</template>

<style scoped>
#mainContainer-personalNavMenu {
    --border: color-mix(in srgb, var(--txt-color) 20%, transparent);
    --hover-bg: color-mix(in srgb, var(--txt-color) 10%, transparent);
    --muted: color-mix(in srgb, var(--txt-color) 50%, transparent);

    height: 90%;
    width: 220px;
    top: 50%;
    right: 0;
    position: absolute;
    background: var(--background-color);
    border: 1px solid var(--border);
    border-right: none;
    border-radius: 16px 0 0 16px;
    display: flex;
    z-index: 999;
    transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    transform: translateY(-50%) translateX(0);
}

#mainContainer-personalNavMenu:not(.open) {
    transform: translateY(-50%) translateX(100%);

    .panel-content {
        opacity: 0;
        transform: translateX(16px);
    }
}

.tab {
    position: absolute;
    left: -29px;
    top: 50%;
    transform: translateY(-50%);
    width: 29px;
    height: 64px;
    background: var(--background-color);
    border: 1px solid var(--border);
    border-right: none;
    border-radius: 10px 0 0 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    user-select: none;
}

.tab-arrow {
    width: 9px;
    height: 9px;
    border-top: 2px solid var(--txt-color);
    border-right: 2px solid var(--txt-color);
    transition: transform 0.4s ease;
    transform: rotate(45deg);
}

#mainContainer-personalNavMenu:not(.open) .tab-arrow {
    transform: rotate(-135deg);
}

.panel-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 1rem 0.875rem;
    gap: 2px;
    overflow-y: auto;
    transition:
        opacity 0.3s ease,
        transform 0.4s ease;
}

.section-label {
    font-size: 10px;
    font-weight: 500;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding: 6px 10px 2px;
}

.divider {
    height: 1px;
    background: var(--border);
    margin: 6px 10px;
}

a {
    text-decoration: none;
}

.nav-btn {
    display: flex;
    align-items: center;
    gap: 10px;
    background: none;
    border: none;
    border-radius: 10px;
    padding: 8px 10px;
    cursor: pointer;
    width: 100%;
    text-align: left;
    font-size: 13px;
    font-weight: 400;
    color: var(--txt-color);
    transition: background 0.15s;
}

.nav-btn:hover {
    background: var(--hover-bg);
}

.icon {
    width: 30px;
    height: 30px;
    border-radius: 8px;
    background: var(--hover-bg);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.icon svg {
    width: 15px;
    height: 15px;
    stroke: var(--muted);
}

/* --- Estado invitado --- */

.guest-area {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    text-align: center;
}

.guest-icon {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: var(--hover-bg);
    display: flex;
    align-items: center;
    justify-content: center;
}

.guest-icon svg {
    width: 22px;
    height: 22px;
    stroke: var(--muted);
}

.guest-title {
    margin: 0;
    font-size: 13px;
    font-weight: 500;
    color: var(--txt-color);
}

.guest-sub {
    margin: 0;
    font-size: 11px;
    color: var(--muted);
    line-height: 1.5;
}

.auth-btn {
    width: 100%;
    padding: 8px 0;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: transparent;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    color: var(--txt-color);
    transition: background 0.15s;
}

.auth-btn:hover {
    background: var(--hover-bg);
}

.auth-btn.primary {
    background: var(--hover-bg);
    border-color: var(--muted);
}

.auth-btn.primary:hover {
    background: color-mix(in srgb, var(--txt-color) 18%, transparent);
}
</style>
