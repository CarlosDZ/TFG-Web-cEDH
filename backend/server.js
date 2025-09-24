require('dotenv').config();

const express = require('express');
const authMiddleware = require('./middlewares/authMiddleware');

const app = express();
app.use(express.json());
app.use(require('cors')());

moongose.connect(process.env.MONGODB_URL);
//RUTAS
app.use('/api/auth', require('./routes/auth'));
app.use('/api/decklist', require ('./routes/decklist'));
app.use('/api/commandertech', require('./routes/commandertech'));

//LISTENER
app.listen(process.env.BACKEND_PORT, () => {
  console.log('Backend corriendo en puerto '+process.env.BACKEND_PORT);
});