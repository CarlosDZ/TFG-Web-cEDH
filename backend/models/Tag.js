const mongoose = require('mongoose');

const tag_schema = new mongoose.Schema({
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

module.exports = mongoose.model('Tag', tag_schema);