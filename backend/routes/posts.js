const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Post = require('../models/Post');
const Like = require('../models/Like');
const Comment = require('../models/Comment');


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

router.get('/user/:userId', protect, async (req, res) => {
    try {
        console.log("--- POST ÇEKME İSTEĞİ GELDİ ---");
        console.log("Aranan User ID:", req.params.userId);

        const posts = await Post.find({ user: req.params.userId }).sort({ createdAt: -1 });
        
        console.log("Bulunan Post Sayısı:", posts.length);
        
       
        if (posts.length === 0) {
            const anyPost = await Post.findOne();
            if (anyPost) {
                console.log("Veritabanındaki rastgele bir postun User ID'si:", anyPost.user.toString());
                console.log("Eşleşmiyor mu? ->", anyPost.user.toString() === req.params.userId);
            } else {
                console.log("Veritabanı tamamen boş! Hiç post yok.");
            }
        }

        res.json(posts);
    } catch (err) {
        console.error("HATA:", err.message);
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

// @route   POST /api/posts/:id/comment
// @desc    Bir posta yorum yap
// @access  Private
router.post('/:id/comment', protect, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ msg: 'Post bulunamadı' });

        const newComment = new Comment({
            text: req.body.text,
            post: req.params.id,
            user: req.user.id
        });

        await newComment.save();

        post.commentsCount = post.commentsCount + 1;  

        const commentToSend = await Comment.findById(newComment._id).populate('user', ['username', 'email']);

        res.json(commentToSend);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Sunucu Hatası');
    }
});

// @route   GET /api/posts/:id/comments
// @desc    Bir postun tüm yorumlarını getir
// @access  Public
router.get('/:id/comments', async (req, res) => {
    try {
        const comments = await Comment.find({ post: req.params.id })
            .sort({ createdAt: -1 }) 
            .populate('user', ['username', 'email']); 

        res.json(comments);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Sunucu Hatası');
    }
});

// @route   DELETE /api/posts/comment/:id
// @desc    Yorum sil (Sadece yorum sahibi veya post sahibi silebilir)
// @access  Private
router.delete('/comment/:id', protect, async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.id);
        if (!comment) return res.status(404).json({ msg: 'Yorum bulunamadı' });

        if (comment.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Yetkisiz işlem' });
        }

        await Comment.deleteOne({ _id: req.params.id });
        res.json({ msg: 'Yorum silindi' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Sunucu Hatası');
    }
});

// @route   PUT /api/posts/like/:id
// @desc    Postu Beğen / Beğenmekten Vazgeç (Toggle)
// @access  Private
router.put('/like/:id', protect, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if(!post) return res.status(404).json({ msg: 'Post bulunamadı' });

        
        const existingLike = await Like.findOne({ user: req.user.id, post: req.params.id });

        if (existingLike) {
 
            await Like.deleteOne({ _id: existingLike._id });
            post.likesCount = Math.max(0, post.likesCount - 1);
            await post.save();
            return res.json({ action: 'unlike', likesCount: post.likesCount });
        } else {

            const newLike = new Like({ user: req.user.id, post: req.params.id });
            await newLike.save();
            post.likesCount += 1;
            await post.save();
            return res.json({ action: 'like', likesCount: post.likesCount });
        }

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Sunucu Hatası');
    }
});

module.exports = router;