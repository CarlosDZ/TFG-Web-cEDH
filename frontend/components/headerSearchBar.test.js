import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createRouter, createMemoryHistory } from "vue-router";
import headerSearchBar from "./headerSearchBar.component.vue";

// ── Mocks de servicios ────────────────────────────────────────────────────────

vi.mock("../services/scryfallService", () => ({
  autocompleteCards: vi.fn(),
}));
vi.mock("../services/userService", () => ({
  searchUsuarios: vi.fn(),
}));
vi.mock("../services/searchService", () => ({
  searchDiscusiones: vi.fn(),
  searchDecks: vi.fn(),
  searchTechs: vi.fn(),
}));

import { autocompleteCards } from "../services/scryfallService";
import { searchUsuarios } from "../services/userService";
import {
  searchDiscusiones,
  searchDecks,
  searchTechs,
} from "../services/searchService";

// Defaults seguros para todos los mocks — evita undefined en filtros no configurados
beforeEach(() => {
  autocompleteCards.mockResolvedValue([]);
  searchUsuarios.mockResolvedValue([]);
  searchDiscusiones.mockResolvedValue([]);
  searchDecks.mockResolvedValue([]);
  searchTechs.mockResolvedValue([]);
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [{ path: "/:pathMatch(.*)*", component: { template: "<div/>" } }],
  });
}

async function mountSearchBar(router) {
  const wrapper = mount(headerSearchBar, {
    global: { plugins: [router] },
    attachTo: document.body,
  });
  await flushPromises();
  return wrapper;
}

// Escribe en el input y espera a que el debounce + async terminen
async function typeAndWait(wrapper, text, ms = 850) {
  await wrapper.find(".search-input").setValue(text);
  await new Promise((r) => setTimeout(r, ms));
  await flushPromises();
}

// ── submitPath — rutas al enviar ──────────────────────────────────────────────

describe("submitPath — rutas de navegación al enviar", () => {
  let router, wrapper;

  beforeEach(async () => {
    router = makeRouter();
    wrapper = await mountSearchBar(router);
  });

  it("navega a /carta/:name para el filtro 'card'", async () => {
    await wrapper.find(".search-filter").setValue("card");
    await wrapper.find(".search-input").setValue("Lightning Bolt");
    await wrapper.find(".search-submit").trigger("click");
    await flushPromises();
    expect(router.currentRoute.value.path).toBe("/carta/Lightning%20Bolt");
  });

  it("navega a /jugador/:username para el filtro 'user'", async () => {
    await wrapper.find(".search-filter").setValue("user");
    await wrapper.find(".search-input").setValue("Tymna");
    await wrapper.find(".search-submit").trigger("click");
    await flushPromises();
    expect(router.currentRoute.value.path).toBe("/jugador/Tymna");
  });

  it("navega a /busqueda/discusiones?q= para el filtro 'discussion'", async () => {
    await wrapper.find(".search-filter").setValue("discussion");
    await wrapper.find(".search-input").setValue("combo");
    await wrapper.find(".search-submit").trigger("click");
    await flushPromises();
    expect(router.currentRoute.value.path).toBe("/busqueda/discusiones");
    expect(router.currentRoute.value.query.q).toBe("combo");
  });

  it("navega a /busqueda/decks?q=&by=title para el filtro 'deck'", async () => {
    await wrapper.find(".search-filter").setValue("deck");
    await wrapper.find(".search-input").setValue("Turbo Naus");
    await wrapper.find(".search-submit").trigger("click");
    await flushPromises();
    expect(router.currentRoute.value.path).toBe("/busqueda/decks");
    expect(router.currentRoute.value.query.q).toBe("Turbo Naus");
    expect(router.currentRoute.value.query.by).toBe("title");
  });

  it("navega a /busqueda/techs?q= para el filtro 'commander-tech'", async () => {
    await wrapper.find(".search-filter").setValue("commander-tech");
    await wrapper.find(".search-input").setValue("Thrasios");
    await wrapper.find(".search-submit").trigger("click");
    await flushPromises();
    expect(router.currentRoute.value.path).toBe("/busqueda/techs");
    expect(router.currentRoute.value.query.q).toBe("Thrasios");
  });

  it("no navega si la query está vacía", async () => {
    await wrapper.find(".search-input").setValue("");
    await wrapper.find(".search-submit").trigger("click");
    await flushPromises();
    expect(router.currentRoute.value.path).toBe("/");
  });
});

// ── Autocomplete: cartas ──────────────────────────────────────────────────────

describe("autocomplete — cartas (Scryfall)", () => {
  let router, wrapper;

  beforeEach(async () => {
    autocompleteCards.mockResolvedValue([
      "Lightning Bolt",
      "Lightning Axe",
      "Lightning Strike",
    ]);
    router = makeRouter();
    wrapper = await mountSearchBar(router);
    await wrapper.find(".search-filter").setValue("card");
  });

  it("muestra sugerencias de cartas tras el debounce", async () => {
    await typeAndWait(wrapper, "Lightning");
    const items = wrapper.findAll(".suggestion-item");
    expect(items.length).toBe(3);
    expect(items[0].text()).toContain("Lightning Bolt");
  });

  it("cada sugerencia enlaza a /carta/:name", async () => {
    await typeAndWait(wrapper, "Lightning");
    expect(wrapper.vm.suggestions[0].navigateTo).toBe(
      `/carta/${encodeURIComponent("Lightning Bolt")}`,
    );
  });

  it("no muestra sugerencias para query de 1 carácter", async () => {
    await typeAndWait(wrapper, "L");
    expect(wrapper.findAll(".suggestion-item").length).toBe(0);
  });

  it("oculta el dropdown si no hay resultados", async () => {
    autocompleteCards.mockResolvedValue([]);
    await typeAndWait(wrapper, "xyzxyz");
    expect(wrapper.find(".suggestions-dropdown").exists()).toBe(false);
  });
});

// ── Autocomplete: jugadores ───────────────────────────────────────────────────

describe("autocomplete — jugadores (backend)", () => {
  let router, wrapper;

  beforeEach(async () => {
    searchUsuarios.mockResolvedValue([
      { username: "Tymna_Player" },
      { username: "Tymna_Fan" },
    ]);
    router = makeRouter();
    wrapper = await mountSearchBar(router);
    await wrapper.find(".search-filter").setValue("user");
  });

  it("muestra sugerencias de usuarios", async () => {
    await typeAndWait(wrapper, "Tymna");
    const items = wrapper.findAll(".suggestion-item");
    expect(items.length).toBe(2);
    expect(items[0].text()).toContain("Tymna_Player");
  });

  it("cada sugerencia enlaza a /jugador/:username", async () => {
    await typeAndWait(wrapper, "Tymna");
    expect(wrapper.vm.suggestions[0].navigateTo).toBe(
      `/jugador/${encodeURIComponent("Tymna_Player")}`,
    );
  });
});

// ── Autocomplete: discusiones ─────────────────────────────────────────────────

describe("autocomplete — discusiones (backend)", () => {
  let router, wrapper;

  beforeEach(async () => {
    searchDiscusiones.mockResolvedValue([
      { title: "¿Cuándo jugar Thassa Oracle?" },
      { title: "Mejores cartas para Tymna" },
    ]);
    router = makeRouter();
    wrapper = await mountSearchBar(router);
    await wrapper.find(".search-filter").setValue("discussion");
  });

  it("muestra títulos de discusiones como sugerencias", async () => {
    await typeAndWait(wrapper, "Thassa");
    const items = wrapper.findAll(".suggestion-item");
    expect(items.length).toBe(2);
    expect(items[0].text()).toContain("Thassa Oracle");
  });

  it("cada sugerencia enlaza a /busqueda/discusiones?q=título", async () => {
    await typeAndWait(wrapper, "Thassa");
    expect(wrapper.vm.suggestions[0].navigateTo).toContain(
      "/busqueda/discusiones?q=",
    );
  });

  it("no tiene grupos etiquetados (group: null)", async () => {
    await typeAndWait(wrapper, "Thassa");
    expect(wrapper.vm.suggestions.every((s) => s.group === null)).toBe(true);
    expect(wrapper.findAll(".suggestion-group-label").length).toBe(0);
  });
});

// ── Autocomplete: decks (dos grupos) ─────────────────────────────────────────

describe("autocomplete — decks (título + commander)", () => {
  let router, wrapper;

  beforeEach(async () => {
    searchDecks.mockResolvedValue([
      { title: "Turbo Naus Build", commander: ["Tymna the Weaver"] },
    ]);
    autocompleteCards.mockResolvedValue([
      "Tymna the Weaver",
      "Thrasios, Triton Hero",
    ]);
    router = makeRouter();
    wrapper = await mountSearchBar(router);
    await wrapper.find(".search-filter").setValue("deck");
  });

  it("muestra sugerencias del grupo 'Por título'", async () => {
    await typeAndWait(wrapper, "Turbo");
    const byTitle = wrapper.vm.suggestions.filter(
      (s) => s.group === "Por título",
    );
    expect(byTitle.length).toBe(1);
    expect(byTitle[0].label).toBe("Turbo Naus Build");
  });

  it("el grupo 'Por título' enlaza con by=title", async () => {
    await typeAndWait(wrapper, "Turbo");
    const s = wrapper.vm.suggestions.find((s) => s.group === "Por título");
    expect(s.navigateTo).toContain("by=title");
  });

  it("muestra sugerencias del grupo 'Por comandante'", async () => {
    await typeAndWait(wrapper, "Tymna");
    const byCommander = wrapper.vm.suggestions.filter(
      (s) => s.group === "Por comandante",
    );
    expect(byCommander.length).toBe(2);
    expect(byCommander[0].label).toBe("Tymna the Weaver");
  });

  it("el grupo 'Por comandante' enlaza con by=commander", async () => {
    await typeAndWait(wrapper, "Tymna");
    const s = wrapper.vm.suggestions.find((s) => s.group === "Por comandante");
    expect(s.navigateTo).toContain("by=commander");
  });

  it("renderiza ambas etiquetas de grupo en el dropdown", async () => {
    await typeAndWait(wrapper, "Tymna");
    const labels = wrapper
      .findAll(".suggestion-group-label")
      .map((el) => el.text());
    expect(labels).toContain("Por título");
    expect(labels).toContain("Por comandante");
  });
});

// ── Autocomplete: techs (dos grupos) ─────────────────────────────────────────

describe("autocomplete — techs (base de datos + cartas)", () => {
  let router, wrapper;

  beforeEach(async () => {
    searchTechs.mockResolvedValue([
      { commander: ["Tymna the Weaver", "Thrasios, Triton Hero"] },
    ]);
    autocompleteCards.mockResolvedValue(["Tymna the Weaver"]);
    router = makeRouter();
    wrapper = await mountSearchBar(router);
    await wrapper.find(".search-filter").setValue("commander-tech");
  });

  it("muestra sugerencias del grupo 'En la base de datos'", async () => {
    await typeAndWait(wrapper, "Tymna");
    const inDb = wrapper.vm.suggestions.filter(
      (s) => s.group === "En la base de datos",
    );
    expect(inDb.length).toBe(1);
    expect(inDb[0].label).toBe("Tymna the Weaver / Thrasios, Triton Hero");
  });

  it("muestra sugerencias del grupo 'Buscar por carta'", async () => {
    await typeAndWait(wrapper, "Tymna");
    const byCommander = wrapper.vm.suggestions.filter(
      (s) => s.group === "Buscar por carta",
    );
    expect(byCommander.length).toBe(1);
    expect(byCommander[0].label).toBe("Tymna the Weaver");
  });

  it("ambos grupos enlazan a /busqueda/techs", async () => {
    await typeAndWait(wrapper, "Tymna");
    expect(
      wrapper.vm.suggestions.every((s) =>
        s.navigateTo.startsWith("/busqueda/techs"),
      ),
    ).toBe(true);
  });
});

// ── Cambio de filtro ──────────────────────────────────────────────────────────

describe("cambio de filtro limpia las sugerencias", () => {
  let router, wrapper;

  beforeEach(async () => {
    autocompleteCards.mockResolvedValue(["Lightning Bolt"]);
    router = makeRouter();
    wrapper = await mountSearchBar(router);
  });

  it("al cambiar el filtro desaparece el dropdown", async () => {
    await wrapper.find(".search-filter").setValue("card");
    await typeAndWait(wrapper, "Lightning");
    expect(wrapper.vm.suggestions.length).toBeGreaterThan(0);

    await wrapper.find(".search-filter").setValue("user");
    await flushPromises();
    expect(wrapper.vm.suggestions.length).toBe(0);
    expect(wrapper.find(".suggestions-dropdown").exists()).toBe(false);
  });
});

// ── Navegación por teclado ────────────────────────────────────────────────────

describe("navegación por teclado", () => {
  let router, wrapper;

  beforeEach(async () => {
    autocompleteCards.mockResolvedValue([
      "Lightning Bolt",
      "Lightning Axe",
      "Lightning Strike",
    ]);
    router = makeRouter();
    wrapper = await mountSearchBar(router);
    await wrapper.find(".search-filter").setValue("card");
    await typeAndWait(wrapper, "Lightning");
  });

  it("ArrowDown mueve el highlight hacia abajo", async () => {
    const input = wrapper.find(".search-input");
    await input.trigger("keydown", { key: "ArrowDown" });
    expect(wrapper.vm.highlightedIndex).toBe(0);
    await input.trigger("keydown", { key: "ArrowDown" });
    expect(wrapper.vm.highlightedIndex).toBe(1);
  });

  it("ArrowUp no baja de -1", async () => {
    const input = wrapper.find(".search-input");
    await input.trigger("keydown", { key: "ArrowUp" });
    expect(wrapper.vm.highlightedIndex).toBe(-1);
  });

  it("ArrowDown no supera el último índice", async () => {
    const input = wrapper.find(".search-input");
    for (let i = 0; i < 10; i++)
      await input.trigger("keydown", { key: "ArrowDown" });
    expect(wrapper.vm.highlightedIndex).toBe(wrapper.vm.suggestions.length - 1);
  });

  it("Escape cierra el dropdown", async () => {
    const input = wrapper.find(".search-input");
    await input.trigger("keydown", { key: "ArrowDown" });
    await input.trigger("keydown", { key: "Escape" });
    expect(wrapper.vm.showSuggestions).toBe(false);
    expect(wrapper.vm.highlightedIndex).toBe(-1);
  });

  it("Enter con sugerencia destacada navega a esa sugerencia", async () => {
    const input = wrapper.find(".search-input");
    await input.trigger("keydown", { key: "ArrowDown" });
    await input.trigger("keydown", { key: "Enter" });
    await flushPromises();
    expect(router.currentRoute.value.path).toBe(
      `/carta/${encodeURIComponent("Lightning Bolt")}`,
    );
  });
});

// ── Click en sugerencia ───────────────────────────────────────────────────────

describe("click en sugerencia", () => {
  let router, wrapper;

  beforeEach(async () => {
    autocompleteCards.mockResolvedValue(["Lightning Bolt", "Lightning Axe"]);
    router = makeRouter();
    wrapper = await mountSearchBar(router);
    await wrapper.find(".search-filter").setValue("card");
    await typeAndWait(wrapper, "Lightning");
  });

  it("navega a la ruta de la sugerencia al hacer click", async () => {
    await wrapper.findAll(".suggestion-item")[0].trigger("click");
    await flushPromises();
    expect(router.currentRoute.value.path).toBe(
      `/carta/${encodeURIComponent("Lightning Bolt")}`,
    );
  });

  it("cierra el dropdown tras el click", async () => {
    await wrapper.findAll(".suggestion-item")[0].trigger("click");
    await flushPromises();
    expect(wrapper.vm.showSuggestions).toBe(false);
  });

  it("actualiza el texto del input con el label de la sugerencia", async () => {
    await wrapper.findAll(".suggestion-item")[0].trigger("click");
    expect(wrapper.vm.searchQuery).toBe("Lightning Bolt");
  });
});
