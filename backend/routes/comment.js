const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const router = express.Router();

const {
  obtener_discusiones,
  obtener_respuestas,
  reply_to,
  obtener_comentario,
  post_discusion,
  edit,
  delete_comment,
  toggle_like,
  is_liked,
  search_discusiones,
} = require("../controllers/comment");

router.get("/search", search_discusiones);
router.post("/", authMiddleware, post_discusion);
router.get("/", obtener_discusiones);
router.get("/:id", obtener_comentario);
router.post("/:id/comment", authMiddleware, reply_to);
router.get("/:id/replies", obtener_respuestas);
router.patch("/:id", authMiddleware, edit);
router.delete("/:id", authMiddleware, delete_comment);
router.post("/:id/like", authMiddleware, toggle_like);
router.get("/:id/isLiked", authMiddleware, is_liked);
//Comentar en un deck es una ruta en decklist.js

module.exports = router;
