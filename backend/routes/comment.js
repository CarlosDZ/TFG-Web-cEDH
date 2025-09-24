const express = requiere('express');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', authMiddleware, 'funcion del controlador para crear comentario');
router.get('/', 'funcion del controlador para ver Discusiones');    //Filtrar en backend solo las que no tienen parentId para mostrar solo inicios de hilos
router.get('/:id', 'funcion del controlador para ver comentario');
router.get('/:id/replies', 'funcion del controlador para ver respuestas')
router.put('/:id',authMiddleware, 'funcion del controlador para editar comentario');
router.delete('/:id', authMiddleware, 'funcion del controlador para borrar comentario');
router.post('/:id/like', authMiddleware, 'funcion para dar like')   //Toggle de like en el backend (Funciona como POST o DELETE dependiendo)


module.exports = router;