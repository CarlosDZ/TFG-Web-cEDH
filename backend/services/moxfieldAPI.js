const axios = require("axios");

const moxfieldDeckUrl = "https://api2.moxfield.com/v3/decks/all";
const moxfieldPrimerUrl = "https://api2.moxfield.com/v1/decks";

const axiosHeaders = {
    "User-Agent": "Mozilla/5.0",
    Accept: "application/json",
};

function extractDeckSlug(url) {
    const match = url.match(/moxfield\.com\/decks\/([a-zA-Z0-9_-]+)/);
    if (!match) return null;
    return match[1];
}

function parseMoxfieldDeck(deckData, primerContent) {
    const commanders = Object.values(deckData.boards.commanders.cards).map((c) => c.card.name);
    const cards = Object.values(deckData.boards.mainboard.cards).map((c) => c.card.name);

    return {
        title: deckData.name,
        description: deckData.description || "",
        commander: commanders,
        cards,
        decktech_markdown: primerContent || "",
    };
}

async function importFromMoxfield(url) {
    const slug = extractDeckSlug(url);
    if (!slug) return [false, "Invalid Moxfield URL", null];

    try {
        const deckResponse = await axios.get(`${moxfieldDeckUrl}/${slug}`, {
            headers: axiosHeaders,
        });
        const deckData = deckResponse.data;

        let primerContent = "";
        try {
            const primerResponse = await axios.get(`${moxfieldPrimerUrl}/${deckData.id}/primer`, {
                headers: axiosHeaders,
            });
            primerContent = primerResponse.data?.content || "";
        } catch {
            // Deck without premier, can continue
        }

        const parsed = parseMoxfieldDeck(deckData, primerContent);
        return [true, "Deck imported correctly", parsed];
    } catch (error) {
        console.error("Error importing from Moxfield:", error.message);
        return [false, "Error fetching deck from Moxfield", null];
    }
}

module.exports = { importFromMoxfield };
