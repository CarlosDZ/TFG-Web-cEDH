const PQueue = require('p-queue');
const axios = require('axios');

const APIqueue = new PQueue({
  interval: 1000,
  intervalCap: 10
  //10 peticiones por segundo es el limite especificado por Scryfall
});

async function validateDecklist(commander, decklist){
    const groupSize = 50;
    const groups = [];
    const allCards = commander.concat(decklist);

    if(allCards)

    for (let i = 0; i < decklist.length; i += groupSize) {
        groups.push(decklist.slice(i, i + groupSize));
    }

}