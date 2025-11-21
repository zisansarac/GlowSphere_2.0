const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/users/profile
// @desc    Giriş yapmış kullanıcının profil bilgilerini döndürür
// @access  Private (Sadece token ile erişilebilir)
router.get('/profile', protect, (req, res) => {
    res.json({
        id: req.user._id,
        email: req.user.email,
        createdAt: req.user.createdAt,
        message: "GlowSphere profil bilgileri yüklendi."
    });
});

module.exports = router;