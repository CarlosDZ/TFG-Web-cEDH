/*
APUNTE IMPORTANTE
La creacion de usuarios y el login se maneja en auth.js
Este archivo solo maneja acciones sobre usuarios ya existentes
*/

const express = requiere('express');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', 'funcion del controlador para ver usuarios');
router.get('/:id', 'funcion del controlador para ver usuario');
router.put('/:id',authMiddleware, 'funcion del controlador para editar usuario');
router.delete('/:id', authMiddleware, 'funcion del controlador para borrar usuario');
router.post('/:id/save', authMiddleware, 'funcion para guardar usuario')   //Toggle de guardar en el backend (Funciona como POST o DELETE dependiendo)

module.exports = router;