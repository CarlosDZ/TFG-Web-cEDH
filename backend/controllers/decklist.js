const Decklist = require("../models/Decklist");
const User = require("../models/User");
const Comentario = require("../models/Comment");
const { importFromMoxfield } = require("../services/moxfieldAPI");

const post_decklist = async (req, res) => {
    try {
        const newDecklist = new Decklist({
            authorId: req.user.id,
            title: req.body.title,
            commander: req.body.commander,
            description: req.body.description,
            decktech_markdown: req.body.decktech_markdown,
            cards: req.body.cards,
            alternative_choices: req.body.alternative_choices,
            color_identity: req.body.color_identity ?? "",
            tags: req.body.tags,
            isPublic: req.body.isPublic,
            allowComments: req.body.allowComments,
        });
        await newDecklist.save();
        res.status(201).json(newDecklist);
    } catch (err) {
        console.log(err);
        res.status(500).json("Error interno del server");
    }
};

const obtener_decklists = async (req, res) => {
    try {
        const decklists = await Decklist.find({
            isPublic: true,
        }).populate("authorId", "username");
        res.status(200).json(decklists);
    } catch (err) {
        console.log(err);
        res.status(500).json("Error interno del server");
    }
};

const obtener_decklist = async (req, res) => {
    try {
        const decklist = await Decklist.findById(req.params.id).populate("authorId", "username");

        const myself = await User.findById(req.user.id);

        if (!myself)
            return res.status(401).json("No se ha podido determinar el usuario de la sesion");
        else if (!decklist) {
            return res.status(404).json("Decklist no encontrada");
        } else if (decklist.authorId._id.equals(myself._id) || decklist.isPublic) {
            res.status(200).json(decklist);
        } else {
            return res.status(403).json("No tienes acceso a esta decklist");
        }
    } catch (err) {
        console.log(err);
        res.status(500).json("Error interno del server");
    }
};

const toggle_like = async (req, res) => {
    try {
        const decklistToLike = await Decklist.findById(req.params.id);
        if (!decklistToLike) return res.status(404).json("Decklist no encontrada");
        else if (decklistToLike.likedBy.some((userId) => userId.toString() === req.user.id)) {
            decklistToLike.likedBy = decklistToLike.likedBy.filter(
                (id) => id.toString() !== req.user.id
            );
            decklistToLike.likes--;
            await decklistToLike.save();
            res.status(200).json("Eliminacion de like procesado con exito");
        } else {
            decklistToLike.likedBy.push(req.user.id);
            decklistToLike.likes++;
            await decklistToLike.save();
            res.status(200).json("Like procesado con exito");
        }
    } catch (err) {
        console.log(err);
        res.status(500).json("Error interno del server");
    }
};

const toggle_fav = async (req, res) => {
    try {
        const decklistToFav = await Decklist.findById(req.params.id);
        const myself = await User.findById(req.user.id);
        if (!decklistToFav) return res.status(404).json("Decklist no encontrada");
        else if (!myself)
            return res.status(401).json("No se ha podido determinar el usuario de la sesion");
        else if (
            myself.fav_decklist.some(
                (fav_decklist_obj) =>
                    fav_decklist_obj._id.toString() === decklistToFav._id.toString()
            )
        ) {
            await User.updateOne(
                { _id: req.user.id },
                { $pull: { fav_decklist: { _id: decklistToFav._id } } }
            );
            res.status(200).json("Eliminacion de favorito procesado con exito");
        } else {
            await User.updateOne({ _id: req.user.id }, { $push: { fav_decklist: decklistToFav } });
            res.status(200).json("Favorito procesado con exito");
        }
    } catch (err) {
        console.log(err);
        res.status(500).json("Error interno del server");
    }
};

const edit = async (req, res) => {
    try {
        const oldDecklist = await Decklist.findById(req.params.id);
        if (!oldDecklist) res.status(404).json("Decklist no encontrada");
        else if (oldDecklist.authorId !== req.user.id)
            return res.status(403).json("No tienes permiso para editar esto");
        else {
            oldDecklist.lastChangeDate = new Date().toISOString();

            const fields = [
                "title",
                "commander",
                "description",
                "decktech_markdown",
                "cards",
                "alternative_choices",
                "scryfallQuery",
                "tags",
                "isPublic",
                "allowComments",
            ];
            for (const field of fields) {
                oldDecklist[field] = req.body[field] ?? oldDecklist[field];
            }

            await oldDecklist.save();
            res.status(201).json(oldDecklist);
        }
    } catch (err) {
        console.log(err);
        res.status(500).json("Error interno del server");
    }
};

const delete_decklist = async (req, res) => {
    try {
        const decklist_to_delete = await Decklist.findById(req.params.id);
        const myself = await User.findById(req.user.id);
        if (!decklist_to_delete) return res.status(404).json("Decklist no encontrada");
        else if (!myself)
            return res.status(401).json("No se ha podido determinar el usuario de la sesion");
        else if (!myself.isAdmin && !decklist_to_delete.authorId.equals(myself._id))
            return res.status(403).json("No tienes permiso para borrar eso");
        else {
            await User.updateMany(
                { fav_decklist: decklist_to_delete._id },
                { $pull: { fav_decklist: decklist_to_delete._id } }
            );
            await decklist_to_delete.deleteOne();
            res.status(200).json("Borrado con exito");
        }
    } catch (err) {
        console.log(err);
        res.status(500).json("Error interno del server");
    }
};

const reply_to = async (req, res) => {
    try {
        const deck = await Decklist.findById(req.params.id);
        const myself = await User.findById(req.user.id);
        if (!deck) {
            return res.status(404).json("Decklist no encontrada");
        } else if (!myself) {
            return res.status(401).json("No se ha podido determinar el usuario de la sesion");
        } else if (!deck.allowComments && !deck.authorId.equals(myself._id)) {
            return res.status(403).json("No tienes permiso para comentar aqui");
        } else if (!req.body.markdown_text || typeof req.body.markdown_text !== "string") {
            return res.status(409).json("El comentario ha de tener cuerpo");
        } else {
            const newComment = new Comentario({
                markdown_text: req.body.markdown_text,
                authorId: req.user.id,
                comentingOnDeck: true,
            });

            await newComment.save();
            await Decklist.updateOne({ _id: deck._id }, { $push: { comments: newComment._id } });
            res.status(201).json(newComment);
        }
    } catch (err) {
        res.status(500).json("Error interno del server");
    }
};

const import_from_moxfield = async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: "URL Required" });

    const [ok, message, data] = await importFromMoxfield(url);
    if (!ok) return res.status(502).json({ error: message });

    res.status(200).json(data);
};

module.exports = {
    post_decklist,
    obtener_decklist,
    obtener_decklists,
    toggle_fav,
    toggle_like,
    edit,
    delete_decklist,
    reply_to,
    import_from_moxfield,
};
