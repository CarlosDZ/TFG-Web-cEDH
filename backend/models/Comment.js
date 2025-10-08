const mongoose = require('mongoose');

const comment_schema = new mongoose.schema({
    authorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    parentId: {
        type: mongoose.Schema.Types.ObjectId,
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
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
})

module.exports = mongoose.model('Comment', comment_schema);