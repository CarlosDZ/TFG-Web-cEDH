const crypto = require("crypto");
const Usuario = require("../models/User");
const Deck = require("../models/Decklist");
const CommanderTech = require("../models/CommanderTech");
const Comentario = require("../models/Comment");
const Torneo = require("../models/Tournament");

const obtener_usuario = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id).select(
      "-password_hash -salt -__v",
    );
    res.status(200).json(usuario);
  } catch (err) {
    console.log(err);
    res.status(500).json("Error interno del server.");
  }
};

const delete_usuario = async (req, res) => {
  try {
    const usuarioToDelete = await Usuario.findById(req.params.id);
    if (!usuarioToDelete) return res.status(404).json("Usuario no encontrado");
    else if (
      usuarioToDelete._id.toString() !== req.user.id &&
      !req.user.isAdmin
    )
      return res.status(403).json("No tienes permiso para borrar esto");
    else {
      await Comentario.deleteMany({ authorId: usuarioToDelete._id });
      await Deck.deleteMany({ authorId: usuarioToDelete._id });
      await CommanderTech.deleteMany({ authorId: usuarioToDelete._id });
      await Torneo.deleteMany({ authorId: usuarioToDelete._id });

      await usuarioToDelete.deleteOne();

      res.status(200).json("Borrado con exito");
    }
  } catch (err) {
    console.log(err);
    res.status(500).json("Error interno del server");
  }
};

const toggle_fav = async (req, res) => {
  try {
    const userToFav = await Usuario.findById(req.params.id);
    const myself = await Usuario.findById(req.user.id);
    if (!userToFav) return res.status(404).json("Usuario no encontrado");
    else if (!myself)
      return res
        .status(401)
        .json("No se ha podido determinar el usuario de la sesion");
    else if (
      myself.fav_user.some(
        (fav_user_obj) =>
          fav_user_obj._id.toString() === userToFav._id.toString(),
      )
    ) {
      await Usuario.updateOne(
        { _id: req.user.id },
        { $pull: { fav_user: userToFav._id } },
      );
      res.status(200).json("Eliminacion de favorito procesado con exito");
    } else {
      await Usuario.updateOne(
        { _id: req.user.id },
        { $push: { fav_user: userToFav } },
      );
      res.status(200).json("Favorito procesado con exito");
    }
  } catch (err) {
    console.log(err);
    res.status(500).json("Error interno del server");
  }
};

const verify_mail = async (req, res) => {
  try {
    if (!req.user.isAdmin)
      return res.status(501).json("No tienes permiso para verificar emails");
    else {
      User.updateOne({ _id: req.params.id }, { emailIsVerified: true });
      res.status(200).json("Email verificado con exito");
    }
  } catch (err) {
    console.log(err);
    res.status(500).json("Error interno del server");
  }
};

const edit_user = async (req, res) => {
  try {
    if (req.user.id !== req.params.id)
      return res
        .status(403)
        .json("La sesion no coincide con el usuario objetivo");

    const {
      username: newName,
      bio: newBio,
      email: newEmail,
      currentPassword,
      newPassword,
    } = req.body;

    if (newName) {
      const existing = await Usuario.findOne({ username: newName });
      if (existing && existing._id.toString() !== req.params.id)
        return res.status(409).json("El nombre de usuario no esta disponible.");
    }

    if (newEmail) {
      const existing = await Usuario.findOne({ email: newEmail.toLowerCase() });
      if (existing && existing._id.toString() !== req.params.id)
        return res.status(409).json("El correo electrónico ya está en uso.");
    }

    const usuarioObjetivo = await Usuario.findById(req.params.id).select(
      "username bio email salt password_hash",
    );

    if (newPassword) {
      if (!currentPassword)
        return res.status(400).json("Se requiere la contraseña actual.");
      const inputHash = crypto
        .createHash("sha256")
        .update(currentPassword + usuarioObjetivo.salt)
        .digest("hex");
      if (inputHash !== usuarioObjetivo.password_hash)
        return res.status(401).json("La contraseña actual es incorrecta.");
      const newSalt = crypto.randomBytes(16).toString("hex");
      usuarioObjetivo.salt = newSalt;
      usuarioObjetivo.password_hash = crypto
        .createHash("sha256")
        .update(newPassword + newSalt)
        .digest("hex");
    }

    if (newName !== undefined) usuarioObjetivo.username = newName;
    if (newBio !== undefined) usuarioObjetivo.bio = newBio;
    if (newEmail !== undefined) usuarioObjetivo.email = newEmail.toLowerCase();

    await usuarioObjetivo.save();
    res.status(200).json({
      _id: usuarioObjetivo._id,
      username: usuarioObjetivo.username,
      bio: usuarioObjetivo.bio,
      email: usuarioObjetivo.email,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json("Error interno del server");
  }
};

const search_usuarios = async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    if (q.length < 2) return res.status(200).json([]);
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escaped, "i");
    const usuarios = await Usuario.find({ username: regex })
      .select("_id username bio createdAt isVerified")
      .limit(8)
      .lean();
    res.status(200).json(usuarios);
  } catch (err) {
    console.log(err);
    res.status(500).json("Error interno del server.");
  }
};

const obtener_usuario_por_nombre = async (req, res) => {
  try {
    const usuario = await Usuario.findOne({
      username: req.params.username,
    }).select("-password_hash -salt -__v -email");
    if (!usuario) return res.status(404).json("Usuario no encontrado");
    res.status(200).json(usuario);
  } catch (err) {
    console.log(err);
    res.status(500).json("Error interno del server.");
  }
};

const listar_usuarios = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = 20;
    const skip = (page - 1) * limit;
    const [usuarios, total] = await Promise.all([
      Usuario.find()
        .select("_id username bio createdAt isVerified")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Usuario.countDocuments(),
    ]);
    res
      .status(200)
      .json({ usuarios, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.log(err);
    res.status(500).json("Error interno del server.");
  }
};

module.exports = {
  obtener_usuario,
  delete_usuario,
  toggle_fav,
  verify_mail,
  edit_user,
  search_usuarios,
  obtener_usuario_por_nombre,
  listar_usuarios,
};
