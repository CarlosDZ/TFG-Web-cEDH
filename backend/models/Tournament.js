const mongoose = require("mongoose");

const tournament_schema = new mongoose.Schema({
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  ubication: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  description: String,
  format: {
    type: String,
    required: true,
  },
  enter_cost: {
    type: String,
    required: true,
  },
  prizes: [
    {
      range: {
        type: String,
        required: true,
      },
      prize: {
        type: String,
        required: true,
      },
    },
  ],
  ruling_markdown: String,
  tournament_date_hour: {
    type: Date,
    required: true,
  },
  isFull: {
    type: Boolean,
    default: false,
  },
  max_players: {
    type: Number,
    default: null,
  },

  auto_accept_participants: {
    type: Boolean,
    default: false,
  },
  needs_decklist: {
    type: Boolean,
    default: false,
  },
  reserve_non_confirmed_places: {
    type: Boolean,
    default: true,
  },
  registration_deadline: {
    type: Date,
    default: null,
  },
});

module.exports = mongoose.model("Tournament", tournament_schema);
