const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const User = require('../models/User');
const jwtUtil = require('../utils/jwt');


// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, role = 'student', name } = req.body;
    if (!['teacher','student'].includes(role)) {
      return res.status(400).json({ error: 'invalid role' });
    }
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: 'email exists' });

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password_hash: hash, role, name });

    res.json({ userId: user._id, email: user.email, role: user.role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
});


// Login
router.post('/login', async (req, res) => {
try {
const { email, password } = req.body;
const user = await User.findOne({ email });
if (!user) return res.status(401).json({ error: 'invalid credentials' });
const ok = await bcrypt.compare(password, user.password_hash);
if (!ok) return res.status(401).json({ error: 'invalid credentials' });
const token = jwtUtil.sign({ userId: user._id, role: user.role, email: user.email });
res.json({ accessToken: token, role: user.role });
} catch (err) {
console.error(err);
res.status(500).json({ error: 'server error' });
}
});
router.get('/me', (req, res) => {
const h = req.headers.authorization || ''
const token = h.startsWith('Bearer ') ? h.slice(7) : null
const payload = require('../utils/jwt').verify(token)
if (!payload) return res.status(401).json({ error: 'invalid token' })
res.json(payload)
}
);

module.exports = router;