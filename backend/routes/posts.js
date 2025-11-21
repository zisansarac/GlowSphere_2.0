const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Post = require('../models/Post');
const Like = require('../models/Like');

// @route   POST /api/posts
// @desc    Yeni bir post oluştur
// @access  Private
router.post('/', protect, async (req, res) => {
    const { caption, imageUrl, tags } = req.body;
    
    if (!imageUrl) {
        return res.status(400).json({ msg: 'Post oluşturmak için bir resim URL\'si gereklidir.' });
    }

    try {
        const newPost = new Post({
            user: req.user.id, 
            caption,
            imageUrl,
            tags: tags || [],
        });

        const post = await newPost.save();
        res.status(201).json(post);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Post oluşturulurken sunucu hatası.');
    }
});


// @route   PUT /api/posts/:id
// @desc    Postu güncelle (Sadece kendi postunu)
// @access  Private
router.put('/:id', protect, async (req, res) => {
    const { caption, tags } = req.body;
    
    try {
        let post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ msg: 'Post bulunamadı.' });
        }

        if (post.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Bu postu düzenleme yetkiniz yok.' });
        }

        post.caption = caption || post.caption;
        post.tags = tags || post.tags;
        
        await post.save();
        res.json(post);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Post güncellenirken sunucu hatası.');
    }
});


// @route   DELETE /api/posts/:id
// @desc    Postu sil (Sadece kendi postunu)
// @access  Private
router.delete('/:id', protect, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ msg: 'Post bulunamadı.' });
        }

        if (post.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Bu postu silme yetkiniz yok.' });
        }

        await Post.deleteOne({ _id: req.params.id });

        await Like.deleteMany({ post: req.params.id });

        res.json({ msg: 'Post başarıyla silindi.' });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Post silinirken sunucu hatası.');
    }
});


// @route   GET /api/posts/all
// @desc    Tüm postları getir (Keşfet/Explore için kullanılabilir)
// @access  Public (Herkes görebilir)
router.get('/all', async (req, res) => {
    try {
        const posts = await Post.find()
            .sort({ createdAt: -1 })
            .populate('user', ['email', 'createdAt']); 
            
        res.json(posts);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Sunucu Hatası');
    }
});


// @route   GET /api/posts/:id
// @desc    Belirli bir postu getir
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id)
            .populate('user', ['email', 'createdAt']);

        if (!post) {
            return res.status(404).json({ msg: 'Post bulunamadı.' });
        }
        res.json(post);
    } catch (err) {
        console.error(err.message);
        // Hata ID formatından kaynaklanıyorsa (CastError)
        if (err.kind === 'ObjectId') {
             return res.status(404).json({ msg: 'Post bulunamadı.' });
        }
        res.status(500).send('Sunucu Hatası');
    }
});

module.exports = router;