const Etiqueta = require('../models/Tag');

const obtener_etiquetas = async (res) => {
    try{
        const etiquetas = await Etiqueta.find({active:true});
        res.status(200).json(etiquetas);
    }catch(err){
        console.log(err);
        res.status(500).json('Error interno del server.');
    }
};

module.exports = {
    obtener_etiquetas
};