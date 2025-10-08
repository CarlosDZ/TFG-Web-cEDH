const express = requiere('express');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', authMiddleware, 'funcion del controlador para crear commandertech');
router.get('/', 'funcion del controlador para ver commandertechs');
router.get('/:id', 'funcion del controlador para ver commandertech');
router.patch('/:id',authMiddleware, 'funcion del controlador para editar commandertech');
router.delete('/:id', authMiddleware, 'funcion del controlador para borrar commandertech');
router.post('/:id/like', authMiddleware, 'funcion para dar like')   //Toggle de like en el backend (Funciona como POST o DELETE dependiendo)
router.post('/:id/save', authMiddleware, 'funcion para guardar commanderTech')   //Toggle de guardar en el backend (Funciona como POST o DELETE dependiendo)

module.exports = router;