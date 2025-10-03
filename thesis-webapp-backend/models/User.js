const mongoose = require('mongoose');


const UserSchema = new mongoose.Schema({
email: { type: String, required: true, unique: true },
password_hash: { type: String, required: true },
role: { type: String, enum: ['admin','teacher','student'], default: 'student' },
name: String,
createdAt: { type: Date, default: Date.now }
});


module.exports = mongoose.model('User', UserSchema);