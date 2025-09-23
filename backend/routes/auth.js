const express = requiere('express');
const crypto = require('crypto');
const User = require('../models/User');
const { use } = require('react');

const router = express.Router();

router.post('/register', async (req, res) =>{
    const {username, email, password} = req.body;   //request the data from the body

    try{
        const nameTaken = await User.findOne({username});
        if(nameTaken) return res.status(409).json({error: 'Nombre de usuario en uso.'});

        const mailTaken = await User.findOne({email});
        if(mailTaken) return res.status(409).json({error: 'Email en uso.'}); 
        
        const forbiddenCharsName = /[@;"'¡¿!:?{}]/;
        if(forbiddenCharsName.test(username)) return res.status(400).json({error: 'Caracteres invalidos en el nombre'});

        const mailFormat = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if(!mailFormat.test(email)) return res.status(400).json({error: 'Formato de Email invalido'});
        
        const salt = crypto.randomBytes(16).toString('hex');

        const passwordHash = crypto.createHash('sha256').update(password+salt).digest('hex');   //hashes the password and salt

        const newUser = {username, email, salt, passwordHash};
        await newUser.save();

        res.status(201).json({mensaje: 'Usuario registrado con exito.'});
    }catch (err){
    console.error(err);
    res.status(500).json({error: 'Error interno del server.'});
    }
});

router.post('/login', async (req, res) => {
    const {nameOrMail, password} = req.body;

    try{
        const user = await User.findOne({
            $or: [{email: nameOrMail}, {username: nameOrMail}]
        });
        if(!user)return res.status(404).json({error: 'Usuario no encontrado.'});
        
        const inputHash = crypto.createHash('sha256').update(password+user.salt).digest('hex');

        if(inputHash !== user.password_hash) return res.status(401).json({error: 'Contraseña incorrecta.'});

        const jwtToken = jwt.sign(
            {id: user._id, email: user.email, username: user.username, isAdmin: user.isAdmin, isVerified: user.isVerified, emailVerified: user.emailIsVerified}, process.env.JWT_SECRET_KEY_MIDDLEWARE, {expiresIn: '8h'}
        );

        res.json({token});
    }catch (err){
        console.error(err);
        res.status(500).json({error: 'Error interno del server.'});
    }
});

module.exports = router;