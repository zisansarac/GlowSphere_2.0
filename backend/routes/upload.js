// backend/routes/upload.js

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');


const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, 'uploads/'); 
    },
    filename(req, file, cb) {
      
        cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    }
});


function checkFileType(file, cb) {
    const filetypes = /jpg|jpeg|png/; // İzin verilen uzantılar
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb('Hata: Sadece resim dosyaları yüklenebilir!');
    }
}


const upload = multer({
    storage,
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    }
});

// @route   POST /api/upload
// @desc    Resim yükle
// @access  Public (veya Private yapabilirsin)

// backend/routes/upload.js en alt kısım:

router.post('/', upload.single('image'), (req, res) => {
    try {

        const normalizedPath = req.file.path.replace(/\\/g, "/");
        res.send(`/${normalizedPath}`); 
    } catch (error) {
        res.status(400).send('Resim yüklenirken hata oluştu.');
    }
});

module.exports = router;