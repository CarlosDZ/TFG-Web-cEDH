const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  getCardByName,
  autocompleteCards,
  getCommanderColorIdentity,
} = require("./scryfallAPI");

const TIMEOUT = 10000;

// --- getCardByName ---

test(
  "obtiene una carta conocida correctamente",
  { timeout: TIMEOUT },
  async () => {
    const [ok, err, card] = await getCardByName("Lightning Bolt");

    assert.equal(ok, true, `Debería encontrar la carta. Error: ${err}`);
    assert.ok(card, "Debe devolver datos de la carta");
    assert.equal(card.object, "card");
    assert.ok(card.name.toLowerCase().includes("lightning bolt"));
    assert.ok(card.oracle_text, "Debe tener oracle text");
    assert.ok(card.type_line, "Debe tener type line");
    assert.ok(card.legalities, "Debe tener legalidades");

    console.log(`  ✓ Nombre: ${card.name}`);
    console.log(`  ✓ Tipo: ${card.type_line}`);
    console.log(`  ✓ Commander: ${card.legalities.commander}`);
  },
);

test(
  "obtiene una carta de doble cara (DFC)",
  { timeout: TIMEOUT },
  async () => {
    const [ok, err, card] = await getCardByName("Delver of Secrets");

    assert.equal(ok, true, `Debería encontrar la carta DFC. Error: ${err}`);
    assert.ok(card.card_faces, "Debe tener card_faces para DFC");
    assert.equal(card.card_faces.length, 2, "DFC debe tener 2 caras");
    assert.ok(
      card.card_faces[0].oracle_text,
      "Cara frontal debe tener oracle text",
    );

    console.log(`  ✓ Nombre: ${card.name}`);
    console.log(`  ✓ Cara frontal: ${card.card_faces[0].name}`);
    console.log(`  ✓ Cara trasera: ${card.card_faces[1].name}`);
  },
);

test("busca carta con nombre difuso", { timeout: TIMEOUT }, async () => {
  const [ok, err, card] = await getCardByName("lighning bolt"); // typo intencionado

  assert.equal(
    ok,
    true,
    `Debe encontrar Lightning Bolt con fuzzy. Error: ${err}`,
  );
  assert.ok(card.name.toLowerCase().includes("lightning bolt"));

  console.log(`  ✓ Fuzzy match: '${card.name}'`);
});

test(
  "devuelve error para carta inexistente",
  { timeout: TIMEOUT },
  async () => {
    const [ok, err, card] = await getCardByName(
      "xyzxyzxyz carta que no existe para nada",
    );

    assert.equal(ok, false, "Debe devolver ok=false para carta no encontrada");
    assert.equal(card, null);
    assert.ok(err, "Debe devolver mensaje de error");

    console.log(`  ✓ Error: ${err}`);
  },
);

// --- autocompleteCards ---

test(
  "autocomplete devuelve sugerencias para una query válida",
  { timeout: TIMEOUT },
  async () => {
    const results = await autocompleteCards("Lightning");

    assert.ok(Array.isArray(results), "Debe devolver un array");
    assert.ok(results.length > 0, "Debe devolver al menos una sugerencia");
    assert.ok(
      results.some((r) => r.toLowerCase().includes("lightning")),
      "Las sugerencias deben estar relacionadas con la query",
    );

    console.log(
      `  ✓ Sugerencias para 'Lightning': ${results.slice(0, 3).join(", ")}...`,
    );
  },
);

test("autocomplete devuelve array vacío para query muy corta", async () => {
  const results = await autocompleteCards("a");

  assert.ok(Array.isArray(results), "Debe devolver un array");
  assert.equal(
    results.length,
    0,
    "Query de 1 carácter no debe devolver resultados",
  );

  console.log(`  ✓ Query corta devuelve array vacío`);
});

test("autocomplete devuelve array vacío para query nula", async () => {
  const results = await autocompleteCards(null);

  assert.ok(Array.isArray(results));
  assert.equal(results.length, 0);

  console.log(`  ✓ Query nula devuelve array vacío`);
});

// --- getCommanderColorIdentity ---

test(
  "obtiene color identity de un comandante monocolor",
  { timeout: TIMEOUT },
  async () => {
    const identity = await getCommanderColorIdentity([
      "Thassa, God of the Sea",
    ]);

    assert.equal(identity, "U", "Thassa debe ser monoazul");

    console.log(`  ✓ Color identity de Thassa: ${identity}`);
  },
);

test(
  "obtiene color identity de un par de comandantes",
  { timeout: TIMEOUT },
  async () => {
    const identity = await getCommanderColorIdentity([
      "Tymna the Weaver",
      "Thrasios, Triton Hero",
    ]);

    assert.ok(identity.includes("W"), "Debe incluir blanco (Tymna)");
    assert.ok(identity.includes("U"), "Debe incluir azul (Thrasios)");
    assert.ok(identity.includes("G"), "Debe incluir verde (Thrasios)");

    console.log(`  ✓ Color identity Tymna+Thrasios: ${identity}`);
  },
);
