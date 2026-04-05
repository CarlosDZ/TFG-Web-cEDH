const axios = require("axios");

const moxfieldUrl = "https://api2.moxfield.com/v3/decks/all";

function extractDeckId(url) {
    const match = url.match(/moxfield\.com\/decks\/([a-zA-Z0-9_-]+)/);
    if (!match) return null;
    return match[1];
}

function parseMoxfieldDeck(data) {
    const commanders = Object.values(data.boards.commanders.cards).map((c) => c.card.name);

    const cards = Object.values(data.boards.mainboard.cards).map((c) => c.card.name);

    return {
        title: data.name,
        description: data.description || "",
        commander: commanders,
        cards,
    };
}

async function importFromMoxfield(url) {
    const deckId = extractDeckId(url);
    if (!deckId) return [false, "Invalid Moxfield URL", null];

    try {
        const response = await axios.get(`${moxfieldUrl}/${deckId}`, {
            headers: {
                "User-Agent": "Mozilla/5.0",
                Accept: "application/json",
            },
        });

        const parsed = parseMoxfieldDeck(response.data);
        return [true, "Deck imported correctly", parsed];
    } catch (error) {
        console.error("Error importing from Moxfield:", error.message);
        return [false, "Error fetching deck from Moxfield", null];
    }
}

module.exports = { importFromMoxfield };
