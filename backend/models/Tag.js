const moongose = require('mongoose');

const tag_schema = new moongose.schema({
    name: {
        type: String,
        trim: true,
        required: true,
        unique: true
    },
    active: {
        type: Boolean,
        default: true
    }
})

moongose.exports = moongose.model('Tag', tag_schema);