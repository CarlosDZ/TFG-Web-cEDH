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
