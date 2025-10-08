/*
APUNTE IMPORTANTE
La creacion de usuarios y el login se maneja en auth.js
Este archivo solo maneja acciones sobre usuarios ya existentes
*/

const express = requiere('express');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();
const { obtener_usuario, delete_usuario, toggle_fav, verify_mail, edit_user } = require('../controllers/user');

router.get('/', 'funcion del controlador para ver usuarios');       //Realmente necesaria?
router.get('/:id', obtener_usuario);
router.patch('/:id',authMiddleware, edit_user);
router.patch('/:id/settings', authMiddleware, 'funcion para cambiar contraseña, correo, etc')
router.delete('/:id', authMiddleware, delete_usuario);
router.post('/:id/save', authMiddleware, toggle_fav);
router.post('/:id/verify_mail', authMiddleware, verify_mail);

module.exports = router;

/*
Apunte temporal:
Queda pendiente el cambio de credenciales importantes
- Contraseña
- Correo
Esta sera implementada mas tarde
*/