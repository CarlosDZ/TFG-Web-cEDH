/**
 * Tests de integración para los endpoints de búsqueda de commander techs.
 *
 * Ejecutar con:
 * node --env-file=.env --test backend/controllers/commandertech.test.js
 */

const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const CommanderTech = require("../models/CommanderTech");
const Usuario = require("../models/User");

let testUserId = null;

const TEST_USER = {
  username: "test_search_ctech_user",
  email: "test_search_ctech@example.com",
  salt: "testsalt_ctech",
  password_hash: "testhash_ctech",
};

const TEST_TECHS = [
  {
    commander: ["Tymna the Weaver", "Thrasios, Triton Hero"],
    text_markdown: "Tech para Tymna Thrasios con muchas cartas azules.",
  },
  {
    // Comandante con coma
    commander: ["Najeela, the Blade-Blossom"],
    text_markdown: "Guía de techs para Najeela aggro.",
  },
  {
    commander: ["Thrasios, Triton Hero", "Vial Smasher the Fierce"],
    text_markdown: "Tech para el par Thrasios Vial Smasher.",
  },
  {
    // Comandante DFC con '//'
    commander: ["Etali, Primal Conqueror // Etali, Primal Sickness"],
    text_markdown: "Tech para Etali DFC.",
  },
  {
    // Comandante con apóstrofo
    commander: ["Urza, Lord High Artificer"],
    text_markdown: "Tech para Urza stax.",
  },
];

before(async () => {
  const mongoUrl = process.env.MONGODB_URL;
  if (!mongoUrl)
    throw new Error("MONGODB_URL no definida. Ejecuta con --env-file=.env");
  await mongoose.connect(mongoUrl);

  await Usuario.deleteOne({ username: TEST_USER.username });
  const user = await Usuario.create(TEST_USER);
  testUserId = user._id;

  await CommanderTech.deleteMany({ authorId: testUserId });
  await CommanderTech.insertMany(
    TEST_TECHS.map((t) => ({ ...t, authorId: testUserId })),
  );
});

after(async () => {
  await CommanderTech.deleteMany({ authorId: testUserId });
  await Usuario.deleteOne({ _id: testUserId });
  await mongoose.disconnect();
});

// --- search_commandertechs ---

test("search devuelve techs cuyo comandante coincide con la query", async () => {
  const { search_commandertechs } = require("../controllers/commandertech");

  let responseBody, statusCode;
  const req = { query: { q: "Tymna" } };
  const res = {
    status(c) {
      statusCode = c;
      return this;
    },
    json(b) {
      responseBody = b;
      return this;
    },
  };

  await search_commandertechs(req, res);

  assert.equal(statusCode, 200);
  assert.ok(Array.isArray(responseBody));
  assert.ok(responseBody.length > 0, "Debe encontrar techs con Tymna");
  assert.ok(
    responseBody.every((t) =>
      t.commander.some((c) => c.toLowerCase().includes("tymna")),
    ),
    "Todos los resultados deben tener 'Tymna' en el array de comandantes",
  );

  console.log(
    `  ✓ Techs para 'Tymna': ${responseBody.map((t) => t.commander.join(" / ")).join(" | ")}`,
  );
});

test("search devuelve múltiples techs cuando el comandante está en varias entradas", async () => {
  const { search_commandertechs } = require("../controllers/commandertech");

  let responseBody, statusCode;
  const req = { query: { q: "Thrasios" } };
  const res = {
    status(c) {
      statusCode = c;
      return this;
    },
    json(b) {
      responseBody = b;
      return this;
    },
  };

  await search_commandertechs(req, res);

  assert.equal(statusCode, 200);
  assert.ok(Array.isArray(responseBody));
  // Thrasios aparece en dos de los tres techs de prueba
  assert.ok(
    responseBody.length >= 2,
    "Debe devolver los dos techs que incluyen a Thrasios",
  );
  assert.ok(
    responseBody.every((t) =>
      t.commander.some((c) => c.toLowerCase().includes("thrasios")),
    ),
    "Todos los resultados deben tener 'Thrasios' en el array de comandantes",
  );

  console.log(
    `  ✓ Techs para 'Thrasios': ${responseBody.map((t) => t.commander.join(" / ")).join(" | ")}`,
  );
});

test("search no expone datos sensibles del autor", async () => {
  const { search_commandertechs } = require("../controllers/commandertech");

  let responseBody, statusCode;
  const req = { query: { q: "Najeela" } };
  const res = {
    status(c) {
      statusCode = c;
      return this;
    },
    json(b) {
      responseBody = b;
      return this;
    },
  };

  await search_commandertechs(req, res);

  assert.equal(statusCode, 200);
  assert.ok(responseBody.length > 0);
  const author = responseBody[0].authorId;
  assert.ok(!author.password_hash, "No debe exponer password_hash");
  assert.ok(!author.salt, "No debe exponer salt");
  assert.ok(!author.email, "No debe exponer email");

  console.log(`  ✓ Datos sensibles no expuestos en autor: ${author.username}`);
});

test("search devuelve vacío para query menor de 2 caracteres", async () => {
  const { search_commandertechs } = require("../controllers/commandertech");

  let responseBody, statusCode;
  const req = { query: { q: "T" } };
  const res = {
    status(c) {
      statusCode = c;
      return this;
    },
    json(b) {
      responseBody = b;
      return this;
    },
  };

  await search_commandertechs(req, res);

  assert.equal(statusCode, 200);
  assert.deepEqual(responseBody, []);

  console.log(`  ✓ Query corta devuelve array vacío`);
});

test("search devuelve vacío para query sin coincidencias", async () => {
  const { search_commandertechs } = require("../controllers/commandertech");

  let responseBody, statusCode;
  const req = { query: { q: "xyzxyzxyz_commander_no_existe" } };
  const res = {
    status(c) {
      statusCode = c;
      return this;
    },
    json(b) {
      responseBody = b;
      return this;
    },
  };

  await search_commandertechs(req, res);

  assert.equal(statusCode, 200);
  assert.equal(responseBody.length, 0);

  console.log(`  ✓ Sin coincidencias devuelve array vacío`);
});

// --- casos extremos de caracteres ---

test("search encuentra tech con comandante que tiene coma en el nombre", async () => {
  const { search_commandertechs } = require("../controllers/commandertech");

  let responseBody, statusCode;
  const req = { query: { q: "Najeela, the Blade-Blossom" } };
  const res = {
    status(c) {
      statusCode = c;
      return this;
    },
    json(b) {
      responseBody = b;
      return this;
    },
  };

  await search_commandertechs(req, res);

  assert.equal(statusCode, 200);
  assert.ok(
    responseBody.some((t) =>
      t.commander.some((c) => c.includes("Najeela, the Blade-Blossom")),
    ),
    "Debe encontrar la tech con coma en el nombre del comandante",
  );

  console.log(`  ✓ Comandante con coma encontrado`);
});

test("search encuentra tech con comandante DFC que tiene '//' en el nombre", async () => {
  const { search_commandertechs } = require("../controllers/commandertech");

  let responseBody, statusCode;
  const req = { query: { q: "Etali, Primal Conqueror // Etali" } };
  const res = {
    status(c) {
      statusCode = c;
      return this;
    },
    json(b) {
      responseBody = b;
      return this;
    },
  };

  await search_commandertechs(req, res);

  assert.equal(statusCode, 200);
  assert.ok(
    responseBody.some((t) => t.commander.some((c) => c.includes("Etali"))),
    "Debe encontrar la tech con '//' en el nombre del comandante DFC",
  );

  console.log(`  ✓ Comandante DFC con '//' encontrado`);
});

test("search encuentra tech con comandante que tiene apóstrofo en el nombre", async () => {
  const { search_commandertechs } = require("../controllers/commandertech");

  let responseBody, statusCode;
  const req = { query: { q: "Urza, Lord High Artificer" } };
  const res = {
    status(c) {
      statusCode = c;
      return this;
    },
    json(b) {
      responseBody = b;
      return this;
    },
  };

  await search_commandertechs(req, res);

  assert.equal(statusCode, 200);
  assert.ok(
    responseBody.some((t) =>
      t.commander.some((c) => c.includes("Urza, Lord High Artificer")),
    ),
    "Debe encontrar la tech con apóstrofo en el nombre del comandante",
  );

  console.log(`  ✓ Comandante con apóstrofo encontrado`);
});
