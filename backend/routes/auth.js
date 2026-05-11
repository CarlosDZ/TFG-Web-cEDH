const express = require("express");
const crypto = require("crypto");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { hashPassword, verifyPassword } = require("../services/password");
const {
  sendVerificationEmail,
  verifyVerificationToken,
} = require("../services/mailer");
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

    try {
      await sendVerificationEmail(newUser);
    } catch (mailErr) {
      console.error("Fallo al enviar correo de verificacion:", mailErr);
    }

    return res.status(201).json({
      mensaje:
        "Cuenta creada. Te hemos enviado un correo para verificar tu email antes de poder iniciar sesión.",
      requiresVerification: true,
      email: newUser.email,
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

    if (!user.emailIsVerified) {
      return res.status(403).json({
        error:
          "Debes verificar tu correo antes de iniciar sesión. Revisa tu bandeja de entrada.",
        requiresVerification: true,
        email: user.email,
      });
    }

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
      secure: process.env.NODE_ENV === "production",
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

router.post("/logout", (req, res) => {
  res.clearCookie("legendsCEDH_auth_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
  return res.status(200).json({ message: "Sesión cerrada." });
});

router.post("/verify-email", async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: "Token requerido." });

  try {
    const payload = verifyVerificationToken(token);
    const user = await User.findById(payload.id);
    if (!user) return res.status(404).json({ error: "Usuario no encontrado." });

    if (user.emailIsVerified) {
      return res.status(200).json({
        message: "El correo ya estaba verificado.",
        alreadyVerified: true,
      });
    }

    user.emailIsVerified = true;
    await user.save();
    return res.status(200).json({ message: "Correo verificado con éxito." });
  } catch (err) {
    if (err.name === "TokenExpiredError")
      return res.status(410).json({
        error: "El enlace ha expirado. Solicita uno nuevo desde el login.",
        expired: true,
      });
    if (err.name === "JsonWebTokenError" || err.message.includes("propósito"))
      return res.status(400).json({ error: "Token inválido." });
    console.error(err);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
});

router.post("/resend-verification", async (req, res) => {
  const { nameOrMail } = req.body;
  if (!nameOrMail)
    return res.status(400).json({ error: "Se requiere usuario o email." });

  try {
    const user = await User.findOne({
      $or: [{ email: nameOrMail }, { username: nameOrMail }],
    });

    // Respuesta genérica para no filtrar qué emails existen
    const genericResponse = {
      message:
        "Si la cuenta existe y no está verificada, se ha enviado un nuevo correo de verificación.",
    };

    if (!user || user.emailIsVerified)
      return res.status(200).json(genericResponse);

    try {
      await sendVerificationEmail(user);
    } catch (mailErr) {
      console.error("Fallo al reenviar correo de verificacion:", mailErr);
    }
    return res.status(200).json(genericResponse);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
});

module.exports = router;
