const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const User = require('../models/User');

// @route   GET /api/users/profile
// @desc    Giriş yapmış kullanıcının profil bilgilerini döndürür
// @access  Private (Sadece token ile erişilebilir)
router.get('/profile', protect, (req, res) => {
    res.json({
       user: {
            _id: req.user._id,
            email: req.user.email,
            username: req.user.username,
            bio: req.user.bio,
            createdAt: req.user.createdAt
        }
    });
});

// @route   GET /api/users/:id
// @desc    ID'si verilen kullanıcının bilgilerini (username, bio, email) getir
// @access  Public (Herkes görebilir)
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password'); 
        
        if (!user) {
            return res.status(404).json({ msg: 'Kullanıcı bulunamadı.' });
        }

        res.json({ user });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
             return res.status(404).json({ msg: 'Kullanıcı bulunamadı.' });
        }
        res.status(500).send('Sunucu Hatası');
    }
});

module.exports = router;