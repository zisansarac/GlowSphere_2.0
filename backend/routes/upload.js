const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const dotenv = require('dotenv');

dotenv.config();

// 1. Cloudinary Ayarlarını Yapılandır
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// 2. Depolama Motorunu Oluştur (Bulut)
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'glowsphere_uploads', 
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp'], // İzin 
    },
});

const upload = multer({ storage: storage });

// @route   POST /api/upload
// @desc    Resmi Cloudinary'ye yükle
// @access  Public
router.post('/', upload.single('image'), (req, res) => {
    try {
   
        res.send(req.file.path); 
    } catch (error) {
        console.error(error);
        res.status(400).send('Resim yüklenirken hata oluştu.');
    }
});

module.exports = router;