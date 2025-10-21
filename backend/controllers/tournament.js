const Torneo = require('../models/Tournament');
const Usuario = require('../models/User');

const obtener_torneos = async (req, res) => {
    try{
        const torneos = await Torneo.find().populate('authorId','username');
        res.status(200).json(torneos);

    }catch(err){
        console.log(err);
        res.status(500).json('Error interno del server');
    }
};

const obtener_torneos_disponibles = async (req, res) => {
    try{
        const torneos = await Torneo.find({
            isFull:false,
            tournament_date_hour: { $gt: new Date() } //greater than now
        }).populate('authorId','username');
        res.status(200).json(torneos);

    }catch(err){
        console.log(err);
        res.status(500).json('Error interno del server');
    }
};

const obtener_torneo = async (req, res) => {
    try{
        const torneo = await Torneo.findById(req.params.id).populate('authorId','username');
        if(!torneo) return res.status(404).json('Torneo no encontrado');
        else{
            res.status(200).json(torneo);
        }

    }catch(err){
        console.log(err);
        res.status(500).json('Error interno del server');
    }
};

const toggle_fav = async (req, res) => {
    try{
        const torneoToFav = await Torneo.findById(req.params.id);
        const myself = await Usuario.findById(req.user.id);
        if(!torneoToFav) return res.status(404).json('Recurso no encontrado');
        else if(!myself) return res.status(401).json('No se ha podido determinar el usuario de la sesion');
        else if(myself.fav_tournament.some(fav_tournament_obj => fav_tournament_obj._id.toString() === torneoToFav._id.toString())){
            await Usuario.updateOne(
                {_id: req.user.id},
                { $pull: {fav_tournament: torneoToFav}}
            );
            res.status(200).json('Eliminacion de favorito procesado con exito');
        }
        else{
            await Usuario.updateOne(
                {_id:req.user.id},
                { $push: { fav_tournament: torneoToFav}}
            );
            res.status(200).json('Favorito procesado con exito');
        }
    }catch(err){
        console.log(err);
        res.status(500).json('Error interno del server');
    }
};

const delete_tournament = async (req, res) => {
    try{
        const torneoToDelete = await Torneo.findById(req.params.id);
        const myself = await Usuario.findById(req.user.id);
        if(!torneoToDelete) return res.status(404).json('Recurso no encontrado');
        else if (!myself) return res.status(401).json('No se ha podido determinar el usuario de la sesion');
        else if(!myself.isAdmin && !torneoToDelete.authorId.equals(myself._id)) return res.status(403).json('No tienes permiso para borrar eso.');
        else{
            await Usuario.updateMany(
                {fav_tournament: torneoToDelete._id},
                { $pull: {fav_tournament: torneoToDelete._id}}
            );
            await torneoToDelete.deleteOne();
            res.status(200).json('Borrado con exito');
        }
    }catch(err){
        console.log(err);
        res.status(500).json('Error interno del server');
    }
};

const post_tournament = async (req, res) => {
    try{
        const newTournament = new Torneo({
            authorId:req.user.id,
            ubication:req.body.ubication,
            name:req.body.name,
            description:req.body.description,
            format:req.body.format,
            enter_cost:req.body.enter_cost,
            prizes:req.body.prizes,
            ruling_markdown:req.body.ruling_markdown
        });
        await newTournament.save();
        res.status(201).json(newTournament);
    }catch(err){
        console.log(err);
        res.status(500).json('Error interno del server');
    }
};

module.exports = {
    obtener_torneos,
    obtener_torneos_disponibles,
    obtener_torneo,
    toggle_fav,
    delete_tournament,
    post_tournament
}