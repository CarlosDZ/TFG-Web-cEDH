/**
 * Tests de integración para los endpoints de búsqueda de decklists.
 *
 * Ejecutar con:
 * node --env-file=.env --test backend/controllers/decklistSearch.test.js
 */

const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const Decklist = require("../models/Decklist");
const Usuario = require("../models/User");

let testUserId = null;
let createdIds = [];

const TEST_USER = {
  username: "test_search_decklist_user",
  email: "test_search_decklist@example.com",
  salt: "testsalt_deck",
  password_hash: "testhash_deck",
};

const TEST_DECKS = [
  {
    title: "SISAY 1.4 (help me)",
    commander: ["Sisay, Weatherlight Captain"],
    color_identity: "WUBRG",
    isPublic: true,
  },
  {
    // Título con punto y guion
    title: "Turbo-Naus v2.0 Optimizado",
    commander: ["Tymna the Weaver", "Thrasios, Triton Hero"],
    color_identity: "WUBG",
    isPublic: true,
  },
  {
    title: "Najeela Aggro",
    // Comandante con coma (muy común en cartas de Magic)
    commander: ["Najeela, the Blade-Blossom"],
    color_identity: "WUBRG",
    isPublic: true,
  },
  {
    title: "Etali DFC Build",
    // Comandante DFC con '//' en el nombre
    commander: ["Etali, Primal Conqueror // Etali, Primal Sickness"],
    color_identity: "R",
    isPublic: true,
  },
  {
    // Título con apóstrofo
    title: "Urza's Best Stax",
    // Comandante con apóstrofo
    commander: ["Urza, Lord High Artificer"],
    color_identity: "U",
    isPublic: true,
  },
  {
    title: "Private Brew",
    commander: ["Thrasios, Triton Hero"],
    color_identity: "UG",
    isPublic: false,
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

  // Limpiar posibles restos de tests anteriores
  await Decklist.deleteMany({ authorId: testUserId });

  const decks = await Decklist.insertMany(
    TEST_DECKS.map((d) => ({ ...d, authorId: testUserId })),
  );
  createdIds = decks.map((d) => d._id);
});

after(async () => {
  await Decklist.deleteMany({ authorId: testUserId });
  await Usuario.deleteOne({ _id: testUserId });
  await mongoose.disconnect();
});

// --- search_decklists por título ---

test("search por título devuelve decks públicos que coinciden", async () => {
  const { search_decklists } = require("../controllers/decklist");

  let responseBody, statusCode;
  const req = { query: { q: "naus", by: "title" } };
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

  await search_decklists(req, res);

  assert.equal(statusCode, 200);
  assert.ok(Array.isArray(responseBody));
  assert.ok(responseBody.length > 0, "Debe encontrar al menos un deck");
  assert.ok(
    responseBody.every((d) => d.isPublic !== false),
    "No debe devolver decks privados",
  );
  assert.ok(
    responseBody.some((d) => d.title.toLowerCase().includes("naus")),
    "El resultado debe incluir el deck con 'naus' en el título",
  );

  console.log(
    `  ✓ Por título 'naus': ${responseBody.map((d) => d.title).join(", ")}`,
  );
});

test("search por título no devuelve decks privados", async () => {
  const { search_decklists } = require("../controllers/decklist");

  let responseBody, statusCode;
  const req = { query: { q: "Private", by: "title" } };
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

  await search_decklists(req, res);

  assert.equal(statusCode, 200);
  assert.ok(Array.isArray(responseBody));
  assert.equal(responseBody.length, 0, "No debe devolver el deck privado");

  console.log(`  ✓ Deck privado no aparece en resultados`);
});

test("search por título encuentra decks con caracteres especiales en el nombre", async () => {
  const { search_decklists } = require("../controllers/decklist");

  let responseBody, statusCode;
  const req = { query: { q: "SISAY 1.4 (help me)", by: "title" } };
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

  await search_decklists(req, res);

  assert.equal(statusCode, 200);
  assert.ok(Array.isArray(responseBody));
  assert.ok(
    responseBody.length > 0,
    "Debe encontrar el deck con paréntesis en el nombre",
  );
  assert.ok(
    responseBody.some((d) => d.title === "SISAY 1.4 (help me)"),
    "Debe encontrar exactamente el deck 'SISAY 1.4 (help me)'",
  );

  console.log(`  ✓ Deck con paréntesis encontrado: ${responseBody[0].title}`);
});

test("search por título devuelve vacío para query menor de 2 caracteres", async () => {
  const { search_decklists } = require("../controllers/decklist");

  let responseBody, statusCode;
  const req = { query: { q: "n", by: "title" } };
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

  await search_decklists(req, res);

  assert.equal(statusCode, 200);
  assert.deepEqual(responseBody, []);

  console.log(`  ✓ Query corta devuelve array vacío`);
});

test("search por título devuelve vacío para query sin coincidencias", async () => {
  const { search_decklists } = require("../controllers/decklist");

  let responseBody, statusCode;
  const req = { query: { q: "xyzxyzxyz_deck_no_existe" } };
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

  await search_decklists(req, res);

  assert.equal(statusCode, 200);
  assert.equal(responseBody.length, 0);

  console.log(`  ✓ Sin coincidencias devuelve array vacío`);
});

// --- search_decklists por comandante ---

test("search por comandante devuelve decks con ese comandante", async () => {
  const { search_decklists } = require("../controllers/decklist");

  let responseBody, statusCode;
  const req = { query: { q: "Thrasios", by: "commander" } };
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

  await search_decklists(req, res);

  assert.equal(statusCode, 200);
  assert.ok(Array.isArray(responseBody));
  // Solo el deck público con Thrasios debe aparecer (el privado no)
  assert.ok(responseBody.length > 0, "Debe encontrar decks con Thrasios");
  assert.ok(
    responseBody.every((d) =>
      d.commander.some((c) => c.toLowerCase().includes("thrasios")),
    ),
    "Todos los resultados deben tener Thrasios como comandante",
  );

  console.log(
    `  ✓ Por comandante 'Thrasios': ${responseBody.map((d) => d.title).join(", ")}`,
  );
});

test("search por comandante no incluye decks privados", async () => {
  const { search_decklists } = require("../controllers/decklist");

  // El deck privado tiene a Thrasios — verificar que no aparece
  let responseBody, statusCode;
  const req = { query: { q: "Thrasios", by: "commander" } };
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

  await search_decklists(req, res);

  assert.equal(statusCode, 200);
  // Debe haber exactamente 1 resultado (el público con Tymna+Thrasios), no 2
  const titlesFound = responseBody.map((d) => d.title);
  assert.ok(
    !titlesFound.includes("Private Brew"),
    "El deck privado no debe aparecer",
  );

  console.log(
    `  ✓ Deck privado con Thrasios no aparece: ${titlesFound.join(", ")}`,
  );
});

test("search por comandante devuelve vacío para query corta", async () => {
  const { search_decklists } = require("../controllers/decklist");

  let responseBody, statusCode;
  const req = { query: { q: "T", by: "commander" } };
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

  await search_decklists(req, res);

  assert.equal(statusCode, 200);
  assert.deepEqual(responseBody, []);

  console.log(`  ✓ Query corta por comandante devuelve array vacío`);
});

// --- casos extremos de caracteres ---

test("search por título encuentra deck con punto y guion en el nombre", async () => {
  const { search_decklists } = require("../controllers/decklist");

  let responseBody, statusCode;
  const req = { query: { q: "Turbo-Naus v2.0", by: "title" } };
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

  await search_decklists(req, res);

  assert.equal(statusCode, 200);
  assert.ok(responseBody.some((d) => d.title === "Turbo-Naus v2.0 Optimizado"));

  console.log(
    `  ✓ Deck con punto y guion encontrado: ${responseBody[0].title}`,
  );
});

test("search por título encuentra deck con apóstrofo en el nombre", async () => {
  const { search_decklists } = require("../controllers/decklist");

  let responseBody, statusCode;
  const req = { query: { q: "Urza's Best", by: "title" } };
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

  await search_decklists(req, res);

  assert.equal(statusCode, 200);
  assert.ok(responseBody.some((d) => d.title === "Urza's Best Stax"));

  console.log(`  ✓ Deck con apóstrofo encontrado: ${responseBody[0].title}`);
});

test("search por comandante encuentra comandante con coma en el nombre", async () => {
  const { search_decklists } = require("../controllers/decklist");

  let responseBody, statusCode;
  const req = { query: { q: "Najeela, the Blade-Blossom", by: "commander" } };
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

  await search_decklists(req, res);

  assert.equal(statusCode, 200);
  assert.ok(
    responseBody.some((d) =>
      d.commander.some((c) => c.includes("Najeela, the Blade-Blossom")),
    ),
  );

  console.log(`  ✓ Comandante con coma encontrado`);
});

test("search por comandante encuentra comandante DFC con '//' en el nombre", async () => {
  const { search_decklists } = require("../controllers/decklist");

  let responseBody, statusCode;
  const req = {
    query: { q: "Etali, Primal Conqueror // Etali", by: "commander" },
  };
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

  await search_decklists(req, res);

  assert.equal(statusCode, 200);
  assert.ok(
    responseBody.some((d) => d.commander.some((c) => c.includes("Etali"))),
  );

  console.log(`  ✓ Comandante DFC con '//' encontrado`);
});
