import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createRouter, createMemoryHistory } from "vue-router";
import UsersView from "./UsersView.vue";

// ── Mocks de servicios ────────────────────────────────────────────────────────

vi.mock("../services/userService", () => ({
  getAllUsuarios: vi.fn(),
}));

import { getAllUsuarios } from "../services/userService";

// ── Datos de prueba ───────────────────────────────────────────────────────────

function makeUser(overrides = {}) {
  return {
    _id: "000000000000000000000001",
    username: "jugador_uno",
    bio: "Jugador competitivo.",
    createdAt: "2020-03-10T00:00:00.000Z",
    isVerified: false,
    ...overrides,
  };
}

const FAKE_RESPONSE_PAGE1 = {
  usuarios: [
    makeUser({ _id: "000000000000000000000001", username: "jugador_uno" }),
    makeUser({
      _id: "000000000000000000000002",
      username: "jugador_dos",
      isVerified: true,
    }),
    makeUser({
      _id: "000000000000000000000003",
      username: "jugador_tres",
      bio: "",
    }),
  ],
  total: 3,
  page: 1,
  pages: 1,
};

const FAKE_RESPONSE_MULTIPAGE = {
  usuarios: [makeUser()],
  total: 25,
  page: 1,
  pages: 2,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const STUBS = {
  headersSearchBar: { template: "<div/>" },
  sectionNavMenu: { template: "<div/>" },
};

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: "/jugadores", component: UsersView },
      { path: "/jugador/:username", component: { template: "<div/>" } },
      { path: "/:pathMatch(.*)*", component: { template: "<div/>" } },
    ],
  });
}

async function mountView() {
  const router = makeRouter();
  await router.push("/jugadores");
  const wrapper = mount(UsersView, {
    global: { plugins: [router], stubs: STUBS },
  });
  await flushPromises();
  return { wrapper, router };
}

// ── Setup por defecto ─────────────────────────────────────────────────────────

beforeEach(() => {
  getAllUsuarios.mockResolvedValue(FAKE_RESPONSE_PAGE1);
});

// ── Tests: estado de carga ────────────────────────────────────────────────────

describe("estado de carga", () => {
  it("muestra el spinner mientras carga", async () => {
    getAllUsuarios.mockReturnValue(new Promise(() => {}));
    const router = makeRouter();
    await router.push("/jugadores");
    const wrapper = mount(UsersView, {
      global: { plugins: [router], stubs: STUBS },
    });
    expect(wrapper.find(".spinner").exists()).toBe(true);
    expect(wrapper.text()).toContain("Cargando jugadores");
  });

  it("muestra error cuando la carga falla", async () => {
    getAllUsuarios.mockRejectedValue(new Error("Error al cargar los usuarios"));
    const { wrapper } = await mountView();
    expect(wrapper.find(".state-msg.error").exists()).toBe(true);
    expect(wrapper.text()).toContain("Error al cargar los usuarios");
  });
});

// ── Tests: listado de usuarios ────────────────────────────────────────────────

describe("listado de usuarios", () => {
  it("renderiza una card por cada usuario devuelto", async () => {
    const { wrapper } = await mountView();
    const cards = wrapper.findAll(".user-card");
    expect(cards.length).toBe(FAKE_RESPONSE_PAGE1.usuarios.length);
  });

  it("muestra el username en cada card", async () => {
    const { wrapper } = await mountView();
    const cards = wrapper.findAll(".user-card");
    expect(cards[0].text()).toContain("jugador_uno");
    expect(cards[1].text()).toContain("jugador_dos");
  });

  it("muestra el total de jugadores en el header", async () => {
    const { wrapper } = await mountView();
    expect(wrapper.find(".user-count").text()).toContain("3");
  });

  it("muestra la inicial del username en el avatar", async () => {
    const { wrapper } = await mountView();
    const avatars = wrapper.findAll(".card-avatar");
    expect(avatars[0].text()).toBe("J");
  });

  it("muestra la bio cuando el usuario la tiene", async () => {
    const { wrapper } = await mountView();
    expect(wrapper.findAll(".card-bio")[0].text()).toContain(
      "Jugador competitivo.",
    );
  });

  it("no muestra .card-bio cuando el usuario no tiene bio", async () => {
    const { wrapper } = await mountView();
    const cards = wrapper.findAll(".user-card");
    // jugador_tres no tiene bio
    expect(cards[2].find(".card-bio").exists()).toBe(false);
  });

  it("llama a getAllUsuarios con página 1 al montar", async () => {
    await mountView();
    expect(getAllUsuarios).toHaveBeenCalledWith(1);
  });
});

// ── Tests: badge verificado ───────────────────────────────────────────────────

describe("badge de verificación", () => {
  it("muestra el tick de verificado en usuarios verificados", async () => {
    const { wrapper } = await mountView();
    const cards = wrapper.findAll(".user-card");
    // jugador_dos es el verificado (índice 1)
    expect(cards[1].find(".verified-badge").exists()).toBe(true);
  });

  it("no muestra el tick en usuarios no verificados", async () => {
    const { wrapper } = await mountView();
    const cards = wrapper.findAll(".user-card");
    expect(cards[0].find(".verified-badge").exists()).toBe(false);
  });

  it("solo aparece el badge en los usuarios que tienen isVerified=true", async () => {
    const { wrapper } = await mountView();
    const badges = wrapper.findAll(".verified-badge");
    expect(badges.length).toBe(1);
  });
});

// ── Tests: navegación al perfil ───────────────────────────────────────────────

describe("navegación al perfil de usuario", () => {
  it("navega a /jugador/:username al hacer click en una card", async () => {
    const { wrapper, router } = await mountView();
    await wrapper.findAll(".user-card")[0].trigger("click");
    await flushPromises();
    expect(router.currentRoute.value.path).toBe("/jugador/jugador_uno");
  });

  it("navega al perfil correcto según el username de la card", async () => {
    const { wrapper, router } = await mountView();
    await wrapper.findAll(".user-card")[1].trigger("click");
    await flushPromises();
    expect(router.currentRoute.value.path).toBe("/jugador/jugador_dos");
  });
});

// ── Tests: paginación ─────────────────────────────────────────────────────────

describe("paginación", () => {
  it("no muestra paginación cuando hay una sola página", async () => {
    const { wrapper } = await mountView();
    expect(wrapper.find(".pagination").exists()).toBe(false);
  });

  it("muestra paginación cuando hay más de una página", async () => {
    getAllUsuarios.mockResolvedValue(FAKE_RESPONSE_MULTIPAGE);
    const { wrapper } = await mountView();
    expect(wrapper.find(".pagination").exists()).toBe(true);
  });

  it("el botón anterior está deshabilitado en la primera página", async () => {
    getAllUsuarios.mockResolvedValue(FAKE_RESPONSE_MULTIPAGE);
    const { wrapper } = await mountView();
    const prevBtn = wrapper.findAll(".page-btn")[0];
    expect(prevBtn.attributes("disabled")).toBeDefined();
  });

  it("el botón siguiente está habilitado cuando no estamos en la última página", async () => {
    getAllUsuarios.mockResolvedValue(FAKE_RESPONSE_MULTIPAGE);
    const { wrapper } = await mountView();
    const nextBtn = wrapper.findAll(".page-btn")[1];
    expect(nextBtn.attributes("disabled")).toBeUndefined();
  });

  it("muestra el indicador de página actual / total", async () => {
    getAllUsuarios.mockResolvedValue(FAKE_RESPONSE_MULTIPAGE);
    const { wrapper } = await mountView();
    expect(wrapper.find(".page-info").text()).toBe("1 / 2");
  });

  it("carga la página siguiente al pulsar el botón siguiente", async () => {
    const page2Response = { ...FAKE_RESPONSE_MULTIPAGE, page: 2 };
    getAllUsuarios
      .mockResolvedValueOnce(FAKE_RESPONSE_MULTIPAGE)
      .mockResolvedValueOnce(page2Response);

    const { wrapper } = await mountView();
    const nextBtn = wrapper.findAll(".page-btn")[1];
    await nextBtn.trigger("click");
    await flushPromises();

    expect(getAllUsuarios).toHaveBeenCalledWith(2);
    expect(wrapper.find(".page-info").text()).toBe("2 / 2");
  });
});
