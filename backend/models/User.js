const mongoose = require('mongoose');

const user_schema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },                          //NAME AND EMAIL VERIFICATION ON FRONTEND... NO @ IN NAME PLS
    emailIsVerified:{
        type: Boolean,
        default: false
    },
    salt:{
        type: String,
        required: true
    },
    password_hash: {
        type: String,
        required: true
    },
    bio: {
        type: String,
        default: ''
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    isVerified: {
        type: Boolean,
        default: false
    },

    fav_commanderTech: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CommanderTech'
    }],
    fav_decklist: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Decklist'
    }],
    fav_user:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    fav_tournament:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tournament'
    }]
});     //I dont know if i would add a favorite option to all these 4 but i include them from the start to dodge consistency problems later on

module.exports = mongoose.model('User', user_schema);
