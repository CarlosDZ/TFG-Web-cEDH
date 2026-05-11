/**
 * Tests de integración para el controller de torneos.
 * Requieren conexión real a MongoDB.
 *
 * Ejecutar con:
 *   node --env-file=.env --test backend/controllers/tournament.integration.test.js
 */

"use strict";

const { test, before, after, describe } = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");

const Torneo = require("../models/Tournament");
const TournamentEntry = require("../models/TournamentEntry");
const Usuario = require("../models/User");

const {
  obtener_torneos_disponibles,
  join_tournament,
  get_organized_tournaments,
  patch_entry,
  delete_entry,
  get_entries,
} = require("../controllers/tournament");

// ─── Fixtures ────────────────────────────────────────────────────────────────

const ORGANIZER = {
  username: "integ_tournament_organizer",
  email: "integ_tournament_organizer@test.com",
  salt: "salt_organizer",
  password_hash: "hash_organizer",
  isVerified: true,
  isAdmin: false,
};

const OTHER_USER = {
  username: "integ_tournament_other",
  email: "integ_tournament_other@test.com",
  salt: "salt_other",
  password_hash: "hash_other",
  isVerified: false,
  isAdmin: false,
};

let organizerId, otherUserId;
let createdTournamentIds = [];
let createdEntryIds = [];

function makeReqRes({
  params = {},
  body = {},
  user = null,
  session = null,
} = {}) {
  const req = { params, body, user };
  const res = {
    _status: null,
    _body: undefined,
    session,
    status(code) {
      this._status = code;
      return this;
    },
    json(data) {
      this._body = data;
      return this;
    },
  };
  return { req, res };
}

async function createTournament(overrides = {}) {
  const t = await Torneo.create({
    authorId: organizerId,
    name: "Torneo Integración",
    ubication: "https://maps.google.com",
    format: "Swiss",
    enter_cost: "10€",
    tournament_date_hour: new Date(Date.now() + 86400 * 1000 * 7),
    isFull: false,
    auto_accept_participants: false,
    needs_decklist: false,
    reserve_non_confirmed_places: true,
    registration_deadline: null,
    ...overrides,
  });
  createdTournamentIds.push(t._id);
  return t;
}

async function createEntry(tournamentId, overrides = {}) {
  const e = await TournamentEntry.create({
    tournamentId,
    userId: organizerId,
    username_snapshot: "integ_tournament_organizer",
    status: "pending",
    title: null,
    commander: [],
    cards: [],
    ...overrides,
  });
  createdEntryIds.push(e._id);
  return e;
}

// ─── Setup / Teardown ────────────────────────────────────────────────────────

before(async () => {
  const mongoUrl = process.env.MONGODB_URL;
  if (!mongoUrl)
    throw new Error("MONGODB_URL no definida. Ejecuta con --env-file=.env");
  await mongoose.connect(mongoUrl);

  await Usuario.deleteOne({ username: ORGANIZER.username });
  await Usuario.deleteOne({ username: OTHER_USER.username });

  const org = await Usuario.create(ORGANIZER);
  const other = await Usuario.create(OTHER_USER);
  organizerId = org._id;
  otherUserId = other._id;
});

after(async () => {
  await TournamentEntry.deleteMany({ _id: { $in: createdEntryIds } });
  await Torneo.deleteMany({ _id: { $in: createdTournamentIds } });
  await Usuario.deleteOne({ _id: organizerId });
  await Usuario.deleteOne({ _id: otherUserId });
  await mongoose.disconnect();
});

// ═════════════════════════════════════════════════════════════════════════════
// obtener_torneos_disponibles — filtros reales sobre MongoDB
// ═════════════════════════════════════════════════════════════════════════════

describe("obtener_torneos_disponibles (integración)", () => {
  test("no devuelve torneos pasados", async () => {
    await createTournament({
      name: "Torneo Pasado",
      tournament_date_hour: new Date(Date.now() - 86400 * 1000),
    });

    const { req, res } = makeReqRes();
    await obtener_torneos_disponibles(req, res);

    assert.equal(res._status, 200);
    const names = res._body.map((t) => t.name);
    assert.ok(
      !names.includes("Torneo Pasado"),
      "No debe incluir torneos pasados",
    );
    console.log("  ✓ Torneos pasados excluidos");
  });

  test("no devuelve torneos completos", async () => {
    await createTournament({ name: "Torneo Lleno", isFull: true });

    const { req, res } = makeReqRes();
    await obtener_torneos_disponibles(req, res);

    assert.equal(res._status, 200);
    const names = res._body.map((t) => t.name);
    assert.ok(
      !names.includes("Torneo Lleno"),
      "No debe incluir torneos llenos",
    );
    console.log("  ✓ Torneos llenos excluidos");
  });

  test("no devuelve torneos con deadline de inscripción pasado", async () => {
    await createTournament({
      name: "Torneo Deadline Pasado",
      registration_deadline: new Date(Date.now() - 3600 * 1000),
    });

    const { req, res } = makeReqRes();
    await obtener_torneos_disponibles(req, res);

    assert.equal(res._status, 200);
    const names = res._body.map((t) => t.name);
    assert.ok(
      !names.includes("Torneo Deadline Pasado"),
      "No debe incluir torneos con deadline pasado",
    );
    console.log("  ✓ Torneos con deadline pasado excluidos");
  });

  test("sí devuelve torneos con deadline futuro", async () => {
    await createTournament({
      name: "Torneo Deadline Futuro",
      registration_deadline: new Date(Date.now() + 86400 * 1000 * 3),
    });

    const { req, res } = makeReqRes();
    await obtener_torneos_disponibles(req, res);

    assert.equal(res._status, 200);
    const names = res._body.map((t) => t.name);
    assert.ok(
      names.includes("Torneo Deadline Futuro"),
      "Debe incluir torneos con deadline futuro",
    );
    console.log("  ✓ Torneos con deadline futuro incluidos");
  });

  test("sí devuelve torneos sin deadline (null)", async () => {
    await createTournament({
      name: "Torneo Sin Deadline",
      registration_deadline: null,
    });

    const { req, res } = makeReqRes();
    await obtener_torneos_disponibles(req, res);

    assert.equal(res._status, 200);
    const names = res._body.map((t) => t.name);
    assert.ok(
      names.includes("Torneo Sin Deadline"),
      "Debe incluir torneos sin deadline",
    );
    console.log("  ✓ Torneos sin deadline incluidos");
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// join_tournament — flujo completo de inscripción
// ═════════════════════════════════════════════════════════════════════════════

describe("join_tournament (integración)", () => {
  test("crea una entry pendiente cuando auto_accept es false", async () => {
    const t = await createTournament({
      name: "Torneo Manual",
      auto_accept_participants: false,
    });

    const { req, res } = makeReqRes({
      params: { id: t._id.toString() },
      body: {},
      session: { authenticated: true, user: { id: organizerId.toString() } },
    });
    await join_tournament(req, res);

    assert.equal(res._status, 201);
    assert.equal(res._body.status, "pending");
    createdEntryIds.push(res._body._id);
    console.log("  ✓ Entry creada con status=pending");
  });

  test("crea una entry aceptada cuando auto_accept es true", async () => {
    const t = await createTournament({
      name: "Torneo Auto",
      auto_accept_participants: true,
    });

    const { req, res } = makeReqRes({
      params: { id: t._id.toString() },
      body: {},
      session: { authenticated: true, user: { id: organizerId.toString() } },
    });
    await join_tournament(req, res);

    assert.equal(res._status, 201);
    assert.equal(res._body.status, "accepted");
    createdEntryIds.push(res._body._id);
    console.log("  ✓ Entry creada con status=accepted (auto_accept)");
  });

  test("devuelve 409 si el usuario ya está inscrito con status pending/accepted", async () => {
    const t = await createTournament({ name: "Torneo Duplicado" });
    await createEntry(t._id, {
      userId: otherUserId,
      username_snapshot: "integ_tournament_other",
      status: "pending",
    });

    const { req, res } = makeReqRes({
      params: { id: t._id.toString() },
      body: {},
      session: { authenticated: true, user: { id: otherUserId.toString() } },
    });
    await join_tournament(req, res);

    assert.equal(res._status, 409);
    console.log("  ✓ Duplicado detectado correctamente");
  });

  test("permite reinscribirse tras ser rechazado", async () => {
    const t = await createTournament({ name: "Torneo Reingreso" });
    await createEntry(t._id, {
      userId: otherUserId,
      username_snapshot: "integ_tournament_other",
      status: "rejected",
    });

    const { req, res } = makeReqRes({
      params: { id: t._id.toString() },
      body: {},
      session: { authenticated: true, user: { id: otherUserId.toString() } },
    });
    await join_tournament(req, res);

    assert.equal(res._status, 201);
    createdEntryIds.push(res._body._id);
    console.log("  ✓ Reingreso permitido tras rechazo");
  });

  test("marca el torneo como isFull al alcanzar max_players con reserve=true", async () => {
    const t = await createTournament({
      name: "Torneo Límite",
      max_players: 1,
      reserve_non_confirmed_places: true,
    });

    const { req, res } = makeReqRes({
      params: { id: t._id.toString() },
      body: {},
      session: { authenticated: true, user: { id: organizerId.toString() } },
    });
    await join_tournament(req, res);

    assert.equal(res._status, 201);
    createdEntryIds.push(res._body._id);

    const updated = await Torneo.findById(t._id);
    assert.equal(updated.isFull, true, "El torneo debe marcarse como isFull");
    console.log("  ✓ isFull activado al llegar al límite");
  });

  test("no marca isFull cuando reserve=false y la entry es pending", async () => {
    const t = await createTournament({
      name: "Torneo Reserva Off",
      max_players: 1,
      reserve_non_confirmed_places: false,
      auto_accept_participants: false,
    });

    const { req, res } = makeReqRes({
      params: { id: t._id.toString() },
      body: {},
      session: { authenticated: true, user: { id: organizerId.toString() } },
    });
    await join_tournament(req, res);

    assert.equal(res._status, 201);
    createdEntryIds.push(res._body._id);

    const updated = await Torneo.findById(t._id);
    assert.equal(
      updated.isFull,
      false,
      "No debe marcarse isFull si la entry está pendiente y reserve=false",
    );
    console.log("  ✓ isFull no activado con reserve=false y entry pendiente");
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// get_organized_tournaments — agregación real de entry_counts
// ═════════════════════════════════════════════════════════════════════════════

describe("get_organized_tournaments (integración)", () => {
  test("devuelve entry_counts correctos por status", async () => {
    const t = await createTournament({ name: "Torneo Counts" });
    await createEntry(t._id, { status: "accepted" });
    await createEntry(t._id, { status: "accepted" });
    await createEntry(t._id, { status: "pending" });
    await createEntry(t._id, { status: "rejected" });

    const { req, res } = makeReqRes({
      user: { id: organizerId.toString(), isVerified: true, isAdmin: false },
    });
    await get_organized_tournaments(req, res);

    assert.equal(res._status, 200);
    const found = res._body.find((t_) => t_.name === "Torneo Counts");
    assert.ok(found, "Debe encontrar el torneo creado");
    assert.equal(found.entry_counts.accepted, 2);
    assert.equal(found.entry_counts.pending, 1);
    assert.equal(found.entry_counts.rejected, 1);
    console.log(
      "  ✓ entry_counts correctos: aceptados=2, pendientes=1, rechazados=1",
    );
  });

  test("torneos sin inscripciones tienen entry_counts en cero", async () => {
    const t = await createTournament({ name: "Torneo Vacío Counts" });

    const { req, res } = makeReqRes({
      user: { id: organizerId.toString(), isVerified: true, isAdmin: false },
    });
    await get_organized_tournaments(req, res);

    assert.equal(res._status, 200);
    const found = res._body.find((t_) => t_.name === "Torneo Vacío Counts");
    assert.ok(found);
    assert.deepEqual(found.entry_counts, {
      pending: 0,
      accepted: 0,
      rejected: 0,
    });
    console.log("  ✓ entry_counts en cero para torneo sin inscripciones");
  });

  test("no devuelve torneos de otros organizadores", async () => {
    const ajeno = await Torneo.create({
      authorId: otherUserId,
      name: "Torneo Ajeno",
      ubication: "url",
      format: "Swiss",
      enter_cost: "0",
      tournament_date_hour: new Date(Date.now() + 86400 * 1000),
    });

    const { req, res } = makeReqRes({
      user: { id: organizerId.toString(), isVerified: true, isAdmin: false },
    });
    await get_organized_tournaments(req, res);

    await Torneo.deleteOne({ _id: ajeno._id });

    assert.equal(res._status, 200);
    const names = res._body.map((t) => t.name);
    assert.ok(
      !names.includes("Torneo Ajeno"),
      "No debe devolver torneos de otros organizadores",
    );
    console.log("  ✓ Torneos ajenos no incluidos");
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// patch_entry — transiciones de estado e isFull
// ═════════════════════════════════════════════════════════════════════════════

describe("patch_entry (integración)", () => {
  test("acepta una entry pendiente y recalcula isFull con reserve=true", async () => {
    const t = await createTournament({
      name: "Torneo Patch isFull",
      max_players: 1,
      reserve_non_confirmed_places: true,
    });
    const e = await createEntry(t._id, { status: "pending" });

    // La entry pending ya ocupa la plaza (reserve=true), así que el torneo ya debería estar lleno
    await Torneo.updateOne({ _id: t._id }, { isFull: true });

    const { req, res } = makeReqRes({
      params: { id: t._id.toString(), entryId: e._id.toString() },
      body: { status: "accepted" },
      user: { id: organizerId.toString() },
    });
    await patch_entry(req, res);

    assert.equal(res._status, 200);
    assert.equal(res._body.status, "accepted");

    const updated = await Torneo.findById(t._id);
    assert.equal(
      updated.isFull,
      true,
      "Sigue lleno: hay 1 accepted sobre max=1",
    );
    console.log("  ✓ Entry aceptada, torneo sigue lleno");
  });

  test("rechazar la única entry aceptada reabre el torneo (reserve=false)", async () => {
    const t = await createTournament({
      name: "Torneo Reabre",
      max_players: 1,
      reserve_non_confirmed_places: false,
      isFull: true,
    });
    // Actualizamos directamente el torneo a lleno
    await Torneo.updateOne({ _id: t._id }, { isFull: true });
    const e = await createEntry(t._id, { status: "accepted" });

    const { req, res } = makeReqRes({
      params: { id: t._id.toString(), entryId: e._id.toString() },
      body: { status: "rejected" },
      user: { id: organizerId.toString() },
    });
    await patch_entry(req, res);

    assert.equal(res._status, 200);
    const updated = await Torneo.findById(t._id);
    assert.equal(
      updated.isFull,
      false,
      "Debe reabrirse al no quedar accepted suficientes",
    );
    console.log("  ✓ Torneo reabierto al rechazar la única entry aceptada");
  });

  test("guarda placement y metadata correctamente en DB", async () => {
    const t = await createTournament({ name: "Torneo Resultados" });
    const e = await createEntry(t._id, { status: "accepted" });

    const { req, res } = makeReqRes({
      params: { id: t._id.toString(), entryId: e._id.toString() },
      body: { placement: "1º", metadata: { comment: "Gran actuación" } },
      user: { id: organizerId.toString() },
    });
    await patch_entry(req, res);

    assert.equal(res._status, 200);
    const persisted = await TournamentEntry.findById(e._id);
    assert.equal(persisted.placement, "1º");
    assert.equal(persisted.metadata.comment, "Gran actuación");
    console.log("  ✓ placement y metadata persistidos en BD");
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// delete_entry — borrado y reset de isFull
// ═════════════════════════════════════════════════════════════════════════════

describe("delete_entry (integración)", () => {
  test("elimina la entry de la BD", async () => {
    const t = await createTournament({ name: "Torneo Borrado Entry" });
    const e = await createEntry(t._id);

    const { req, res } = makeReqRes({
      params: { id: t._id.toString(), entryId: e._id.toString() },
      user: { id: organizerId.toString() },
    });
    await delete_entry(req, res);

    assert.equal(res._status, 200);
    const found = await TournamentEntry.findById(e._id);
    assert.equal(found, null, "La entry debe haber sido eliminada de la BD");
    // Eliminar del tracker para no intentar borrar en after()
    createdEntryIds.splice(createdEntryIds.indexOf(e._id), 1);
    console.log("  ✓ Entry eliminada de la BD");
  });

  test("reabre el torneo al eliminar una entry si estaba lleno", async () => {
    const t = await createTournament({
      name: "Torneo Reopen On Delete",
      max_players: 1,
    });
    await Torneo.updateOne({ _id: t._id }, { isFull: true });
    const e = await createEntry(t._id, { status: "accepted" });

    const { req, res } = makeReqRes({
      params: { id: t._id.toString(), entryId: e._id.toString() },
      user: { id: organizerId.toString() },
    });
    await delete_entry(req, res);

    assert.equal(res._status, 200);
    const updated = await Torneo.findById(t._id);
    assert.equal(updated.isFull, false, "Debe reabrirse al eliminar la entry");
    createdEntryIds.splice(createdEntryIds.indexOf(e._id), 1);
    console.log("  ✓ isFull reseteado al eliminar entry");
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// get_entries — visibilidad solo para organizador
// ═════════════════════════════════════════════════════════════════════════════

describe("get_entries (integración)", () => {
  test("devuelve todas las entries del torneo para el organizador", async () => {
    const t = await createTournament({ name: "Torneo Get Entries" });
    await createEntry(t._id, { status: "pending" });
    await createEntry(t._id, { status: "accepted" });
    await createEntry(t._id, { status: "rejected" });

    const { req, res } = makeReqRes({
      params: { id: t._id.toString() },
      user: { id: organizerId.toString() },
    });
    await get_entries(req, res);

    assert.equal(res._status, 200);
    assert.equal(res._body.length, 3);
    const statuses = res._body.map((e) => e.status).sort();
    assert.deepEqual(statuses, ["accepted", "pending", "rejected"]);
    console.log("  ✓ Devuelve los 3 entries con sus statuses correctos");
  });

  test("devuelve 403 para usuario que no es el organizador", async () => {
    const t = await createTournament({ name: "Torneo Forbidden Entries" });

    const { req, res } = makeReqRes({
      params: { id: t._id.toString() },
      user: { id: otherUserId.toString() },
    });
    await get_entries(req, res);

    assert.equal(res._status, 403);
    console.log("  ✓ 403 para usuario no organizador");
  });
});
