const axios = require("axios");

const scryfallUrl_collection = "https://api.scryfall.com/cards/collection";
const scryfallUrl_named = "https://api.scryfall.com/cards/named";
const scryfallUrl_autocomplete = "https://api.scryfall.com/cards/autocomplete";

function normalizeName(name) {
  return name.split(" // ")[0].trim();
}

function constructCollectionQueryBody(card_array) {
  const body = {
    identifiers: card_array.map((card) => ({ name: normalizeName(card) })),
  };
  return body;
}

async function checkCardsExist(card_array) {
  const body = constructCollectionQueryBody(card_array);
  try {
    const response = await axios.post(scryfallUrl_collection, body);
    const foundCards = response.data.data.filter((c) => c.object === "card");
    if (foundCards.length === card_array.length)
      return [true, "Todas las cartas existen."];

    const foundNames = new Set(
      foundCards.map((c) => normalizeName(c.name).toLowerCase()),
    );
    const missing = card_array.filter(
      (name) => !foundNames.has(normalizeName(name).toLowerCase()),
    );
    return [false, `Cartas no encontradas: ${missing.join(", ")}`];
  } catch (error) {
    console.error("Error en la petición a Scryfall:", error.message);
    return [false, "Error al contactar con Scryfall."];
  }
}

async function validateDecklist(commander, decklist) {
  const allCards = [...commander, ...decklist];

  if (allCards.length !== 100)
    return [
      false,
      `El deck debe tener exactamente 100 cartas (tienes ${allCards.length}).`,
    ];

  const groupSize = 50;
  for (let i = 0; i < allCards.length; i += groupSize) {
    const group = allCards.slice(i, i + groupSize);
    const [valid, message] = await checkCardsExist(group);
    if (!valid) return [false, message];
  }

  return [true, "El deck es válido."];
}

const COLOR_ORDER = ["W", "U", "B", "R", "G"];

async function getCommanderColorIdentity(commanderNames) {
  try {
    const body = {
      identifiers: commanderNames.map((name) => ({
        name: normalizeName(name),
      })),
    };
    const response = await axios.post(scryfallUrl_collection, body);
    const colors = new Set();
    for (const card of response.data.data) {
      for (const c of card.color_identity ?? []) colors.add(c);
    }
    return COLOR_ORDER.filter((c) => colors.has(c)).join("");
  } catch (error) {
    console.error("Error obteniendo color identity:", error.message);
    return "";
  }
}

async function getCardByName(name) {
  try {
    const response = await axios.get(scryfallUrl_named, {
      params: { fuzzy: name },
    });
    return [true, null, response.data];
  } catch (error) {
    if (error.response?.status === 404)
      return [false, "Carta no encontrada.", null];
    console.error("Error buscando carta en Scryfall:", error.message);
    return [false, "Error al contactar con Scryfall.", null];
  }
}

async function autocompleteCards(query) {
  if (!query || query.trim().length < 2) return [];
  try {
    const response = await axios.get(scryfallUrl_autocomplete, {
      params: { q: query },
    });
    return response.data.data ?? [];
  } catch (error) {
    console.error("Error en autocomplete de Scryfall:", error.message);
    return [];
  }
}

module.exports = {
  validateDecklist,
  getCommanderColorIdentity,
  getCardByName,
  autocompleteCards,
};
