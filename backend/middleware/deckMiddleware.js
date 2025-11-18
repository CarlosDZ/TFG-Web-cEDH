const { validateDecklist } = require("../services/scryfallAPI");

const createDeckValidationMiddleware = async (req, res, next) => {
    const commander = req.body.commander;
    const main_deck = req.body.cards;

    if (!commander || !main_deck)
        return res.status(400).json("Error en la request: Falta el comandante o el decklist");

    const valid = await validateDecklist(commander, main_deck);

    if (valid[0] === true) return next();

    return res.status(409).json("Error en la request: " + valid[1]);
};

module.exports = createDeckValidationMiddleware;
