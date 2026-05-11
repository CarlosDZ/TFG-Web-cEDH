const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const checkSession = require("../middleware/checkSession");
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
  get_organized_tournaments,
  join_tournament,
  get_my_entry,
  get_entries,
  patch_entry,
  delete_entry,
} = require("../controllers/tournament");

router.post("/", authMiddleware, post_tournament);
router.get("/", obtener_torneos);
router.get("/aviable", obtener_torneos_disponibles);
router.get("/saved", authMiddleware, get_saved_tournaments);
router.get("/organized", authMiddleware, get_organized_tournaments);
router.get("/:id", obtener_torneo);
router.patch("/:id", authMiddleware, patch_tournament);
router.delete("/:id", authMiddleware, delete_tournament);
router.post("/:id/save", authMiddleware, toggle_fav);
router.post("/:id/join", checkSession, join_tournament);
router.get("/:id/my-entry", authMiddleware, get_my_entry);
router.get("/:id/entries", authMiddleware, get_entries);
router.patch("/:id/entries/:entryId", authMiddleware, patch_entry);
router.delete("/:id/entries/:entryId", authMiddleware, delete_entry);

module.exports = router;
