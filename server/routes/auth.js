const express = require('express');
const router = express.Router();
const User = require('../models/User');
const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

function signToken(user) {
  const payload = { id: user.id, email: user.email, user_type: user.user_type };
  const secret = process.env.JWT_SECRET || 'dev_secret';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign(payload, secret, { expiresIn });
}

// Yeni kullanıcı kaydı
router.post('/register', (req, res) => {
  const { full_name, email, password, user_type } = req.body;

  const normalized_email = (email || '').trim().toLowerCase();
  const normalized_name = (full_name || '').trim();
  const normalized_user_type = (user_type || '').trim();
  const allowedTypes = ['client', 'freelancer', 'admin'];

  if (!normalized_name || !normalized_email || !password || !normalized_user_type) {
    return res.status(400).json({ success: false, message: 'Tüm alanlar gereklidir' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalized_email)) {
    return res.status(400).json({ success: false, message: 'E-posta formatı geçersiz' });
  }

  if (!allowedTypes.includes(normalized_user_type)) {
    return res.status(400).json({ success: false, message: 'Kullanıcı türü client, freelancer veya admin olmalıdır' });
  }

  db.query('SELECT id FROM users WHERE LOWER(TRIM(email)) = LOWER(TRIM(?)) LIMIT 1', [normalized_email], (checkErr, rows) => {
    if (checkErr) return res.status(500).json({ success: false, message: 'E-posta doğrulama hatası' });
    if (rows && rows.length > 0) return res.status(409).json({ success: false, message: 'E-posta zaten kayıtlı' });

    const rounds = Number(process.env.BCRYPT_SALT_ROUNDS || 10);
    const salt = bcrypt.genSaltSync(rounds);
    const hash = bcrypt.hashSync(password, salt);

    const sql = 'INSERT INTO users (full_name, email, password, user_type) VALUES (?, ?, ?, ?)';
    db.query(sql, [normalized_name, normalized_email, hash, normalized_user_type], (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ success: false, message: 'E-posta zaten kayıtlı' });
        return res.status(500).json({ success: false, message: 'Hesap oluşturma hatası' });
      }

      const user = { id: result.insertId, email: normalized_email, user_type: normalized_user_type };
      const token = signToken(user);
      return res.status(201).json({ success: true, message: 'Kayıt başarıyla tamamlandı', user_id: result.insertId, token });
    });
  });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const normalized_email = (email || '').trim().toLowerCase();

  if (!normalized_email || !password) {
    return res.status(400).json({ success: false, message: 'E-posta ve şifre gereklidir' });
  }

  User.findByEmail(normalized_email, (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'Sunucu hatası' });
    if (!results || results.length === 0) return res.status(401).json({ success: false, message: 'Giriş bilgileri yanlış' });

    const user = results[0];
    const match = bcrypt.compareSync(password, user.password);
    if (!match) return res.status(401).json({ success: false, message: 'Giriş bilgileri yanlış' });

    const token = signToken(user);
    res.json({
      success: true,
      message: 'Başarıyla giriş yapıldı',
      token,
      user: { id: user.id, full_name: user.full_name, email: user.email, user_type: user.user_type }
    });
  });
});

module.exports = router;