const Usuario = require('../models/User');
const Deck = require('../models/Decklist');
const CommanderTech = require('../models/CommanderTech');
const Comentario = require('../models/Comment');
const Torneo = require('../models/Tournament');

const obtener_usuario = async (req, res) => {
    try{
        const usuario = await Usuario.findById(req.params.id);
        res.status(200).json(usuario);
    }catch(err){
        console.log(err);
        res.status(500).json('Error interno del server.');
    }
};

const delete_usuario = async (req, res) => {
    try{
        const usuarioToDelete = await Usuario.findById(req.params.id);
        if(!usuarioToDelete) return res.status(404).json('Usuario no encontrado');
        else if(usuarioToDelete._id.toString() !== req.user.id && !req.user.isAdmin) return res.status(403).json('No tienes permiso para borrar esto');
        else{
            await Comentario.deleteMany({ authorId: usuarioToDelete._id });
            await Deck.deleteMany({ authorId: usuarioToDelete._id });
            await CommanderTech.deleteMany({ authorId: usuarioToDelete._id });
            await Torneo.deleteMany({ authorId: usuarioToDelete._id });

            await usuarioToDelete.deleteOne();

            res.status(200).json('Borrado con exito');
        }
    }catch(err){
        console.log(err);
        res.status(500).json('Error interno del server');
    }
};

const toggle_fav = async (req, res) => {
    try{
        const userToFav = await Usuario.findById(req.params.id);
        const myself = await Usuario.findById(req.user.id);
        if(!userToFav) return res.status(404).json('Usuario no encontrado');
        else if(!myself) return res.status(401).json('No se ha podido determinar el usuario de la sesion');
        else if(myself.fav_user.some(fav_user_obj => fav_user_obj._id.toString() === userToFav._id.toString())){
            await Usuario.updateOne(
                {_id:req.user.id},
                { $pull: { fav_user: { _id: userToFav._id } } }
            );
            res.status(200).json('Eliminacion de favorito procesado con exito');
        }
        else{
            await Usuario.updateOne(
                { _id: req.user.id },
                { $push: { fav_user: userToFav } }
            );
            res.status(200).json('Favorito procesado con exito');
        }
    }catch(err){
        console.log(err);
        res.status(500).json('Error interno del server');
    }
};

const verify_mail = async (req, res) => {
    try{
        if(!req.user.isAdmin) return res.status(501).json('No tienes permiso para verificar emails');
        else{
            User.updateOne(
                {_id: req.params.id},
                {emailIsVerified: true}
            );
            res.status(200).json('Email verificado con exito');
        }
    }catch(err){
        console.log(err);
        res.status(500).json('Error interno del server');
    }
};

const edit_user = async(req, res) => {
    try{
        if(req.user.id !== req.params.id) return res.status(403).json('La sesion no coincide con el usuario objetivo');
        else{
            const newName = req.body.username;
            const newBio = req.body.bio;

            if(await Usuario.findOne({username:newName}) &&  req.user.username != newName) return res.status(409).json('El nombre de usuario no esta disponible.');
            else{
                const usuarioObjetivo = await Usuario.findById(req.params.id);
                usuarioObjetivo.bio = newBio;
                usuarioObjetivo.username = newName;
                await usuarioObjetivo.save();
                res.status(200).json(usuarioObjetivo);
            }
        }
    }catch(err){
        console.log(err);
        res.status(500).json('Error interno del server');
    }
};

module.exports = {
    obtener_usuario,
    delete_usuario,
    toggle_fav,
    verify_mail,
    edit_user
}