const express = requiere('express');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

const { obtener_torneos, obtener_torneos_disponibles, obtener_torneo, toggle_fav, delete_tournament, post_tournament} = require('../controllers/tournament');

router.post('/', authMiddleware, post_tournament);
router.get('/', obtener_torneos);
router.get('/:id', obtener_torneo);
router.get('/aviable', obtener_torneos_disponibles);
router.patch('/:id',authMiddleware, 'funcion del controlador para editar torneo');  //maybe later lol
router.delete('/:id', authMiddleware, delete_tournament);
router.post('/:id/save', authMiddleware, toggle_fav);

//Puede que se requieran mas segun el funcionamiento de la api que use para los mapas

module.exports = router;