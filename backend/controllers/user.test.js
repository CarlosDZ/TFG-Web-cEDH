/**
 * Tests de integración para los endpoints de usuarios.
 * Requieren conexión a MongoDB (MONGODB_URL en .env).
 *
 * Se ejecutan con: node --test backend/controllers/user.test.js
 * (con el .env cargado o variables de entorno definidas)
 */

const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const Usuario = require("../models/User");
const { edit_user } = require("../controllers/user");

let createdUserId = null;
const extraUserIds = [];

const TEST_USER = {
  username: "test_search_user_cedh",
  email: "test_search_cedh@example.com",
  salt: "testsalt123",
  password_hash: "testhash123",
};

const EDIT_USER_A = {
  username: "edit_user_a_cedh",
  email: "edit_user_a@example.com",
  salt: "salta",
  password_hash: "hasha",
};

const EDIT_USER_B = {
  username: "edit_user_b_cedh",
  email: "edit_user_b@example.com",
  salt: "saltb",
  password_hash: "hashb",
};

let editUserAId = null;
let editUserBId = null;

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
  await Usuario.deleteOne({ username: EDIT_USER_A.username });
  await Usuario.deleteOne({ username: EDIT_USER_B.username });

  const user = await Usuario.create(TEST_USER);
  createdUserId = user._id.toString();

  for (const u of EXTRA_USERS) {
    const created = await Usuario.create(u);
    extraUserIds.push(created._id);
  }

  const userA = await Usuario.create(EDIT_USER_A);
  editUserAId = userA._id.toString();
  const userB = await Usuario.create(EDIT_USER_B);
  editUserBId = userB._id.toString();
});

after(async () => {
  if (createdUserId) await Usuario.deleteOne({ _id: createdUserId });
  for (const id of extraUserIds) await Usuario.deleteOne({ _id: id });
  if (editUserAId) await Usuario.deleteOne({ _id: editUserAId });
  if (editUserBId) await Usuario.deleteOne({ _id: editUserBId });
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

// ── Tests de integración: edit_user ──────────────────────────────────────────

function makeRes() {
  return {
    _status: null,
    _body: undefined,
    status(code) { this._status = code; return this; },
    json(data) { this._body = data; return this; },
  };
}

test("edit_user actualiza username, bio y email correctamente", async () => {
  const res = makeRes();
  const req = {
    params: { id: editUserAId },
    user: { id: editUserAId },
    body: {
      username: "edit_user_a_updated",
      bio: "bio actualizada",
      email: "edit_user_a_updated@example.com",
    },
  };

  await edit_user(req, res);

  assert.equal(res._status, 200);
  assert.equal(res._body.username, "edit_user_a_updated");
  assert.equal(res._body.bio, "bio actualizada");
  assert.equal(res._body.email, "edit_user_a_updated@example.com");

  // Verificar que persiste en DB
  const inDb = await Usuario.findById(editUserAId).select("username bio email");
  assert.equal(inDb.username, "edit_user_a_updated");
  assert.equal(inDb.bio, "bio actualizada");
  assert.equal(inDb.email, "edit_user_a_updated@example.com");

  // Restaurar para no romper otros tests
  await Usuario.updateOne({ _id: editUserAId }, { username: EDIT_USER_A.username, email: EDIT_USER_A.email });

  console.log("  ✓ Campos actualizados y persistidos en DB");
});

test("edit_user devuelve 409 si el username ya existe en otro usuario", async () => {
  const res = makeRes();
  const req = {
    params: { id: editUserAId },
    user: { id: editUserAId },
    body: { username: EDIT_USER_B.username, bio: "", email: EDIT_USER_A.email },
  };

  await edit_user(req, res);

  assert.equal(res._status, 409);
  assert.match(res._body, /usuario/i);

  console.log("  ✓ 409 cuando username pertenece a otro usuario");
});

test("edit_user devuelve 409 si el email ya existe en otro usuario", async () => {
  const res = makeRes();
  const req = {
    params: { id: editUserAId },
    user: { id: editUserAId },
    body: { username: EDIT_USER_A.username, bio: "", email: EDIT_USER_B.email },
  };

  await edit_user(req, res);

  assert.equal(res._status, 409);
  assert.match(res._body, /correo/i);

  console.log("  ✓ 409 cuando email pertenece a otro usuario");
});

test("edit_user devuelve 403 si el id de sesion no coincide", async () => {
  const res = makeRes();
  const req = {
    params: { id: editUserBId },
    user: { id: editUserAId },
    body: { username: "intruder", bio: "", email: "intruder@example.com" },
  };

  await edit_user(req, res);

  assert.equal(res._status, 403);

  console.log("  ✓ 403 cuando la sesion no coincide con el id del parametro");
});


// ── Tests de integración: cambio de contraseña ───────────────────────────────

const crypto = require("crypto");

test("edit_user cambia la contraseña y el nuevo hash es valido", async () => {
  const res = makeRes();
  const req = {
    params: { id: editUserAId },
    user: { id: editUserAId },
    body: { currentPassword: "passwordoriginal", newPassword: "passwordnueva" },
  };

  // Establecer una contraseña conocida en DB antes del test
  const saltBefore = crypto.randomBytes(16).toString("hex");
  const hashBefore = crypto
    .createHash("sha256")
    .update("passwordoriginal" + saltBefore)
    .digest("hex");
  await Usuario.updateOne(
    { _id: editUserAId },
    { salt: saltBefore, password_hash: hashBefore },
  );

  await edit_user(req, res);

  assert.equal(res._status, 200);

  // Verificar que el hash en DB corresponde a la nueva contraseña
  const inDb = await Usuario.findById(editUserAId).select("salt password_hash");
  const expectedHash = crypto
    .createHash("sha256")
    .update("passwordnueva" + inDb.salt)
    .digest("hex");
  assert.equal(inDb.password_hash, expectedHash);
  assert.notEqual(inDb.salt, saltBefore, "El salt debe haber rotado");

  console.log("  ✓ Contraseña cambiada y hash verificado en DB");
});

test("edit_user devuelve 401 cuando currentPassword no coincide con el hash en DB", async () => {
  const res = makeRes();
  const req = {
    params: { id: editUserAId },
    user: { id: editUserAId },
    body: { currentPassword: "contraseniaequivocada", newPassword: "nuevapass" },
  };

  await edit_user(req, res);

  assert.equal(res._status, 401);
  assert.match(res._body, /contraseña/i);

  console.log("  ✓ 401 cuando la contraseña actual no coincide");
});

test("edit_user devuelve 400 cuando falta currentPassword en el body", async () => {
  const res = makeRes();
  const req = {
    params: { id: editUserAId },
    user: { id: editUserAId },
    body: { newPassword: "nuevapass" },
  };

  await edit_user(req, res);

  assert.equal(res._status, 400);

  console.log("  ✓ 400 cuando falta currentPassword");
});

