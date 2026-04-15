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
  "obtiene una carta de doble cara (DFC, layout transform)",
  { timeout: TIMEOUT },
  async () => {
    const [ok, err, card] = await getCardByName("Delver of Secrets");

    assert.equal(ok, true, `Debería encontrar la carta DFC. Error: ${err}`);
    assert.equal(card.layout, "transform", "Debe tener layout transform");
    assert.ok(card.card_faces, "Debe tener card_faces");
    assert.equal(card.card_faces.length, 2, "Debe tener 2 caras");

    // El mana_cost raíz es la versión combinada — la cara frontal tiene el suyo propio
    const frontFace = card.card_faces[0];
    assert.ok(frontFace.mana_cost, "Cara frontal debe tener mana_cost propio");
    assert.ok(
      !frontFace.mana_cost.includes("//"),
      "mana_cost de la cara no debe incluir '//'",
    );
    assert.ok(frontFace.oracle_text, "Cara frontal debe tener oracle text");
    assert.ok(card.card_faces[1].name, "Cara trasera debe tener nombre");

    console.log(`  ✓ Layout: ${card.layout}`);
    console.log(`  ✓ Cara frontal: ${frontFace.name} (${frontFace.mana_cost})`);
    console.log(`  ✓ Cara trasera: ${card.card_faces[1].name}`);
  },
);

test(
  "carta de aventura tiene cara secundaria con mana_cost independiente",
  { timeout: TIMEOUT },
  async () => {
    const [ok, err, card] = await getCardByName("Bonecrusher Giant");

    assert.equal(ok, true, `Debería encontrar la carta. Error: ${err}`);
    assert.equal(card.layout, "adventure", "Debe tener layout adventure");
    assert.ok(card.card_faces, "Debe tener card_faces");
    assert.equal(card.card_faces.length, 2);

    const creatureFace = card.card_faces[0];
    const adventureFace = card.card_faces[1];

    // El mana_cost raíz contiene "//" — las caras tienen costes limpios
    assert.ok(
      card.mana_cost.includes("//"),
      "mana_cost raíz debe contener '//'",
    );
    assert.ok(
      !creatureFace.mana_cost.includes("//"),
      "Cara criatura no debe tener '//' en mana_cost",
    );
    assert.ok(
      !adventureFace.mana_cost.includes("//"),
      "Cara aventura no debe tener '//' en mana_cost",
    );
    assert.notEqual(
      creatureFace.mana_cost,
      adventureFace.mana_cost,
      "Las dos caras deben tener costes distintos",
    );

    console.log(`  ✓ Layout: ${card.layout}`);
    console.log(`  ✓ mana_cost raíz (combinado): ${card.mana_cost}`);
    console.log(
      `  ✓ Criatura: ${creatureFace.name} (${creatureFace.mana_cost})`,
    );
    console.log(
      `  ✓ Aventura: ${adventureFace.name} (${adventureFace.mana_cost})`,
    );
  },
);

test(
  "carta con mecánica prepare tiene cara secundaria con mana_cost independiente",
  { timeout: TIMEOUT },
  async () => {
    const [ok, err, card] = await getCardByName("Emeritus of Conflict");

    assert.equal(ok, true, `Debería encontrar la carta. Error: ${err}`);
    assert.equal(card.layout, "prepare", "Debe tener layout prepare");
    assert.ok(card.card_faces, "Debe tener card_faces");
    assert.equal(card.card_faces.length, 2);

    const mainFace = card.card_faces[0];
    const spellFace = card.card_faces[1];

    assert.ok(
      card.mana_cost.includes("//"),
      "mana_cost raíz debe contener '//'",
    );
    assert.ok(
      !mainFace.mana_cost.includes("//"),
      "Cara principal no debe tener '//' en mana_cost",
    );
    assert.ok(
      !spellFace.mana_cost.includes("//"),
      "Hechizo preparado no debe tener '//' en mana_cost",
    );
    assert.notEqual(
      mainFace.mana_cost,
      spellFace.mana_cost,
      "Las dos caras deben tener costes distintos",
    );

    console.log(`  ✓ Layout: ${card.layout}`);
    console.log(`  ✓ mana_cost raíz (combinado): ${card.mana_cost}`);
    console.log(`  ✓ Cara principal: ${mainFace.name} (${mainFace.mana_cost})`);
    console.log(
      `  ✓ Hechizo preparado: ${spellFace.name} (${spellFace.mana_cost})`,
    );
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
