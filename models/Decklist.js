const mongoose = require('mongoose');

const decklist_schema = new mongoose.Schema({
    title: { 
        type: String,
        required: true,
        trim: true
    },

    commander: [String],
    description: String,
    decktech_markdown: String,
    cards: [String],
    alternative_choices: [String],
    scryfallQuery: String,
    authorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    tags: [{
        type: moongose.Schema.Types.ObjectId,
        ref: 'Tag',
    }],
    isPublic: {
        type: Boolean,
        default: true
    },
    allowComments: {
        type: Boolean,
        default: true
    },
    lastChangeDate: {
        type: Date,
        default: Date.now
    },
    likes: {
        type: Number,
        default: 0
    },
    likedBy: [{
        type: moongose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    comments: [{
        type: moongose.Schema.Types.ObjectId,
        ref: 'Comment'
    }]
});

module.exports = mongoose.model('Decklist', decklist_schema);