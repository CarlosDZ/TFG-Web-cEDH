const CommanderTech = require("../models/CommanderTech");
const Comentario = require("../models/Comment");
const mongoose = require("mongoose");
const User = require("../models/User");

const post_commandertech = async (req, res) => {
  try {
    const newCommandertech = new CommanderTech({
      authorId: req.user.id,
      title: req.body.title,
      pickup_lane: req.body.pickup_lane,
      allowComments: req.body.allowComments,
      lastChangeDate: new Date().toISOString(),
      text_markdown: req.body.text_markdown,
      tags: req.body.tags,
      commander: req.body.commander,
    });
    await newCommandertech.save();
    res.status(201).json(newCommandertech);
  } catch (err) {
    console.log(err);
    res.status(500).json("Error interno del server");
  }
};

const obtener_commandertechs = async (req, res) => {
  try {
    const commandertechs = await CommanderTech.find().populate(
      "authorId",
      "username",
    );
    res.status(200).json(commandertechs);
  } catch (err) {
    console.log(err);
    res.status(500).json("Error interno del server");
  }
};

const obtener_commandertech = async (req, res) => {
  try {
    const commandertech = await CommanderTech.findById(req.params.id).populate(
      "authorId",
      "username",
    );
    res.status(200).json(commandertech);
  } catch (err) {
    console.log(err);
    res.status(500).json("Error interno del server");
  }
};

const toggle_like = async (req, res) => {
  try {
    const commandertechToLike = await CommanderTech.findById(req.params.id);
    if (!commandertechToLike)
      return res.status(404).json("Commander Tech no encontrada");
    else if (
      commandertechToLike.likedBy.some(
        (userId) => userId.toString() === req.user.id,
      )
    ) {
      commandertechToLike.likedBy = commandertechToLike.likedBy.filter(
        (id) => id.toString() !== req.user.id,
      );
      commandertechToLike.likes--;
      await commandertechToLike.save();
      res.status(200).json({ likes: commandertechToLike.likes, liked: false });
    } else {
      commandertechToLike.likedBy.push(req.user.id);
      commandertechToLike.likes++;
      await commandertechToLike.save();
      res.status(200).json({ likes: commandertechToLike.likes, liked: true });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json("Error interno del server");
  }
};

const toggle_fav = async (req, res) => {
  try {
    const commandertechToFav = await CommanderTech.findById(req.params.id);
    const myself = await User.findById(req.user.id);
    if (!commandertechToFav)
      return res.status(404).json("Commander Tech no encontrado");
    else if (!myself)
      return res
        .status(401)
        .json("No se ha podido determinar el usuario de la sesion");
    else if (
      myself.fav_commanderTech.some(
        (fav_commandertech_obj) =>
          fav_commandertech_obj._id.toString() ===
          commandertechToFav._id.toString(),
      )
    ) {
      await User.updateOne(
        { _id: req.user.id },
        { $pull: { fav_commanderTech: { _id: commandertechToFav._id } } },
      );
      res.status(200).json("Eliminacion de favorito procesado con exito");
    } else {
      await User.updateOne(
        { _id: req.user.id },
        { $push: { fav_commanderTech: commandertechToFav } },
      );
      res.status(200).json("Favorito procesado con exito");
    }
  } catch (err) {
    console.log(err);
    res.status(500).json("Error interno del server");
  }
};

const edit = async (req, res) => {
  try {
    const oldCommandertech = await CommanderTech.findById(req.params.id);
    if (!oldCommandertech) res.status(404).json("Commander Tech no encontrada");
    else if (oldCommandertech.authorId !== req.user.id)
      return res.status(403).json("No tienes permiso para editar esto");
    else {
      oldCommandertech.lastChangeDate = new Date().toISOString();
      oldCommandertech.text_markdown = req.body.text_markdown;
      oldCommandertech.tags = req.body.tags;
      oldCommandertech.allowComments = req.body.allowComments;
      await oldCommandertech.save();
      res.status(201).json(oldCommandertech);
    }
  } catch (err) {
    console.log(err);
    res.status(500).json("Error interno del server");
  }
};

const delete_commandertech = async (req, res) => {
  try {
    const commandertech_to_delete = await CommanderTech.findById(req.params.id);
    const myself = await User.findById(req.user.id);
    if (!commandertech_to_delete)
      return res.status(404).json("Commander Tech no encontrada");
    else if (!myself)
      return res
        .status(401)
        .json("No se ha podido determinar el usuario de la sesion");
    else if (
      !myself.isAdmin &&
      !commandertech_to_delete.authorId.equals(myself._id)
    )
      return res.status(403).json("No tienes permiso para borrar eso");
    else {
      await User.updateMany(
        { fav_commanderTech: commandertech_to_delete._id },
        { $pull: { fav_commanderTech: commandertech_to_delete._id } },
      );
      await commandertech_to_delete.deleteOne();
      res.status(200).json("Borrado con exito");
    }
  } catch (err) {
    console.log(err);
    res.status(500).json("Error interno del server");
  }
};

const comment_on_commandertech = async (req, res) => {
  try {
    const tech = await CommanderTech.findById(req.params.id);
    if (!tech) return res.status(404).json("Commander Tech no encontrada");
    if (!tech.allowComments)
      return res.status(403).json("Los comentarios están desactivados");

    const newComment = new Comentario({
      markdown_text: req.body.markdown_text,
      authorId: req.user.id,
      comentingOnDeck: false,
      comentingOnCommanderTech: true,
    });
    await newComment.save();
    await CommanderTech.updateOne(
      { _id: tech._id },
      { $push: { comments: newComment._id } },
    );
    await newComment.populate("authorId", "username");
    res.status(201).json({ ...newComment.toObject(), replyCount: 0 });
  } catch (err) {
    console.log(err);
    res.status(500).json("Error interno del server");
  }
};

const obtener_comentarios_commandertech = async (req, res) => {
  try {
    const tech = await CommanderTech.findById(req.params.id);
    if (!tech) return res.status(404).json("Commander Tech no encontrada");

    const comentarios = await Comentario.aggregate([
      {
        $match: {
          _id: {
            $in: tech.comments.map((id) => new mongoose.Types.ObjectId(id)),
          },
          parentId: null,
        },
      },
      {
        $lookup: {
          from: "comments",
          localField: "_id",
          foreignField: "parentId",
          as: "replies",
        },
      },
      { $addFields: { replyCount: { $size: "$replies" } } },
      { $project: { replies: 0 } },
      {
        $lookup: {
          from: "users",
          localField: "authorId",
          foreignField: "_id",
          as: "authorId",
        },
      },
      { $unwind: "$authorId" },
      { $project: { "authorId.password": 0 } },
    ]);
    res.status(200).json(comentarios);
  } catch (err) {
    console.log(err);
    res.status(500).json("Error interno del server");
  }
};

const is_liked = async (req, res) => {
  try {
    const tech = await CommanderTech.findById(req.params.id);
    if (!tech) return res.status(404).json("Commander Tech no encontrada");
    const liked = tech.likedBy.some((id) => id.toString() === req.user.id);
    res.status(200).json({ liked });
  } catch (err) {
    console.log(err);
    res.status(500).json("Error interno del server");
  }
};

const search_commandertechs = async (req, res) => {
  try {
    const title = (req.query.title || req.query.q || "").trim();
    const cards = []
      .concat(req.query.cards || [])
      .map((c) => c.trim())
      .filter(Boolean);

    if (title.length < 2 && cards.length === 0) return res.status(200).json([]);

    const conditions = [];

    if (title.length >= 2) {
      const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      conditions.push({ title: { $regex: escaped, $options: "i" } });
    }

    if (cards.length > 0) {
      conditions.push({ commander: { $all: cards } });
    }

    const filter =
      conditions.length === 1 ? conditions[0] : { $and: conditions };

    const techs = await CommanderTech.find(filter)
      .select("_id title commander pickup_lane likes lastChangeDate authorId")
      .populate("authorId", "username")
      .limit(20)
      .lean();

    res.status(200).json(techs);
  } catch (err) {
    console.log(err);
    res.status(500).json("Error interno del server.");
  }
};

const obtener_commandertechs_por_usuario = async (req, res) => {
  try {
    const techs = await CommanderTech.find({ authorId: req.params.userId })
      .select(
        "_id title commander pickup_lane text_markdown likes lastChangeDate tags authorId allowComments",
      )
      .populate("authorId", "username")
      .sort({ lastChangeDate: -1 })
      .lean();
    res.status(200).json(techs);
  } catch (err) {
    console.log(err);
    res.status(500).json("Error interno del server");
  }
};

module.exports = {
  post_commandertech,
  obtener_commandertechs_por_usuario,
  obtener_commandertechs,
  obtener_commandertech,
  toggle_like,
  toggle_fav,
  edit,
  delete_commandertech,
  comment_on_commandertech,
  obtener_comentarios_commandertech,
  is_liked,
  search_commandertechs,
};
