/**
 * Tests de integración para obtener_decklists_por_usuario.
 *
 * Ejecutar con:
 * node --env-file=.env --test backend/controllers/decklistPorUsuario.test.js
 */

"use strict";

const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const Decklist = require("../models/Decklist");
const Usuario = require("../models/User");

let testUserId = null;
let otherUserId = null;
let createdDeckIds = [];

const TEST_USER = {
  username: "test_decklist_user_cedh",
  email: "test_decklist_user@example.com",
  salt: "salt_decklist_user",
  password_hash: "hash_decklist_user",
};

const OTHER_USER = {
  username: "test_decklist_other_cedh",
  email: "test_decklist_other@example.com",
  salt: "salt_decklist_other",
  password_hash: "hash_decklist_other",
};

before(async () => {
  const mongoUrl = process.env.MONGODB_URL;
  if (!mongoUrl)
    throw new Error("MONGODB_URL no definida. Ejecuta con --env-file=.env");
  await mongoose.connect(mongoUrl);

  await Usuario.deleteOne({ username: TEST_USER.username });
  await Usuario.deleteOne({ username: OTHER_USER.username });

  const user = await Usuario.create(TEST_USER);
  testUserId = user._id;

  const other = await Usuario.create(OTHER_USER);
  otherUserId = other._id;

  await Decklist.deleteMany({ authorId: testUserId });
  await Decklist.deleteMany({ authorId: otherUserId });

  const decks = await Decklist.insertMany([
    {
      authorId: testUserId,
      title: "Tymna Thrasios Stax",
      commander: ["Tymna the Weaver", "Thrasios, Triton Hero"],
      description: "Deck de stax competitivo.",
      cards: [],
      isPublic: true,
      allowComments: true,
    },
    {
      authorId: testUserId,
      title: "Kenrith Combo",
      commander: ["Kenrith, the Returned King"],
      description: "Combo infinito con Kenrith.",
      cards: [],
      isPublic: true,
      allowComments: false,
    },
    {
      authorId: testUserId,
      title: "Deck Privado",
      commander: ["Thassa, Deep-Dwelling"],
      description: "Este deck es privado.",
      cards: [],
      isPublic: false,
      allowComments: false,
    },
    {
      authorId: otherUserId,
      title: "Deck de Otro Usuario",
      commander: ["Najeela, the Blade-Blossom"],
      description: "No debe aparecer.",
      cards: [],
      isPublic: true,
      allowComments: true,
    },
  ]);
  createdDeckIds = decks.map((d) => d._id);
});

after(async () => {
  await Decklist.deleteMany({ authorId: testUserId });
  await Decklist.deleteMany({ authorId: otherUserId });
  await Usuario.deleteOne({ _id: testUserId });
  await Usuario.deleteOne({ _id: otherUserId });
  await mongoose.disconnect();
});

function makeRes() {
  const res = { _status: null, _body: null };
  res.status = (c) => {
    res._status = c;
    return res;
  };
  res.json = (b) => {
    res._body = b;
    return res;
  };
  return res;
}

test("devuelve solo decklists públicas del usuario solicitado", async () => {
  const { obtener_decklists_por_usuario } = require("../controllers/decklist");

  const req = { params: { userId: testUserId.toString() } };
  const res = makeRes();

  await obtener_decklists_por_usuario(req, res);

  assert.equal(res._status, 200);
  assert.ok(Array.isArray(res._body));
  assert.equal(
    res._body.length,
    2,
    "Solo debe devolver los 2 decks públicos del usuario",
  );
  assert.ok(
    res._body.every((d) => d.isPublic === true),
    "Todos los decks devueltos deben ser públicos",
  );
  assert.ok(
    res._body.every(
      (d) =>
        d.authorId._id?.toString() === testUserId.toString() ||
        d.authorId?.toString() === testUserId.toString(),
    ),
    "Todos los decks deben pertenecer al usuario solicitado",
  );

  console.log(`  ✓ Devuelve ${res._body.length} decks públicos del usuario`);
});

test("no devuelve decks de otros usuarios", async () => {
  const { obtener_decklists_por_usuario } = require("../controllers/decklist");

  const req = { params: { userId: testUserId.toString() } };
  const res = makeRes();

  await obtener_decklists_por_usuario(req, res);

  assert.equal(res._status, 200);
  assert.ok(
    !res._body.some((d) => d.title === "Deck de Otro Usuario"),
    "No debe incluir decks de otros usuarios",
  );

  console.log(`  ✓ Decks de otros usuarios excluidos correctamente`);
});

test("no devuelve decks privados", async () => {
  const { obtener_decklists_por_usuario } = require("../controllers/decklist");

  const req = { params: { userId: testUserId.toString() } };
  const res = makeRes();

  await obtener_decklists_por_usuario(req, res);

  assert.equal(res._status, 200);
  assert.ok(
    !res._body.some((d) => d.title === "Deck Privado"),
    "No debe incluir decks privados",
  );

  console.log(`  ✓ Decks privados excluidos correctamente`);
});

test("devuelve array vacío para usuario sin decks públicos", async () => {
  const { obtener_decklists_por_usuario } = require("../controllers/decklist");

  const tempUser = await Usuario.create({
    username: "test_decklist_empty_user",
    email: "test_decklist_empty@example.com",
    salt: "s_empty",
    password_hash: "h_empty",
  });

  const req = { params: { userId: tempUser._id.toString() } };
  const res = makeRes();

  await obtener_decklists_por_usuario(req, res);
  await Usuario.deleteOne({ _id: tempUser._id });

  assert.equal(res._status, 200);
  assert.deepEqual(res._body, []);

  console.log(`  ✓ Array vacío para usuario sin decks`);
});

test("los decks devueltos incluyen los campos necesarios", async () => {
  const { obtener_decklists_por_usuario } = require("../controllers/decklist");

  const req = { params: { userId: testUserId.toString() } };
  const res = makeRes();

  await obtener_decklists_por_usuario(req, res);

  assert.equal(res._status, 200);
  assert.ok(res._body.length > 0);

  const deck = res._body[0];
  assert.ok(deck._id, "Debe incluir _id");
  assert.ok(deck.title, "Debe incluir title");
  assert.ok(Array.isArray(deck.commander), "Debe incluir commander como array");
  assert.ok(deck.authorId, "Debe incluir authorId populado");
  assert.ok(deck.authorId.username, "authorId debe incluir username");
  assert.ok(!deck.cards || Array.isArray(deck.cards), "cards puede estar o no");

  console.log(`  ✓ Campos correctos en deck devuelto: ${deck.title}`);
});
