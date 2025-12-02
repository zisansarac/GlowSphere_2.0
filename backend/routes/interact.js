const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

const Follow = require('../models/Follow');
const User = require('../models/User');

// @route   POST /api/interact/follow/:targetUserId
// @desc    Kullanıcıyı takip et / takibi bırak 
// @access  Private
router.post('/follow/:targetUserId', protect, async (req, res) => {
    const followerId = req.user.id; 
    const followingId = req.params.targetUserId;

    if (followerId === followingId) {
        return res.status(400).json({ msg: 'Kendinizi takip edemezsiniz.' });
    }
    
    try {
        const targetUser = await User.findById(followingId);
        if (!targetUser) return res.status(404).json({ msg: 'Kullanıcı bulunamadı.' });

        const existingFollow = await Follow.findOne({ follower: followerId, following: followingId });

        if (existingFollow) {
     
            await Follow.deleteOne({ _id: existingFollow._id });

            await User.findByIdAndUpdate(followerId, { $inc: { followingCount: -1 } });
            await User.findByIdAndUpdate(followingId, { $inc: { followersCount: -1 } });

            await User.updateMany(
                { _id: { $in: [followerId, followingId] }, $or: [{ followingCount: { $lt: 0 } }, { followersCount: { $lt: 0 } }] },
                { $set: { followingCount: 0, followersCount: 0 } } 
            );
           
            await User.updateOne({ _id: followerId, followingCount: { $lt: 0 } }, { $set: { followingCount: 0 } });
            await User.updateOne({ _id: followingId, followersCount: { $lt: 0 } }, { $set: { followersCount: 0 } });
            

            return res.json({ action: 'unfollow', msg: `${targetUser.username} takipten çıkarıldı.` });
        } else {
            const newFollow = new Follow({ follower: followerId, following: followingId });
            await newFollow.save();

            await User.findByIdAndUpdate(followerId, { $inc: { followingCount: 1 } });
            await User.findByIdAndUpdate(followingId, { $inc: { followersCount: 1 } });

            return res.json({ action: 'follow', msg: `${targetUser.username} takip edildi!` });
        }

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Hata');
    }
});

// @route   GET /api/interact/is-following/:id
// @desc    Bir kullanıcıyı takip edip etmediğimi kontrol et (Buton rengi için)
// @access  Private
router.get('/is-following/:id', protect, async (req, res) => {
    try {
        const existingFollow = await Follow.findOne({
            follower: req.user.id,
            following: req.params.id
        });

        res.json({ isFollowing: !!existingFollow });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Sunucu Hatası');
    }
});

// @route   PUT /api/interact/profile
// @desc    Profil bilgilerini güncelle (Bio, Username, ProfileImage)
// @access  Private
router.put('/profile', protect, async (req, res) => {
    const { bio, username, profileImage } = req.body; 
    
    console.log("--- Profil Güncelleme ---");
    console.log("Gelen Resim:", profileImage); 

    const fieldsToUpdate = {};
    if (bio) fieldsToUpdate.bio = bio;
    if (username) fieldsToUpdate.username = username;
    
    if (profileImage) {
   
        const cleanUrl = profileImage.split('?')[0];
        fieldsToUpdate.profileImage = cleanUrl;
        console.log("Kaydedilen Saf URL:", cleanUrl);
    }

    try {
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: fieldsToUpdate },
            { new: true, runValidators: true } 
        ).select('-password'); 

        res.json({ msg: 'Profil başarıyla güncellendi.', user });

    } catch (err) {
        console.error("Profil Güncelleme Hatası:", err.message);
        if (err.code === 11000) { 
             return res.status(400).json({ msg: 'Bu kullanıcı adı veya e-posta zaten kullanımda.' });
        }
        res.status(500).send('Profil güncellenirken sunucu hatası.');
    }
});

// @route   PUT /api/interact/save/:id
// @desc    Postu Kaydet / Kaydedilenlerden Kaldır (Toggle)
// @access  Private
router.put('/save/:id', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const postId = req.params.id;

        if (user.savedPosts.includes(postId)) {
           
            user.savedPosts = user.savedPosts.filter(id => id.toString() !== postId);
            await user.save();
            return res.json({ action: 'unsave', msg: 'Post kaydedilenlerden çıkarıldı.' });
        } else {
            // Yoksa -> Ekle (Save)
            user.savedPosts.push(postId);
            await user.save();
            return res.json({ action: 'save', msg: 'Post kaydedildi!' });
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('İşlem hatası.');
    }
});

module.exports = router;