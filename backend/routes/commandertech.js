const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

const {
  post_commandertech,
  obtener_commandertechs,
  obtener_commandertech,
  toggle_like,
  toggle_fav,
  edit,
  delete_commandertech,
  is_liked,
  comment_on_commandertech,
  obtener_comentarios_commandertech,
  search_commandertechs,
} = require("../controllers/commandertech");

router.post("/", authMiddleware, post_commandertech);
router.get("/", obtener_commandertechs);
router.get("/search", search_commandertechs);
router.get("/:id", obtener_commandertech);
router.patch("/:id", authMiddleware, edit);
router.delete("/:id", authMiddleware, delete_commandertech);
router.post("/:id/like", authMiddleware, toggle_like);
router.get("/:id/isLiked", authMiddleware, is_liked);
router.post("/:id/save", authMiddleware, toggle_fav);
router.post("/:id/comment", authMiddleware, comment_on_commandertech);
router.get("/:id/comments", obtener_comentarios_commandertech);

module.exports = router;
