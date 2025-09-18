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
    }
})

module.exports = moongose.model('Comment', comment_schema);