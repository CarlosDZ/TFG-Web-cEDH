const jwt = require("jsonwebtoken");

const checkSession = (req, res, next) => {
    const token = req.cookies.spaincEDH_auth_token;

    if (!token) {
        res.session = { authenticated: false };
        return next();
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY_MIDDLEWARE);
        res.session = { authenticated: true, user: decoded };
        return next();
    } catch (err) {
        res.session = { authenticated: false };
        return next();
    }
};

module.exports = checkSession;
