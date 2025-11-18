const axios = require("axios");

const scryfallUrl_collection = "https://api.scryfall.com/cards/collection";

function constructCollectionQueryBody(card_array) {
    if (card_array.length > 50 || card_array.length < 0)
        return { error: "The card collection is not between 1 and 50 cards." };

    const body = {
        identifiers: card_array.map((card) => ({ name: card })),
    };

    return body;
}

async function checkCardsExist(request_body, expected_length) {
    try {
        const response = await axios.post(scryfallUrl_collection, request_body);

        const foundCards = response.data.data;
        if (foundCards.length === expected_length) return [true, "Todas las cartas existen."];
        return [false, "Hay una o mas cartas que no existen."];
    } catch (error) {
        console.error("Error en la petición:", error.message);
        return [false, "Error en la peticion."];
    }
}

async function validateDecklist(commander, decklist) {
    const groupSize = 50;
    const groups = [];
    const allCards = commander.concat(decklist);

    if (allCards.length != 100) return [false, "Your deck does not contain exactly 100 cards."];

    for (let i = 0; i < decklist.length; i += groupSize) {
        groups.push(decklist.slice(i, i + groupSize));
    }

    let valid_group;
    let valid_deck = [true, "All the cards on your deck exist."];
    groups.forEach(async (group) => {
        valid_group = await checkCardsExist(constructCollectionQueryBody(group), group.length);
        if (valid_group[0] === false) {
            valid_deck = valid_group;
        }
    });

    return valid_deck;
}
