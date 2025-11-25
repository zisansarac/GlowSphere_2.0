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
            profileImage: req.user.profileImage,
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

// @route   GET /api/users/search/:query
// @desc    Kullanıcı ara
// @access  Public
router.get('/search/:query', async (req, res) => {
    try {
        const keyword = req.params.query;
        
        console.log("--- ARAMA İSTEĞİ GELDİ ---");
        console.log("Aranan Kelime:", keyword);

        const regex = new RegExp(keyword, 'i'); 

        const users = await User.find({
            $or: [
                { username: { $regex: regex } },
                { email: { $regex: regex } }
            ]
        }).select('username email bio profileImage');

        console.log(`Bulunan Kullanıcı Sayısı: ${users.length}`);

        res.json(users);
    } catch (err) {
        console.error("Arama Hatası:", err.message);
        res.status(500).send('Arama sırasında hata oluştu.');
    }
});

module.exports = router;