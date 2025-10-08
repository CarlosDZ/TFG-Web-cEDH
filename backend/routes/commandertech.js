const express = requiere('express');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

const { post_commandertech, obtener_commandertechs, obtener_commandertech, toggle_like, toggle_fav, edit } = require('../controllers/commandertech');

router.post('/', authMiddleware, post_commandertech);
router.get('/', obtener_commandertechs);
router.get('/:id', obtener_commandertech);
router.patch('/:id',authMiddleware, edit);
router.delete('/:id', authMiddleware, 'funcion del controlador para borrar commandertech'); 
router.post('/:id/like', authMiddleware, toggle_like);
router.post('/:id/save', authMiddleware, toggle_fav);

module.exports = router;

/*
    Las funciones de borrado me preocupan a nivel de optimizacion.
    Hay que borrar todos los comentarios de la commandertech.
    Hay que borrrar la commander tech de la lista de favoritos de todos los usuarios.
    Y luego borrar la commander tech.
    Lo segundo podria ser un problema enorme.
    Quiza podria buscar una manera de no borrar en las listas de favoritos hasta que el usuario las carga, como hacer una comprobacion de integridad de ellas al ser necesario o algo asi.
*/