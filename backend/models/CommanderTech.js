const mongoose = require('mongoose');

const commanderTech_schema = new mongoose.schema({
    authorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        requiered: true
    },
    commander: [String],
    text_markdown: {
        type: text,
        requiered: true
    },
    tags: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tag'
    }],
    allowComments: {
        type: Boolean,
        default: true
    },
    lastChangeDate: {
        type: Date,
        default: true
    },
    likes: {
        type: Number,
        default: 0
    },
    likedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    comments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment'
    }]
})

module.exports = mongoose.model('CommanderTech', commanderTech_schema);