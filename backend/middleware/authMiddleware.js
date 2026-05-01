const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
    const token = req.cookies.legendsCEDH_auth_token;

    if (!token) {
        return res.status(401).json({ error: "Token nulo" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY_MIDDLEWARE);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: "Token inválido" });
    }
};

module.exports = authMiddleware;
