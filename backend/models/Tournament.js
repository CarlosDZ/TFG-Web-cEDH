const mongoose = require('mongoose');

const tournament_schema = new mongoose.schema({
    authorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        requiered: true
    },
    ubication: {
        type: String,
        required: true
    },
    name: {
        type: String,
        requiered: true
    },
    description: String,
    format: {
        type: String,
        required: true
    },
    enter_cost: {
        type: String,
        requiered: true
    },
    prizes: [{
        range: {
            type: String,
            requiere: true
        },
        prize: {
            type: String,
            require: true
        }
    }],
    ruling_markdown: String,
    tournament_date_hour: {
        type: Date,
        required: true
    },
    isFull: {
        type: Boolean,
        default: False
    }

    //i may put winner data on here if i have time to pull it off without it depending on decks and users not being changed.
})

module.exports = mongoose.model('Tournament', tournament_schema);