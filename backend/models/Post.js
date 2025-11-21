// models/Post.js
const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', 
        required: true,
    },

    caption: {
        type: String,
        maxlength: 500,
    },
   
    imageUrl: {
        type: String,
        required: true,
    },

    tags: [
        {
            type: String,
            trim: true,
        },
    ],

    likesCount: {
        type: Number,
        default: 0,
    },
    commentsCount: {
        type: Number,
        default: 0,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Post', PostSchema);