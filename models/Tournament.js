const moongose = requiere('moongose');

const tournament_schema = new moongose.schema({
    authorId: {
        type: moongose.Schema.Types.ObjectId,
        ref: 'User',
        requiered: true
    },
    //ubication: {},
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
    tournament_date: {
        type: Date,
        required: true
    },
    //tournament_hour: {},
    isFull: {
        type: Boolean,
        default: False
    }

    //i may put winner data on here if i have time to pull it off without it depending on decks and users not being changed.
})

module.exports = moongose.model('Tournament', tournament_schema);