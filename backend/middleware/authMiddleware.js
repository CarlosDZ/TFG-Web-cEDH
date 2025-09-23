const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');    //Pillo el token de la cabecera HTTP y si no es nulo le quito Bearer

  if (!token) {
    return res.status(401).json({ error: 'Token nulo' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);   //pillo la key de env y la verifico en conjunto al token
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};

module.exports = authMiddleware;
