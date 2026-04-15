/**
 * Tests de integración para los endpoints de búsqueda de decklists.
 *
 * Ejecutar con:
 * node --env-file=.env --test backend/controllers/decklist.test.js
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
"use strict";

const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert/strict");

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Minimal req/res factory */
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

/** Inject a fake module into require.cache at the given resolved path */
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

/** Remove a module from require.cache so the next require re-loads it */
function clearModule(modulePath) {
  delete require.cache[require.resolve(modulePath)];
}

// ── Fake model builders ───────────────────────────────────────────────────────

const OWNER_ID = "000000000000000000000001";
const OTHER_ID = "000000000000000000000002";
const DECK_ID = "aaaaaaaaaaaaaaaaaaaaaaaa";

function makePublicDeck(overrides = {}) {
  return {
    _id: DECK_ID,
    title: "Test Deck",
    isPublic: true,
    likes: 5,
    likedBy: [],
    comments: [],
    authorId: { _id: OWNER_ID, username: "owner" },
    ...overrides,
  };
}

// ── Tests for obtener_decklist ────────────────────────────────────────────────

describe("obtener_decklist", () => {
  const CONTROLLER_PATH = "./decklist";
  const DECKLIST_MODEL = "../models/Decklist";
  const USER_MODEL = "../models/User";
  const MONGOOSE_PATH = "mongoose";

  function loadController(fakeDecklistModel, fakeUserModel) {
    clearModule(CONTROLLER_PATH);
    mockModule(DECKLIST_MODEL, fakeDecklistModel);
    mockModule(USER_MODEL, fakeUserModel ?? {});
    // mongoose is needed for ObjectId in get_deck_comments; provide a stub
    // only if not already loaded (it is, so just leave it).
    return require(CONTROLLER_PATH);
  }

  test("devuelve 404 cuando el deck no existe", async () => {
    const fakeDecklistModel = {
      findById: () => ({ populate: () => Promise.resolve(null) }),
    };
    const { obtener_decklist } = loadController(fakeDecklistModel);
    const { req, res } = makeReqRes({ params: { id: DECK_ID } });

    await obtener_decklist(req, res);

    assert.equal(res._status, 404);
  });

  test("devuelve el deck público sin autenticación", async () => {
    const deck = makePublicDeck();
    const fakeDecklistModel = {
      findById: () => ({ populate: () => Promise.resolve(deck) }),
    };
    const { obtener_decklist } = loadController(fakeDecklistModel);
    const { req, res } = makeReqRes({ params: { id: DECK_ID }, user: null });

    await obtener_decklist(req, res);

    assert.equal(res._status, 200);
    assert.equal(res._body.title, "Test Deck");
  });

  test("devuelve 403 para deck privado sin sesión", async () => {
    const deck = makePublicDeck({ isPublic: false });
    const fakeDecklistModel = {
      findById: () => ({ populate: () => Promise.resolve(deck) }),
    };
    const { obtener_decklist } = loadController(fakeDecklistModel);
    const { req, res } = makeReqRes({ params: { id: DECK_ID }, user: null });

    await obtener_decklist(req, res);

    assert.equal(res._status, 403);
  });

  test("devuelve 403 para deck privado cuando el usuario no es el autor", async () => {
    const deck = makePublicDeck({ isPublic: false });
    const fakeDecklistModel = {
      findById: () => ({ populate: () => Promise.resolve(deck) }),
    };
    const fakeUserModel = {
      findById: () => Promise.resolve({ _id: OTHER_ID }),
    };
    // deck.authorId._id.equals() needs to work
    deck.authorId._id = {
      equals: (id) => id.toString() === OWNER_ID,
    };
    const { obtener_decklist } = loadController(
      fakeDecklistModel,
      fakeUserModel,
    );
    const { req, res } = makeReqRes({
      params: { id: DECK_ID },
      user: { id: OTHER_ID },
    });

    await obtener_decklist(req, res);

    assert.equal(res._status, 403);
  });

  test("devuelve 200 para deck privado cuando el usuario es el autor", async () => {
    const deck = makePublicDeck({ isPublic: false });
    deck.authorId._id = {
      equals: (id) => id.toString() === OWNER_ID,
      toString: () => OWNER_ID,
    };
    const fakeDecklistModel = {
      findById: () => ({ populate: () => Promise.resolve(deck) }),
    };
    const fakeUserModel = {
      findById: () => Promise.resolve({ _id: OWNER_ID }),
    };
    const { obtener_decklist } = loadController(
      fakeDecklistModel,
      fakeUserModel,
    );
    const { req, res } = makeReqRes({
      params: { id: DECK_ID },
      user: { id: OWNER_ID },
    });

    await obtener_decklist(req, res);

    assert.equal(res._status, 200);
  });
});

// ── Tests for get_deck_comments ───────────────────────────────────────────────

describe("get_deck_comments", () => {
  const CONTROLLER_PATH = "./decklist";
  const DECKLIST_MODEL = "../models/Decklist";
  const COMMENT_MODEL = "../models/Comment";

  function loadController(fakeDecklistModel, fakeCommentModel) {
    clearModule(CONTROLLER_PATH);
    mockModule(DECKLIST_MODEL, fakeDecklistModel);
    mockModule(
      COMMENT_MODEL,
      fakeCommentModel ?? { aggregate: () => Promise.resolve([]) },
    );
    return require(CONTROLLER_PATH);
  }

  test("devuelve 404 cuando el deck no existe", async () => {
    const fakeDecklistModel = {
      findById: () => ({ select: () => Promise.resolve(null) }),
    };
    const { get_deck_comments } = loadController(fakeDecklistModel);
    const { req, res } = makeReqRes({ params: { id: DECK_ID } });

    await get_deck_comments(req, res);

    assert.equal(res._status, 404);
  });

  test("devuelve array vacío si el deck no tiene comentarios", async () => {
    const fakeDecklistModel = {
      findById: () => ({ select: () => Promise.resolve({ comments: [] }) }),
    };
    const fakeCommentModel = { aggregate: () => Promise.resolve([]) };
    const { get_deck_comments } = loadController(
      fakeDecklistModel,
      fakeCommentModel,
    );
    const { req, res } = makeReqRes({ params: { id: DECK_ID } });

    await get_deck_comments(req, res);

    assert.equal(res._status, 200);
    assert.deepEqual(res._body, []);
  });

  test("devuelve los comentarios del deck", async () => {
    // IDs deben ser hex de 24 chars para que mongoose.Types.ObjectId los acepte
    const COMMENT_ID_1 = "bbbbbbbbbbbbbbbbbbbbbb01";
    const COMMENT_ID_2 = "bbbbbbbbbbbbbbbbbbbbbb02";
    const fakeComments = [
      {
        _id: COMMENT_ID_1,
        markdown_text: "Buen deck",
        replyCount: 0,
        authorId: { username: "user1" },
      },
      {
        _id: COMMENT_ID_2,
        markdown_text: "Mola",
        replyCount: 2,
        authorId: { username: "user2" },
      },
    ];
    const fakeDecklistModel = {
      findById: () => ({
        select: () =>
          Promise.resolve({ comments: [COMMENT_ID_1, COMMENT_ID_2] }),
      }),
    };
    const fakeCommentModel = { aggregate: () => Promise.resolve(fakeComments) };
    const { get_deck_comments } = loadController(
      fakeDecklistModel,
      fakeCommentModel,
    );
    const { req, res } = makeReqRes({ params: { id: DECK_ID } });

    await get_deck_comments(req, res);

    assert.equal(res._status, 200);
    assert.equal(res._body.length, 2);
    assert.equal(res._body[0].markdown_text, "Buen deck");
  });
});

// ── Tests for is_liked_decklist ───────────────────────────────────────────────

describe("is_liked_decklist", () => {
  const CONTROLLER_PATH = "./decklist";
  const DECKLIST_MODEL = "../models/Decklist";

  function loadController(fakeDecklistModel) {
    clearModule(CONTROLLER_PATH);
    mockModule(DECKLIST_MODEL, fakeDecklistModel);
    return require(CONTROLLER_PATH);
  }

  test("devuelve 404 si el deck no existe", async () => {
    const fakeDecklistModel = {
      findById: () => ({ select: () => Promise.resolve(null) }),
    };
    const { is_liked_decklist } = loadController(fakeDecklistModel);
    const { req, res } = makeReqRes({
      params: { id: DECK_ID },
      user: { id: OTHER_ID },
    });

    await is_liked_decklist(req, res);

    assert.equal(res._status, 404);
  });

  test("devuelve liked=false cuando el usuario no ha dado like", async () => {
    const fakeDecklistModel = {
      findById: () => ({
        select: () =>
          Promise.resolve({ likedBy: [{ toString: () => OWNER_ID }] }),
      }),
    };
    const { is_liked_decklist } = loadController(fakeDecklistModel);
    const { req, res } = makeReqRes({
      params: { id: DECK_ID },
      user: { id: OTHER_ID },
    });

    await is_liked_decklist(req, res);

    assert.equal(res._status, 200);
    assert.equal(res._body.liked, false);
  });

  test("devuelve liked=true cuando el usuario ya ha dado like", async () => {
    const fakeDecklistModel = {
      findById: () => ({
        select: () =>
          Promise.resolve({ likedBy: [{ toString: () => OWNER_ID }] }),
      }),
    };
    const { is_liked_decklist } = loadController(fakeDecklistModel);
    const { req, res } = makeReqRes({
      params: { id: DECK_ID },
      user: { id: OWNER_ID },
    });

    await is_liked_decklist(req, res);

    assert.equal(res._status, 200);
    assert.equal(res._body.liked, true);
  });
});

// ── Tests for toggle_like (decklist) ─────────────────────────────────────────

describe("toggle_like (decklist)", () => {
  const CONTROLLER_PATH = "./decklist";
  const DECKLIST_MODEL = "../models/Decklist";

  function loadController(fakeDecklistModel) {
    clearModule(CONTROLLER_PATH);
    mockModule(DECKLIST_MODEL, fakeDecklistModel);
    return require(CONTROLLER_PATH);
  }

  test("devuelve 404 si el deck no existe", async () => {
    const fakeDecklistModel = { findById: () => Promise.resolve(null) };
    const { toggle_like } = loadController(fakeDecklistModel);
    const { req, res } = makeReqRes({
      params: { id: DECK_ID },
      user: { id: OTHER_ID },
    });

    await toggle_like(req, res);

    assert.equal(res._status, 404);
  });

  test("añade like cuando el usuario no había dado like", async () => {
    let saved = false;
    const deck = {
      likes: 3,
      likedBy: [],
      save: async () => {
        saved = true;
      },
    };
    deck.likedBy.some = () => false;
    deck.likedBy.push = (id) => deck.likedBy.unshift(id);

    const fakeDecklistModel = { findById: () => Promise.resolve(deck) };
    const { toggle_like } = loadController(fakeDecklistModel);
    const { req, res } = makeReqRes({
      params: { id: DECK_ID },
      user: { id: OTHER_ID },
    });

    await toggle_like(req, res);

    assert.equal(res._status, 200);
    assert.equal(deck.likes, 4);
    assert.equal(saved, true);
  });

  test("quita like cuando el usuario ya había dado like", async () => {
    let saved = false;
    const deck = {
      likes: 5,
      likedBy: [{ toString: () => OWNER_ID }],
      save: async () => {
        saved = true;
      },
    };
    deck.likedBy.some = (fn) =>
      deck.likedBy.some.call(Array.prototype, fn, deck.likedBy);
    // Use real Array.prototype.some for likedBy
    deck.likedBy = Object.assign([{ toString: () => OWNER_ID }], {
      save: async () => {
        saved = true;
      },
    });

    const fakeDecklistModel = { findById: () => Promise.resolve(deck) };
    const { toggle_like } = loadController(fakeDecklistModel);
    const { req, res } = makeReqRes({
      params: { id: DECK_ID },
      user: { id: OWNER_ID },
    });

    await toggle_like(req, res);

    assert.equal(res._status, 200);
    assert.equal(deck.likes, 4);
    assert.equal(saved, true);
  });
});
