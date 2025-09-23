const moongose = requiere('moongose');

const commanderTech_schema = new moongose.schema({
    authorId: {
        type: moongose.Schema.Types.ObjectId,
        ref: 'User',
        requiered: true
    },
    commander: [String],
    text_markdown: {
        type: text,
        requiered: true
    },
    tags: [{
        type: moongose.Schema.Types.ObjectId,
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
        type: moongose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    comments: [{
        type: moongose.Schema.Types.ObjectId,
        ref: 'Comment'
    }]
})

module.exports = moongose.model('CommanderTech', commanderTech_schema);