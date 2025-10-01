const express = requiere('express');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

const { obtener_discusiones, obtener_comentario } = require('../controllers/comment');
const { obtener_respuestas } = require('../controllers/comment');
const { reply_to } = require('../controllers/comment');
const { obtener_comentario } = require('../controllers/comment');
const { post_discusion } = require('../controllers/comment');
const { edit } = require('../controllers/comment');
const { delete_comment } = require('../controllers/comment');
const { toggle_like } = require('../controllers/comment');


router.post('/', authMiddleware, post_discusion);
router.get('/', obtener_discusiones);
router.get('/:id', obtener_comentario);
router.post('/:id/comment', authMiddleware, reply_to);
router.get('/:id/replies', obtener_respuestas);
router.put('/:id',authMiddleware, edit);
router.delete('/:id', authMiddleware, delete_comment);
router.post('/:id/like', authMiddleware, toggle_like);
//Comentar en un deck es una ruta en decklist.js

module.exports = router;