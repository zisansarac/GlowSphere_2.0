const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Post = require('../models/Post');
const Like = require('../models/Like');
const Follow = require('../models/Follow');
const User = require('../models/User'); 

// @route   POST /api/interact/like/:postId
// @desc    Postu beğen veya beğeniyi kaldır (toggle)
// @access  Private
router.post('/like/:postId', protect, async (req, res) => {
    try {
        const { postId } = req.params;
        const userId = req.user.id;
        
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ msg: 'Beğenilecek post bulunamadı.' });
        }
        
        
        const existingLike = await Like.findOne({ user: userId, post: postId });

        if (existingLike) {
          
            await Like.deleteOne({ _id: existingLike._id });
            
            
            post.likesCount = Math.max(0, post.likesCount - 1); 
            await post.save();
            
            return res.json({ action: 'unlike', msg: 'Beğeni kaldırıldı.', likesCount: post.likesCount });
        } else {
            
            const newLike = new Like({ user: userId, post: postId });
            await newLike.save();
            
           
            post.likesCount += 1;
            await post.save();
            
            return res.json({ action: 'like', msg: 'Post beğenildi.', likesCount: post.likesCount });
        }

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Beğeni işlemi sırasında sunucu hatası.');
    }
});



// @route   POST /api/interact/follow/:targetUserId
// @desc    Kullanıcıyı takip et/takibi bırak (toggle)
// @access  Private
router.post('/follow/:targetUserId', protect, async (req, res) => {
    const followerId = req.user.id;
    const followingId = req.params.targetUserId;
    

    if (followerId === followingId) {
        return res.status(400).json({ msg: 'Kendinizi takip edemezsiniz.' });
    }
    
    try {
       
        const targetUser = await User.findById(followingId);
        if (!targetUser) {
            return res.status(404).json({ msg: 'Takip edilecek kullanıcı bulunamadı.' });
        }

     
        const existingFollow = await Follow.findOne({ follower: followerId, following: followingId });

        if (existingFollow) {
           
            await Follow.deleteOne({ _id: existingFollow._id });
            return res.json({ action: 'unfollow', msg: `${targetUser.email} takipten çıkarıldı.` });
        } else {
            
            const newFollow = new Follow({ follower: followerId, following: followingId });
            await newFollow.save();
            return res.json({ action: 'follow', msg: `${targetUser.email} takip edildi.` });
        }

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Takip işlemi sırasında sunucu hatası.');
    }
});




// @route   PUT /api/interact/profile
// @desc    Giriş yapmış kullanıcının profilini güncelle (Şifre hariç)
// @access  Private
router.put('/profile', protect, async (req, res) => {
    const { bio, username } = req.body; 
    const fieldsToUpdate = {};
    if (bio) fieldsToUpdate.bio = bio;
    if (username) fieldsToUpdate.username = username;

    try {
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: fieldsToUpdate },
            { new: true, runValidators: true } 
        ).select('-password'); 

        res.json({ msg: 'Profil başarıyla güncellendi.', user });

    } catch (err) {
        console.error(err.message);

        if (err.code === 11000) { 
             return res.status(400).json({ msg: 'Bu kullanıcı adı veya e-posta zaten kullanımda.' });
        }
        res.status(500).send('Profil güncellenirken sunucu hatası.');
    }
});


module.exports = router;