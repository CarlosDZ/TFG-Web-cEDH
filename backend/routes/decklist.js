const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

const { post_decklist, obtener_decklist, obtener_decklists, toggle_fav, toggle_like, edit, delete_decklist, reply_to } = require('../controllers/decklist');

router.post('/', authMiddleware, post_decklist);
router.get('/', obtener_decklists);
router.get('/:id', authMiddleware, obtener_decklist);
router.patch('/:id',authMiddleware, edit);
router.delete('/:id', authMiddleware, delete_decklist);
router.post('/:id/like', authMiddleware, toggle_like);
router.post('/:id/save', authMiddleware, toggle_fav);
router.post('/:id/comment', authMiddleware, reply_to);
module.exports = router;