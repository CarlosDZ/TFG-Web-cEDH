"use strict";

/**
 * Tests unitarios para edit_user.
 * No requieren base de datos; mockean el modelo Usuario.
 *
 * Ejecutar con: node --test backend/controllers/userEdit.test.js
 */

const { test, describe } = require("node:test");
const assert = require("node:assert/strict");

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeReqRes({ params = {}, body = {}, user = null } = {}) {
  const req = { params, body, user };
  const res = {
    _status: null,
    _body: undefined,
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

// ── IDs de prueba ─────────────────────────────────────────────────────────────

const OWNER_ID = "aaaaaaaaaaaaaaaaaaaaaaaa";
const OTHER_ID = "bbbbbbbbbbbbbbbbbbbbbbbb";

// ── Carga del controlador con modelo falso ────────────────────────────────────

function loadController(fakeUsuario) {
  clearModule("./user");
  mockModule("../models/User", fakeUsuario);
  return require("./user");
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("edit_user", () => {
  test("devuelve 403 cuando el id de sesion no coincide con el parametro", async () => {
    const fakeUsuario = {};
    const { edit_user } = loadController(fakeUsuario);

    const { req, res } = makeReqRes({
      params: { id: OTHER_ID },
      body: { username: "nuevo", bio: "", email: "a@b.com" },
      user: { id: OWNER_ID },
    });

    await edit_user(req, res);

    assert.equal(res._status, 403);
    console.log("  ✓ 403 cuando sesion no coincide con id del parametro");
  });

  test("devuelve 409 cuando el username ya esta en uso por otro usuario", async () => {
    const fakeUsuario = {
      findOne: async ({ username }) => {
        if (username === "ocupado")
          return { _id: { toString: () => OTHER_ID } };
        return null;
      },
      findById: () => ({ select: async () => null }),
    };
    const { edit_user } = loadController(fakeUsuario);

    const { req, res } = makeReqRes({
      params: { id: OWNER_ID },
      body: { username: "ocupado", bio: "", email: "" },
      user: { id: OWNER_ID },
    });

    await edit_user(req, res);

    assert.equal(res._status, 409);
    assert.match(res._body, /usuario/i);
    console.log("  ✓ 409 cuando username esta en uso por otro usuario");
  });

  test("no devuelve 409 si el username ocupado pertenece al mismo usuario", async () => {
    const savedDoc = {
      _id: { toString: () => OWNER_ID },
      username: "mismonombre",
      bio: "bio",
      email: "yo@example.com",
      salt: "s",
      password_hash: "h",
      save: async function () {},
    };
    const fakeUsuario = {
      findOne: async ({ username }) => {
        if (username === "mismonombre") return savedDoc;
        return null;
      },
      findById: () => ({
        select: async () => savedDoc,
      }),
    };
    const { edit_user } = loadController(fakeUsuario);

    const { req, res } = makeReqRes({
      params: { id: OWNER_ID },
      body: {
        username: "mismonombre",
        bio: "bio actualizada",
        email: "yo@example.com",
      },
      user: { id: OWNER_ID },
    });

    await edit_user(req, res);

    assert.equal(res._status, 200);
    console.log("  ✓ 200 cuando el username coincide con el propio usuario");
  });

  test("devuelve 409 cuando el email ya esta en uso por otro usuario", async () => {
    const fakeUsuario = {
      findOne: async (query) => {
        if (query.email === "tomado@example.com")
          return { _id: { toString: () => OTHER_ID } };
        return null;
      },
      findById: () => ({ select: async () => null }),
    };
    const { edit_user } = loadController(fakeUsuario);

    const { req, res } = makeReqRes({
      params: { id: OWNER_ID },
      body: { username: "libre", bio: "", email: "tomado@example.com" },
      user: { id: OWNER_ID },
    });

    await edit_user(req, res);

    assert.equal(res._status, 409);
    assert.match(res._body, /correo/i);
    console.log("  ✓ 409 cuando email esta en uso por otro usuario");
  });

  test("guarda y devuelve 200 con los campos actualizados", async () => {
    let savedDoc;
    const docInDb = {
      _id: { toString: () => OWNER_ID },
      username: "viejo",
      bio: "bio vieja",
      email: "viejo@example.com",
      salt: "s",
      password_hash: "h",
      save: async function () {
        savedDoc = this;
      },
    };
    const fakeUsuario = {
      findOne: async () => null,
      findById: () => ({ select: async () => docInDb }),
    };
    const { edit_user } = loadController(fakeUsuario);

    const { req, res } = makeReqRes({
      params: { id: OWNER_ID },
      body: { username: "nuevo", bio: "bio nueva", email: "nuevo@example.com" },
      user: { id: OWNER_ID },
    });

    await edit_user(req, res);

    assert.equal(res._status, 200);
    assert.equal(res._body.username, "nuevo");
    assert.equal(res._body.bio, "bio nueva");
    assert.equal(res._body.email, "nuevo@example.com");
    assert.ok(savedDoc, "save() debe haberse llamado");
    console.log("  ✓ 200 y datos actualizados correctamente");
  });

  test("normaliza el email a minusculas al guardar", async () => {
    const docInDb = {
      _id: { toString: () => OWNER_ID },
      username: "u",
      bio: "",
      email: "viejo@example.com",
      salt: "s",
      password_hash: "h",
      save: async function () {},
    };
    const fakeUsuario = {
      findOne: async () => null,
      findById: () => ({ select: async () => docInDb }),
    };
    const { edit_user } = loadController(fakeUsuario);

    const { req, res } = makeReqRes({
      params: { id: OWNER_ID },
      body: { username: "u", bio: "", email: "MAYUS@EXAMPLE.COM" },
      user: { id: OWNER_ID },
    });

    await edit_user(req, res);

    assert.equal(res._status, 200);
    assert.equal(res._body.email, "mayus@example.com");
    console.log("  ✓ Email normalizado a minusculas");
  });

  test("no modifica campos omitidos en el body", async () => {
    const docInDb = {
      _id: { toString: () => OWNER_ID },
      username: "original",
      bio: "bio original",
      email: "original@example.com",
      salt: "s",
      password_hash: "h",
      save: async function () {},
    };
    const fakeUsuario = {
      findOne: async () => null,
      findById: () => ({ select: async () => docInDb }),
    };
    const { edit_user } = loadController(fakeUsuario);

    const { req, res } = makeReqRes({
      params: { id: OWNER_ID },
      body: { bio: "bio cambiada" },
      user: { id: OWNER_ID },
    });

    await edit_user(req, res);

    assert.equal(res._status, 200);
    assert.equal(res._body.username, "original");
    assert.equal(res._body.bio, "bio cambiada");
    assert.equal(res._body.email, "original@example.com");
    console.log("  ✓ Solo actualiza los campos presentes en el body");
  });

  // ── Cambio de contraseña ────────────────────────────────────────────────────

  test("cambia la contraseña correctamente cuando currentPassword es valida", async () => {
    const crypto = require("crypto");
    const salt = "testsaltunit";
    const correctHash = crypto
      .createHash("sha256")
      .update("passwordcorrecta" + salt)
      .digest("hex");

    let savedDoc;
    const docInDb = {
      _id: { toString: () => OWNER_ID },
      username: "u",
      bio: "",
      email: "u@example.com",
      salt,
      password_hash: correctHash,
      save: async function () {
        savedDoc = this;
      },
    };
    const fakeUsuario = {
      findOne: async () => null,
      findById: () => ({ select: async () => docInDb }),
    };
    const { edit_user } = loadController(fakeUsuario);

    const { req, res } = makeReqRes({
      params: { id: OWNER_ID },
      body: {
        currentPassword: "passwordcorrecta",
        newPassword: "nuevapassword123",
      },
      user: { id: OWNER_ID },
    });

    await edit_user(req, res);

    assert.equal(res._status, 200);
    assert.ok(savedDoc, "save() debe haberse llamado");
    // El hash debe haber cambiado
    assert.notEqual(savedDoc.password_hash, correctHash);
    // El salt debe haber rotado
    assert.notEqual(savedDoc.salt, salt);
    console.log("  ✓ Contraseña cambiada y salt rotado correctamente");
  });

  test("devuelve 401 cuando currentPassword es incorrecta", async () => {
    const crypto = require("crypto");
    const salt = "testsaltunit2";
    const correctHash = crypto
      .createHash("sha256")
      .update("correcta" + salt)
      .digest("hex");

    const docInDb = {
      _id: { toString: () => OWNER_ID },
      username: "u",
      bio: "",
      email: "u@example.com",
      salt,
      password_hash: correctHash,
      save: async function () {},
    };
    const fakeUsuario = {
      findOne: async () => null,
      findById: () => ({ select: async () => docInDb }),
    };
    const { edit_user } = loadController(fakeUsuario);

    const { req, res } = makeReqRes({
      params: { id: OWNER_ID },
      body: { currentPassword: "incorrecta", newPassword: "nuevapassword123" },
      user: { id: OWNER_ID },
    });

    await edit_user(req, res);

    assert.equal(res._status, 401);
    assert.match(res._body, /contraseña/i);
    console.log("  ✓ 401 cuando la contraseña actual es incorrecta");
  });

  test("devuelve 400 cuando se pide cambio de contraseña sin enviar currentPassword", async () => {
    const docInDb = {
      _id: { toString: () => OWNER_ID },
      username: "u",
      bio: "",
      email: "u@example.com",
      salt: "s",
      password_hash: "h",
      save: async function () {},
    };
    const fakeUsuario = {
      findOne: async () => null,
      findById: () => ({ select: async () => docInDb }),
    };
    const { edit_user } = loadController(fakeUsuario);

    const { req, res } = makeReqRes({
      params: { id: OWNER_ID },
      body: { newPassword: "nuevapassword123" },
      user: { id: OWNER_ID },
    });

    await edit_user(req, res);

    assert.equal(res._status, 400);
    console.log("  ✓ 400 cuando falta currentPassword en el body");
  });
});
