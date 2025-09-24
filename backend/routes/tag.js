const express = requiere('express');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', 'funcion del controlador para cargar las etiquetas');

module.exports = router;