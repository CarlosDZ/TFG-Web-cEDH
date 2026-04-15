"use strict";

const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeRes() {
  const res = { _status: null, _body: null };
  res.status = (code) => {
    res._status = code;
    return res;
  };
  res.json = (body) => {
    res._body = body;
    return res;
  };
  return res;
}

function makeId(n = 1) {
  return String(n).padStart(24, "0");
}

// ── Mock factories ────────────────────────────────────────────────────────────

function makeCommanderTechDoc({
  likedBy = [],
  likes = 0,
  allowComments = true,
  comments = [],
} = {}) {
  const doc = {
    _id: makeId(1),
    title: "Tech de prueba",
    pickup_lane: "Resumen corto",
    commander: ["Thrasios, Triton Hero"],
    text_markdown: "# Análisis\nContenido.",
    allowComments,
    likes,
    likedBy: [...likedBy],
    comments: [...comments],
    save: async function () {
      return this;
    },
  };
  return doc;
}

// ── Inject mocks into require cache before loading the controller ─────────────

const modelsDir = path.resolve(__dirname, "../models");

// CommanderTech mock
let _techDoc = makeCommanderTechDoc();
const MockCommanderTech = function (data) {
  Object.assign(this, data);
  this._id = makeId(99);
  this.likes = 0;
  this.likedBy = [];
  this.comments = [];
  this.save = async () => this;
};
MockCommanderTech.findById = async () => _techDoc;
MockCommanderTech.updateOne = async () => ({});

// Comment mock
let _savedComment = null;
const MockComment = function (data) {
  Object.assign(this, data);
  this._id = makeId(50);
  this.save = async () => {
    _savedComment = this;
    return this;
  };
};
MockComment.aggregate = async () => [];

// User mock
const MockUser = function () {};
MockUser.findById = async () => ({
  _id: makeId(2),
  isAdmin: false,
  fav_commanderTech: [],
});
MockUser.updateOne = async () => ({});
MockUser.updateMany = async () => ({});

// Mongoose mock (for Types.ObjectId)
const MockMongoose = {
  Types: {
    ObjectId: function (id) {
      return id;
    },
  },
};

// Register mocks in require cache
require.cache[path.join(modelsDir, "CommanderTech.js")] = {
  id: "CommanderTech",
  filename: "CommanderTech",
  loaded: true,
  exports: MockCommanderTech,
};
require.cache[path.join(modelsDir, "Comment.js")] = {
  id: "Comment",
  filename: "Comment",
  loaded: true,
  exports: MockComment,
};
require.cache[path.join(modelsDir, "User.js")] = {
  id: "User",
  filename: "User",
  loaded: true,
  exports: MockUser,
};
require.cache["mongoose"] = {
  id: "mongoose",
  filename: "mongoose",
  loaded: true,
  exports: MockMongoose,
};

// Now load the controller with mocks in place
const ctrl = require("./commandertech");

// ── Tests: post_commandertech ─────────────────────────────────────────────────

describe("post_commandertech", () => {
  test("crea y devuelve la tech con status 201", async () => {
    const req = {
      user: { id: makeId(2) },
      body: {
        title: "Mi tech",
        pickup_lane: "Breve descripción",
        text_markdown: "# Análisis",
        commander: ["Thrasios, Triton Hero"],
        allowComments: true,
        tags: [],
      },
    };
    const res = makeRes();
    await ctrl.post_commandertech(req, res);
    assert.equal(res._status, 201);
    assert.equal(res._body.title, "Mi tech");
    assert.equal(res._body.pickup_lane, "Breve descripción");
    assert.deepEqual(res._body.commander, ["Thrasios, Triton Hero"]);
  });
});

// ── Tests: toggle_like ────────────────────────────────────────────────────────

describe("toggle_like", () => {
  beforeEach(() => {
    _techDoc = makeCommanderTechDoc({ likes: 0, likedBy: [] });
    MockCommanderTech.findById = async () => _techDoc;
  });

  test("like: incrementa likes y devuelve { liked: true }", async () => {
    const userId = makeId(5);
    const req = { user: { id: userId }, params: { id: makeId(1) } };
    const res = makeRes();
    await ctrl.toggle_like(req, res);
    assert.equal(res._status, 200);
    assert.equal(res._body.liked, true);
    assert.equal(res._body.likes, 1);
  });

  test("unlike: decrementa likes y devuelve { liked: false }", async () => {
    const userId = makeId(5);
    _techDoc = makeCommanderTechDoc({ likes: 3, likedBy: [userId] });
    MockCommanderTech.findById = async () => _techDoc;
    const req = { user: { id: userId }, params: { id: makeId(1) } };
    const res = makeRes();
    await ctrl.toggle_like(req, res);
    assert.equal(res._status, 200);
    assert.equal(res._body.liked, false);
    assert.equal(res._body.likes, 2);
  });

  test("tech no encontrada: devuelve 404", async () => {
    MockCommanderTech.findById = async () => null;
    const req = { user: { id: makeId(5) }, params: { id: makeId(99) } };
    const res = makeRes();
    await ctrl.toggle_like(req, res);
    assert.equal(res._status, 404);
  });
});

// ── Tests: is_liked ───────────────────────────────────────────────────────────

describe("is_liked", () => {
  test("devuelve { liked: true } si el usuario ya dio like", async () => {
    const userId = makeId(5);
    _techDoc = makeCommanderTechDoc({ likedBy: [userId] });
    MockCommanderTech.findById = async () => _techDoc;
    const req = { user: { id: userId }, params: { id: makeId(1) } };
    const res = makeRes();
    await ctrl.is_liked(req, res);
    assert.equal(res._status, 200);
    assert.equal(res._body.liked, true);
  });

  test("devuelve { liked: false } si el usuario no ha dado like", async () => {
    _techDoc = makeCommanderTechDoc({ likedBy: [] });
    MockCommanderTech.findById = async () => _techDoc;
    const req = { user: { id: makeId(5) }, params: { id: makeId(1) } };
    const res = makeRes();
    await ctrl.is_liked(req, res);
    assert.equal(res._status, 200);
    assert.equal(res._body.liked, false);
  });

  test("tech no encontrada: devuelve 404", async () => {
    MockCommanderTech.findById = async () => null;
    const req = { user: { id: makeId(5) }, params: { id: makeId(99) } };
    const res = makeRes();
    await ctrl.is_liked(req, res);
    assert.equal(res._status, 404);
  });
});

// ── Tests: comment_on_commandertech ──────────────────────────────────────────

describe("comment_on_commandertech", () => {
  beforeEach(() => {
    _savedComment = null;
    _techDoc = makeCommanderTechDoc({ allowComments: true });
    MockCommanderTech.findById = async () => _techDoc;
    MockCommanderTech.updateOne = async () => ({});
  });

  test("crea un comentario y devuelve 201", async () => {
    const req = {
      user: { id: makeId(2) },
      params: { id: makeId(1) },
      body: { markdown_text: "Buen análisis." },
    };
    const res = makeRes();
    await ctrl.comment_on_commandertech(req, res);
    assert.equal(res._status, 201);
    assert.equal(_savedComment.markdown_text, "Buen análisis.");
    assert.equal(_savedComment.comentingOnCommanderTech, true);
    assert.equal(_savedComment.comentingOnDeck, false);
  });

  test("comentarios desactivados: devuelve 403", async () => {
    _techDoc = makeCommanderTechDoc({ allowComments: false });
    MockCommanderTech.findById = async () => _techDoc;
    const req = {
      user: { id: makeId(2) },
      params: { id: makeId(1) },
      body: { markdown_text: "Intento comentar." },
    };
    const res = makeRes();
    await ctrl.comment_on_commandertech(req, res);
    assert.equal(res._status, 403);
  });

  test("tech no encontrada: devuelve 404", async () => {
    MockCommanderTech.findById = async () => null;
    const req = {
      user: { id: makeId(2) },
      params: { id: makeId(99) },
      body: { markdown_text: "Test." },
    };
    const res = makeRes();
    await ctrl.comment_on_commandertech(req, res);
    assert.equal(res._status, 404);
  });
});

// ── Tests: obtener_comentarios_commandertech ──────────────────────────────────

describe("obtener_comentarios_commandertech", () => {
  test("devuelve la lista de comentarios de la tech", async () => {
    const fakeComments = [
      { _id: makeId(10), markdown_text: "Comentario A", replyCount: 0 },
      { _id: makeId(11), markdown_text: "Comentario B", replyCount: 2 },
    ];
    _techDoc = makeCommanderTechDoc({ comments: [makeId(10), makeId(11)] });
    MockCommanderTech.findById = async () => _techDoc;
    MockComment.aggregate = async () => fakeComments;

    const req = { params: { id: makeId(1) } };
    const res = makeRes();
    await ctrl.obtener_comentarios_commandertech(req, res);
    assert.equal(res._status, 200);
    assert.equal(res._body.length, 2);
    assert.equal(res._body[0].markdown_text, "Comentario A");
  });

  test("tech no encontrada: devuelve 404", async () => {
    MockCommanderTech.findById = async () => null;
    const req = { params: { id: makeId(99) } };
    const res = makeRes();
    await ctrl.obtener_comentarios_commandertech(req, res);
    assert.equal(res._status, 404);
  });
});

// ── Tests: obtener_commandertechs ─────────────────────────────────────────────

describe("obtener_commandertechs", () => {
  test("devuelve lista con status 200", async () => {
    const fakeTechs = [{ _id: makeId(1), title: "Tech A" }];
    MockCommanderTech.find = () => ({ populate: async () => fakeTechs });
    const req = {};
    const res = makeRes();
    await ctrl.obtener_commandertechs(req, res);
    assert.equal(res._status, 200);
    assert.equal(res._body.length, 1);
  });
});

// ── Tests: obtener_commandertech (individual) ─────────────────────────────────

describe("obtener_commandertech", () => {
  test("devuelve la tech correcta con status 200", async () => {
    _techDoc = makeCommanderTechDoc();
    MockCommanderTech.findById = () => ({ populate: async () => _techDoc });
    const req = { params: { id: makeId(1) } };
    const res = makeRes();
    await ctrl.obtener_commandertech(req, res);
    assert.equal(res._status, 200);
    assert.equal(res._body.title, "Tech de prueba");
  });
});
