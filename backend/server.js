const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const cors = require('cors');
const path = require('path');

dotenv.config();

connectDB();

const app = express();

app.use(express.json());

// CORS ayarı: Front-end'in sadece izin verilen adresten erişmesine izin ver.
// Geliştirme aşamasında her yerden erişime izin vermek için 'cors()' kullanılabilir.

// GÜNCELLENMİŞ CORS AYARI (DEBUG İÇİN)

const allowedOrigins = [
  "https://glow-sphere-2-0.vercel.app", // Elle ekledik, garanti olsun
  "http://localhost:5173", // Local testlerin için
  process.env.FRONTEND_URL // Env'den gelen
];

app.use(cors({
    origin: (origin, callback) => {

        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.log("CORS Engellendi! Gelen Origin:", origin); 
            callback(new Error(`CORS policy: ${origin} adresi engellendi.`));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'], 
    credentials: true
}));

app.get('/', (req, res) => {
    res.send('GlowSphere Backend API Çalışıyor!');
});


app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/user'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/interact', require('./routes/interact'));
app.use('/api/feed', require('./routes/feed'));
app.use('/api/upload', require('./routes/upload'));

app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Sunucu ${PORT} portunda çalışıyor (http://localhost:${PORT})`));