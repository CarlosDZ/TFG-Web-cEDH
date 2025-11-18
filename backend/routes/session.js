const express = require("express");
const checkSession = require("../middleware/checkSession");
const router = express.Router();

router.get("/", checkSession, (req, res) => {
    res.json(req.session);
});

module.exports = router;
