const express = require("express");
const checkSession = require("../middleware/checkSession");
const router = express.Router();

router.get("/", checkSession, (req, res) => {
    res.json({session: res.session});
});

module.exports = router;
