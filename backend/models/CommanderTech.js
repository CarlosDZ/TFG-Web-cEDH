const mongoose = require("mongoose");

const commanderTech_schema = new mongoose.Schema({
    authorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    pickup_lane: {
        type: String,
        default: ''
    },
    commander: [String],
    title: String,
    pickup_lane: String,
    text_markdown: {
        type: String,
        required: true
    },
    tags: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Tag",
        },
    ],
    allowComments: {
        type: Boolean,
        default: true,
    },
    lastChangeDate: {
        type: Date,
        default: true,
    },
    likes: {
        type: Number,
        default: 0,
    },
    likedBy: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    ],
    comments: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment",
        },
    ],
});

module.exports = mongoose.model("CommanderTech", commanderTech_schema);
