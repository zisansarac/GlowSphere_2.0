const express = require('express');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');
const router = express.Router();
const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Like = require('../models/Like');
const Follow = require('../models/Follow');
const jwt = require('jsonwebtoken');
const { protect } = require('../middleware/authMiddleware');


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

// @route   POST /api/auth/forgotpassword
// @desc    Şifre sıfırlama linki gönder
// @access  Public
router.post('/forgotpassword', async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ msg: 'Bu e-posta ile kayıtlı kullanıcı bulunamadı.' });
        }

        const resetToken = crypto.randomBytes(20).toString('hex');


        user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        

        user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

        await user.save();

        const resetUrl = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`;

        const message = `
            Şifrenizi sıfırlamak için aşağıdaki linke tıklayın:\n\n
            ${resetUrl}\n\n
            Bu işlemi siz yapmadıysanız bu e-postayı görmezden gelin.
        `;

        try {
            await sendEmail({
                email: user.email,
                subject: 'GlowSphere Şifre Sıfırlama',
                message
            });

            res.status(200).json({ success: true, data: 'E-posta gönderildi.' });
        } catch (emailError) {
            console.error("Mail hatası:", emailError);
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save();
            return res.status(500).json({ msg: 'E-posta gönderilemedi.' });
        }

    } catch (err) {
        console.error(err);
        res.status(500).send('Sunucu hatası.');
    }
});


// @route   PUT /api/auth/resetpassword/:resetToken
// @desc    Yeni şifreyi kaydet
// @access  Public
router.put('/resetpassword/:resetToken', async (req, res) => {
    try {
    
        const resetPasswordToken = crypto.createHash('sha256').update(req.params.resetToken).digest('hex');

        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ msg: 'Geçersiz veya süresi dolmuş token.' });
        }

        user.password = req.body.password;

        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();

        res.status(200).json({ success: true, data: 'Şifre başarıyla güncellendi.' });

    } catch (err) {
        console.error(err);
        res.status(500).send('Sunucu hatası.');
    }
});

router.delete('/delete', protect, async (req, res) => {
    try {
        const userId = req.user.id;

        await Post.deleteMany({ user: userId });

        await Comment.deleteMany({ user: userId });

        await Like.deleteMany({ user: userId });

        await Follow.deleteMany({ $or: [{ follower: userId }, { following: userId }] });

        await User.findByIdAndDelete(userId);

        res.json({ msg: 'Hesap başarıyla silindi.' });

    } catch (err) {
        console.error("Hesap silme hatası:", err.message);
        res.status(500).send('Sunucu hatası');
    }
});



module.exports = router;