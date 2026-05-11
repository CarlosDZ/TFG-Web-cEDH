const mongoose = require("mongoose");

const tournament_entry_schema = new mongoose.Schema({
  tournamentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tournament",
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  username_snapshot: {
    type: String,
    required: true,
    trim: true,
  },

  // Deck snapshot (frozen at submit time, null if tournament doesn't require decklist)
  title: {
    type: String,
    default: null,
    trim: true,
  },
  commander: [String],
  cards: [String],
  color_identity: {
    type: String,
    default: "",
  },
  card_images: {
    type: Map,
    of: String,
    default: {},
  },
  card_types: {
    type: Map,
    of: String,
    default: {},
  },
  decklistId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Decklist",
    default: null,
  },

  status: {
    type: String,
    enum: ["pending", "accepted", "rejected"],
    default: "pending",
  },

  placement: {
    type: String,
    default: null,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },

  comments: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
    },
  ],

  submitted_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("TournamentEntry", tournament_entry_schema);
