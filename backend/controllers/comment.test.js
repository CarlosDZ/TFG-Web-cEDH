/**
 * Tests de integración para los endpoints de búsqueda de discusiones.
 *
 * Ejecutar con:
 * node --env-file=.env --test backend/controllers/comment.test.js
 */

const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const Comentario = require("../models/Comment");
const Usuario = require("../models/User");

let testUserId = null;
let createdIds = [];

const TEST_USER = {
  username: "test_search_comment_user",
  email: "test_search_comment@example.com",
  salt: "testsalt_comment",
  password_hash: "testhash_comment",
};

const TEST_DISCUSSIONS = [
  {
    title: "Mejores cartas para Tymna Thrasios",
    markdown_text:
      "Hablemos sobre las mejores techs para este par de comandantes.",
    parentId: null,
    comentingOnDeck: false,
  },
  {
    // Título con signos de interrogación y acento (caracteres especiales de regex)
    title: "¿Cuándo jugar Thassa Oracle?",
    markdown_text: "Tips para saber cuando ejecutar la combo.",
    parentId: null,
    comentingOnDeck: false,
  },
  {
    // Título con paréntesis y punto
    title: "Mulligans en cEDH (guía v1.2)",
    markdown_text: "Cómo hacer mulligan correctamente.",
    parentId: null,
    comentingOnDeck: false,
  },
  {
    // Título con guion y apóstrofo — posibles en títulos libres
    title: "Urza's combo: step-by-step",
    markdown_text: "Guía detallada del combo de Urza.",
    parentId: null,
    comentingOnDeck: false,
  },
  {
    title: "Discusión oculta (deck comment)",
    markdown_text:
      "Este comentario es sobre un deck, no debe aparecer en búsqueda de discusiones.",
    parentId: null,
    comentingOnDeck: true,
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

  await Comentario.deleteMany({ authorId: testUserId });

  const docs = await Comentario.insertMany(
    TEST_DISCUSSIONS.map((d) => ({ ...d, authorId: testUserId })),
  );
  createdIds = docs.map((d) => d._id);
});

after(async () => {
  await Comentario.deleteMany({ authorId: testUserId });
  await Usuario.deleteOne({ _id: testUserId });
  await mongoose.disconnect();
});

// --- search_discusiones ---

test("search devuelve discusiones que coinciden con la query", async () => {
  const { search_discusiones } = require("../controllers/comment");

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

  await search_discusiones(req, res);

  assert.equal(statusCode, 200);
  assert.ok(Array.isArray(responseBody));
  assert.ok(responseBody.length > 0, "Debe encontrar al menos una discusión");
  assert.ok(
    responseBody.some((d) => d.title.toLowerCase().includes("tymna")),
    "Debe incluir la discusión con 'Tymna' en el título",
  );

  console.log(
    `  ✓ Encontradas: ${responseBody.map((d) => d.title).join(", ")}`,
  );
});

test("search no devuelve comentarios de deck (comentingOnDeck: true)", async () => {
  const { search_discusiones } = require("../controllers/comment");

  let responseBody, statusCode;
  const req = { query: { q: "oculta" } };
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

  await search_discusiones(req, res);

  assert.equal(statusCode, 200);
  assert.ok(Array.isArray(responseBody));
  assert.equal(
    responseBody.length,
    0,
    "No debe devolver comentarios de deck aunque coincidan con la query",
  );

  console.log(`  ✓ Comentarios de deck no aparecen en búsqueda de discusiones`);
});

test("search no devuelve respuestas (parentId no nulo)", async () => {
  const { search_discusiones } = require("../controllers/comment");

  // Crear una respuesta a la primera discusión
  const reply = await Comentario.create({
    authorId: testUserId,
    parentId: createdIds[0],
    comentingOnDeck: false,
    title: "Respuesta con Tymna en el título",
    markdown_text: "Esta es una respuesta, no una discusión raíz.",
  });

  let responseBody, statusCode;
  const req = { query: { q: "Respuesta con Tymna" } };
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

  await search_discusiones(req, res);
  await Comentario.deleteOne({ _id: reply._id });

  assert.equal(statusCode, 200);
  assert.equal(
    responseBody.length,
    0,
    "No debe devolver respuestas anidadas, solo discusiones raíz",
  );

  console.log(`  ✓ Respuestas anidadas no aparecen en resultados`);
});

test("search no expone datos sensibles del autor", async () => {
  const { search_discusiones } = require("../controllers/comment");

  let responseBody, statusCode;
  const req = { query: { q: "Thassa" } };
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

  await search_discusiones(req, res);

  assert.equal(statusCode, 200);
  assert.ok(responseBody.length > 0);
  const author = responseBody[0].authorId;
  assert.ok(!author.password_hash, "No debe exponer password_hash");
  assert.ok(!author.salt, "No debe exponer salt");
  assert.ok(!author.email, "No debe exponer email");

  console.log(`  ✓ Datos sensibles no expuestos en autor: ${author.username}`);
});

test("search devuelve vacío para query menor de 2 caracteres", async () => {
  const { search_discusiones } = require("../controllers/comment");

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

  await search_discusiones(req, res);

  assert.equal(statusCode, 200);
  assert.deepEqual(responseBody, []);

  console.log(`  ✓ Query corta devuelve array vacío`);
});

test("search devuelve vacío para query sin coincidencias", async () => {
  const { search_discusiones } = require("../controllers/comment");

  let responseBody, statusCode;
  const req = { query: { q: "xyzxyzxyz_discusion_no_existe" } };
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

  await search_discusiones(req, res);

  assert.equal(statusCode, 200);
  assert.equal(responseBody.length, 0);

  console.log(`  ✓ Sin coincidencias devuelve array vacío`);
});

// --- casos extremos de caracteres ---

test("search encuentra discusión con paréntesis y punto en el título", async () => {
  const { search_discusiones } = require("../controllers/comment");

  let responseBody, statusCode;
  const req = { query: { q: "Mulligans en cEDH (guía v1.2)" } };
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

  await search_discusiones(req, res);

  assert.equal(statusCode, 200);
  assert.ok(
    responseBody.some((d) => d.title === "Mulligans en cEDH (guía v1.2)"),
    "Debe encontrar la discusión con paréntesis y punto",
  );

  console.log(`  ✓ Discusión con paréntesis y punto encontrada`);
});

test("search encuentra discusión con guion y apóstrofo en el título", async () => {
  const { search_discusiones } = require("../controllers/comment");

  let responseBody, statusCode;
  const req = { query: { q: "Urza's combo: step-by-step" } };
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

  await search_discusiones(req, res);

  assert.equal(statusCode, 200);
  assert.ok(
    responseBody.some((d) => d.title === "Urza's combo: step-by-step"),
    "Debe encontrar la discusión con guion y apóstrofo",
  );

  console.log(`  ✓ Discusión con guion y apóstrofo encontrada`);
});

test("search encuentra discusión con signos de interrogación y acentos", async () => {
  const { search_discusiones } = require("../controllers/comment");

  let responseBody, statusCode;
  const req = { query: { q: "¿Cuándo jugar Thassa Oracle?" } };
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

  await search_discusiones(req, res);

  assert.equal(statusCode, 200);
  assert.ok(
    responseBody.some((d) => d.title === "¿Cuándo jugar Thassa Oracle?"),
    "Debe encontrar la discusión con signos de interrogación y acentos",
  );

  console.log(`  ✓ Discusión con signos especiales y acentos encontrada`);
});
