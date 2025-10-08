const Comentario = require('../models/Comment');

const obtener_discusiones = async (res) => {
    try{
        const comentarios = await Comentario.find({
            parentId:null,
            comentingOnDeck:false
        }).populate('authorId', 'username');
        res.status(200).json(comentarios);
    }catch(err){
        console.log(err);
        res.status(500).json('Error interno del server.');
    }
};

const obtener_respuestas = async (req, res) => {
    try{
        const comentarios = await Comentario.find({
            parentId: req.params.id
        }).populate('authorId', 'username');
        res.status(200).json(comentarios);
    }catch(err){
        console.log(err);
        res.status(500).json('Error interno del server');
    }
};

const reply_to = async (req, res) => {
    try{
        const newComment = new Comentario({
            markdown_text: req.body.contenido,
            authorId: req.user.id,
            parentId: req.params.id,
            comentingOnDeck: false
        });

        await newComment.save();
        res.status(201).json(newComment);
    }catch(err){
        res.status(500).json('Error interno del server');
    }
};

const obtener_comentario = async (req, res) =>{
    try{
        const comentario = await Comentario.findById(req.params.id).populate('authorId', 'username');
        res.status(200).json(comentario);
    }catch(err){
        console.log(err);
        res.status(500).json('Error interno del server');
    }
};

const post_discusion = async (req, res) => {
    try{
        const newComment = new Comentario({
            title:req.body.title,
            markdown_text:req.body.markdown_text,
            authorId: req.user.id,
            comentingOnDeck: false
        });
        await newComment.save();
        res.status(201).json(newComment);
    }catch(err){
        console.log(err);
        res.status(500).json('Error interno del server');
    }
};

const edit = async (req, res) => {
    try{
        const oldComment = await Comentario.findById(req.params.id);
        if(!oldComment) return res.status(404).json('Comentario no encontrado');
        else if(oldComment.authorId.toString() !== req.user.id) return res.status(403).json('No tienes permiso para editar esto');
        else{
            oldComment.title = req.body.title;
            oldComment.markdown_text = req.body.markdown_text;
            await oldComment.save();
            res.status(201).json(oldComment);
        }
    }catch(err){
        console.log(err);
        res.status(500).json('Error interno del server');
    }
};

const delete_comment = async (req, res) => {
    try{
        const comentarioToDelete = await Comentario.findById(req.params.id);
        if(!comentarioToDelete) return res.status(404).json('Comentario no encontrado');
        else if(comentarioToDelete.authorId.toString() !== req.user.id && !req.user.isAdmin) return res.status(403).json('No tienes permiso para borrar esto');
        else{
            await comentarioToDelete.deleteOne();
            res.status(200).json('Borrado con exito');
        }
    }catch(err){
        console.log(err);
        res.status(500).json('Error interno del server');
    }
};

const toggle_like = async (req, res) => {
    try{
        const comentarioToLike = await Comentario.findById(req.params.id);
        if(!comentarioToLike) return res.status(404).json('Comentario no encontrado');
        else if(comentarioToLike.likedBy.some(userId => userId.toString() === req.user.id)){
            comentarioToLike.likedBy = comentarioToLike.likedBy.filter(id => id.toString() !== req.user.id);
            comentarioToLike.likes--;
            res.status(200).json('Eliminacion de like procesado con exito');
        }
        else{
            comentarioToLike.likedBy.push(req.user.id);
            comentarioToLike.likes++;
            await comentarioToLike.save();
            res.status(200).json('Like procesado con exito');
        }
    }catch(err){
        console.log(err);
        res.status(500).json('Error interno del server');
    }
};

module.exports = {
  obtener_discusiones,
  obtener_respuestas,
  reply_to,
  obtener_comentario,
  post_discusion,
  edit,
  delete_comment,
  toggle_like
};