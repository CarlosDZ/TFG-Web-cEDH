const CommanderTech = require('../models/CommanderTech');

const post_commandertech = async (req, res) => {
    try{
        const newCommandertech = new CommanderTech({
            authorId:req.user.id,
            allowComments:req.body.allowComments,
            lastChangeDate: new Date().toISOString(),
            text_markdown:req.body.text_markdown,
            tags:req.body.tags,
            commander:req.body.commander
        });
        await newCommandertech.save();
        res.status(201).json(newCommandertech);
    }catch(err){
        console.log(err);
        res.status(500).json('Error interno del server');
    }
};

const obtener_commandertechs = async (req, res) => {
    try{
        const commandertechs = await CommanderTech.find().populate('authorId', 'username');
        res.status(200).json(commandertechs);
    }catch(err){
        console.log(err);
        res.status(500).json('Error interno del server');
    }
};

const obtener_commandertech = async (req, res) => {
    try{
        const commandertech = await CommanderTech.findById(req.params.id).populate('authorId', 'username');
        res.status(200).json(commandertech);
    }catch(err){
        console.log(err);
        res.status(500).json('Error interno del server');
    }
};

const toggle_like = async (req, res) => {
    try{
        const commandertechToLike = await CommanderTech.findById(req.params.id);
        if(!commandertechToLike) return res.status(404).json('Commander Tech no encontrada');
        else if(commandertechToLike.likedBy.some(userId => userId.toString() === req.user.id)){
            commandertechToLike.likedBy = commandertechToLike.likedBy.filter(id => id.toString() !== req.user.id);
            commandertechToLike.likes--;
            res.status(200).json('Eliminacion de like procesado con exito');
        }
        else{
            commandertechToLike.likedBy.push(req.user.id);
            commandertechToLike.likes++;
            await commandertechToLike.save();
            res.status(200).json('Like procesado con exito');
        }
    }catch(err){
        console.log(err);
        res.status(500).json('Error interno del server');
    }
};

const toggle_fav = async (req, res) => {
    try{
        const commandertechToFav = await CommanderTech.findById(req.params.id);
        const myself = await delete_usuario.findById(req.user.id);
        if(!commandertechToFav) return res.status(404).json('Commander Tech no encontrado');
        else if(!myself) return res.status(401).json('No se ha podido determinar el usuario de la sesion');
        
        else if(myself.fav_commanderTech.some(fav_commandertech_obj => fav_commandertech_obj._id.toString() === commandertechToFav._id.toString())){
                    await Usuario.updateOne(
                        {_id:req.user.id},
                        { $pull: { fav_commanderTech: { _id: commandertechToFav._id } } }
                    );
                    res.status(200).json('Eliminacion de favorito procesado con exito');
                }
                else{
                    await Usuario.updateOne(
                        { _id: req.user.id },
                        { $push: { fav_commanderTech: commandertechToFav } }
                    );
                    res.status(200).json('Favorito procesado con exito');
                }
    }catch(err){
        console.log(err);
        res.status(500).json('Error interno del server');
    }
};

const edit = async (req, res) => {
    try{
        const oldCommandertech = await CommanderTech.findById(req.params.id);
        if(!oldCommandertech) res.status(404).json('Commander Tech no encontrada')
        else if(oldCommandertech.authorId !== req.user.id) return res.status(403).json('No tienes permiso para editar esto');
        else{
            oldCommandertech.lastChangeDate = new Date().toISOString();
            oldCommandertech.text_markdown = req.body.text_markdown;
            oldCommandertech.tags = req.body.tags;
            oldCommandertech.allowComments = req.body.allowComments;
            await oldCommandertech.save();
            res.status(201).json(oldCommandertech);
        }
    }catch(err){
        console.log(err);
        res.status(500).json('Error interno del server');
    }
};

module.exports = {
    post_commandertech,
    obtener_commandertechs,
    obtener_commandertech,
    toggle_like,
    toggle_fav,
    edit
}