
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    username: { 
        type: String, 
        required: [true, 'Lütfen bir kullanıcı adı girin.'], 
        unique: true, 
        trim: true 
    },
    email: {
        type: String,
        required: [true, 'Lütfen bir e-posta adresi girin'],
        unique: true, 
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: [true, 'Lütfen bir şifre girin.'],
        minlength: [6, 'Şifre en az 6 karakter olmalıdır.'],
        select: false 
    },
    bio: {
        type: String,
        maxlength: 150,
        default: ''
    },
    profileImage: {
        type: String,
        default: ''
    },
    savedPosts: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Post' // Post modeline referans (ID'leri tutacağız)
        }
    ],
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

UserSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }

    const salt = await bcrypt.genSalt(10); 
    this.password = await bcrypt.hash(this.password, salt);
    
});

UserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
