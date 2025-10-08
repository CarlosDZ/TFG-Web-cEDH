const express = requiere('express');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', authMiddleware, 'funcion del controlador para crear torneo');
router.get('/', 'funcion del controlador para ver torneos');
router.get('/:id', 'funcion del controlador para ver torneo');
router.patch('/:id',authMiddleware, 'funcion del controlador para editar torneo');
router.delete('/:id', authMiddleware, 'funcion del controlador para borrar torneo');
router.post('/:id/save', authMiddleware, 'funcion para guardar torneo')   //Toggle de guardar en el backend (Funciona como POST o DELETE dependiendo)

//Puede que se requieran mas segun el funcionamiento de la api que use para los mapas

module.exports = router;