const jwt = require('jsonwebtoken');
const secret = process.env.JWT_SECRET || 'dev_secret';


function sign(payload) {
return jwt.sign(payload, secret, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
}


function verify(token) {
try { return jwt.verify(token, secret); } catch (e) { return null; }
}


module.exports = { sign, verify };