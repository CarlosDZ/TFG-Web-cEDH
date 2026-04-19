import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createRouter, createMemoryHistory } from "vue-router";
import SearchResultsView from "./SearchResultsView.vue";

vi.mock("../services/searchService", () => ({
  searchDiscusiones: vi.fn(),
  searchDecks: vi.fn(),
  searchTechsFiltered: vi.fn(),
}));
vi.mock("../components/headerSearchBar.component.vue", () => ({
  default: { template: "<div/>" },
}));
vi.mock("../components/sectionNavMenu.component.vue", () => ({
  default: { template: "<div/>" },
}));
vi.mock("../components/commanderTechs/commanderTechDetail.vue", () => ({
  default: {
    props: ["tech"],
    emits: ["close"],
    template:
      '<div class="tech-detail-modal" @click="$emit(\'close\')">{{ tech._id }}</div>',
  },
}));

import {
  searchDiscusiones,
  searchDecks,
  searchTechsFiltered,
} from "../services/searchService";

const TECH_RESULTS = [
  {
    _id: "t1",
    title: "Tech Tymna Thrasios",
    commander: ["Tymna the Weaver", "Thrasios, Triton Hero"],
    pickup_lane: "Análisis completo del par.",
    likes: 5,
    lastChangeDate: "2024-01-01",
    authorId: { username: "testuser" },
  },
];

const DECK_RESULTS = [
  {
    _id: "d1",
    title: "Turbo Naus Build",
    commander: ["Tymna the Weaver"],
    color_identity: "WB",
    likes: 12,
    authorId: { username: "deckbuilder" },
  },
];

const DISCUSSION_RESULTS = [
  {
    _id: "c1",
    title: "¿Cuándo jugar Thassa Oracle?",
    markdown_text: "Esta es una discusión sobre Thassa Oracle.",
    likes: 3,
    replyCount: 7,
    createdAt: "2024-03-15",
    authorId: { username: "discusser" },
  },
];

async function mountView(type, query = {}) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: "/busqueda/:type", component: SearchResultsView }],
  });
  router.push({ path: `/busqueda/${type}`, query });
  await router.isReady();
  const wrapper = mount(SearchResultsView, { global: { plugins: [router] } });
  await flushPromises();
  return wrapper;
}

beforeEach(() => {
  searchDiscusiones.mockReset().mockResolvedValue([]);
  searchDecks.mockReset().mockResolvedValue([]);
  searchTechsFiltered.mockReset().mockResolvedValue([]);
});

// ── Techs ─────────────────────────────────────────────────────────────────────

describe("SearchResultsView — techs", () => {
  it("llama a searchTechsFiltered con title de la URL", async () => {
    searchTechsFiltered.mockResolvedValue(TECH_RESULTS);
    await mountView("techs", { title: "Tymna" });
    expect(searchTechsFiltered).toHaveBeenCalledWith({
      title: "Tymna",
      cards: [],
    });
  });

  it("llama a searchTechsFiltered con cards[] de la URL", async () => {
    searchTechsFiltered.mockResolvedValue(TECH_RESULTS);
    await mountView("techs", {
      cards: ["Tymna the Weaver", "Thrasios, Triton Hero"],
    });
    expect(searchTechsFiltered).toHaveBeenCalledWith({
      title: "",
      cards: ["Tymna the Weaver", "Thrasios, Triton Hero"],
    });
  });

  it("llama a searchTechsFiltered con title y cards simultáneamente (AND)", async () => {
    searchTechsFiltered.mockResolvedValue(TECH_RESULTS);
    await mountView("techs", { title: "Turbo", cards: ["Tymna the Weaver"] });
    expect(searchTechsFiltered).toHaveBeenCalledWith({
      title: "Turbo",
      cards: ["Tymna the Weaver"],
    });
  });

  it("renderiza el badge 'Techs'", async () => {
    searchTechsFiltered.mockResolvedValue(TECH_RESULTS);
    const wrapper = await mountView("techs", { title: "Tymna" });
    expect(wrapper.find(".type-badge").text()).toBe("Techs");
  });

  it("renderiza title como card-title y commander como subtítulo", async () => {
    searchTechsFiltered.mockResolvedValue(TECH_RESULTS);
    const wrapper = await mountView("techs", { title: "Tymna" });
    expect(wrapper.find(".card-title").text()).toBe("Tech Tymna Thrasios");
    expect(wrapper.find(".card-commanders").text()).toBe(
      "Tymna the Weaver / Thrasios, Triton Hero",
    );
  });

  it("renderiza el extracto pickup_lane si existe", async () => {
    searchTechsFiltered.mockResolvedValue(TECH_RESULTS);
    const wrapper = await mountView("techs", { title: "Tymna" });
    expect(wrapper.find(".card-excerpt").text()).toContain("Análisis completo");
  });

  it("muestra mensaje 'sin resultados' cuando la búsqueda devuelve vacío", async () => {
    searchTechsFiltered.mockResolvedValue([]);
    const wrapper = await mountView("techs", { title: "xyzxyz" });
    expect(wrapper.text()).toContain("No se encontraron resultados");
  });

  it("no muestra el switcher título/comandante para techs", async () => {
    searchTechsFiltered.mockResolvedValue(TECH_RESULTS);
    const wrapper = await mountView("techs", { title: "Tymna" });
    expect(wrapper.find(".by-switcher").exists()).toBe(false);
  });
});

// ── Decks ─────────────────────────────────────────────────────────────────────

describe("SearchResultsView — decks", () => {
  it("llama a searchDecks con query y by=title por defecto", async () => {
    searchDecks.mockResolvedValue(DECK_RESULTS);
    await mountView("decks", { q: "Turbo Naus" });
    expect(searchDecks).toHaveBeenCalledWith("Turbo Naus", "title");
  });

  it("llama a searchDecks con by=commander cuando la URL lo indica", async () => {
    searchDecks.mockResolvedValue(DECK_RESULTS);
    await mountView("decks", { q: "Tymna", by: "commander" });
    expect(searchDecks).toHaveBeenCalledWith("Tymna", "commander");
  });

  it("renderiza el badge 'Decks'", async () => {
    searchDecks.mockResolvedValue(DECK_RESULTS);
    const wrapper = await mountView("decks", { q: "Turbo Naus" });
    expect(wrapper.find(".type-badge").text()).toBe("Decks");
  });

  it("muestra el switcher título/comandante solo para decks", async () => {
    searchDecks.mockResolvedValue(DECK_RESULTS);
    const wrapper = await mountView("decks", { q: "Turbo Naus" });
    expect(wrapper.find(".by-switcher").exists()).toBe(true);
  });

  it("renderiza el título del deck", async () => {
    searchDecks.mockResolvedValue(DECK_RESULTS);
    const wrapper = await mountView("decks", { q: "Turbo Naus" });
    expect(wrapper.find(".card-title").text()).toBe("Turbo Naus Build");
  });

  it("no llama a searchDecks si la query tiene menos de 2 caracteres", async () => {
    await mountView("decks", { q: "T" });
    expect(searchDecks).not.toHaveBeenCalled();
  });
});

// ── Discusiones ───────────────────────────────────────────────────────────────

describe("SearchResultsView — discusiones", () => {
  it("llama a searchDiscusiones con la query", async () => {
    searchDiscusiones.mockResolvedValue(DISCUSSION_RESULTS);
    await mountView("discusiones", { q: "Thassa" });
    expect(searchDiscusiones).toHaveBeenCalledWith("Thassa");
  });

  it("renderiza el título de la discusión", async () => {
    searchDiscusiones.mockResolvedValue(DISCUSSION_RESULTS);
    const wrapper = await mountView("discusiones", { q: "Thassa" });
    expect(wrapper.find(".card-title").text()).toContain("Thassa Oracle");
  });

  it("no muestra el switcher para discusiones", async () => {
    searchDiscusiones.mockResolvedValue(DISCUSSION_RESULTS);
    const wrapper = await mountView("discusiones", { q: "Thassa" });
    expect(wrapper.find(".by-switcher").exists()).toBe(false);
  });

  it("no llama a searchDiscusiones si la query tiene menos de 2 caracteres", async () => {
    await mountView("discusiones", { q: "T" });
    expect(searchDiscusiones).not.toHaveBeenCalled();
  });
});

// ── Estado de error ───────────────────────────────────────────────────────────

describe("SearchResultsView — estado de error", () => {
  it("muestra el mensaje de error si searchTechsFiltered lanza excepción", async () => {
    searchTechsFiltered.mockRejectedValue(new Error("Fallo de red"));
    const wrapper = await mountView("techs", { title: "Tymna" });
    expect(wrapper.find(".state-error").exists()).toBe(true);
    expect(wrapper.text()).toContain("Fallo de red");
  });

  it("muestra el mensaje de error si searchDecks lanza excepción", async () => {
    searchDecks.mockRejectedValue(new Error("Timeout"));
    const wrapper = await mountView("decks", { q: "Turbo" });
    expect(wrapper.find(".state-error").exists()).toBe(true);
  });
});

// ── Modal de detalle de tech ──────────────────────────────────────────────────

describe("SearchResultsView — modal commanderTechDetail", () => {
  it("no muestra el modal antes de hacer click", async () => {
    searchTechsFiltered.mockResolvedValue(TECH_RESULTS);
    const wrapper = await mountView("techs", { title: "Tymna" });
    expect(wrapper.find(".tech-detail-modal").exists()).toBe(false);
  });

  it("muestra el modal al hacer click en un resultado tech", async () => {
    searchTechsFiltered.mockResolvedValue(TECH_RESULTS);
    const wrapper = await mountView("techs", { title: "Tymna" });
    await wrapper.find(".tech-card").trigger("click");
    await flushPromises();
    expect(wrapper.find(".tech-detail-modal").exists()).toBe(true);
    expect(wrapper.find(".tech-detail-modal").text()).toContain("t1");
  });

  it("cierra el modal al emitir close", async () => {
    searchTechsFiltered.mockResolvedValue(TECH_RESULTS);
    const wrapper = await mountView("techs", { title: "Tymna" });
    await wrapper.find(".tech-card").trigger("click");
    await flushPromises();
    await wrapper.find(".tech-detail-modal").trigger("click");
    await flushPromises();
    expect(wrapper.find(".tech-detail-modal").exists()).toBe(false);
  });
});
