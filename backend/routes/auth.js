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
    const { email, password } = req.body;

    try {
        let user = await User.findOne({ email });

        if (user) {
            return res.status(400).json({ msg: 'Bu e-posta adresi zaten kullanımda.' });
        }

   
        user = new User({ email, password });

        await user.save();

        const token = generateToken(user._id);

        res.status(201).json({
            token,
            user: {
                id: user._id,
                email: user.email,
            },
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Sunucu Hatası');
    }
});


// @route   POST /api/auth/login
// @desc    Kullanıcı girişi ve JWT token döndürme
// @access  Public
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {

        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({ msg: 'Geçersiz kimlik bilgileri.' });
        }

        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return res.status(401).json({ msg: 'Geçersiz kimlik bilgileri.' });
        }

        const token = generateToken(user._id);

        res.json({
            token,
            user: {
                id: user._id,
                email: user.email,
            },
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Sunucu Hatası');
    }
});

module.exports = router;