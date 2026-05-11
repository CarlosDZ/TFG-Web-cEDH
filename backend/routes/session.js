const express = require("express");
const checkSession = require("../middleware/checkSession");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const router = express.Router();

function issueToken(res, user) {
  const jwtPayload = {
    id: user._id,
    username: user.username,
    isAdmin: user.isAdmin,
    isVerified: user.isVerified,
  };
  const clientPayload = {
    ...jwtPayload,
    email: user.email,
    emailVerified: user.emailIsVerified,
  };
  const token = jwt.sign(jwtPayload, process.env.JWT_SECRET_KEY_MIDDLEWARE, {
    expiresIn: "30d",
  });
  res.cookie("legendsCEDH_auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
  return clientPayload;
}

router.get("/", checkSession, async (_req, res) => {
  if (!res.session.authenticated) {
    return res.json({ session: res.session });
  }

  try {
    const user = await User.findById(res.session.user.id).select(
      "username email isAdmin isVerified emailIsVerified",
    );
    if (!user) {
      return res.json({ session: { authenticated: false } });
    }
    const payload = issueToken(res, user);
    return res.json({ session: { authenticated: true, user: payload } });
  } catch (err) {
    console.error(err);
    return res.json({ session: { authenticated: false } });
  }
});

module.exports = router;
