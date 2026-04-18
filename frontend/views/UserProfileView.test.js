import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createRouter, createMemoryHistory } from "vue-router";
import UserProfileView from "./UserProfileView.vue";

// ── Mocks de servicios ────────────────────────────────────────────────────────

vi.mock("../services/userService", () => ({
  getUsuarioPorNombre: vi.fn(),
}));
vi.mock("../services/decklistService", () => ({
  getDecklistsByUser: vi.fn(),
}));
vi.mock("../services/commanderTechService", () => ({
  getCommanderTechsByUser: vi.fn(),
}));
vi.mock("../services/discussionService", () => ({
  getDiscusionesByUser: vi.fn(),
}));

import { getUsuarioPorNombre } from "../services/userService";
import { getDecklistsByUser } from "../services/decklistService";
import { getCommanderTechsByUser } from "../services/commanderTechService";
import { getDiscusionesByUser } from "../services/discussionService";

// ── Datos de prueba ───────────────────────────────────────────────────────────

const BASE_USER = {
  _id: "000000000000000000000001",
  username: "tymna_player",
  bio: "Jugador de cEDH desde 2019.",
  createdAt: "2019-06-15T00:00:00.000Z",
  isVerified: false,
};

const VERIFIED_USER = { ...BASE_USER, isVerified: true };

const FAKE_DECKS = [
  {
    _id: "aaa000000000000000000001",
    title: "Tymna Thrasios",
    commander: ["Tymna the Weaver", "Thrasios, Triton Hero"],
    description: "Stax competitivo.",
    color_identity: "WUB",
    likes: 12,
    tags: ["stax"],
    createdAt: "2023-01-10T00:00:00.000Z",
    authorId: { username: "tymna_player" },
  },
];

const FAKE_TECHS = [
  {
    _id: "bbb000000000000000000001",
    title: "Cómo usar Thassa Oracle",
    commander: ["Tymna the Weaver"],
    pickup_lane: "Ejecuta la combo en el turno 3.",
    likes: 5,
    lastChangeDate: "2023-03-01T00:00:00.000Z",
    authorId: { username: "tymna_player" },
  },
];

const FAKE_DISCUSSIONS = [
  {
    _id: "ccc000000000000000000001",
    title: "Mejores cartas para stax",
    markdown_text: "Hablemos de las mejores piezas de stax en 2024.",
    likes: 3,
    replyCount: 7,
    createdAt: "2023-05-20T00:00:00.000Z",
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeRouter(username = "tymna_player") {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: "/jugador/:username",
        component: UserProfileView,
      },
      { path: "/:pathMatch(.*)*", component: { template: "<div/>" } },
    ],
  });
}

const STUBS = {
  headersSearchBar: { template: "<div/>" },
  sectionNavMenu: { template: "<div/>" },
  DeckCard: {
    template: '<div class="deck-card-stub">{{ deck.title }}</div>',
    props: ["deck"],
  },
  CommanderTechCard: {
    template:
      '<div class="tech-card-stub" @click="$emit(\'open\', tech)">{{ tech.title }}</div>',
    props: ["tech"],
    emits: ["open"],
  },
  CommanderTechDetail: {
    template: '<div class="tech-detail-stub"/>',
    props: ["tech"],
    emits: ["close"],
  },
};

async function mountView(username = "tymna_player") {
  const router = makeRouter(username);
  await router.push(`/jugador/${username}`);
  const wrapper = mount(UserProfileView, {
    global: { plugins: [router], stubs: STUBS },
  });
  await flushPromises();
  return wrapper;
}

// ── Setup por defecto ─────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  getUsuarioPorNombre.mockResolvedValue(BASE_USER);
  getDecklistsByUser.mockResolvedValue(FAKE_DECKS);
  getCommanderTechsByUser.mockResolvedValue(FAKE_TECHS);
  getDiscusionesByUser.mockResolvedValue(FAKE_DISCUSSIONS);
});

// ── Tests: estado de carga ────────────────────────────────────────────────────

describe("estado de carga", () => {
  it("muestra el spinner mientras carga", async () => {
    getUsuarioPorNombre.mockReturnValue(new Promise(() => {}));
    const router = makeRouter();
    await router.push("/jugador/tymna_player");
    const wrapper = mount(UserProfileView, {
      global: { plugins: [router], stubs: STUBS },
    });
    expect(wrapper.find(".spinner").exists()).toBe(true);
    expect(wrapper.text()).toContain("Cargando perfil");
  });

  it("muestra el error cuando la carga falla", async () => {
    getUsuarioPorNombre.mockRejectedValue(new Error("Usuario no encontrado"));
    const wrapper = await mountView("fantasma");
    expect(wrapper.find(".state-msg.error").exists()).toBe(true);
    expect(wrapper.text()).toContain("Usuario no encontrado");
  });
});

// ── Tests: datos del perfil ───────────────────────────────────────────────────

describe("datos del perfil", () => {
  it("muestra el username del usuario", async () => {
    const wrapper = await mountView();
    expect(wrapper.find(".username").text()).toBe("tymna_player");
  });

  it("muestra la bio del usuario", async () => {
    const wrapper = await mountView();
    expect(wrapper.find(".bio-text").text()).toContain("Jugador de cEDH");
  });

  it("no muestra la sección bio si el usuario no tiene bio", async () => {
    getUsuarioPorNombre.mockResolvedValue({ ...BASE_USER, bio: "" });
    const wrapper = await mountView();
    expect(wrapper.find(".bio-section").exists()).toBe(false);
  });

  it("muestra la fecha de registro", async () => {
    const wrapper = await mountView();
    expect(wrapper.find(".join-date").text()).toContain("2019");
  });
});

// ── Tests: badge verificado ───────────────────────────────────────────────────

describe("badge de verificación", () => {
  it("muestra el badge verificado cuando isVerified=true", async () => {
    getUsuarioPorNombre.mockResolvedValue(VERIFIED_USER);
    const wrapper = await mountView();
    expect(wrapper.find(".verified-badge").exists()).toBe(true);
    expect(wrapper.find(".verified-badge").text()).toContain("Verificado");
  });

  it("no muestra el badge cuando isVerified=false", async () => {
    const wrapper = await mountView();
    expect(wrapper.find(".verified-badge").exists()).toBe(false);
  });
});

// ── Tests: sección decks ──────────────────────────────────────────────────────

describe("sección decks públicos", () => {
  it("renderiza una DeckCard por cada deck del usuario", async () => {
    const wrapper = await mountView();
    const cards = wrapper.findAll(".deck-card-stub");
    expect(cards.length).toBe(FAKE_DECKS.length);
    expect(cards[0].text()).toContain("Tymna Thrasios");
  });

  it("llama a getDecklistsByUser con el id del usuario", async () => {
    await mountView();
    expect(getDecklistsByUser).toHaveBeenCalledWith(BASE_USER._id);
  });

  it("muestra mensaje vacío cuando no hay decks", async () => {
    getDecklistsByUser.mockResolvedValue([]);
    const wrapper = await mountView();
    const sections = wrapper.findAll(".content-section");
    expect(sections[0].text()).toContain("no tiene decks públicos");
  });

  it("muestra el contador de decks en el título de sección", async () => {
    const wrapper = await mountView();
    const count = wrapper.findAll(".section-count")[0];
    expect(count.text()).toBe(String(FAKE_DECKS.length));
  });
});

// ── Tests: sección commander techs ───────────────────────────────────────────

describe("sección commander techs", () => {
  it("renderiza una CommanderTechCard por cada tech del usuario", async () => {
    const wrapper = await mountView();
    const cards = wrapper.findAll(".tech-card-stub");
    expect(cards.length).toBe(FAKE_TECHS.length);
    expect(cards[0].text()).toContain("Cómo usar Thassa Oracle");
  });

  it("llama a getCommanderTechsByUser con el id del usuario", async () => {
    await mountView();
    expect(getCommanderTechsByUser).toHaveBeenCalledWith(BASE_USER._id);
  });

  it("muestra mensaje vacío cuando no hay techs", async () => {
    getCommanderTechsByUser.mockResolvedValue([]);
    const wrapper = await mountView();
    const sections = wrapper.findAll(".content-section");
    expect(sections[1].text()).toContain("no ha publicado ninguna tech");
  });

  it("abre CommanderTechDetail al emitir 'open' desde una tech card", async () => {
    const wrapper = await mountView();
    expect(wrapper.find(".tech-detail-stub").exists()).toBe(false);
    await wrapper.find(".tech-card-stub").trigger("click");
    await flushPromises();
    expect(wrapper.find(".tech-detail-stub").exists()).toBe(true);
  });
});

// ── Tests: sección discusiones ────────────────────────────────────────────────

describe("sección discusiones", () => {
  it("renderiza una tarjeta por cada discusión del usuario", async () => {
    const wrapper = await mountView();
    const cards = wrapper.findAll(".discussion-card");
    expect(cards.length).toBe(FAKE_DISCUSSIONS.length);
  });

  it("muestra el título de la discusión", async () => {
    const wrapper = await mountView();
    expect(wrapper.find(".discussion-title").text()).toContain(
      "Mejores cartas para stax",
    );
  });

  it("muestra el preview del texto de la discusión", async () => {
    const wrapper = await mountView();
    expect(wrapper.find(".discussion-preview").text()).toContain(
      "Hablemos de las mejores piezas",
    );
  });

  it("llama a getDiscusionesByUser con el id del usuario", async () => {
    await mountView();
    expect(getDiscusionesByUser).toHaveBeenCalledWith(BASE_USER._id);
  });

  it("muestra mensaje vacío cuando no hay discusiones", async () => {
    getDiscusionesByUser.mockResolvedValue([]);
    const wrapper = await mountView();
    const sections = wrapper.findAll(".content-section");
    expect(sections[2].text()).toContain("no ha iniciado ninguna discusión");
  });

  it("muestra el contador de replies", async () => {
    const wrapper = await mountView();
    const metaItems = wrapper.findAll(".meta-item");
    expect(metaItems.some((el) => el.text().includes("7"))).toBe(true);
  });
});

// ── Tests: carga de datos ─────────────────────────────────────────────────────

describe("carga de datos", () => {
  it("carga los tres recursos en paralelo al montar", async () => {
    await mountView();
    expect(getDecklistsByUser).toHaveBeenCalledTimes(1);
    expect(getCommanderTechsByUser).toHaveBeenCalledTimes(1);
    expect(getDiscusionesByUser).toHaveBeenCalledTimes(1);
  });

  it("recarga el perfil al cambiar el parámetro username en la ruta", async () => {
    const router = makeRouter();
    await router.push("/jugador/tymna_player");
    const wrapper = mount(UserProfileView, {
      global: { plugins: [router], stubs: STUBS },
    });
    await flushPromises();

    getUsuarioPorNombre.mockResolvedValue({
      ...BASE_USER,
      username: "otro_jugador",
    });
    await router.push("/jugador/otro_jugador");
    await flushPromises();

    expect(getUsuarioPorNombre).toHaveBeenCalledTimes(2);
    expect(getUsuarioPorNombre).toHaveBeenLastCalledWith("otro_jugador");
  });
});
