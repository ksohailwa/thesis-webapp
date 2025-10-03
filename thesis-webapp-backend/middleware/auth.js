const jwtUtil = require('../utils/jwt')


function requireAuth(req, res, next){
const h = req.headers.authorization || ''
const token = h.startsWith('Bearer ') ? h.slice(7) : null
if (!token) return res.status(401).json({ error: 'missing token' })
const payload = jwtUtil.verify(token)
if (!payload) return res.status(401).json({ error: 'invalid token' })
req.user = payload
next()
}


function requireRole(...roles){
return (req, res, next) => {
if (!req.user) return res.status(401).json({ error: 'unauthorized' })
if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'forbidden' })
next()
}
}


module.exports = { requireAuth, requireRole }