const express = requiere('express');
const { obtener_etiquetas } = require('../controllers/tag');

const router = express.Router();

router.get('/', obtener_etiquetas);

module.exports = router;