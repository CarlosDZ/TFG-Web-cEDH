const express = requiere('express');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', authMiddleware, 'funcion del controlador para crear deck');
router.get('/', 'funcion del controlador para ver decks publicos');
router.get('/:id', authMiddleware, 'funcion del controlador para ver deck');
router.put('/:id',authMiddleware, 'funcion del controlador para editar deck');
router.delete('/:id', authMiddleware, 'funcion del controlador para borrar deck');
router.post('/:id/like', authMiddleware, 'funcion para dar like')   //Toggle de like en el backend (Funciona como POST o DELETE dependiendo)
router.post('/:id/save', authMiddleware, 'funcion para guardar deck')   //Toggle de guardar en el backend (Funciona como POST o DELETE dependiendo)
router.post('/:id/comment', authMiddleware, 'funcion para comentar en deck') //solo si permite comentarios
module.exports = router;