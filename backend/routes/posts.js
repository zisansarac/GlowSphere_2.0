const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

const User = require('../models/User');
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
            likesCount: 0,
            commentsCount: 0
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
        await Comment.deleteMany({ post: req.params.id });

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
            .populate('user', ['username','email', 'createdAt']); 
            
        res.json(posts);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Sunucu Hatası');
    }
});

// @route   GET /api/posts/saved/all
// @desc    Kullanıcının kaydettiği postları getir
// @access  Private
router.get('/saved/all', protect, async (req, res) => {
    try {
        const currentUser = await User.findById(req.user.id);
        
        const savedPosts = await Post.find({ _id: { $in: currentUser.savedPosts } })
            .sort({ createdAt: -1 })
            .populate('user', ['username', 'email']);

        res.json(savedPosts);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Sunucu Hatası');
    }
});

router.get('/user/:userId', protect, async (req, res) => {
    try { 
        const posts = await Post.find({ user: req.params.userId }).sort({ createdAt: -1 });
    
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
        const post = await Post.findById(req.params.id).populate('user', ['username', 'email']);
        if(!post) return res.status(404).json({ msg: 'Bulunamadı' });
        res.json(post);
    } catch (err) { res.status(500).send('Hata'); }
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

        const realCommentCount = await Comment.countDocuments({ post: req.params.id });
        post.commentsCount = realCommentCount;

        await post.save();  

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

        const post = await Post.findById(comment.post);
        
        if (comment.user.toString() !== req.user.id && post.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Yetkisiz işlem' });
        }

        const postId = comment.post; 
        await Comment.deleteOne({ _id: req.params.id });

        const realCommentCount = await Comment.countDocuments({ post: postId });
        
        await Post.findByIdAndUpdate(postId, { commentsCount: realCommentCount });

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
           
        } else {

            const newLike = new Like({ user: req.user.id, post: req.params.id });
            await newLike.save();
        }

        const realLikeCount = await Like.countDocuments({ post: req.params.id });

        post.likesCount = realLikeCount;
        await post.save();

        res.json({ 
            action: existingLike ? 'unlike' : 'like', 
            likesCount: realLikeCount 
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Sunucu Hatası');
    }
});

// @route   GET /api/posts/is-liked/:id
// @desc    Kullanıcının bu postu beğenip beğenmediğini kontrol et
// @access  Private
router.get('/is-liked/:id', protect, async (req, res) => {
    try {
        // Like tablosunda (User + Post) eşleşmesi var mı?
        const existingLike = await Like.findOne({ 
            user: req.user.id, 
            post: req.params.id 
        });

        // Varsa true, yoksa false döner
        res.json({ isLiked: !!existingLike });
        
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Sunucu Hatası');
    }
});

// @route   GET /api/posts/is-saved/:id
// @desc    Postun kaydedilip kaydedilmediğini kontrol et
// @access  Private
router.get('/is-saved/:id', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        const isSaved = user.savedPosts.includes(req.params.id);
        res.json({ isSaved });
    } catch (err) {
        res.status(500).send('Hata');
    }
});

module.exports = router;