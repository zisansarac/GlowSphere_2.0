const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');


const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });
};


// @route   POST /api/auth/register
// @desc    Yeni kullanıcı kaydı
// @access  Public
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ msg: 'Lütfen tüm alanları doldurun.' });
    }

    try {
        let userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ msg: 'Bu e-posta adresi zaten kayıtlı.' });
        }

       let usernameExists = await User.findOne({ username });
        if (usernameExists) {
            return res.status(400).json({ msg: 'Bu kullanıcı adı zaten alınmış.' });
        }

        const user = await User.create({
            username,
            email,
            password
        });

       if (user) {
            res.status(201).json({
                token: generateToken(user._id),
                user: {
                    _id: user._id,
                    username: user.username, // Cevaba username ekledik
                    email: user.email,
                    bio: user.bio,
                    createdAt: user.createdAt
                }
            });
        } else {
            res.status(400).json({ msg: 'Geçersiz kullanıcı verisi.' });
        }

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Sunucu hatası.');
    }
});



// @route   POST /api/auth/login
// @desc    Kullanıcı girişi ve JWT token döndürme
// @access  Public
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {

        const user = await User.findOne({ email }).select('+password');

       if (user && (await user.matchPassword(password))) {
            res.json({
                token: generateToken(user._id),
                user: {
                    _id: user._id,
                    username: user.username,
                    email: user.email,
                    bio: user.bio,
                    createdAt: user.createdAt
                }
            });
        } else {
            res.status(401).json({ msg: 'Geçersiz e-posta veya şifre.' });
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Sunucu hatası.');
    }
});

module.exports = router;