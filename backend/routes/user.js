const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

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

module.exports = router;