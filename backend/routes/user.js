const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { protect } = require('../middleware/authMiddleware');
const User = require('../models/User');
const Follow = require('../models/Follow');

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

        const userData = {
            ...user._doc, 
            followersCount: user.followersCount || 0,
            followingCount: user.followingCount || 0
        };

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
        

        const regex = new RegExp(keyword, 'i'); 

        const users = await User.find({
            $or: [
                { username: { $regex: regex } }
            ]
        }).select('username email bio profileImage');

        console.log(`Bulunan Kullanıcı Sayısı: ${users.length}`);

        res.json(users);
    } catch (err) {
        console.error("Arama Hatası:", err.message);
        res.status(500).send('Arama sırasında hata oluştu.');
    }
});

// @route   GET /api/users/suggestions/random
// @desc    Takip etmediğim rastgele 3 kullanıcıyı öner
// @access  Private
router.get('/suggestions/random', protect, async (req, res) => {
    try {
        const currentUserId = req.user.id;

        const myFollows = await Follow.find({ follower: currentUserId }).select('following');
        const excludeIds = myFollows.map(f => f.following);

        excludeIds.push(new mongoose.Types.ObjectId(currentUserId));

        const suggestions = await User.aggregate([
            { 
                $match: { 
                    _id: { $nin: excludeIds } 
                } 
            },
            { $sample: { size: 3 } }, 
            { $project: { username: 1, email: 1, profileImage: 1 } } 
        ]);

        res.json(suggestions);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Öneriler alınırken hata oluştu.');
    }
});

module.exports = router;