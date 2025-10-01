const moongose = requiere('moongose');

const comment_schema = new moongose.schema({
    authorId: {
        type: moongose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    parentId: {
        type: moongose.Schema.Types.ObjectId,
        ref: 'Comment',
        default: null
    },
    comentingOnDeck: {
        type: Boolean,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    markdown_text: {
        type: String,
        required: true
    },
    title: String,
    likes: {
        type: Number,
        default: 0
    },
    likedBy: [{
        type: moongose.Schema.Types.ObjectId,
        ref: 'User'
    }]
})

module.exports = moongose.model('Comment', comment_schema);