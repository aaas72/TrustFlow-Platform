const jwt = require('jsonwebtoken');
const { getJwtSecret } = require('../utils/jwtSecret');

function requireAuth(req, res, next) {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ success: false, code: 'AUTH_REQUIRED', message: 'Kimlik doğrulama gerekli' });

    const payload = jwt.verify(token, getJwtSecret());
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ success: false, code: 'INVALID_TOKEN', message: 'Geçersiz kimlik doğrulama belirteci' });
  }
}

function requireAdmin(req, res, next) {
  // Önce requireAuth ara katmanından kullanıcının varlığını doğrulayın
  try {
    if (!req.user) {
      const auth = req.headers.authorization || '';
      const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
      if (!token) return res.status(401).json({ success: false, code: 'AUTH_REQUIRED', message: 'Kimlik doğrulama gerekli' });
      req.user = jwt.verify(token, getJwtSecret());
    }
    if (req.user.user_type !== 'admin') {
      return res.status(403).json({ success: false, code: 'FORBIDDEN', message: 'Yetersiz yetki: yönetici rolü gerekir' });
    }
    next();
  } catch (e) {
    return res.status(401).json({ success: false, code: 'INVALID_TOKEN', message: 'Geçersiz kimlik doğrulama belirteci' });
  }
}

module.exports = { requireAuth, requireAdmin };
