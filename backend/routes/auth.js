const express = require("express");
const crypto = require("crypto");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { hashPassword, verifyPassword } = require("../services/password");
const router = express.Router();

router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const nameTaken = await User.findOne({ username });
    if (nameTaken)
      return res.status(409).json({ error: "Nombre de usuario en uso." });

    const mailTaken = await User.findOne({ email });
    if (mailTaken) return res.status(409).json({ error: "Email en uso." });

    const forbiddenCharsName = /[@;"'¡¿!:?{}]/;
    if (forbiddenCharsName.test(username))
      return res
        .status(400)
        .json({ error: "Caracteres invalidos en el nombre" });

    const mailFormat = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!mailFormat.test(email))
      return res.status(400).json({ error: "Formato de Email invalido" });

    const salt = crypto.randomBytes(16).toString("hex");
    const password_hash = await hashPassword(password, salt);
    const newUser = new User({ username, email, salt, password_hash });
    await newUser.save();

    const jwtPayload = {
      id: newUser._id,
      username: newUser.username,
      isAdmin: newUser.isAdmin,
      isVerified: newUser.isVerified,
    };
    const jwtToken = jwt.sign(
      jwtPayload,
      process.env.JWT_SECRET_KEY_MIDDLEWARE,
      { expiresIn: "30d" },
    );
    res.cookie("legendsCEDH_auth_token", jwtToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    return res.status(201).json({
      mensaje: "Usuario registrado con exito.",
      user: {
        ...jwtPayload,
        email: newUser.email,
        emailVerified: newUser.emailIsVerified,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error:
        "Error interno del servidor. Por favor intentalo mas tarde. Sentimos las molestias!",
    });
  }
});

router.post("/login", async (req, res) => {
  const { nameOrMail, password } = req.body;

  try {
    const user = await User.findOne({
      $or: [{ email: nameOrMail }, { username: nameOrMail }],
    });
    if (!user) return res.status(404).json({ error: "Usuario no encontrado." });

    const isValid = await verifyPassword(
      password,
      user.salt,
      user.password_hash,
    );
    if (!isValid)
      return res.status(401).json({ error: "Contraseña incorrecta." });

    // Migración transparente: si el hash era SHA256, rehashear con Argon2id
    if (/^[0-9a-f]{64}$/.test(user.password_hash)) {
      const newSalt = crypto.randomBytes(16).toString("hex");
      user.salt = newSalt;
      user.password_hash = await hashPassword(password, newSalt);
      await user.save();
    }

    const jwtPayload = {
      id: user._id,
      username: user.username,
      isAdmin: user.isAdmin,
      isVerified: user.isVerified,
    };

    const jwtToken = jwt.sign(
      jwtPayload,
      process.env.JWT_SECRET_KEY_MIDDLEWARE,
      { expiresIn: "30d" },
    );

    res.cookie("legendsCEDH_auth_token", jwtToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    return res.status(200).json({
      message: "Login completado",
      user: {
        ...jwtPayload,
        email: user.email,
        emailVerified: user.emailIsVerified,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error:
        "Error interno del servidor. Por favor intentalo mas tarde. Sentimos las molestias!",
    });
  }
});

module.exports = router;
