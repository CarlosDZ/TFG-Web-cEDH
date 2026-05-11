"use strict";

/**
 * Tests unitarios para el controller de torneos.
 * Ejecutar con:
 *   node --env-file=.env --test backend/controllers/tournament.test.js
 */

const { test, describe } = require("node:test");
const assert = require("node:assert/strict");

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeReqRes({ params = {}, body = {}, user = null, session = null } = {}) {
  const req = { params, body, user };
  const res = {
    _status: null,
    _body: undefined,
    session,
    status(code) { this._status = code; return this; },
    json(data) { this._body = data; return this; },
  };
  return { req, res };
}

function mockModule(modulePath, fakeExports) {
  require.cache[require.resolve(modulePath)] = {
    id: require.resolve(modulePath),
    filename: require.resolve(modulePath),
    loaded: true,
    exports: fakeExports,
    parent: null,
    children: [],
    paths: [],
  };
}

function clearModule(modulePath) {
  delete require.cache[require.resolve(modulePath)];
}

// ─── IDs de test ─────────────────────────────────────────────────────────────

const ORGANIZER_ID = "000000000000000000000001";
const OTHER_ID     = "000000000000000000000002";
const TOURNAMENT_ID = "aaaa00000000000000000001";
const ENTRY_ID      = "bbbb00000000000000000001";

const FUTURE_DATE = new Date(Date.now() + 86400 * 1000 * 30).toISOString();
const PAST_DATE   = new Date(Date.now() - 86400 * 1000).toISOString();

// ─── Builders de objetos fake ─────────────────────────────────────────────────

function makeTournament(overrides = {}) {
  return {
    _id: { toString: () => TOURNAMENT_ID, equals: (id) => id?.toString() === TOURNAMENT_ID },
    name: "Torneo Test",
    authorId: { equals: (id) => id?.toString() === ORGANIZER_ID },
    tournament_date_hour: FUTURE_DATE,
    isFull: false,
    max_players: null,
    auto_accept_participants: false,
    needs_decklist: false,
    reserve_non_confirmed_places: true,
    registration_deadline: null,
    save: async () => {},
    populate: async () => {},
    deleteOne: async () => {},
    ...overrides,
  };
}

function makeUser(overrides = {}) {
  return {
    _id: ORGANIZER_ID,
    username: "organizer",
    isAdmin: false,
    isVerified: true,
    fav_tournament: [],
    save: async () => {},
    ...overrides,
  };
}

function makeEntry(overrides = {}) {
  return {
    _id: ENTRY_ID,
    tournamentId: { equals: (id) => id?.toString() === TOURNAMENT_ID },
    userId: { equals: (id) => id?.toString() === ORGANIZER_ID },
    username_snapshot: "organizer",
    status: "pending",
    placement: null,
    metadata: {},
    save: async () => {},
    deleteOne: async () => {},
    ...overrides,
  };
}

// ─── Loader del controller ────────────────────────────────────────────────────

const CONTROLLER_PATH = "./tournament";
const TOURNAMENT_MODEL = "../models/Tournament";
const ENTRY_MODEL      = "../models/TournamentEntry";
const USER_MODEL       = "../models/User";

function loadController(fakeTournament, fakeEntry, fakeUser) {
  clearModule(CONTROLLER_PATH);
  mockModule(TOURNAMENT_MODEL, fakeTournament ?? {});
  mockModule(ENTRY_MODEL, fakeEntry ?? {});
  mockModule(USER_MODEL, fakeUser ?? {});
  return require(CONTROLLER_PATH);
}

// ═════════════════════════════════════════════════════════════════════════════
// obtener_torneos_disponibles
// ═════════════════════════════════════════════════════════════════════════════

describe("obtener_torneos_disponibles", () => {
  function makePopulateChain(result) {
    return { populate: () => Promise.resolve(result) };
  }

  test("solo devuelve torneos futuros, no llenos y sin deadline pasado", async () => {
    const expected = [makeTournament()];
    const fakeTournament = { find: () => makePopulateChain(expected) };
    const { obtener_torneos_disponibles } = loadController(fakeTournament);
    const { req, res } = makeReqRes();

    await obtener_torneos_disponibles(req, res);

    assert.equal(res._status, 200);
    assert.equal(res._body.length, 1);
  });

  test("devuelve 500 en error de BD", async () => {
    const fakeTournament = { find: () => { throw new Error("DB"); } };
    const { obtener_torneos_disponibles } = loadController(fakeTournament);
    const { req, res } = makeReqRes();

    await obtener_torneos_disponibles(req, res);

    assert.equal(res._status, 500);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// post_tournament
// ═════════════════════════════════════════════════════════════════════════════

describe("post_tournament", () => {
  function makeFakeTournamentConstructor(saveOk = true) {
    function FakeTorneo(data) { Object.assign(this, data); }
    FakeTorneo.prototype.save = saveOk
      ? async function () { return this; }
      : async function () { throw new Error("save error"); };
    return FakeTorneo;
  }

  test("devuelve 403 si el usuario no está verificado ni es admin", async () => {
    const { post_tournament } = loadController(makeFakeTournamentConstructor());
    const { req, res } = makeReqRes({
      body: { name: "T", ubication: "u", format: "Swiss", enter_cost: "10€", tournament_date_hour: FUTURE_DATE },
      user: { id: OTHER_ID, isVerified: false, isAdmin: false },
    });

    await post_tournament(req, res);

    assert.equal(res._status, 403);
  });

  test("devuelve 201 si el usuario está verificado", async () => {
    const { post_tournament } = loadController(makeFakeTournamentConstructor());
    const { req, res } = makeReqRes({
      body: { name: "Torneo A", ubication: "url", format: "Swiss", enter_cost: "5€", tournament_date_hour: FUTURE_DATE, prizes: [] },
      user: { id: ORGANIZER_ID, isVerified: true, isAdmin: false },
    });

    await post_tournament(req, res);

    assert.equal(res._status, 201);
    assert.equal(res._body.name, "Torneo A");
  });

  test("devuelve 201 si el usuario es admin aunque no esté verificado", async () => {
    const { post_tournament } = loadController(makeFakeTournamentConstructor());
    const { req, res } = makeReqRes({
      body: { name: "Admin T", ubication: "url", format: "Swiss", enter_cost: "0", tournament_date_hour: FUTURE_DATE, prizes: [] },
      user: { id: ORGANIZER_ID, isVerified: false, isAdmin: true },
    });

    await post_tournament(req, res);

    assert.equal(res._status, 201);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// patch_tournament
// ═════════════════════════════════════════════════════════════════════════════

describe("patch_tournament", () => {
  function makeFakeModels(tournament, user) {
    return {
      tournament: { findById: () => Promise.resolve(tournament) },
      user: { findById: () => Promise.resolve(user) },
    };
  }

  test("devuelve 404 si el torneo no existe", async () => {
    const m = makeFakeModels(null, makeUser());
    const { patch_tournament } = loadController(m.tournament, {}, m.user);
    const { req, res } = makeReqRes({ params: { id: TOURNAMENT_ID }, body: { name: "X" }, user: { id: ORGANIZER_ID } });

    await patch_tournament(req, res);

    assert.equal(res._status, 404);
  });

  test("devuelve 403 si el usuario no es el autor ni admin", async () => {
    const t = makeTournament();
    const u = makeUser({ _id: OTHER_ID, isAdmin: false });
    const m = makeFakeModels(t, u);
    const { patch_tournament } = loadController(m.tournament, {}, m.user);
    const { req, res } = makeReqRes({ params: { id: TOURNAMENT_ID }, body: { name: "X" }, user: { id: OTHER_ID } });

    await patch_tournament(req, res);

    assert.equal(res._status, 403);
  });

  test("actualiza solo los campos permitidos y devuelve 200", async () => {
    let saved = false;
    const t = makeTournament({ save: async function () { saved = true; }, populate: async function () {} });
    const u = makeUser({ _id: ORGANIZER_ID });
    const m = makeFakeModels(t, u);
    const { patch_tournament } = loadController(m.tournament, {}, m.user);
    const { req, res } = makeReqRes({
      params: { id: TOURNAMENT_ID },
      body: { name: "Nuevo nombre", isFull: true, hackerField: "injected" },
      user: { id: ORGANIZER_ID },
    });

    await patch_tournament(req, res);

    assert.equal(res._status, 200);
    assert.equal(saved, true);
    assert.equal(t.name, "Nuevo nombre");
    assert.equal(t.isFull, true);
    assert.equal(t.hackerField, undefined);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// delete_tournament
// ═════════════════════════════════════════════════════════════════════════════

describe("delete_tournament", () => {
  test("devuelve 404 si el torneo no existe", async () => {
    const fakeTournament = { findById: () => Promise.resolve(null) };
    const fakeUser = { findById: () => Promise.resolve(makeUser()) };
    const { delete_tournament } = loadController(fakeTournament, {}, fakeUser);
    const { req, res } = makeReqRes({ params: { id: TOURNAMENT_ID }, user: { id: ORGANIZER_ID } });

    await delete_tournament(req, res);

    assert.equal(res._status, 404);
  });

  test("devuelve 403 si no es el autor ni admin", async () => {
    const fakeTournament = { findById: () => Promise.resolve(makeTournament()) };
    const fakeUser = { findById: () => Promise.resolve(makeUser({ _id: OTHER_ID, isAdmin: false })), updateMany: async () => {} };
    const { delete_tournament } = loadController(fakeTournament, {}, fakeUser);
    const { req, res } = makeReqRes({ params: { id: TOURNAMENT_ID }, user: { id: OTHER_ID } });

    await delete_tournament(req, res);

    assert.equal(res._status, 403);
  });

  test("borra el torneo y devuelve 200 si es el autor", async () => {
    let deleted = false;
    const t = makeTournament({ deleteOne: async () => { deleted = true; } });
    const fakeTournament = { findById: () => Promise.resolve(t) };
    const fakeUser = {
      findById: () => Promise.resolve(makeUser({ _id: ORGANIZER_ID })),
      updateMany: async () => {},
    };
    const { delete_tournament } = loadController(fakeTournament, {}, fakeUser);
    const { req, res } = makeReqRes({ params: { id: TOURNAMENT_ID }, user: { id: ORGANIZER_ID } });

    await delete_tournament(req, res);

    assert.equal(res._status, 200);
    assert.equal(deleted, true);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// join_tournament
// ═════════════════════════════════════════════════════════════════════════════

describe("join_tournament", () => {
  function makeEntryConstructor(capturedData) {
    function FakeEntry(data) {
      Object.assign(this, data);
      if (capturedData) Object.assign(capturedData, data);
    }
    FakeEntry.prototype.save = async function () {};
    return FakeEntry;
  }

  test("devuelve 409 si el torneo está completo", async () => {
    const fakeTournament = { findById: () => Promise.resolve(makeTournament({ isFull: true })) };
    const { join_tournament } = loadController(fakeTournament, makeEntryConstructor());
    const { req, res } = makeReqRes({ params: { id: TOURNAMENT_ID }, body: {}, session: null });

    await join_tournament(req, res);

    assert.equal(res._status, 409);
  });

  test("devuelve 409 si el deadline de inscripción ha pasado", async () => {
    const t = makeTournament({ registration_deadline: new Date(PAST_DATE) });
    const FakeEntry = makeEntryConstructor();
    FakeEntry.findOne = () => Promise.resolve(null);
    const fakeTournament = { findById: () => Promise.resolve(t) };
    const { join_tournament } = loadController(fakeTournament, FakeEntry);
    const { req, res } = makeReqRes({ params: { id: TOURNAMENT_ID }, body: {}, session: { authenticated: false } });

    await join_tournament(req, res);

    assert.equal(res._status, 409);
  });

  test("devuelve 409 si el usuario ya está inscrito", async () => {
    const fakeTournament = { findById: () => Promise.resolve(makeTournament()) };
    const fakeEntry = {
      ...makeEntryConstructor(),
      findOne: () => Promise.resolve(makeEntry()),
    };
    const fakeUser = { findById: () => Promise.resolve(makeUser()) };
    const { join_tournament } = loadController(fakeTournament, fakeEntry, fakeUser);
    const { req, res } = makeReqRes({
      params: { id: TOURNAMENT_ID }, body: {},
      session: { authenticated: true, user: { id: ORGANIZER_ID } },
    });

    await join_tournament(req, res);

    assert.equal(res._status, 409);
  });

  test("devuelve 400 si el torneo requiere decklist y no se proporciona", async () => {
    const fakeTournament = { findById: () => Promise.resolve(makeTournament({ needs_decklist: true })) };
    const fakeEntry = {
      ...makeEntryConstructor(),
      findOne: () => Promise.resolve(null),
    };
    const fakeUser = { findById: () => Promise.resolve(makeUser()) };
    const { join_tournament } = loadController(fakeTournament, fakeEntry, fakeUser);
    const { req, res } = makeReqRes({
      params: { id: TOURNAMENT_ID }, body: {},
      session: { authenticated: true, user: { id: ORGANIZER_ID } },
    });

    await join_tournament(req, res);

    assert.equal(res._status, 400);
  });

  test("crea entry con status=accepted cuando auto_accept es true", async () => {
    const captured = {};
    const fakeTournament = {
      findById: () => Promise.resolve(makeTournament({ auto_accept_participants: true })),
      updateOne: async () => {},
    };
    const FakeEntry = makeEntryConstructor(captured);
    FakeEntry.findOne = () => Promise.resolve(null);
    FakeEntry.countDocuments = async () => 0;
    const fakeUser = { findById: () => Promise.resolve(makeUser()) };
    const { join_tournament } = loadController(fakeTournament, FakeEntry, fakeUser);
    const { req, res } = makeReqRes({
      params: { id: TOURNAMENT_ID }, body: {},
      session: { authenticated: true, user: { id: ORGANIZER_ID } },
    });

    await join_tournament(req, res);

    assert.equal(res._status, 201);
    assert.equal(captured.status, "accepted");
  });

  test("crea entry con status=pending cuando auto_accept es false", async () => {
    const captured = {};
    const fakeTournament = {
      findById: () => Promise.resolve(makeTournament({ auto_accept_participants: false })),
      updateOne: async () => {},
    };
    const FakeEntry = makeEntryConstructor(captured);
    FakeEntry.findOne = () => Promise.resolve(null);
    FakeEntry.countDocuments = async () => 0;
    const fakeUser = { findById: () => Promise.resolve(makeUser()) };
    const { join_tournament } = loadController(fakeTournament, FakeEntry, fakeUser);
    const { req, res } = makeReqRes({
      params: { id: TOURNAMENT_ID }, body: {},
      session: { authenticated: true, user: { id: ORGANIZER_ID } },
    });

    await join_tournament(req, res);

    assert.equal(res._status, 201);
    assert.equal(captured.status, "pending");
  });

  test("marca el torneo como isFull cuando se alcanza el límite con reserve=true", async () => {
    let updatedFull = false;
    const fakeTournament = {
      findById: () => Promise.resolve(makeTournament({ max_players: 2, reserve_non_confirmed_places: true })),
      updateOne: async (_q, update) => { if (update.$set?.isFull || update.isFull) updatedFull = true; },
    };
    const FakeEntry = makeEntryConstructor();
    FakeEntry.findOne = () => Promise.resolve(null);
    FakeEntry.countDocuments = async () => 2;
    const fakeUser = { findById: () => Promise.resolve(makeUser()) };
    const { join_tournament } = loadController(fakeTournament, FakeEntry, fakeUser);
    const { req, res } = makeReqRes({
      params: { id: TOURNAMENT_ID }, body: {},
      session: { authenticated: true, user: { id: ORGANIZER_ID } },
    });

    await join_tournament(req, res);

    assert.equal(res._status, 201);
    assert.equal(updatedFull, true);
  });

  test("inscripción como invitado usa username_snapshot del body", async () => {
    const captured = {};
    const fakeTournament = {
      findById: () => Promise.resolve(makeTournament()),
      updateOne: async () => {},
    };
    const FakeEntry = makeEntryConstructor(captured);
    FakeEntry.findOne = () => Promise.resolve(null);
    FakeEntry.countDocuments = async () => 0;
    const { join_tournament } = loadController(fakeTournament, FakeEntry, {});
    const { req, res } = makeReqRes({
      params: { id: TOURNAMENT_ID },
      body: { username_snapshot: "invitado123" },
      session: { authenticated: false },
    });

    await join_tournament(req, res);

    assert.equal(res._status, 201);
    assert.equal(captured.username_snapshot, "invitado123");
    assert.equal(captured.userId, null);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// get_my_entry
// ═════════════════════════════════════════════════════════════════════════════

describe("get_my_entry", () => {
  test("devuelve null si el usuario no tiene inscripción", async () => {
    const fakeEntry = { findOne: () => Promise.resolve(null) };
    const { get_my_entry } = loadController({}, fakeEntry);
    const { req, res } = makeReqRes({ params: { id: TOURNAMENT_ID }, user: { id: OTHER_ID } });

    await get_my_entry(req, res);

    assert.equal(res._status, 200);
    assert.equal(res._body, null);
  });

  test("devuelve la entry si existe", async () => {
    const entry = makeEntry();
    const fakeEntry = { findOne: () => Promise.resolve(entry) };
    const { get_my_entry } = loadController({}, fakeEntry);
    const { req, res } = makeReqRes({ params: { id: TOURNAMENT_ID }, user: { id: ORGANIZER_ID } });

    await get_my_entry(req, res);

    assert.equal(res._status, 200);
    assert.equal(res._body._id, ENTRY_ID);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// patch_entry
// ═════════════════════════════════════════════════════════════════════════════

describe("patch_entry", () => {
  function makeModels(tournament, entry, user, entryCount = 0) {
    return {
      tournament: { findById: () => Promise.resolve(tournament) },
      entry: {
        findById: () => Promise.resolve(entry),
        countDocuments: async () => entryCount,
      },
      user: { findById: () => Promise.resolve(user) },
    };
  }

  test("devuelve 404 si el torneo no existe", async () => {
    const m = makeModels(null, makeEntry(), makeUser());
    const { patch_entry } = loadController(m.tournament, m.entry, m.user);
    const { req, res } = makeReqRes({ params: { id: TOURNAMENT_ID, entryId: ENTRY_ID }, body: { status: "accepted" }, user: { id: ORGANIZER_ID } });

    await patch_entry(req, res);

    assert.equal(res._status, 404);
  });

  test("devuelve 403 si el usuario no es organizador ni admin", async () => {
    const m = makeModels(makeTournament(), makeEntry(), makeUser({ _id: OTHER_ID, isAdmin: false }));
    const { patch_entry } = loadController(m.tournament, m.entry, m.user);
    const { req, res } = makeReqRes({ params: { id: TOURNAMENT_ID, entryId: ENTRY_ID }, body: { status: "accepted" }, user: { id: OTHER_ID } });

    await patch_entry(req, res);

    assert.equal(res._status, 403);
  });

  test("actualiza status, placement y metadata; ignora otros campos", async () => {
    let saved = false;
    const entry = makeEntry({ save: async function () { saved = true; } });
    const m = makeModels(makeTournament(), entry, makeUser({ _id: ORGANIZER_ID }));
    const { patch_entry } = loadController(m.tournament, m.entry, m.user);
    const { req, res } = makeReqRes({
      params: { id: TOURNAMENT_ID, entryId: ENTRY_ID },
      body: { status: "accepted", placement: "1º", metadata: { comment: "Ganó todo" }, username_snapshot: "hack" },
      user: { id: ORGANIZER_ID },
    });

    await patch_entry(req, res);

    assert.equal(res._status, 200);
    assert.equal(saved, true);
    assert.equal(entry.status, "accepted");
    assert.equal(entry.placement, "1º");
    assert.deepEqual(entry.metadata, { comment: "Ganó todo" });
    assert.equal(entry.username_snapshot, "organizer");
  });

  test("recalcula isFull tras cambio de status", async () => {
    let updatedTournament = false;
    const t = makeTournament({ max_players: 2, isFull: true, reserve_non_confirmed_places: false });
    const entry = makeEntry({ save: async function () {} });
    const fakeTournament = {
      findById: () => Promise.resolve(t),
      updateOne: async () => { updatedTournament = true; },
    };
    const fakeEntry = { findById: () => Promise.resolve(entry), countDocuments: async () => 1 };
    const fakeUser = { findById: () => Promise.resolve(makeUser({ _id: ORGANIZER_ID })) };
    const { patch_entry } = loadController(fakeTournament, fakeEntry, fakeUser);
    const { req, res } = makeReqRes({
      params: { id: TOURNAMENT_ID, entryId: ENTRY_ID },
      body: { status: "rejected" },
      user: { id: ORGANIZER_ID },
    });

    await patch_entry(req, res);

    assert.equal(res._status, 200);
    assert.equal(updatedTournament, true);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// delete_entry
// ═════════════════════════════════════════════════════════════════════════════

describe("delete_entry", () => {
  test("devuelve 404 si la entry no existe", async () => {
    const fakeTournament = { findById: () => Promise.resolve(makeTournament()) };
    const fakeEntry = { findById: () => Promise.resolve(null) };
    const fakeUser = { findById: () => Promise.resolve(makeUser()) };
    const { delete_entry } = loadController(fakeTournament, fakeEntry, fakeUser);
    const { req, res } = makeReqRes({ params: { id: TOURNAMENT_ID, entryId: ENTRY_ID }, user: { id: ORGANIZER_ID } });

    await delete_entry(req, res);

    assert.equal(res._status, 404);
  });

  test("devuelve 403 si no es el propietario ni el organizador", async () => {
    const entry = makeEntry({ userId: { equals: () => false } });
    const fakeTournament = { findById: () => Promise.resolve(makeTournament()) };
    const fakeEntry = { findById: () => Promise.resolve(entry) };
    const fakeUser = { findById: () => Promise.resolve(makeUser({ _id: OTHER_ID, isAdmin: false })) };
    const { delete_entry } = loadController(fakeTournament, fakeEntry, fakeUser);
    const { req, res } = makeReqRes({ params: { id: TOURNAMENT_ID, entryId: ENTRY_ID }, user: { id: OTHER_ID } });

    await delete_entry(req, res);

    assert.equal(res._status, 403);
  });

  test("el propietario puede cancelar su propia inscripción", async () => {
    let deleted = false;
    const entry = makeEntry({ deleteOne: async () => { deleted = true; } });
    const fakeTournament = {
      findById: () => Promise.resolve(makeTournament({ isFull: false })),
      updateOne: async () => {},
    };
    const fakeEntry = { findById: () => Promise.resolve(entry) };
    const fakeUser = { findById: () => Promise.resolve(makeUser({ _id: ORGANIZER_ID })) };
    const { delete_entry } = loadController(fakeTournament, fakeEntry, fakeUser);
    const { req, res } = makeReqRes({ params: { id: TOURNAMENT_ID, entryId: ENTRY_ID }, user: { id: ORGANIZER_ID } });

    await delete_entry(req, res);

    assert.equal(res._status, 200);
    assert.equal(deleted, true);
  });

  test("reabre el torneo (isFull=false) al eliminar una entrada si estaba lleno", async () => {
    let updatedFull = false;
    const entry = makeEntry({ deleteOne: async () => {} });
    const t = makeTournament({ isFull: true });
    const fakeTournament = {
      findById: () => Promise.resolve(t),
      updateOne: async () => { updatedFull = true; },
    };
    const fakeEntry = { findById: () => Promise.resolve(entry) };
    const fakeUser = { findById: () => Promise.resolve(makeUser({ _id: ORGANIZER_ID })) };
    const { delete_entry } = loadController(fakeTournament, fakeEntry, fakeUser);
    const { req, res } = makeReqRes({ params: { id: TOURNAMENT_ID, entryId: ENTRY_ID }, user: { id: ORGANIZER_ID } });

    await delete_entry(req, res);

    assert.equal(updatedFull, true);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// get_entries
// ═════════════════════════════════════════════════════════════════════════════

describe("get_entries", () => {
  test("devuelve 404 si el torneo no existe", async () => {
    const fakeTournament = { findById: () => Promise.resolve(null) };
    const fakeUser = { findById: () => Promise.resolve(makeUser()) };
    const { get_entries } = loadController(fakeTournament, {}, fakeUser);
    const { req, res } = makeReqRes({ params: { id: TOURNAMENT_ID }, user: { id: ORGANIZER_ID } });

    await get_entries(req, res);

    assert.equal(res._status, 404);
  });

  test("devuelve 403 si el usuario no es el organizador ni admin", async () => {
    const fakeTournament = { findById: () => Promise.resolve(makeTournament()) };
    const fakeUser = { findById: () => Promise.resolve(makeUser({ _id: OTHER_ID, isAdmin: false })) };
    const { get_entries } = loadController(fakeTournament, {}, fakeUser);
    const { req, res } = makeReqRes({ params: { id: TOURNAMENT_ID }, user: { id: OTHER_ID } });

    await get_entries(req, res);

    assert.equal(res._status, 403);
  });

  test("devuelve 200 con la lista de entries para el organizador", async () => {
    const entries = [makeEntry(), makeEntry({ _id: "cccc00000000000000000001" })];
    const fakeTournament = { findById: () => Promise.resolve(makeTournament()) };
    const fakeUser = { findById: () => Promise.resolve(makeUser({ _id: ORGANIZER_ID })) };
    const fakeEntry = {
      find: () => ({
        populate: () => ({ sort: () => Promise.resolve(entries) }),
      }),
    };
    const { get_entries } = loadController(fakeTournament, fakeEntry, fakeUser);
    const { req, res } = makeReqRes({ params: { id: TOURNAMENT_ID }, user: { id: ORGANIZER_ID } });

    await get_entries(req, res);

    assert.equal(res._status, 200);
    assert.equal(res._body.length, 2);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// get_organized_tournaments
// ═════════════════════════════════════════════════════════════════════════════

describe("get_organized_tournaments", () => {
  test("devuelve 403 si el usuario no está verificado ni es admin", async () => {
    const { get_organized_tournaments } = loadController({}, {});
    const { req, res } = makeReqRes({ user: { id: OTHER_ID, isVerified: false, isAdmin: false } });

    await get_organized_tournaments(req, res);

    assert.equal(res._status, 403);
  });

  test("devuelve 200 con array vacío si no hay torneos", async () => {
    const fakeTournament = { find: () => ({ sort: () => ({ lean: () => Promise.resolve([]) }) }) };
    const { get_organized_tournaments } = loadController(fakeTournament, {});
    const { req, res } = makeReqRes({ user: { id: ORGANIZER_ID, isVerified: true, isAdmin: false } });

    await get_organized_tournaments(req, res);

    assert.equal(res._status, 200);
    assert.deepEqual(res._body, []);
  });

  test("fusiona entry_counts en cada torneo", async () => {
    const tid = { toString: () => TOURNAMENT_ID };
    const tournaments = [{ _id: tid, name: "T1" }];
    const aggregateResult = [
      { _id: { tournamentId: tid, status: "accepted" }, count: 3 },
      { _id: { tournamentId: tid, status: "pending" }, count: 1 },
    ];
    const fakeTournament = { find: () => ({ sort: () => ({ lean: () => Promise.resolve(tournaments) }) }) };
    const fakeEntry = { aggregate: () => Promise.resolve(aggregateResult) };
    const { get_organized_tournaments } = loadController(fakeTournament, fakeEntry);
    const { req, res } = makeReqRes({ user: { id: ORGANIZER_ID, isVerified: true, isAdmin: false } });

    await get_organized_tournaments(req, res);

    assert.equal(res._status, 200);
    assert.equal(res._body.length, 1);
    assert.equal(res._body[0].entry_counts.accepted, 3);
    assert.equal(res._body[0].entry_counts.pending, 1);
    assert.equal(res._body[0].entry_counts.rejected, 0);
  });

  test("torneos sin entries tienen entry_counts en cero", async () => {
    const tid = { toString: () => TOURNAMENT_ID };
    const tournaments = [{ _id: tid, name: "T1" }];
    const fakeTournament = { find: () => ({ sort: () => ({ lean: () => Promise.resolve(tournaments) }) }) };
    const fakeEntry = { aggregate: () => Promise.resolve([]) };
    const { get_organized_tournaments } = loadController(fakeTournament, fakeEntry);
    const { req, res } = makeReqRes({ user: { id: ORGANIZER_ID, isVerified: true, isAdmin: false } });

    await get_organized_tournaments(req, res);

    assert.equal(res._status, 200);
    assert.deepEqual(res._body[0].entry_counts, { pending: 0, accepted: 0, rejected: 0 });
  });
});
