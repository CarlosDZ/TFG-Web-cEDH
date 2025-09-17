const mongoose = require('mongoose');

const decklist_schema = new mongoose.Schema({
    title: { 
        type: String,
        required: true,
        trim: true
    },

    commander: [String],
    description: String,
    cards: [String],
    alternative_choices: [String],
    scryfallQuery: String,
    authorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    tags: [String],
    isPublic: {
        type: Boolean,
        default: true
    },
    allowComments: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    likes: {
        type: Number,
        default: 0
    },
    comments: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User' 
        },
        text: String,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }]
});
