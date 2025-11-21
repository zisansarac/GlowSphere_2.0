const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Post = require('../models/Post');
const Follow = require('../models/Follow');

// @route   GET /api/feed/home
// @desc    Takip edilen kullanıcıların postlarını getirir (Home Feed)
// @access  Private
router.get('/home', protect, async (req, res) => {
    try {

        const follows = await Follow.find({ follower: req.user.id }).select('following');

        const followingUserIds = follows.map(follow => follow.following);

        const feedPosts = await Post.find({ user: { $in: followingUserIds } })
            .sort({ createdAt: -1 }) 
            .limit(20) 
            .populate('user', ['email', 'createdAt']); 

        res.json(feedPosts);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Home Feed yüklenirken sunucu hatası.');
    }
});

module.exports = router;