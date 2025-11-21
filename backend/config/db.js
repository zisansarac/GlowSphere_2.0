const mongoose = require('mongoose');
require('dotenv').config(); 

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Bağlantısı Başarılı: ${conn.connection.host}`);
    } catch (err) {
        console.error(`MongoDB Bağlantı Hatası: ${err.message}`);

        process.exit(1);
    }
};

module.exports = connectDB;