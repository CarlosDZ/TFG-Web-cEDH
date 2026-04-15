/**
 * Tests de integración para los endpoints de búsqueda de usuarios.
 * Requieren que el backend esté arrancado en VITE_BACKEND_URL / BACKEND_PORT.
 *
 * Se ejecutan con: node --test backend/controllers/user.test.js
 * (con el .env cargado o variables de entorno definidas)
 */

const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const Usuario = require("../models/User");

let createdUserId = null;
const extraUserIds = [];

const TEST_USER = {
  username: "test_search_user_cedh",
  email: "test_search_cedh@example.com",
  salt: "testsalt123",
  password_hash: "testhash123",
};

// Usuarios con caracteres permitidos en el username:
// letras, números, puntos, guiones, guiones bajos, paréntesis, acentos.
// Prohibidos: @ ; " ' ¡ ¿ ! : ? { }
const EXTRA_USERS = [
  {
    username: "player.one_cedh",
    email: "player.one@example.com",
    salt: "s1",
    password_hash: "h1",
  },
  {
    username: "jugador-42(es)",
    email: "jugador42@example.com",
    salt: "s2",
    password_hash: "h2",
  },
];

before(async () => {
  const mongoUrl = process.env.MONGODB_URL;
  if (!mongoUrl)
    throw new Error("MONGODB_URL no definida. Ejecuta con --env-file=.env");
  await mongoose.connect(mongoUrl);

  await Usuario.deleteOne({ username: TEST_USER.username });
  for (const u of EXTRA_USERS)
    await Usuario.deleteOne({ username: u.username });

  const user = await Usuario.create(TEST_USER);
  createdUserId = user._id.toString();

  for (const u of EXTRA_USERS) {
    const created = await Usuario.create(u);
    extraUserIds.push(created._id);
  }
});

after(async () => {
  if (createdUserId) await Usuario.deleteOne({ _id: createdUserId });
  for (const id of extraUserIds) await Usuario.deleteOne({ _id: id });
  await mongoose.disconnect();
});

// --- search_usuarios ---

test("search devuelve usuarios que coinciden con la query", async () => {
  const { search_usuarios } = require("../controllers/user");

  let responseBody;
  let statusCode;
  const req = { query: { q: "test_search_user" } };
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      responseBody = body;
      return this;
    },
  };

  await search_usuarios(req, res);

  assert.equal(statusCode, 200);
  assert.ok(Array.isArray(responseBody), "Debe devolver un array");
  assert.ok(responseBody.length > 0, "Debe encontrar al menos un usuario");
  assert.ok(
    responseBody.some((u) => u.username === TEST_USER.username),
    "Debe incluir el usuario de prueba",
  );
  assert.ok(!responseBody[0].password_hash, "No debe exponer password_hash");
  assert.ok(!responseBody[0].salt, "No debe exponer salt");
  assert.ok(!responseBody[0].email, "No debe exponer email");

  console.log(
    `  ✓ Encontrados: ${responseBody.map((u) => u.username).join(", ")}`,
  );
});

test("search devuelve vacío para query menor de 2 caracteres", async () => {
  const { search_usuarios } = require("../controllers/user");

  let responseBody;
  let statusCode;
  const req = { query: { q: "t" } };
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      responseBody = body;
      return this;
    },
  };

  await search_usuarios(req, res);

  assert.equal(statusCode, 200);
  assert.deepEqual(responseBody, []);

  console.log(`  ✓ Query corta devuelve array vacío`);
});

test("search devuelve vacío para query sin coincidencias", async () => {
  const { search_usuarios } = require("../controllers/user");

  let responseBody;
  let statusCode;
  const req = { query: { q: "xyzxyzxyz_no_existe_nadie" } };
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      responseBody = body;
      return this;
    },
  };

  await search_usuarios(req, res);

  assert.equal(statusCode, 200);
  assert.ok(Array.isArray(responseBody));
  assert.equal(responseBody.length, 0);

  console.log(`  ✓ Sin coincidencias devuelve array vacío`);
});

// --- obtener_usuario_por_nombre ---

test("obtener_usuario_por_nombre devuelve el usuario correcto", async () => {
  const { obtener_usuario_por_nombre } = require("../controllers/user");

  let responseBody;
  let statusCode;
  const req = { params: { username: TEST_USER.username } };
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      responseBody = body;
      return this;
    },
  };

  await obtener_usuario_por_nombre(req, res);

  assert.equal(statusCode, 200);
  assert.equal(responseBody.username, TEST_USER.username);
  assert.ok(!responseBody.password_hash, "No debe exponer password_hash");
  assert.ok(!responseBody.salt, "No debe exponer salt");
  assert.ok(!responseBody.email, "No debe exponer email");

  console.log(`  ✓ Usuario encontrado: ${responseBody.username}`);
});

test("obtener_usuario_por_nombre devuelve 404 para usuario inexistente", async () => {
  const { obtener_usuario_por_nombre } = require("../controllers/user");

  let responseBody;
  let statusCode;
  const req = { params: { username: "usuario_que_no_existe_jamas" } };
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      responseBody = body;
      return this;
    },
  };

  await obtener_usuario_por_nombre(req, res);

  assert.equal(statusCode, 404);

  console.log(`  ✓ 404 para usuario inexistente`);
});

// --- casos extremos de caracteres ---

test("search encuentra usuario con punto y guion bajo en el nombre", async () => {
  const { search_usuarios } = require("../controllers/user");

  let responseBody, statusCode;
  const req = { query: { q: "player.one_cedh" } };
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

  await search_usuarios(req, res);

  assert.equal(statusCode, 200);
  assert.ok(
    responseBody.some((u) => u.username === "player.one_cedh"),
    "Debe encontrar el usuario con punto y guion bajo",
  );

  console.log(`  ✓ Usuario con punto y guion bajo encontrado`);
});

test("search encuentra usuario con guion, números y paréntesis en el nombre", async () => {
  const { search_usuarios } = require("../controllers/user");

  let responseBody, statusCode;
  const req = { query: { q: "jugador-42(es)" } };
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

  await search_usuarios(req, res);

  assert.equal(statusCode, 200);
  assert.ok(
    responseBody.some((u) => u.username === "jugador-42(es)"),
    "Debe encontrar el usuario con guion, números y paréntesis",
  );

  console.log(`  ✓ Usuario con guion, números y paréntesis encontrado`);
});
