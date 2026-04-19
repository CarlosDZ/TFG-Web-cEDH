import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  searchDiscusiones,
  searchDecks,
  searchTechs,
  searchTechsFiltered,
} from "./searchService";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);
vi.stubEnv("VITE_BACKEND_URL", "http://localhost:3000");

function mockOk(body) {
  return Promise.resolve({ ok: true, json: () => Promise.resolve(body) });
}
function mockFail() {
  return Promise.resolve({ ok: false });
}

beforeEach(() => {
  mockFetch.mockReset();
});

// ── searchTechs (autocomplete por título) ─────────────────────────────────────

describe("searchTechs", () => {
  it("usa el parámetro title= en la URL", async () => {
    mockFetch.mockReturnValueOnce(mockOk([]));
    await searchTechs("Tymna");
    expect(mockFetch.mock.calls[0][0]).toContain("title=Tymna");
    expect(mockFetch.mock.calls[0][0]).not.toContain("q=");
  });

  it("devuelve array de techs para una query válida", async () => {
    const payload = [
      { _id: "1", title: "Tech Tymna", commander: ["Tymna the Weaver"] },
    ];
    mockFetch.mockReturnValueOnce(mockOk(payload));
    expect(await searchTechs("Tymna")).toEqual(payload);
  });

  it("devuelve [] sin llamar al servidor para query < 2 caracteres", async () => {
    expect(await searchTechs("T")).toEqual([]);
    expect(await searchTechs("")).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("devuelve [] si el servidor responde con error", async () => {
    mockFetch.mockReturnValueOnce(mockFail());
    expect(await searchTechs("Thrasios")).toEqual([]);
  });

  it("codifica correctamente caracteres especiales", async () => {
    mockFetch.mockReturnValueOnce(mockOk([]));
    await searchTechs("Najeela, the Blade-Blossom");
    expect(mockFetch.mock.calls[0][0]).toContain(
      encodeURIComponent("Najeela, the Blade-Blossom"),
    );
  });

  it("envía credenciales con la petición", async () => {
    mockFetch.mockReturnValueOnce(mockOk([]));
    await searchTechs("Urza");
    expect(mockFetch.mock.calls[0][1]).toMatchObject({
      credentials: "include",
    });
  });
});

// ── searchTechsFiltered (filtro completo title + cards) ───────────────────────

describe("searchTechsFiltered", () => {
  it("envía title= cuando solo hay título", async () => {
    mockFetch.mockReturnValueOnce(mockOk([]));
    await searchTechsFiltered({ title: "Sisay", cards: [] });
    const url = mockFetch.mock.calls[0][0];
    expect(url).toContain("title=Sisay");
    expect(url).not.toContain("cards");
  });

  it("envía cards= cuando solo hay cartas", async () => {
    mockFetch.mockReturnValueOnce(mockOk([]));
    await searchTechsFiltered({
      title: "",
      cards: ["Tymna the Weaver", "Thrasios, Triton Hero"],
    });
    const qs = new URLSearchParams(mockFetch.mock.calls[0][0].split("?")[1]);
    expect(qs.has("title")).toBe(false);
    expect(qs.getAll("cards")).toContain("Tymna the Weaver");
    expect(qs.getAll("cards")).toContain("Thrasios, Triton Hero");
  });

  it("envía title= y cards= cuando hay ambos (filtro AND)", async () => {
    mockFetch.mockReturnValueOnce(mockOk([]));
    await searchTechsFiltered({ title: "Turbo", cards: ["Tymna the Weaver"] });
    const qs = new URLSearchParams(mockFetch.mock.calls[0][0].split("?")[1]);
    expect(qs.get("title")).toBe("Turbo");
    expect(qs.getAll("cards")).toContain("Tymna the Weaver");
  });

  it("devuelve [] sin llamar al servidor si no hay title ni cards", async () => {
    expect(await searchTechsFiltered({ title: "", cards: [] })).toEqual([]);
    expect(await searchTechsFiltered()).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("no envía title= si el título tiene menos de 2 caracteres", async () => {
    mockFetch.mockReturnValueOnce(mockOk([]));
    await searchTechsFiltered({ title: "T", cards: ["Tymna the Weaver"] });
    expect(mockFetch.mock.calls[0][0]).not.toContain("title=");
  });

  it("devuelve [] si el servidor falla", async () => {
    mockFetch.mockReturnValueOnce(mockFail());
    expect(await searchTechsFiltered({ title: "Sisay", cards: [] })).toEqual(
      [],
    );
  });

  it("devuelve los resultados del servidor", async () => {
    const payload = [
      {
        _id: "1",
        title: "Tech Sisay",
        commander: ["Sisay, Weatherlight Captain"],
      },
    ];
    mockFetch.mockReturnValueOnce(mockOk(payload));
    expect(await searchTechsFiltered({ title: "Sisay", cards: [] })).toEqual(
      payload,
    );
  });
});

// ── searchDecks ───────────────────────────────────────────────────────────────

describe("searchDecks", () => {
  it("busca por title por defecto", async () => {
    mockFetch.mockReturnValueOnce(mockOk([]));
    await searchDecks("Turbo Naus");
    expect(mockFetch.mock.calls[0][0]).toContain("by=title");
  });

  it("pasa el parámetro by=commander cuando se indica", async () => {
    mockFetch.mockReturnValueOnce(mockOk([]));
    await searchDecks("Tymna", "commander");
    expect(mockFetch.mock.calls[0][0]).toContain("by=commander");
  });

  it("devuelve [] para query corta sin llamar al servidor", async () => {
    expect(await searchDecks("x")).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("devuelve [] si el servidor falla", async () => {
    mockFetch.mockReturnValueOnce(mockFail());
    expect(await searchDecks("Turbo")).toEqual([]);
  });
});

// ── searchDiscusiones ─────────────────────────────────────────────────────────

describe("searchDiscusiones", () => {
  it("devuelve discusiones para una query válida", async () => {
    const payload = [{ _id: "1", title: "¿Cuándo jugar Thassa Oracle?" }];
    mockFetch.mockReturnValueOnce(mockOk(payload));
    expect(await searchDiscusiones("Thassa")).toEqual(payload);
  });

  it("devuelve [] para query de 1 carácter", async () => {
    expect(await searchDiscusiones("T")).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("devuelve [] si el servidor falla", async () => {
    mockFetch.mockReturnValueOnce(mockFail());
    expect(await searchDiscusiones("combo")).toEqual([]);
  });
});
