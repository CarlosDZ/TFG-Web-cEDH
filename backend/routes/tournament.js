const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const router = express.Router();

const {
  obtener_torneos,
  obtener_torneos_disponibles,
  obtener_torneo,
  toggle_fav,
  delete_tournament,
  post_tournament,
  patch_tournament,
  get_saved_tournaments,
} = require("../controllers/tournament");

router.post("/", authMiddleware, post_tournament);
router.get("/", obtener_torneos);
router.get("/aviable", obtener_torneos_disponibles);
router.get("/saved", authMiddleware, get_saved_tournaments);
router.get("/:id", obtener_torneo);
router.patch("/:id", authMiddleware, patch_tournament);
router.delete("/:id", authMiddleware, delete_tournament);
router.post("/:id/save", authMiddleware, toggle_fav);

//Puede que se requieran mas segun el funcionamiento de la api que use para los mapas

module.exports = router;
