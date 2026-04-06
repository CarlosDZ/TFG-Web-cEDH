const { execFile } = require("child_process");
const { promisify } = require("util");
const execFileAsync = promisify(execFile);

const moxfieldDeckUrl = "https://api2.moxfield.com/v3/decks/all";
const moxfieldPrimerUrl = "https://api2.moxfield.com/v1/decks";

const curlHeaders = [
    "-H", "Accept: application/json, text/plain, */*",
    "-H", "Accept-Language: en-US,en;q=0.9",
    "-H", "Origin: https://www.moxfield.com",
    "-H", "Referer: https://www.moxfield.com/",
    "-H", "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
];

async function moxfieldGet(url) {
    const { stdout } = await execFileAsync("curl", [
        "-s", "--compressed", "-w", "\n%{http_code}",
        ...curlHeaders,
        url,
    ]);
    const lastNewline = stdout.lastIndexOf("\n");
    const statusCode = parseInt(stdout.slice(lastNewline + 1).trim(), 10);
    const body = stdout.slice(0, lastNewline);
    if (statusCode >= 400) {
        const err = new Error(`HTTP ${statusCode}`);
        err.status = statusCode;
        throw err;
    }
    return JSON.parse(body);
}

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
        const deckData = await moxfieldGet(`${moxfieldDeckUrl}/${slug}`);

        if (deckData.format !== "commander") {
            return [false, "El deck no es de formato Commander/EDH", null];
        }

        let primerContent = "";
        try {
            const primerData = await moxfieldGet(`${moxfieldPrimerUrl}/${deckData.id}/primer`);
            primerContent = primerData?.content || "";
        } catch {
            // Deck without primer, can continue
        }

        const parsed = parseMoxfieldDeck(deckData, primerContent);
        return [true, "Deck imported correctly", parsed];
    } catch (error) {
        console.error("Error importing from Moxfield:", error.message);
        return [false, "Error fetching deck from Moxfield", null];
    }
}

module.exports = { importFromMoxfield };
