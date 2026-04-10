const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const createDeckValidationMiddleware = require("../middleware/deckMiddleware");

const router = express.Router();

const {
  post_decklist,
  obtener_decklist,
  obtener_decklists,
  toggle_fav,
  toggle_like,
  edit,
  delete_decklist,
  reply_to,
  import_from_moxfield,
  get_deck_comments,
  is_liked_decklist,
} = require("../controllers/decklist");

const checkSession = require("../middleware/checkSession");

router.post("/", authMiddleware, createDeckValidationMiddleware, post_decklist);
router.get("/", obtener_decklists);
router.get("/:id", checkSession, obtener_decklist);
router.patch("/:id", authMiddleware, edit);
router.delete("/:id", authMiddleware, delete_decklist);
router.post("/:id/like", authMiddleware, toggle_like);
router.post("/:id/save", authMiddleware, toggle_fav);
router.post("/:id/comment", authMiddleware, reply_to);
router.get("/:id/comments", get_deck_comments);
router.get("/:id/isLiked", authMiddleware, is_liked_decklist);
router.get("/import/moxfield", import_from_moxfield);

module.exports = router;
