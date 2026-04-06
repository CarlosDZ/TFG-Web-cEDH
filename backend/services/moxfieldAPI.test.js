const { test } = require("node:test");
const assert = require("node:assert/strict");
const { importFromMoxfield } = require("./moxfieldAPI");

const TIMEOUT = 15000;

test("importa correctamente un deck con primer", { timeout: TIMEOUT }, async () => {
    const [ok, msg, data] = await importFromMoxfield(
        "https://moxfield.com/decks/KuTcRLw1zUu1aUNaAFw8NA"
    );

    assert.equal(ok, true, `Debería importar con éxito. Mensaje: ${msg}`);
    assert.ok(data.title, "Debe tener título");
    assert.ok(
        Array.isArray(data.commander) && data.commander.length > 0,
        "Debe tener al menos un comandante"
    );
    assert.ok(Array.isArray(data.cards) && data.cards.length > 0, "Debe tener cartas");
    assert.ok(
        data.decktech_markdown && data.decktech_markdown.length > 0,
        "Debe tener primer (decktech_markdown)"
    );

    console.log(`  ✓ Título: ${data.title}`);
    console.log(`  ✓ Comandante(s): ${data.commander.join(", ")}`);
    console.log(`  ✓ Cartas: ${data.cards.length}`);
    console.log(`  ✓ Primer: ${data.decktech_markdown.length} caracteres`);
});

test("importa 2 comandantes para un bluefarm", { timeout: TIMEOUT }, async () => {
    const [ok, msg, data] = await importFromMoxfield(
        "https://moxfield.com/decks/bteFZTv7Ck282fWTRJEkRA"
    );

    assert.equal(ok, true, `Debería importar con éxito. Mensaje: ${msg}`);
    assert.ok(data.title, "Debe tener título");
    assert.ok(
        Array.isArray(data.commander) && data.commander.length == 2,
        "Debe tener 2 comandantes"
    );
    assert.ok(Array.isArray(data.cards) && data.cards.length > 0, "Debe tener cartas");

    console.log(`  ✓ Título: ${data.title}`);
    console.log(`  ✓ Comandante(s): ${data.commander.join(", ")}`);
    console.log(`  ✓ Cartas: ${data.cards.length}`);
});

test("falla con un deck privado", { timeout: TIMEOUT }, async () => {
    const [ok, msg, data] = await importFromMoxfield(
        "https://moxfield.com/decks/ez7FqjDaGEO9F97BKCbeYw"
    );

    assert.equal(ok, false, "Un deck privado debería devolver ok=false");
    assert.equal(data, null, "No debe devolver datos");

    console.log(`  ✓ Mensaje de error: ${msg}`);
});

test("importa correctamente un deck sin primer", { timeout: TIMEOUT }, async () => {
    const [ok, msg, data] = await importFromMoxfield(
        "https://moxfield.com/decks/2HvUHT2OwEqC3HzrwWFKbg"
    );

    assert.equal(ok, true, `Debería importar con éxito. Mensaje: ${msg}`);
    assert.ok(data.title, "Debe tener título");
    assert.ok(
        Array.isArray(data.commander) && data.commander.length > 0,
        "Debe tener al menos un comandante"
    );
    assert.ok(Array.isArray(data.cards) && data.cards.length > 0, "Debe tener cartas");
    assert.equal(data.decktech_markdown, "", "Sin primer, decktech_markdown debe ser vacío");

    console.log(`  ✓ Título: ${data.title}`);
    console.log(`  ✓ Comandante(s): ${data.commander.join(", ")}`);
    console.log(`  ✓ Cartas: ${data.cards.length}`);
    console.log(`  ✓ Sin primer confirmado`);
});

test("falla con un deck que no es Commander", { timeout: TIMEOUT }, async () => {
    const [ok, msg, data] = await importFromMoxfield(
        "https://moxfield.com/decks/5DzIRCVKY0y-v7lFZcRFcQ/primer"
    );

    assert.equal(ok, false, "Un deck no-Commander debería devolver ok=false");
    assert.equal(data, null, "No debe devolver datos");
    assert.ok(
        msg.toLowerCase().includes("commander"),
        `El mensaje debe mencionar Commander. Fue: "${msg}"`
    );

    console.log(`  ✓ Mensaje de error: ${msg}`);
});

test("falla con una URL inválida", async () => {
    const [ok, msg, data] = await importFromMoxfield("https://noesmoxfield.com/decks/abc123");

    assert.equal(ok, false, "Una URL inválida debería devolver ok=false");
    assert.equal(data, null, "No debe devolver datos");

    console.log(`  ✓ Mensaje de error: ${msg}`);
});
