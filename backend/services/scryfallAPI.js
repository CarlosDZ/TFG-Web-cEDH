const axios = require("axios");

const scryfallUrl_collection = "https://api.scryfall.com/cards/collection";

function constructCollectionQueryBody(card_array) {
    const body = {
        identifiers: card_array.map((card) => ({ name: card })),
    };
    return body;
}

async function checkCardsExist(card_array) {
    const body = constructCollectionQueryBody(card_array);
    try {
        const response = await axios.post(scryfallUrl_collection, body);
        const foundCards = response.data.data;
        if (foundCards.length === card_array.length) return [true, "Todas las cartas existen."];

        const foundNames = new Set(foundCards.map((c) => c.name.toLowerCase()));
        const missing = card_array.filter((name) => !foundNames.has(name.toLowerCase()));
        return [false, `Cartas no encontradas: ${missing.join(", ")}`];
    } catch (error) {
        console.error("Error en la petición a Scryfall:", error.message);
        return [false, "Error al contactar con Scryfall."];
    }
}

async function validateDecklist(commander, decklist) {
    const allCards = [...commander, ...decklist];

    if (allCards.length !== 100)
        return [false, `El deck debe tener exactamente 100 cartas (tienes ${allCards.length}).`];

    const groupSize = 50;
    for (let i = 0; i < allCards.length; i += groupSize) {
        const group = allCards.slice(i, i + groupSize);
        const [valid, message] = await checkCardsExist(group);
        if (!valid) return [false, message];
    }

    return [true, "El deck es válido."];
}

module.exports = { validateDecklist };
