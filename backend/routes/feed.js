const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Post = require('../models/Post');
const Follow = require('../models/Follow');


// @access  Private
// @route   GET /api/feed/home
// @desc    Takip edilenlerin VE kendimin postlarını getir
// @access  Private
router.get('/home', protect, async (req, res) => {
    try {
        // 1. Takip edilenleri bul
        const follows = await Follow.find({ follower: req.user.id }).select('following');

        // 2. Sadece ID'leri bir diziye çıkar
        const followingUserIds = follows.map(follow => follow.following);

        // 3. : Kendi ID'ni de bu listeye ekle 
        followingUserIds.push(req.user.id);

        // 4. Postları Bul
        const feedPosts = await Post.find({ user: { $in: followingUserIds } })
            .sort({ createdAt: -1 }) 
            .populate('user', ['username', 'email', 'profileImage', 'createdAt']); 

        res.json(feedPosts);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Home Feed yüklenirken sunucu hatası.');
    }
});

module.exports = router;