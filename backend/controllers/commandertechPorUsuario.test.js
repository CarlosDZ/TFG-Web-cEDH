/**
 * Tests de integración para obtener_commandertechs_por_usuario.
 *
 * Ejecutar con:
 * node --env-file=.env --test backend/controllers/commandertechPorUsuario.test.js
 */

"use strict";

const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const CommanderTech = require("../models/CommanderTech");
const Usuario = require("../models/User");

let testUserId = null;
let otherUserId = null;
let createdTechIds = [];

const TEST_USER = {
  username: "test_ctech_user_cedh",
  email: "test_ctech_user@example.com",
  salt: "salt_ctech_user",
  password_hash: "hash_ctech_user",
};

const OTHER_USER = {
  username: "test_ctech_other_cedh",
  email: "test_ctech_other@example.com",
  salt: "salt_ctech_other",
  password_hash: "hash_ctech_other",
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

  await CommanderTech.deleteMany({ authorId: testUserId });
  await CommanderTech.deleteMany({ authorId: otherUserId });

  const techs = await CommanderTech.insertMany([
    {
      authorId: testUserId,
      title: "Thassa Oracle combo explicado",
      pickup_lane: "Cómo ejecutar la combo de Thassa Oracle correctamente.",
      commander: ["Tymna the Weaver", "Thrasios, Triton Hero"],
      text_markdown: "# Análisis\nContenido completo.",
      tags: ["combo", "win-con"],
      allowComments: true,
      lastChangeDate: new Date(),
    },
    {
      authorId: testUserId,
      title: "Manejo del stack en cEDH",
      pickup_lane: "Guía para prioridades y la pila.",
      commander: ["Kenrith, the Returned King"],
      text_markdown: "# Stack\nExplicación.",
      tags: ["reglas"],
      allowComments: true,
      lastChangeDate: new Date(),
    },
    {
      authorId: otherUserId,
      title: "Tech de otro usuario",
      pickup_lane: "No debe aparecer en resultados del primer usuario.",
      commander: ["Najeela, the Blade-Blossom"],
      text_markdown: "# Otro\nContenido.",
      tags: [],
      allowComments: true,
      lastChangeDate: new Date(),
    },
  ]);
  createdTechIds = techs.map((t) => t._id);
});

after(async () => {
  await CommanderTech.deleteMany({ authorId: testUserId });
  await CommanderTech.deleteMany({ authorId: otherUserId });
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

test("devuelve las techs del usuario solicitado", async () => {
  const {
    obtener_commandertechs_por_usuario,
  } = require("../controllers/commandertech");

  const req = { params: { userId: testUserId.toString() } };
  const res = makeRes();

  await obtener_commandertechs_por_usuario(req, res);

  assert.equal(res._status, 200);
  assert.ok(Array.isArray(res._body));
  assert.equal(
    res._body.length,
    2,
    "Debe devolver exactamente las 2 techs del usuario",
  );

  console.log(`  ✓ Devuelve ${res._body.length} techs del usuario`);
});

test("no devuelve techs de otros usuarios", async () => {
  const {
    obtener_commandertechs_por_usuario,
  } = require("../controllers/commandertech");

  const req = { params: { userId: testUserId.toString() } };
  const res = makeRes();

  await obtener_commandertechs_por_usuario(req, res);

  assert.equal(res._status, 200);
  assert.ok(
    !res._body.some((t) => t.title === "Tech de otro usuario"),
    "No debe incluir techs de otros usuarios",
  );

  console.log(`  ✓ Techs de otros usuarios excluidas correctamente`);
});

test("devuelve array vacío para usuario sin techs", async () => {
  const {
    obtener_commandertechs_por_usuario,
  } = require("../controllers/commandertech");

  const tempUser = await Usuario.create({
    username: "test_ctech_empty_user",
    email: "test_ctech_empty@example.com",
    salt: "s_empty",
    password_hash: "h_empty",
  });

  const req = { params: { userId: tempUser._id.toString() } };
  const res = makeRes();

  await obtener_commandertechs_por_usuario(req, res);
  await Usuario.deleteOne({ _id: tempUser._id });

  assert.equal(res._status, 200);
  assert.deepEqual(res._body, []);

  console.log(`  ✓ Array vacío para usuario sin techs`);
});

test("las techs devueltas incluyen los campos necesarios", async () => {
  const {
    obtener_commandertechs_por_usuario,
  } = require("../controllers/commandertech");

  const req = { params: { userId: testUserId.toString() } };
  const res = makeRes();

  await obtener_commandertechs_por_usuario(req, res);

  assert.equal(res._status, 200);
  assert.ok(res._body.length > 0);

  const tech = res._body[0];
  assert.ok(tech._id, "Debe incluir _id");
  assert.ok(tech.title, "Debe incluir title");
  assert.ok(tech.pickup_lane !== undefined, "Debe incluir pickup_lane");
  assert.ok(
    tech.text_markdown !== undefined,
    "Debe incluir text_markdown (necesario para el detail)",
  );
  assert.ok(
    tech.allowComments !== undefined,
    "Debe incluir allowComments (necesario para el detail)",
  );
  assert.ok(Array.isArray(tech.commander), "Debe incluir commander como array");
  assert.ok(tech.authorId, "Debe incluir authorId populado");
  assert.ok(tech.authorId.username, "authorId debe incluir username");

  console.log(`  ✓ Campos correctos en tech devuelta: ${tech.title}`);
});

test("las techs están ordenadas por lastChangeDate descendente", async () => {
  const {
    obtener_commandertechs_por_usuario,
  } = require("../controllers/commandertech");

  // Actualizar la segunda tech para que sea más reciente
  await CommanderTech.updateOne(
    { title: "Manejo del stack en cEDH", authorId: testUserId },
    { lastChangeDate: new Date(Date.now() + 10000) },
  );

  const req = { params: { userId: testUserId.toString() } };
  const res = makeRes();

  await obtener_commandertechs_por_usuario(req, res);

  assert.equal(res._status, 200);
  assert.equal(res._body.length, 2);

  const dates = res._body.map((t) => new Date(t.lastChangeDate).getTime());
  assert.ok(
    dates[0] >= dates[1],
    "Las techs deben estar ordenadas por fecha descendente",
  );

  console.log(`  ✓ Orden por fecha descendente correcto`);
});
